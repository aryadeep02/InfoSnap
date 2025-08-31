
let selectedFile = null;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const generateBtn = document.getElementById('generateBtn');
const resultsSection = document.getElementById('resultsSection');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault(); 
    uploadArea.classList.add('drag-over'); 
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

function handleFileSelect(file) {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp'];
    
    if (!allowedTypes.includes(file.type)) {
        showError('Please Upload a Valid File - PDF or Image (PNG, JPG, GIF, BMP)');
        return;
    }
    
    if (file.size > 16 * 1024 * 1024) {
        showError('File size should be less than 16MB');
        return;
    }
    
    selectedFile = file;
    uploadArea.querySelector('h3').textContent = `Selected: ${file.name}`;
    generateBtn.disabled = false; 
    hideError();
}

generateBtn.addEventListener('click', async () => {
    if (!selectedFile) {
        showError('Please Select a file first');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('length', document.querySelector('input[name="length"]:checked').value);
    
    loading.style.display = 'block';
    resultsSection.style.display = 'none';
    hideError();
    generateBtn.disabled = true;
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            displayResults(data);
        } else {
            showError(data.error || 'Something Went Wrong');
        }
    } catch (error) {
        showError('Network error, Please Retry');
        console.error('Error:', error);
    } finally {
        loading.style.display = 'none';
        generateBtn.disabled = false;
    }
});

function displayResults(data) {
    document.getElementById('originalWords').textContent = `${data.text_length} words`;
    document.getElementById('summaryWords').textContent = `${data.summary_length} words`;
    
    document.getElementById('summaryText').textContent = data.summary;

    const keyPointsList = document.getElementById('keyPointsList');
    keyPointsList.innerHTML = '';
    data.key_points.forEach(point => {
        const li = document.createElement('li');
        li.textContent = point;
        keyPointsList.appendChild(li);
    });
    

    resultsSection.style.display = 'block';

    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function resetApp() {
    selectedFile = null;
    fileInput.value = '';
    uploadArea.querySelector('h3').textContent = 'Drag & Drop your file here';
    generateBtn.disabled = true;
    resultsSection.style.display = 'none';
    hideError();

    document.querySelector('input[name="length"][value="medium"]').checked = true;
}

function showError(message) {
    errorMessage.style.display = 'block';
    errorMessage.querySelector('p').textContent = message;
}

function hideError() {
    errorMessage.style.display = 'none';
}

async function translateSummary() {
    const languageSelect = document.getElementById('languageSelect');
    const selectedLang = languageSelect.value;
    
    if (!selectedLang) {
        alert('Please Select a Language!');
        return;
    }
    
    const summaryText = document.getElementById('summaryText').textContent;
    const translateBtn = document.getElementById('translateBtn');
    const translatedResult = document.getElementById('translatedResult');
    const translatedTextElement = document.getElementById('translatedText');
    
    translateBtn.disabled = true;
    translateBtn.textContent = 'Translating...';
    
    try {
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
            translatedTextElement.textContent = data.translated_text;
            translatedResult.style.display = 'block';
            
            translatedResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            alert('Translation Failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Translation error ' + error.message);
    } finally {
        translateBtn.disabled = false;
        translateBtn.textContent = 'Translate';
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    const currentTheme = html.getAttribute('data-theme');
    
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

async function downloadPDF() {
    const summary = document.getElementById('summaryText').textContent;
    const keyPointsElements = document.querySelectorAll('#keyPointsList li');
    const keyPoints = Array.from(keyPointsElements).map(li => li.textContent);
    const languageSelect = document.getElementById('languageSelect');
    const language = languageSelect ? languageSelect.value : 'en';
    
    const downloadBtn = document.querySelector('.download-btn');
    const originalText = downloadBtn.textContent;
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Pdf is Loading';
    
    try {

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
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `summary_${language || 'en'}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            alert('PDF generate error, Please Retry');
        }
    } catch (error) {
        alert('PDF download error: ' + error.message);
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = originalText;
    }
}

async function shareSummary() {
    const summaryElement = document.getElementById('summaryText');
    const keyPointsElements = document.querySelectorAll('#keyPointsList li');
    
    if (!summaryElement || !summaryElement.textContent) {
        alert('First Generate Summary');
        return;
    }
    
    const summary = summaryElement.textContent;
    const keyPoints = Array.from(keyPointsElements).map(li => li.textContent);
    const languageSelect = document.getElementById('languageSelect');
    const language = languageSelect ? languageSelect.value : 'en';
    
    try {
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
            const shareModal = document.getElementById('shareModal');
            const shareLink = document.getElementById('shareLink');
            const shareOverlay = document.getElementById('shareOverlay');
            
            if (shareModal && shareLink) {
                shareLink.value = data.share_url;
                shareModal.classList.add('active');
                if (shareOverlay) shareOverlay.style.display = 'block';
            } else {
                navigator.clipboard.writeText(data.share_url).then(() => {
                    alert('Share link Copied!\n\n' + data.share_url);
                }).catch(err => {
                    prompt('Copy This Link', data.share_url);
                });
            }
        } else {
            alert('Error: ' + (data.error || 'No Share Link Made'));
        }
    } catch (error) {
        console.error('Share error:', error);
        alert('Something Went Wrong ' + error.message);
    }
}

// Share link copy karne ka function
function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    if (shareLink) {
        shareLink.select();
        document.execCommand('copy');
        alert('Link copied! ');
    }
}

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

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
});

window.resetApp = resetApp;
window.translateSummary = translateSummary;
window.toggleTheme = toggleTheme;
window.downloadPDF = downloadPDF;
window.shareSummary = shareSummary;
window.copyShareLink = copyShareLink;
window.closeShareModal = closeShareModal;
