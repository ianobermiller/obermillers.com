"""Read literal assignment grades from the family's exported Chemistry Sheet."""
import json
import re
import sys
import zipfile
from pathlib import PurePosixPath
from xml.etree import ElementTree as ET

NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
SHEET_URL = "https://docs.google.com/spreadsheets/d/1m6DpOGIobo2BqBwOhE1ZFg1h1NfrH6wSUZ5YNj5DqF8/edit?gid=0"


def read_grades(path):
    with zipfile.ZipFile(path) as archive:
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            strings = ["".join(si.itertext()) for si in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        book = ET.fromstring(archive.read("xl/workbook.xml"))
        sheet = next((s for s in book.find("s:sheets", NS) if s.get("name") == "Full Course"), None)
        if sheet is None:
            raise ValueError('Expected a "Full Course" worksheet.')
        relationship = sheet.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
        rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        target = next(r.get("Target") for r in rels if r.get("Id") == relationship)
        target = target.lstrip("/") if target.startswith("/") else str(PurePosixPath("xl") / target)
        styles = ET.fromstring(archive.read("xl/styles.xml"))
        custom = {int(n.get("numFmtId")): n.get("formatCode") for n in styles.findall("s:numFmts/s:numFmt", NS)}
        number_formats = [int(x.get("numFmtId", "0")) for x in styles.find("s:cellXfs", NS)]
        cells = {}
        for c in ET.fromstring(archive.read(target)).findall(".//s:c", NS):
            if c.find("s:f", NS) is not None:
                continue
            value = c.findtext("s:v", default="", namespaces=NS)
            kind = c.get("t")
            if kind == "s": value = strings[int(value)]
            elif kind == "inlineStr": value = "".join(c.find("s:is", NS).itertext())
            elif value != "": value = float(value)
            fmt_id = number_formats[int(c.get("s", "0"))]
            cells[c.get("r")] = (value, fmt_id in [9, 10] or "%" in custom.get(fmt_id, ""))
        output = []
        child = None
        for row in range(1, 100):
            label = cells.get(f"A{row}", ("", False))[0]
            if label == "Wellington": child = "wells@obermillers.com"
            if label == "Isla": child = "isla@obermillers.com"
            if not child: continue
            for lesson_col, mapping in [("A", [("homework", "B", "C"), ("quiz", "E", None), ("exam", "F", None), ("lab", "G", "H")]), ("K", [("homework", "L", "M"), ("quiz", "O", None), ("exam", "P", None), ("lab", "Q", "R")])]:
                lesson = re.fullmatch(r"Lesson (\d+)", str(cells.get(f"{lesson_col}{row}", ("", False))[0]))
                if not lesson: continue
                for category, score_col, max_col in mapping:
                    score_cell = f"{score_col}{row}"
                    value, percentage = cells.get(score_cell, ("", False))
                    if value == "": continue
                    if not isinstance(value, (int, float)): raise ValueError(f"Invalid score at {score_cell}")
                    maximum = cells.get(f"{max_col}{row}", ("", False))[0] if max_col else 100
                    if not max_col and percentage: value *= 100
                    if not isinstance(maximum, (int, float)) or maximum <= 0 or not 0 <= value <= maximum:
                        raise ValueError(f"Invalid points at {score_cell}")
                    source = f"{SHEET_URL}#range={score_cell}" + (f":{max_col}{row}" if max_col else "")
                    output.append({"lessonNumber": int(lesson[1]), "studentEmail": child, "category": category, "assessment": {"kind": "imported", "earned": value, "possible": maximum, "source": source}})
        return output


if __name__ == "__main__":
    print(json.dumps(read_grades(sys.argv[1]), indent=2))
