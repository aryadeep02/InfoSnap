
let selectedFile = null;

// DOM elements pakad lete hain reference ke liye
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const generateBtn = document.getElementById('generateBtn');
const resultsSection = document.getElementById('resultsSection');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');

// Drag and drop functionality - file drag karne pe
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault(); // default behavior rok do
    uploadArea.classList.add('drag-over'); // visual feedback do
});

// jab drag area se bahar jaaye
uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

// file drop karne pe
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    // dropped files check karo
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]); // pehli file lo bas
    }
});

// Normal file input se select karne pe
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

// File select hone pe validation aur processing
function handleFileSelect(file) {
    // allowed file types check karo
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp'];
    
    // agar file type allowed nahi hai to error dikhao
    if (!allowedTypes.includes(file.type)) {
        showError('Bhai valid file upload kar - PDF ya Image (PNG, JPG, GIF, BMP)');
        return;
    }
    
    // file size check karo - 16MB se zyada nahi
    if (file.size > 16 * 1024 * 1024) {
        showError('File size 16MB se kam honi chahiye bhai');
        return;
    }
    
    // sab theek hai to file save karo
    selectedFile = file;
    uploadArea.querySelector('h3').textContent = `Selected: ${file.name}`;
    generateBtn.disabled = false; // generate button enable karo
    hideError();
}

// Generate summary button click handler
generateBtn.addEventListener('click', async () => {
    // pehle check karo file selected hai ya nahi
    if (!selectedFile) {
        showError('Pehle file select kar bhai!');
        return;
    }
    
    // FormData banao file upload ke liye
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('length', document.querySelector('input[name="length"]:checked').value);
    
    // loading show karo, baaki sab hide karo
    loading.style.display = 'block';
    resultsSection.style.display = 'none';
    hideError();
    generateBtn.disabled = true;
    
    try {
        // backend pe request bhejo
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        // agar success hai to results dikhao
        if (response.ok && data.success) {
            displayResults(data);
        } else {
            showError(data.error || 'Kuch gadbad hui file process karte waqt');
        }
    } catch (error) {
        // network error ya koi aur issue
        showError('Network error aa gaya bhai. Phir try kar.');
        console.error('Error:', error);
    } finally {
        // loading hide karo aur button enable karo
        loading.style.display = 'none';
        generateBtn.disabled = false;
    }
});

