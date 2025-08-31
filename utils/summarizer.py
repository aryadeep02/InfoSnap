from transformers import pipeline
import torch
from deep_translator import GoogleTranslator

# Global variable to hold summarizer pipeline (lazy init)
_summarizer = None  

def get_summarizer():
    """Load summarizer pipeline only once (lazy loading)."""
    global _summarizer
    if _summarizer is None:
        device = 0 if torch.cuda.is_available() else -1
        # Load lightweight model if 512 MiB RAM, or keep bart-large-cnn if on bigger plan
        model_name = "facebook/bart-large-cnn"
        print(f"Loading summarizer model: {model_name} (device={device})")
        _summarizer = pipeline("summarization", model=model_name, device=device)
    return _summarizer


def translate_text(text, target_language):
    """Translate text to target language"""
    try:
        if target_language == 'en' or not target_language:
            return text
        
        translator = GoogleTranslator(source='auto', target=target_language)
        translation = translator.translate(text)
        return translation
    except Exception as e:
        print(f"Translation error: {e}")
        return text  # Return original if translation fails


def generate_summary(text, length="medium"):
    """Generate summary with configurable length"""
    
    # Configure summary lengths
    length_config = {
        "short": {"max_length": 75, "min_length": 30},
        "medium": {"max_length": 150, "min_length": 60},
        "long": {"max_length": 250, "min_length": 100}
    }
    config = length_config.get(length, length_config["medium"])
    
    max_input_length = 1024
    if len(text.split()) > max_input_length:
        text = ' '.join(text.split()[:max_input_length])
    
    try:
        summarizer = get_summarizer()  # <-- Lazy load here
        summary = summarizer(
            text,
            max_length=config["max_length"],
            min_length=config["min_length"],
            do_sample=False
        )[0]['summary_text']
        
        return {
            "success": True,
            "summary": summary,
            "key_points": extract_key_points(summary)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def extract_key_points(summary):
    """Extract key points from summary"""
    sentences = summary.split('. ')
    key_points = sentences[:3]
    return [point.strip() + '.' for point in key_points if point]
