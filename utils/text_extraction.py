import pdfplumber
import pytesseract
from PIL import Image
import os

def extract_text_from_pdf(file_path):
    """Extract text from PDF file while maintaining formatting"""
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                page_text = page.extract_text()
                if page_text:
                    text += f"\n--- Page {page_num} ---\n"
                    text += page_text
    except Exception as e:
        return f"Error extracting PDF: {str(e)}"
    
    return text.strip()

def extract_text_from_image(file_path):
    """Extract text from image using OCR"""
    try:
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)
        return text.strip()
    except Exception as e:
        return f"Error extracting text from image: {str(e)}"

def extract_text(file_path, file_type):
    """Main function to extract text based on file type"""
    if file_type == 'pdf':
        return extract_text_from_pdf(file_path)
    else:
        return extract_text_from_image(file_path)