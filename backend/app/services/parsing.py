import io
from pypdf import PdfReader


def extract_text(data: bytes, filename: str) -> str:
    """Extract text from various file formats including PDF."""
    filename_lower = filename.lower()
    
    # Text-based files
    if filename_lower.endswith((".txt", ".md", ".tex")):
        return data.decode("utf-8", errors="replace")
    
    # PDF files
    elif filename_lower.endswith(".pdf"):
        try:
            pdf_file = io.BytesIO(data)
            reader = PdfReader(pdf_file)
            text_parts = []
            
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
            
            if not text_parts:
                raise ValueError("PDF appears to be empty or text could not be extracted")
            
            return "\n\n".join(text_parts)
        except Exception as e:
            raise ValueError(f"Failed to parse PDF: {str(e)}")
    
    # DOCX files (if python-docx is installed)
    elif filename_lower.endswith(".docx"):
        try:
            import docx
            doc_file = io.BytesIO(data)
            doc = docx.Document(doc_file)
            text_parts = [paragraph.text for paragraph in doc.paragraphs if paragraph.text.strip()]
            
            if not text_parts:
                raise ValueError("DOCX appears to be empty")
            
            return "\n\n".join(text_parts)
        except ImportError:
            raise ValueError("DOCX support not available. Please install python-docx: pip install python-docx")
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX: {str(e)}")
    
    else:
        raise ValueError(
            f"Unsupported file type: {filename}. "
            f"Supported formats: .txt, .md, .tex, .pdf, .docx"
        )
