
from flask import Flask, render_template, request, jsonify, send_file, url_for, redirect
import os
from werkzeug.utils import secure_filename
from utils.text_extraction import extract_text
from utils.summarizer import generate_summary, translate_text
from utils.pdf_generator import generate_pdf
import shutil
import uuid
import json
from datetime import datetime, timedelta
import logging
from functools import wraps
import time

# App initialize karo
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB limit
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp'}

# Create necessary folders
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('static/temp', exist_ok=True)

# In-memory storage
shared_summaries = {}

# Helper functions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def cleanup_old_shares():
    current_time = datetime.now()
    to_delete = []
    
    for share_id, data in shared_summaries.items():
        created_at = datetime.strptime(data['created_at'], '%Y-%m-%d %H:%M:%S')
        if current_time - created_at > timedelta(hours=24):
            to_delete.append(share_id)
    
    for share_id in to_delete:
        del shared_summaries[share_id]

# Rate limiting decorator
def rate_limit(max_calls=10, time_window=60):
    calls = {}
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            now = time.time()
            client_ip = request.remote_addr
            
            calls[client_ip] = [call for call in calls.get(client_ip, []) 
                               if call > now - time_window]
            
            if len(calls.get(client_ip, [])) >= max_calls:
                return jsonify({'error': 'Rate limit exceeded. Try again later.'}), 429
            
            calls.setdefault(client_ip, []).append(now)
            
            return f(*args, **kwargs)
        return wrapper
    return decorator

# Context processor
@app.context_processor
def inject_globals():
    return {
        'app_name': 'Info Snap',
        'current_year': datetime.now().year,
        'version': '1.0.0'
    }

# Middleware - before request
@app.before_request
def log_request():
    logger.info(f"{request.method} {request.path} from {request.remote_addr}")

# Middleware - after request  
@app.after_request
def set_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(e):
    return render_template('500.html'), 500

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/developer')
def developer():
    return render_template('developer.html')

@app.route('/blog')
def blog():
    return render_template('blog.html')

