from flask import Flask, render_template, request, jsonify, send_file, url_for
import os
from werkzeug.utils import secure_filename
from utils.text_extraction import extract_text
from utils.summarizer import generate_summary, translate_text
from utils.pdf_generator import generate_pdf
import uuid
import json
from datetime import datetime, timedelta
import logging
from functools import wraps
import time


app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB limit
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp'}

# required folders
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('static/temp', exist_ok=True)

# In-memory cache
shared_summaries = {}

# ==============================
# Helper Functions
# ==============================
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def cleanup_old_shares():
    now = datetime.now()
    expired = []
    for sid, data in shared_summaries.items():
        created_at = datetime.strptime(data['created_at'], "%Y-%m-%d %H:%M:%S")
        if now - created_at > timedelta(hours=24):
            expired.append(sid)
    for sid in expired:
        del shared_summaries[sid]

def rate_limit(max_calls=10, time_window=60):
    calls = {}
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            now = time.time()
            ip = request.remote_addr
            calls[ip] = [c for c in calls.get(ip, []) if c > now - time_window]
            if len(calls.get(ip, [])) >= max_calls:
                return jsonify({'error': 'Rate limit exceeded. Try again later.'}), 429
            calls.setdefault(ip, []).append(now)
            return f(*args, **kwargs)
        return wrapper
    return decorator

# ==============================
# Routes
# ==============================
@app.route('/')
def index():
    return render_template("index.html")

@app.route('/upload', methods=['POST'])
@rate_limit(max_calls=5, time_window=60)
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Koi file nahi mili bhai!'}), 400

        file = request.files['file']
        length = request.form.get('length', 'medium')

        if file.filename == '':
            return jsonify({'error': 'File select kar pehle!'}), 400
        if not allowed_file(file.filename):
            return jsonify({'error': 'Sirf PDF ya Image allowed hai!'}), 400

        filename = secure_filename(file.filename)
        unique = f"{uuid.uuid4()}_{filename}"
        fpath = os.path.join(app.config['UPLOAD_FOLDER'], unique)
        file.save(fpath)

        ftype = "pdf" if filename.lower().endswith(".pdf") else "image"
        text = extract_text(fpath, ftype)

        # cleanup file
        try: os.remove(fpath)
        except: pass

        if not text or text.startswith("Error"):
            return jsonify({'error': "Text extract nahi ho paya. Check kar file me text hai ya nahi!"}), 400

        result = generate_summary(text, length)
        if not result["success"]:
            return jsonify({'error': result["error"]}), 500

        return jsonify({
            "success": True,
            "summary": result["summary"],
            "key_points": result["key_points"],
            "text_length": len(text.split()),
            "summary_length": len(result["summary"].split())
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/translate', methods=['POST'])
def translate():
    try:
        data = request.json
        text = data.get("text", "")
        lang = data.get("language", "en")
        if not text:
            return jsonify({'error': 'Text nahi mila!'}), 400
        return jsonify({
            "success": True,
            "translated_text": translate_text(text, lang),
            "language": lang
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/download-pdf', methods=['POST'])
def download_pdf():
    try:
        data = request.json
        summary = data.get("summary", "")
        points = data.get("key_points", [])
        lang = data.get("language", "en")

        pdf_path = generate_pdf(summary, points, lang)
        return send_file(pdf_path,
                         as_attachment=True,
                         download_name=f"summary_{lang}.pdf",
                         mimetype="application/pdf")
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    })

# Debug OCR route
@app.route("/debug-ocr")
def debug_ocr():
    import subprocess
    try:
        ver = subprocess.check_output(["tesseract", "--version"]).decode("utf-8")
        return {"tesseract_version": ver}
    except Exception as e:
        return {"error": str(e)}

# ==============================
# Entry point
# ==============================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
