import fitz # PyMuPDF
import sys

def extract_text(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

if __name__ == "__main__":
    path = "Man Mcq Unit I, Ii And Iii.pdf"
    content = extract_text(path)
    print(content[:2000])
