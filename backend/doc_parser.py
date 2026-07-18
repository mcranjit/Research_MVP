"""Document text extraction for PDF, DOCX, TXT, CSV, XLSX, MD."""
import io
import re
import csv
from typing import Optional
from pypdf import PdfReader
from docx import Document
import openpyxl


def parse_pdf(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    parts = []
    for page in reader.pages:
        try:
            parts.append(page.extract_text() or "")
        except Exception:
            parts.append("")
    return "\n\n".join(parts).strip()


def parse_docx(data: bytes) -> str:
    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def parse_txt(data: bytes) -> str:
    try:
        return data.decode('utf-8', errors='ignore').strip()
    except Exception:
        return ""


def parse_csv(data: bytes) -> str:
    text = data.decode('utf-8', errors='ignore')
    reader = csv.reader(io.StringIO(text))
    rows = [", ".join(r) for r in reader]
    return "\n".join(rows[:500])


def parse_xlsx(data: bytes) -> str:
    wb = openpyxl.load_workbook(io.BytesIO(data), data_only=True)
    out = []
    for sheet in wb.worksheets:
        out.append(f"## Sheet: {sheet.title}")
        for row in sheet.iter_rows(values_only=True):
            out.append(", ".join("" if v is None else str(v) for v in row))
    return "\n".join(out[:2000])


def extract_text(filename: str, data: bytes) -> str:
    name = filename.lower()
    if name.endswith('.pdf'):
        return parse_pdf(data)
    if name.endswith('.docx'):
        return parse_docx(data)
    if name.endswith(('.txt', '.md')):
        return parse_txt(data)
    if name.endswith('.csv'):
        return parse_csv(data)
    if name.endswith('.xlsx'):
        return parse_xlsx(data)
    # fallback: try text
    return parse_txt(data)


def extract_metadata(text: str) -> dict:
    """Heuristic metadata extraction: title, authors, DOI."""
    lines = [ln.strip() for ln in text.split('\n') if ln.strip()]
    title = lines[0][:200] if lines else "Untitled"

    # DOI detection
    doi_match = re.search(r'(10\.\d{4,9}/[-._;()/:A-Z0-9]+)', text, re.IGNORECASE)
    doi = doi_match.group(1) if doi_match else None

    # Naive author detection (look for "Authors:" or top lines)
    authors = []
    auth_match = re.search(r'(?:Authors?|By)\s*[:\-]\s*(.+)', text[:2000], re.IGNORECASE)
    if auth_match:
        raw = auth_match.group(1).split('\n')[0]
        authors = [a.strip() for a in re.split(r',|\band\b|;', raw) if a.strip()][:8]

    # Word count
    word_count = len(text.split())

    return {
        "title": title,
        "authors": authors,
        "doi": doi,
        "word_count": word_count,
    }


def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 150) -> list[dict]:
    """Split text into overlapping chunks with approx page tracking."""
    words = text.split()
    chunks = []
    i = 0
    chunk_id = 0
    while i < len(words):
        piece = " ".join(words[i:i + chunk_size])
        chunks.append({
            "chunk_id": chunk_id,
            "text": piece,
            "page": chunk_id + 1,  # approximate
        })
        chunk_id += 1
        i += chunk_size - overlap
    return chunks
