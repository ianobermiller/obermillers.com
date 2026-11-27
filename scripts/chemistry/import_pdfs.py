"""Convert the family's Chemistry PDFs to native HTML lesson data.

Run with the bundled Python (pdfplumber), Poppler on PATH, and --source/--output.
Text and tables remain HTML. Only embedded figures and Lewis structure cells
are rasterized, because they contain graphical chemical notation.
"""
import argparse
import html
import json
import re
import subprocess
import unicodedata
from pathlib import Path
from xml.etree import ElementTree as ET

import pdfplumber

FILES = {
    "homework": "Experience Chemistry_ Homework Questions Answer Key.pdf",
    "labs": "Experience Chemistry_ Lab Guide Answer Key.pdf",
    "samples": "Experience Chemistry Level C Sample Labs.pdf",
    "guide": "Experience Chemistry Level C Curriculum Guide.pdf",
}
TOTALS = [6,30,6,3,6,6,18,0,21,54,42,18,27,21,0,15,12,27,15,18,18,6,9,24,0,12,9,36,21,15,3,12,12,18,0]


def clean(text):
    return unicodedata.normalize("NFKC", text).replace("\u200b", "").replace("\ufffd", "").strip()


def load_xml(path):
    raw = subprocess.run(["pdftohtml", "-xml", "-hidden", "-i", "-stdout", str(path)], capture_output=True, check=True).stdout
    root = ET.fromstring(raw)
    fonts = {f.get("id"): f.attrib for p in root.findall("page") for f in p.findall("fontspec")}
    pages = []
    for page in root.findall("page"):
        tokens = []
        for node in page.findall("text"):
            text = clean("".join(node.itertext()))
            if not text:
                continue
            font = fonts[node.get("font")]
            tokens.append(dict(text=text, x=float(node.get("left"))/1.5, y=float(node.get("top"))/1.5,
                               w=float(node.get("width"))/1.5, h=float(node.get("height"))/1.5,
                               size=float(font["size"])/1.5, red=font["color"] in ["#ff0000", "#e06666"],
                               bold=node.find("b") is not None, page=int(page.get("number"))))
        pages.append(tokens)
    return pages


def lines_of(tokens):
    lines = []
    for token in sorted(tokens, key=lambda t: (t["y"], t["x"])):
        matches = [line for line in lines if abs(line["y"]-token["y"]) < 3 or
                   (token["size"] < 9 and -3 < token["y"]-line["y"] < 10)]
        if matches:
            min(matches, key=lambda line: abs(line["y"]-token["y"]))["tokens"].append(token)
        else:
            lines.append(dict(y=token["y"], tokens=[token]))
    return sorted(lines, key=lambda line: line["y"])


def rich_line(tokens):
    if not tokens:
        return ""
    base = max(t["size"] for t in tokens)
    baseline = min(t["y"] for t in tokens if t["size"] >= base-1)
    result, previous = "", None
    for t in sorted(tokens, key=lambda t: t["x"]):
        gap = t["x"]-(previous["x"]+previous["w"]) if previous else 0
        if previous and gap > 1.7:
            result += " "
        value = html.escape(t["text"])
        if t["size"] < base*0.85:
            tag = "sub" if t["y"] > baseline+2 else "sup"
            value = f"<{tag}>{value}</{tag}>"
        if t["bold"]:
            value = f"<strong>{value}</strong>"
        result += value
        previous = t
    return result


def paragraphs(tokens):
    pages=sorted(set(t.get('page',0) for t in tokens))
    if len(pages)>1:
        return ''.join(paragraphs([t for t in tokens if t.get('page',0)==p]) for p in pages)
    output, group, last_y = [], [], -100
    for line in lines_of(tokens):
        value = rich_line(line["tokens"])
        if group and (line["y"]-last_y > 20 or re.match(r"^(?:[•●]|\d+[.)]\s|[A-Ha-z][.)]\s)", clean(re.sub('<[^>]+>', '', value)))):
            output.append("<p>"+"<br>".join(group)+"</p>")
            group = []
        group.append(value)
        last_y = line["y"]
    if group:
        output.append("<p>"+"<br>".join(group)+"</p>")
    return "".join(output)


def inside(t, bbox):
    x0,y0,x1,y1=bbox
    return x0-1 <= t["x"]+t["w"]/2 <= x1+1 and y0-1 <= t["y"]+t["h"]/2 <= y1+1


