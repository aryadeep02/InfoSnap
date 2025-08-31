from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.colors import HexColor
import os
from datetime import datetime

def generate_pdf(summary, key_points, language="en", filename=None):
    """Generate a beautiful PDF with summary and key points"""
    
    if not filename:
        filename = f"summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    
    filepath = os.path.join("uploads", filename)
    
    # Create PDF
    doc = SimpleDocTemplate(filepath, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=HexColor('#667eea'),
        spaceAfter=30,
        alignment=1  # Center
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=HexColor('#764ba2'),
        spaceAfter=12
    )
    
    # Add title
    story.append(Paragraph("Document Summary Report", title_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Add metadata
    story.append(Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", styles['Normal']))
    story.append(Paragraph(f"Language: {language.upper()}", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # Add summary
    story.append(Paragraph("Summary", heading_style))
    story.append(Paragraph(summary, styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # Add key points
    story.append(Paragraph("Key Points", heading_style))
    for i, point in enumerate(key_points, 1):
        story.append(Paragraph(f"{i}. {point}", styles['Normal']))
        story.append(Spacer(1, 0.1*inch))
    
    # Build PDF
    doc.build(story)
    return filepath