@app.route('/upload', methods=['POST'])
@rate_limit(max_calls=5, time_window=60)
def upload_file():
    try:
        logger.info("Upload request received")
        
        if 'file' not in request.files:
            logger.warning("No file in request")
            return jsonify({'error': 'Koi file nahi mili bhai!'}), 400
        
        file = request.files['file']
        summary_length = request.form.get('length', 'medium')
        
        if file.filename == '':
            return jsonify({'error': 'File select kar pehle!'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Ye file type allowed nahi hai. PDF ya Image upload kar!'}), 400
        
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        file.save(file_path)
        logger.info(f"File saved: {unique_filename}")
        file_type = 'pdf' if filename.lower().endswith('.pdf') else 'image'
        
        extracted_text = extract_text(file_path, file_type)
        
        try:
            os.remove(file_path)
        except:
            pass
        
        if not extracted_text or extracted_text.startswith('Error'):
            logger.error(f"Text extraction failed: {extracted_text}")
            return jsonify({
                'error': 'Text extract nahi ho paya. Check kar file me text hai ya nahi!'
            }), 400
        
        logger.info("Generating summary...")
        result = generate_summary(extracted_text, summary_length)
        
        if result['success']:
            original_words = len(extracted_text.split())
            summary_words = len(result['summary'].split())
            
            logger.info(f"Summary generated successfully. Original: {original_words} words, Summary: {summary_words} words")
            
            return jsonify({
                'success': True,
                'summary': result['summary'],
                'key_points': result['key_points'],
                'text_length': original_words,
                'summary_length': summary_words,
                'reduction_percentage': round((1 - summary_words/original_words) * 100, 1)
            })
        else:
            logger.error(f"Summary generation failed: {result.get('error')}")
            return jsonify({'error': result.get('error', 'Summary generate nahi ho paya!')}), 500
            
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({'error': f'Kuch gadbad ho gayi: {str(e)}'}), 500

@app.route('/translate', methods=['POST'])
@rate_limit(max_calls=10, time_window=60)
def translate():
    try:
        data = request.json
        text = data.get('text', '')
        target_lang = data.get('language', 'en')
        
        if not text:
            return jsonify({'error': 'Text nahi mila translate karne ke liye!'}), 400
        
        logger.info(f"Translating to: {target_lang}")
        
        translated = translate_text(text, target_lang)
        
        if not translated:
            return jsonify({'error': 'Translation fail ho gaya!'}), 500
        
        logger.info(f"Translation successful: {len(translated)} characters")
        
        return jsonify({
            'success': True,
            'translated_text': translated,
            'language': target_lang,
            'original_length': len(text),
            'translated_length': len(translated)
        })
        
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return jsonify({'error': f'Translation me error: {str(e)}'}), 500

@app.route('/download-pdf', methods=['POST'])
@rate_limit(max_calls=5, time_window=60)
def download_pdf():
    try:
        data = request.json
        summary = data.get('summary', '')
        key_points = data.get('key_points', [])
        language = data.get('language', 'en')
        
        if not summary:
            return jsonify({'error': 'Summary nahi mili PDF banane ke liye!'}), 400
        
        logger.info(f"Generating PDF for language: {language}")
        
        pdf_path = generate_pdf(summary, key_points, language)
        
        if not pdf_path or not os.path.exists(pdf_path):
            return jsonify({'error': 'PDF generate nahi ho payi!'}), 500
        
        def remove_file(response):
            try:
                os.remove(pdf_path)
            except:
                pass
            return response
        
        return send_file(
            pdf_path,
            as_attachment=True,
            download_name=f'info_snap_summary_{language}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf',
            mimetype='application/pdf'
        )
        
    except Exception as e:
        logger.error(f"PDF generation error: {str(e)}")
        return jsonify({'error': f'PDF generation me error: {str(e)}'}), 500

@app.route('/share', methods=['POST'])
@rate_limit(max_calls=10, time_window=60)
def share_summary():
    try:
        cleanup_old_shares()
        
        data = request.json
        summary = data.get('summary', '')
        key_points = data.get('key_points', [])
        language = data.get('language', 'en')
        
        if not summary:
            return jsonify({'error': 'Summary nahi hai share karne ke liye!'}), 400
        
        share_id = str(uuid.uuid4())[:8]
        
        shared_summaries[share_id] = {
            'summary': summary,
            'key_points': key_points,
            'language': language,
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'views': 0,
            'expires_at': (datetime.now() + timedelta(hours=24)).strftime('%Y-%m-%d %H:%M:%S')
        }
        
        share_url = url_for('view_shared', share_id=share_id, _external=True)
        
        logger.info(f"Created share link: {share_url} with ID: {share_id}")
        
        return jsonify({
            'success': True,
            'share_url': share_url,
            'share_id': share_id,
            'expires_in': '24 hours'
        })
        
    except Exception as e:
        logger.error(f"Share error: {str(e)}")
        return jsonify({'error': f'Share karne me error: {str(e)}'}), 500

@app.route('/view/<share_id>')
def view_shared(share_id):
    logger.info(f"Viewing share ID: {share_id}")
    
    cleanup_old_shares()
    
    summary_data = shared_summaries.get(share_id)
    
    if not summary_data:
        logger.warning(f"Share ID not found: {share_id}")
        return render_template('404.html', 
                             message="Ye summary expire ho gayi hai ya exist nahi karti!"), 404
    
    summary_data['views'] += 1
    
    expires_at = datetime.strptime(summary_data['expires_at'], '%Y-%m-%d %H:%M:%S')
    time_remaining = expires_at - datetime.now()
    hours_remaining = int(time_remaining.total_seconds() / 3600)
    
    return render_template('shared.html', 
                         data=summary_data,
                         share_id=share_id,
                         hours_remaining=hours_remaining)

@app.route('/submit-contact', methods=['POST'])
@rate_limit(max_calls=3, time_window=300)
def submit_contact():
    try:
        data = request.json
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        message = data.get('message', '').strip()
        
        if not all([name, email, message]):
            return jsonify({'error': 'Sab fields bharna zaroori hai!'}), 400
        
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Valid email address daal bhai!'}), 400
        
        logger.info(f"Contact form submitted by {name} ({email})")
        
        contact_data = {
            'name': name,
            'email': email,
            'message': message,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'ip': request.remote_addr
        }
        
        with open('contact_submissions.json', 'a') as f:
            json.dump(contact_data, f)
            f.write('\n')
        
        return jsonify({
            'success': True,
            'message': 'Message mil gaya! Jaldi reply karenge.'
        })
        
    except Exception as e:
        logger.error(f"Contact form error: {str(e)}")
        return jsonify({'error': 'Message send nahi ho paya. Thodi der me try kar.'}), 500

@app.route('/api/stats')
def api_stats():
    try:
        stats = {
            'total_shares': len(shared_summaries),
            'active_shares': len([s for s in shared_summaries.values() 
                                if datetime.strptime(s['expires_at'], '%Y-%m-%d %H:%M:%S') > datetime.now()]),
            'total_views': sum(s.get('views', 0) for s in shared_summaries.values()),
            'api_status': 'operational',
                        'server_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Stats error: {str(e)}")
        return jsonify({'error': 'Stats nahi mil paye'}), 500

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

# CLI commands
@app.cli.command()
def cleanup():
    """Clean up old files and expired shares"""
    cleanup_old_shares()
    
    temp_dir = 'static/temp'
    if os.path.exists(temp_dir):
        for file in os.listdir(temp_dir):
            file_path = os.path.join(temp_dir, file)
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)
            except:
                pass
    
    print("Cleanup completed!")

@app.cli.command()
def init_db():
    """Initialize database (if using in future)"""
    print("Database initialized!")

if __name__ == '__main__':
    app.run(debug=True, port=5000)