def figure(pdf, page_no, bbox, name, output):
    x0,y0,x1,y1=bbox
    scale=1.6
    prefix=output/"figures"/name
    prefix.parent.mkdir(exist_ok=True, parents=True)
    subprocess.run(["pdftoppm", "-f", str(page_no), "-l", str(page_no), "-scale-to-x", "980", "-scale-to-y", "1268",
                    "-x",str(max(0,int(x0*scale))),"-y",str(max(0,int(y0*scale))),
                    "-W",str(int((x1-x0)*scale)),"-H",str(int((y1-y0)*scale)),
                    "-png","-singlefile",str(pdf),str(prefix)], check=True, stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    return f'<img class="source-figure" src="figures/{name}.png" alt="{html.escape(name.replace("-", " "))}" loading="lazy">'


def table_html(table, tokens, pdf, page_no, name, output):
    rows=table.extract()
    diagram_columns=[]
    for i,c in enumerate(rows[0]):
        if c and re.search(r"Lewis|structure",c,re.I):
            diagram_columns.append(i)
    result='<div class="table-scroll"><table class="source-table">'
    for ri,row in enumerate(table.rows):
        result+="<tr>"
        for ci,bbox in enumerate(row.cells):
            tag="th" if ri==0 else "td"
            value=paragraphs([t for t in tokens if bbox and inside(t,bbox)]) if bbox else ""
            if bbox and ci in diagram_columns and ri:
                value=figure(pdf,page_no,bbox,f"{name}-row-{ri}-structure",output)
            result+=f'<{tag}>{value}</{tag}>'
        result+="</tr>"
    return result+"</table></div>"


def page_blocks(page, tokens, pdf, name, output):
    tables=page.find_tables()
    filtered=[t for t in tokens if t["y"]>48 and t["y"]<746 and not re.match(r"^(?:Page \d+|Experience Chemistry: Lab Guide Answer Key|Lesson\s+\d+|Laboratory Assignment)$",t["text"])]
    filtered=[t for t in filtered if not any(inside(t,table.bbox) for table in tables)]
    blocks=[]
    for table_no,table in enumerate(tables):
        blocks.append((table.bbox[1],table_html(table,tokens,pdf,page.page_number,f"{name}-table-{table_no}",output)))
    for i,image in enumerate(page.images):
        bbox=(image["x0"],image["top"],image["x1"],image["bottom"])
        if image['width']<30 or image['height']<25 or image["top"]<35 or any(inside(dict(x=image['x0'],w=image['width'],y=image['top'],h=image['height']),table.bbox) for table in tables):
            continue
        blocks.append((image["top"],figure(pdf,page.page_number,bbox,f"{name}-figure-{i}",output)))
    last=0
    for y,value in sorted(blocks):
        prose=[t for t in filtered if last<=t["y"]<y]
        if prose:
            yield paragraphs(prose)
        yield value
        last=y
    yield paragraphs([t for t in filtered if t["y"]>=last])


def homework(path, xml, lessons, output):
    current=None
    roots={}
    for page_no,tokens in enumerate(xml,1):
        heading=next((re.match(r"Lesson\s+(\d+)",t['text']) for t in tokens if re.match(r"Lesson\s+(\d+)",t['text'])),None)
        if heading:
            current=int(heading[1])
        if not current:
            continue
        if current==9:
            continue
        lesson=lessons[current-1]
        lesson['homeworkPages'].append(page_no)
        root_list=roots.setdefault(current,[])
        root=root_list[-1] if root_list else None
        for line in lines_of(tokens):
            ts=line['tokens']
            black=[t for t in ts if not t['red']]
            red=[t for t in ts if t['red']]
            black_text=clean(" ".join(t['text'] for t in sorted(black,key=lambda t:t['x'])))
            if re.match(r"Lesson\s+\d+",black_text):
                continue
            first=min(black,key=lambda t:t['x']) if black else None
            marker=re.match(r"^(\d+)[.)](?:\s|$)",black_text)
            if marker and first['x']<120:
                root=dict(id=marker[1],prompt=[],answer=[],children=[],page=page_no,y=line['y'])
                root_list.append(root)
            if not root:
                lesson['homeworkIntro']+=paragraphs(black)
                continue
            sub=re.match(r"^([A-Za-z])[.)](?:\s|$)",black_text)
            if sub and first and 120<=first['x']<=149:
                root['children'].append(dict(id=root['id']+sub[1].lower(),prompt=[],answer=[],page=page_no,y=line['y']))
            target=root['children'][-1] if root['children'] else root
            if current==33 and red:
                answer_marker=re.match(r"^(\d+)\.",min(red,key=lambda t:t['x'])['text'])
                if answer_marker:
                    target=next((r for r in root_list if r['id']==answer_marker[1]), root)
                    root=target
            target['prompt'].extend(black)
            target['answer'].extend(red)
    for n,root_list in roots.items():
        for root in root_list:
            for item in root['children'] or [root]:
                context=paragraphs(root['prompt']) if root['children'] else ""
                lessons[n-1]['questions'].append(dict(id=f"{n}.{item['id']}",context=context,prompt=paragraphs(item['prompt']),answer=paragraphs(item['answer']),page=item['page'],y=item['y']))
    with pdfplumber.open(path) as pdf:
        for page_no in [11,12]:
            page=pdf.pages[page_no-1]
            for ti,table in enumerate(page.find_tables()):
                for ri,row in enumerate(table.rows[1:] if page_no==11 else table.rows,1):
                    cells=[]
                    for ci,bbox in enumerate(row.cells):
                        cell=paragraphs([t for t in xml[page_no-1] if bbox and inside(t,bbox) and (ci or not t['red'])])
                        if ci==1 and bbox:
                            cell=figure(path,page_no,bbox,f"homework-9-row-{len(lessons[8]['questions'])+1}-structure",output)
                        cells.append(cell)
                    if not any(cells):
                        continue
                    q=lessons[8]['questions']
                    q.append(dict(id=f"9.{len(q)+1}",context="<p>Complete the molecular structure chart.</p>",prompt=cells[0],answer='<div class="table-scroll"><table class="source-table"><thead><tr>'+''.join('<th>'+h+'</th>' for h in ['Lewis structure','Geometry','Molecule','Electronegativity difference','Bonds'])+'</tr></thead><tbody><tr>'+''.join('<td>'+c+'</td>' for c in cells[1:])+'</tr></tbody></table></div>',page=page_no))
        for lesson in lessons:
            for pno in lesson['homeworkPages']:
                for i,image in enumerate(pdf.pages[pno-1].images):
                    if image['width']<30 or image['height']<25:
                        continue
                    y=image['top']
                    question=next((q for q in reversed(lesson['questions']) if q['page']<pno or q['page']==pno and q.get('y',0)<=y),None)
                    if question:
                        image_html=figure(path,pno,(image['x0'],image['top'],image['x1'],image['bottom']),f"homework-{lesson['number']}-page-{pno}-figure-{i}",output)
                        question['answer']+=image_html


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--source',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    args.output.mkdir(parents=True,exist_ok=True)
    lessons=[dict(number=i,title=f"Lesson {i}",questions=[],homeworkIntro="",homeworkFigures="",homeworkPages=[],lab=None,sample=None) for i in range(1,36)]
    xml={kind:load_xml(args.source/name) for kind,name in FILES.items()}
    with pdfplumber.open(args.source/FILES['guide']) as guide:
        for page in guide.pages[14:19]:
            for n,title in re.findall(r"Lesson\s+(\d+):\s*([^\n]+)",page.extract_text()):
                lessons[int(n)-1]['title']=title.strip()
        rubric=[]
        rubric_text="\n".join(p.extract_text() for p in guide.pages[25:27])
        matches=list(re.finditer(r"(?m)^(Title|Introduction|Hypothesis|Materials|Procedure|Results|Conclusion) \((\d+) points\)",rubric_text))
        for i,m in enumerate(matches):
            rubric.append(dict(id=m[1].lower(),name=m[1],max=int(m[2]),description=rubric_text[m.end():matches[i+1].start() if i+1<len(matches) else len(rubric_text)].strip()))
    homework(args.source/FILES['homework'],xml['homework'],lessons,args.output)
    for kind,key in [('labs','lab'),('samples','sample')]:
        with pdfplumber.open(args.source/FILES[kind]) as pdf:
            current=None
            for i,page in enumerate(pdf.pages):
                tokens=xml[kind][i]
                heading=next((re.match(r"Lesson\s+(\d+)(?::\s*(.*))?$",t['text']) for t in tokens if re.match(r"Lesson\s+(\d+)(?::\s*(.*))?$",t['text'])),None)
                if heading:
                    current=int(heading[1])
                    lessons[current-1][key]=dict(title=heading[2] or '',html='',pages=[])
                if not current:
                    continue
                ref=lessons[current-1][key]
                ref['pages'].append(i+1)
                body=''.join(page_blocks(page,tokens,args.source/FILES[kind],f"{kind}-{current}-page-{i+1}",args.output))
                if body and not (kind=='samples' and heading):
                    ref['html']+=f'<section class="reference-page" data-source-page="{i+1}">{body}<small class="source-page">Source page {i+1}</small></section>'
    counts=[len(l['questions'])*3 for l in lessons]
    report=dict(homeworkQuestions=sum(len(l['questions']) for l in lessons),homeworkPossible=sum(counts),expectedHomeworkPossible=sum(TOTALS),labs=sum(bool(l['lab']) for l in lessons),sampleReports=sum(bool(l['sample']) for l in lessons),mismatches=[dict(lesson=i+1,expected=TOTALS[i],actual=counts[i]) for i in range(35) if counts[i]!=TOTALS[i]])
    data=dict(lessons=lessons,rubric=rubric,sources=FILES,report=report)
    (args.output/'content.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    (args.output/'conversion-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
    if report['mismatches']:
        raise SystemExit('Question counts differ from the source gradebook. Resolve before using.')


if __name__=='__main__':
    main()
