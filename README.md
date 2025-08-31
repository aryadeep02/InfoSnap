# 📑 Info Snap - AI-Powered Document Summary Assistant

A modern web application that uses artificial intelligence to automatically summarize documents and extract key information from PDFs and images.

![AI Powered](https://img.shields.io/badge/AI-Powered-blue) ![Python](https://img.shields.io/badge/Python-3.8+-green) ![Flask](https://img.shields.io/badge/Flask-2.3.2-red) ![License](https://img.shields.io/badge/License-MIT-yellow)

## 🌟 Overview

Info Snap transforms lengthy documents into concise, intelligent summaries using state-of-the-art AI technology. Upload any PDF or image, and get a comprehensive summary in seconds with support for multiple languages.

## ✨ Key Features

- **📄 PDF & Image Support** - Extract text from PDFs and images (JPG, PNG, etc.) using advanced OCR  
- **🤖 AI Summarization** - Powered by Facebook's BART model for intelligent summaries  
- **📊 Flexible Summary Lengths** - Choose between short, medium, or long summaries  
- **🌍 Multi-Language Translation** - Translate summaries into 15+ languages  
- **📥 PDF Export** - Download summaries as beautifully formatted PDF documents  
- **🔗 Share Summaries** - Generate shareable links for collaboration  
- **🌙 Dark Mode** - Eye-friendly dark theme for comfortable reading  
- **📱 Responsive Design** - Works perfectly on desktop, tablet, and mobile devices  

## 🚀 Live Demo

Try it out: [https://infosnap.onrender.com](https://infosnap.onrender.com)

## 💻 Technology Stack

### Backend
- **Python 3.8+** - Core programming language  
- **Flask** - Web framework  
- **Transformers (Hugging Face)** - AI/ML models  
- **PyTesseract** - OCR for image text extraction  
- **PDFPlumber** - PDF text extraction  
- **Deep Translator** - Multi-language translation  

### Frontend
- **HTML5/CSS3** - Modern web standards  
- **JavaScript** - Interactive functionality  
- **Bootstrap-inspired UI** - Clean, professional design  

### AI Model
- **Facebook BART-large-CNN** - State-of-the-art summarization model  

## 📋 Prerequisites

Before running this application, make sure you have:

- Python 3.8 or higher  
- Tesseract OCR installed on your system  
- 4GB+ RAM (for AI model)  
- Modern web browser  

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/aryadeep02/info-snap.git
cd info-snap

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install Tesseract OCR
# Windows: Download from GitHub
# Mac: brew install tesseract
# Linux: sudo apt-get install tesseract-ocr

# Run the application
python app.py

```
Then open your browser and navigate to:  
👉 [http://localhost:5000](http://localhost:5000)

## 📝 How to Use

1. **Upload Document** - Drag and drop or click to upload a PDF/image file  
2. **Select Summary Length** - Choose short, medium, or long summary  
3. **Generate Summary** - Click the generate button to process your document  
4. **View Results** - See the summary, key points, and document statistics  
5. **Translate (Optional)** - Select a language to translate your summary  
6. **Download/Share** - Download as PDF or share via link  

## 📁 Project Structure
```
info-snap/
│
├── app.py # Main Flask application
├── requirements.txt # Python dependencies
│
├── static/ # Static files
│ ├── css/
│ │ ├── style.css # Main styles
│ │ └── pages.css # Page-specific styles
│ ├── js/
│ │ └── script.js # JavaScript functionality
│ └── image.png # Logo
│
├── templates/ # HTML templates
│ ├── index.html # Main page
│ ├── about.html # About page
│ ├── features.html # Features page
│ ├── contact.html # Contact page
│ ├── developer.html # Developer info
│ └── shared.html # Shared summary view
│
├── utils/ # Utility modules
│ ├── text_extraction.py # PDF/Image text extraction
│ ├── summarizer.py # AI summarization logic
│ └── pdf_generator.py # PDF generation
│
└── uploads/ # Temporary file storage
```

## 🔧 Configuration

- **Port**: Change in `app.py` (default: 5000)  
- **Upload Limit**: Modify `MAX_CONTENT_LENGTH` in `app.py` (default: 16MB)  
- **Summary Lengths**: Adjust in `utils/summarizer.py`  

## 🌐 API Endpoints

- `GET /` - Main application page  
- `POST /upload` - Upload and process document  
- `POST /translate` - Translate summary  
- `POST /download-pdf` - Generate PDF download  
- `POST /share` - Create shareable link  
- `GET /view/<id>` - View shared summary  

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes:

1. Fork the repository  
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)  
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)  
4. Push to the branch (`git push origin feature/AmazingFeature`)  
5. Open a Pull Request  

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Aryadeep Varshney**  

- GitHub: [@aryadeep02](https://github.com/aryadeep02)  
- Email: aryadeepvarshney85@gmail.com  

## 🙏 Acknowledgments

- Facebook AI for the BART model  
- Hugging Face for the Transformers library  
- Tesseract for OCR capabilities  
- Open source community for various libraries used  

## 🐛 Known Issues

- Large PDFs (>50 pages) may take longer to process  
- Some complex image layouts might affect OCR accuracy  
- Translation quality depends on the target language  

## 📈 Future Enhancements

- User authentication and history  
- Batch document processing  
- API for developers  
- Mobile app version  
- Support for more file formats  

---

   Made with ❤️ and ☕️ by **Aryadeep Varshney**



