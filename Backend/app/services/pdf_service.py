import pypdf
from PIL import Image
import io
import os

def extract_text_from_pdf(file_path: str) -> str:
    try:
        reader = pypdf.PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error extracting text: {e}")
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

