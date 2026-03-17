import pypdf
from PIL import Image
import io
import os
import re

def clean_extracted_text(text: str) -> str:
    """
    Cleans extracted PDF text by removing the Table of Contents 
    and starting from the first actual chapter or content.
    """
    if not text:
        return ""

    # Patterns to look for the "real" start of the book
    # This covers "Chapter 1", "CHAPTER ONE", "Prologue", "Introduction", etc.
    start_patterns = [
        r'\bchapter\s*(?:1|I|one|1\.)\b',
        r'\bprologue\b',
        r'\bintroduction\b',
        r'\bforeword\b',
        r'\bchapter\s*0?1[^\d]',
    ]

    # Combine into a single regex with IGNORECASE flag
    start_regex = re.compile('|'.join(start_patterns), re.IGNORECASE)
    
    # Try to find the earliest match that isn't in a Table of Contents
    # A Table of Contents usually has many dots or page numbers next to chapter names
    toc_pattern = re.compile(r'(\.{3,}|_{3,}|-{3,})\s*\d+')
    
    matches = list(start_regex.finditer(text))
    
    if not matches:
        return text # No clear start found, return as is

    # We want to skip occurrences that look like they are in a TOC
    # We'll check the context around each match
    final_start_pos = 0
    found_valid_start = False

    for match in matches:
        start_idx = match.start()
        # Look at the text shortly after the match to see if it's a TOC entry
        # Typically a TOC entry has many dots and a page number within the next 100 characters
        context = text[start_idx : start_idx + 150]
        if not toc_pattern.search(context):
            final_start_pos = start_idx
            found_valid_start = True
            break
            
    if found_valid_start:
        cleaned_text = text[final_start_pos:].strip()
        # Also trim any residual TOC if it's still at the top
        return cleaned_text
    
    return text

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    
    try:
        import fitz
        try:
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text() + "\n"
            if len(text.strip()) > 100:
                print(f"Successfully extracted {len(text)} chars with PyMuPDF.")
                return clean_extracted_text(text)
        except Exception as e:
            print(f"PyMuPDF error reading {file_path}: {e}")
    except ImportError:
        print("PyMuPDF not found, falling back to pypdf.")
        
    print("Trying pypdf fallback extraction...")
    text = ""
    try:
        reader = pypdf.PdfReader(file_path)
        for page in reader.pages:
            try:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            except Exception as e:
                print(f"Error extracting text from a page in {file_path}: {e}")
                continue
        return clean_extracted_text(text)
    except Exception as e:
        print(f"Error reading PDF {file_path}: {e}")
        return ""

def extract_first_page_as_image(file_path: str, output_dir: str = "data/covers") -> str:
    """
    Extract the first page of a PDF as a cover image.
    Returns the path to the generated image file.
    """
    try:
        
        os.makedirs(output_dir, exist_ok=True)
        
        
        reader = pypdf.PdfReader(file_path)
        if len(reader.pages) == 0:
            raise ValueError("PDF has no pages")
        
        first_page = reader.pages[0]
        
        
        page_width = float(first_page.mediabox.width)
        page_height = float(first_page.mediabox.height)
        
        
        
        
        
        
        
        try:
            from pdf2image import convert_from_path
            
            
            images = convert_from_path(
                file_path, 
                first_page=1, 
                last_page=1,
                dpi=150
            )
            
            if images:
                
                base_name = os.path.splitext(os.path.basename(file_path))[0]
                output_path = os.path.join(output_dir, f"{base_name}_cover.jpg")
                
                
                images[0].save(output_path, 'JPEG', quality=85)
                return output_path
                
        except ImportError:
            print("pdf2image not available, using fallback method")
            
            
            
            return ""
            
    except Exception as e:
        print(f"Error extracting cover image: {e}")
        return ""

