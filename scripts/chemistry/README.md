# Seed Chemistry lessons and import grades

Run these commands from the repository checkout that contains the grading
integration. PocketBase must run the matching Go backend.

## Prepare a local preview

Run `npm run dev`. Local setup creates the grading collections and prints
sign-in codes in the terminal. When converted private curriculum files are
present, it also seeds the course and local family identities. On a fresh
clone, rebuild the PDF content below before seeding. Open `/grading` through
the family hub.

In a worktree, use the shared PocketBase at `http://127.0.0.1:8090` and start
only Vite on another port. Do not start another PocketBase process.

```sh
VITE_POCKETBASE_URL=http://127.0.0.1:8090 npx vite --port 5191 --strictPort
```

## Apply the production data

Wait for the frontend and PocketBase deployment checks to finish. Load the
private admin credentials through the existing `.env.local` convention.
Keep that file untracked.

1. Run `npm run pb:setup:prod -- --only-prefix grading_` to apply only the grading schema.
2. Run `npm run grading:seed` to inspect the content seed plan.
3. Run `npm run grading:seed -- --apply` to seed lessons and protected references.
4. Export the original Google Sheet as an Excel `.xlsx` file.
5. Run the import without `--apply` to inspect its plan.

```sh
npm run grading:import -- --file /path/to/Chemistry-Grades.xlsx
npm run grading:import -- --file /path/to/Chemistry-Grades.xlsx --apply
```

Keep the exported gradebook outside tracked source. Rebuild the private
PDF content before the first content seed on a new checkout.

Both data commands accept `--url http://127.0.0.1:8090` for local use. They
default to a dry run. Seeding preserves lab assignment settings and skips
unchanged reference files. Importing creates missing grades only; it never
overwrites grades already edited in the app.

The importer reads the literal score inputs from the **Full Course** sheet.
It ignores blank cells and calculated percentage formulas. The four current
homework totals become published imported assessments, retaining their
original earned points, possible points, and source cell links. Individual
question scores remain unknown. The parent can edit the imported total.

## Rebuild the PDF content

Use Python with `pdfplumber`, plus Poppler's `pdftohtml` and `pdftoppm` on PATH.
The Codex bundled Python includes `pdfplumber`.

```sh
python3 scripts/chemistry/import_pdfs.py \
  --source /path/to/original-pdfs \
  --output scripts/chemistry/content
npx oxfmt scripts/chemistry/content
```

The importer checks every lesson's homework count against the existing
gradebook. Converted text, native tables, rubric descriptions, and figure
files live under `scripts/chemistry/content`. This directory is seed input;
it is gitignored and outside the frontend import graph and production static
output. Do not add it to this public repository.

## Verify the integration

Run `npm run check` and `npm run build`. Run `go test ./... -count=1` from
`pocketbase/` to exercise the actual schema and HTTP permission rules in
temporary databases. These tests do not start another server or alter the
shared development database.