// Results display karne ka function
function displayResults(data) {
    // statistics update karo
    document.getElementById('originalWords').textContent = `${data.text_length} words`;
    document.getElementById('summaryWords').textContent = `${data.summary_length} words`;
    
    // summary text set karo
    document.getElementById('summaryText').textContent = data.summary;
    
    // key points ki list banao
    const keyPointsList = document.getElementById('keyPointsList');
    keyPointsList.innerHTML = ''; // pehle clear karo
    data.key_points.forEach(point => {
        const li = document.createElement('li');
        li.textContent = point;
        keyPointsList.appendChild(li);
    });
    
    // results section dikhao
    resultsSection.style.display = 'block';
    
    // smooth scroll karke results pe le jao
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// App reset karne ka function - naya summary banane ke liye
function resetApp() {
    selectedFile = null;
    fileInput.value = '';
    uploadArea.querySelector('h3').textContent = 'Drag & Drop your file here';
    generateBtn.disabled = true;
    resultsSection.style.display = 'none';
    hideError();
    
    // radio button reset karo medium pe
    document.querySelector('input[name="length"][value="medium"]').checked = true;
}

// Error handling functions
function showError(message) {
    errorMessage.style.display = 'block';
    errorMessage.querySelector('p').textContent = message;
}

function hideError() {
    errorMessage.style.display = 'none';
}

// Translation function - summary ko dusri language me translate karne ke liye
async function translateSummary() {
    const languageSelect = document.getElementById('languageSelect');
    const selectedLang = languageSelect.value;
    
    // language select check karo
    if (!selectedLang) {
        alert('Bhai pehle language select kar!');
        return;
    }
    
    const summaryText = document.getElementById('summaryText').textContent;
    const translateBtn = document.getElementById('translateBtn');
    const translatedResult = document.getElementById('translatedResult');
    const translatedTextElement = document.getElementById('translatedText');
    
    // loading state dikhao
    translateBtn.disabled = true;
    translateBtn.textContent = 'Translating...';
    
    try {
        // backend pe translation request bhejo
        const response = await fetch('/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: summaryText,
                language: selectedLang
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // translated text dikhao
            translatedTextElement.textContent = data.translated_text;
            translatedResult.style.display = 'block';
            
            // smooth scroll karo translated result tak
            translatedResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            alert('Translation fail ho gaya: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Translation me error aa gaya: ' + error.message);
    } finally {
        // button ko wapas normal karo
        translateBtn.disabled = false;
        translateBtn.textContent = 'Translate';
    }
}

// Dark mode toggle karne ka function
function toggleTheme() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    const currentTheme = html.getAttribute('data-theme');
    
    // theme switch karo aur localStorage me save karo
    if (currentTheme === 'dark') {
        html.setAttribute('data-theme', 'light');
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
}

// PDF download karne ka function
async function downloadPDF() {
    const summary = document.getElementById('summaryText').textContent;
    const keyPointsElements = document.querySelectorAll('#keyPointsList li');
    const keyPoints = Array.from(keyPointsElements).map(li => li.textContent);
    const languageSelect = document.getElementById('languageSelect');
    const language = languageSelect ? languageSelect.value : 'en';
    
    // button ka reference lo event se
    const downloadBtn = document.querySelector('.download-btn');
    const originalText = downloadBtn.textContent;
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'PDF ban rahi hai...';
    
    try {
        // backend pe PDF generation request bhejo
        const response = await fetch('/download-pdf', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                summary: summary,
                key_points: keyPoints,
                language: language || 'en'
            })
        });
        
        if (response.ok) {
            // PDF blob banao aur download trigger karo
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `summary_${language || 'en'}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            alert('PDF generate karne me error aa gaya. Phir try kar.');
        }
    } catch (error) {
        alert('PDF download error: ' + error.message);
    } finally {
        // button wapas normal karo
        downloadBtn.disabled = false;
        downloadBtn.textContent = originalText;
    }
}

// Share summary function - link generate karke share karne ke liye
async function shareSummary() {
    const summaryElement = document.getElementById('summaryText');
    const keyPointsElements = document.querySelectorAll('#keyPointsList li');
    
    // check karo summary generate hui hai ya nahi
    if (!summaryElement || !summaryElement.textContent) {
        alert('Pehle summary generate kar bhai!');
        return;
    }
    
    const summary = summaryElement.textContent;
    const keyPoints = Array.from(keyPointsElements).map(li => li.textContent);
    const languageSelect = document.getElementById('languageSelect');
    const language = languageSelect ? languageSelect.value : 'en';
    
    try {
        // backend pe share link generate karne ki request
        const response = await fetch('/share', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                summary: summary,
                key_points: keyPoints,
                language: language || 'en'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // share modal show karo ya clipboard me copy karo
            const shareModal = document.getElementById('shareModal');
            const shareLink = document.getElementById('shareLink');
            const shareOverlay = document.getElementById('shareOverlay');
            
            if (shareModal && shareLink) {
                shareLink.value = data.share_url;
                shareModal.classList.add('active');
                if (shareOverlay) shareOverlay.style.display = 'block';
            } else {
                // fallback - direct clipboard me copy karo
                navigator.clipboard.writeText(data.share_url).then(() => {
                    alert('Share link copy ho gaya!\n\n' + data.share_url);
                }).catch(err => {
                    // purane browsers ke liye fallback
                    prompt('Is link ko copy karo:', data.share_url);
                });
            }
        } else {
            alert('Error: ' + (data.error || 'Share link nahi ban paya'));
        }
    } catch (error) {
        console.error('Share error:', error);
        alert('Share karne me error: ' + error.message);
    }
}

// Share link copy karne ka function
function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    if (shareLink) {
        shareLink.select();
        document.execCommand('copy');
        alert('Link copy ho gaya bhai!');
    }
}

// Share modal close karne ka function
function closeShareModal() {
    const shareModal = document.getElementById('shareModal');
    const shareOverlay = document.getElementById('shareOverlay');
    if (shareModal) {
        shareModal.classList.remove('active');
    }
    if (shareOverlay) {
        shareOverlay.style.display = 'none';
    }
}

// Page load hone pe saved theme apply karo
document.addEventListener('DOMContentLoaded', () => {
    // localStorage se theme check karo
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
});

// Sare functions ko globally available banao
window.resetApp = resetApp;
window.translateSummary = translateSummary;
window.toggleTheme = toggleTheme;
window.downloadPDF = downloadPDF;
window.shareSummary = shareSummary;
window.copyShareLink = copyShareLink;
window.closeShareModal = closeShareModal;
