let selectedFile = null;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const generateBtn = document.getElementById('generateBtn');
const resultsSection = document.getElementById('resultsSection');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');

// Add null checks for critical elements
if (!uploadArea || !fileInput || !generateBtn) {
    console.error('Critical DOM elements not found');
}

uploadArea?.addEventListener('dragover', (e) => {
    e.preventDefault(); 
    uploadArea.classList.add('drag-over'); 
});

uploadArea?.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea?.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

fileInput?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

function handleFileSelect(file) {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp'];
    
    if (!allowedTypes.includes(file.type)) {
        showError('Please upload a valid file - PDF or Image (PNG, JPG, GIF, BMP)');
        return;
    }
    
    if (file.size > 16 * 1024 * 1024) {
        showError('File size should be less than 16MB');
        return;
    }
    
    selectedFile = file;
    const uploadTitle = uploadArea?.querySelector('h3');
    if (uploadTitle) {
        uploadTitle.textContent = `Selected: ${file.name}`;
    }
    if (generateBtn) generateBtn.disabled = false; 
    hideError();
}

generateBtn?.addEventListener('click', async () => {
    if (!selectedFile) {
        showError('Please select a file first');
        return;
    }
    
    const lengthInput = document.querySelector('input[name="length"]:checked');
    if (!lengthInput) {
        showError('Please select a summary length');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('length', lengthInput.value);
    
    if (loading) loading.style.display = 'block';
    if (resultsSection) resultsSection.style.display = 'none';
    hideError();
    if (generateBtn) generateBtn.disabled = true;
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            displayResults(data);
        } else {
            showError(data.error || 'Something went wrong. Please try again.');
        }
    } catch (error) {
        showError('Network error. Please check your connection and try again.');
        console.error('Error:', error);
    } finally {
        if (loading) loading.style.display = 'none';
        if (generateBtn) generateBtn.disabled = false;
    }
});

function displayResults(data) {
    const originalWords = document.getElementById('originalWords');
    const summaryWords = document.getElementById('summaryWords');
    const summaryText = document.getElementById('summaryText');
    const keyPointsList = document.getElementById('keyPointsList');
    
    if (originalWords) originalWords.textContent = `${data.text_length} words`;
    if (summaryWords) summaryWords.textContent = `${data.summary_length} words`;
    if (summaryText) summaryText.textContent = data.summary;

    if (keyPointsList) {
        keyPointsList.innerHTML = '';
        data.key_points.forEach(point => {
            const li = document.createElement('li');
            li.textContent = point;
            keyPointsList.appendChild(li);
        });
    }

    if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function resetApp() {
    selectedFile = null;
    if (fileInput) fileInput.value = '';
    
    const uploadTitle = uploadArea?.querySelector('h3');
    if (uploadTitle) {
        uploadTitle.textContent = 'Drag & Drop your file here';
    }
    
    if (generateBtn) generateBtn.disabled = true;
    if (resultsSection) resultsSection.style.display = 'none';
    hideError();

    const defaultLength = document.querySelector('input[name="length"][value="medium"]');
    if (defaultLength) defaultLength.checked = true;
}

function showError(message) {
    if (errorMessage) {
        errorMessage.style.display = 'block';
        const errorText = errorMessage.querySelector('p');
        if (errorText) errorText.textContent = message;
    }
}

function hideError() {
    if (errorMessage) errorMessage.style.display = 'none';
}

async function translateSummary() {
    const languageSelect = document.getElementById('languageSelect');
    const selectedLang = languageSelect?.value;
    
    if (!selectedLang) {
        alert('Please select a language!');
        return;
    }
    
    const summaryTextElement = document.getElementById('summaryText');
    const summaryText = summaryTextElement?.textContent;
    
    if (!summaryText) {
        alert('No summary available to translate');
        return;
    }
    
    const translateBtn = document.getElementById('translateBtn');
    const translatedResult = document.getElementById('translatedResult');
    const translatedTextElement = document.getElementById('translatedText');
    
    if (translateBtn) {
        translateBtn.disabled = true;
        translateBtn.textContent = 'Translating...';
    }
    
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
            if (translatedTextElement) translatedTextElement.textContent = data.translated_text;
            if (translatedResult) {
                translatedResult.style.display = 'block';
                translatedResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } else {
            alert('Translation failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Translation error: ' + error.message);
    } finally {
        if (translateBtn) {
            translateBtn.disabled = false;
            translateBtn.textContent = 'Translate';
        }
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    const currentTheme = html.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        html.setAttribute('data-theme', 'light');
        if (themeIcon) themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        if (themeIcon) themeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
}

async function downloadPDF() {
    const summaryElement = document.getElementById('summaryText');
    const summary = summaryElement?.textContent;
    
    if (!summary) {
        alert('No summary available to download');
        return;
    }
    
    const keyPointsElements = document.querySelectorAll('#keyPointsList li');
    const keyPoints = Array.from(keyPointsElements).map(li => li.textContent);
    const languageSelect = document.getElementById('languageSelect');
    const language = languageSelect?.value || 'en';
    
    const downloadBtn = document.querySelector('.download-btn');
    const originalText = downloadBtn?.textContent || 'Download PDF';
    
    if (downloadBtn) {
        downloadBtn.disabled = true;
                downloadBtn.textContent = 'Generating PDF...';
    }
    
    try {
        const response = await fetch('/download-pdf', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                summary: summary,
                key_points: keyPoints,
                language: language
            })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `summary_${language}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            const errorData = await response.json().catch(() => ({}));
            alert('PDF generation error: ' + (errorData.error || 'Please try again'));
        }
    } catch (error) {
        alert('PDF download error: ' + error.message);
    } finally {
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.textContent = originalText;
        }
    }
}

async function shareSummary() {
    const summaryElement = document.getElementById('summaryText');
    const keyPointsElements = document.querySelectorAll('#keyPointsList li');
    
    if (!summaryElement || !summaryElement.textContent) {
        alert('Please generate a summary first');
        return;
    }
    
    const summary = summaryElement.textContent;
    const keyPoints = Array.from(keyPointsElements).map(li => li.textContent);
    const languageSelect = document.getElementById('languageSelect');
    const language = languageSelect?.value || 'en';
    
    // Disable share button while processing
    const shareBtn = event?.target;
    if (shareBtn && shareBtn.tagName === 'BUTTON') {
        shareBtn.disabled = true;
    }
    
    try {
        const response = await fetch('/share', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                summary: summary,
                key_points: keyPoints,
                language: language
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
                // Fallback if modal elements don't exist
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(data.share_url).then(() => {
                        alert('Share link copied to clipboard!\n\n' + data.share_url);
                    }).catch(err => {
                        prompt('Copy this link:', data.share_url);
                    });
                } else {
                    prompt('Copy this link:', data.share_url);
                }
            }
        } else {
            alert('Error creating share link: ' + (data.error || 'Please try again'));
        }
    } catch (error) {
        console.error('Share error:', error);
        alert('Failed to create share link: ' + error.message);
    } finally {
        if (shareBtn && shareBtn.tagName === 'BUTTON') {
            shareBtn.disabled = false;
        }
    }
}

function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    if (!shareLink) return;
    
    shareLink.select();
    shareLink.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareLink.value).then(() => {
                showCopyFeedback('Link copied!');
            }).catch(() => {
                fallbackCopy();
            });
        } else {
            fallbackCopy();
        }
    } catch (err) {
        fallbackCopy();
    }
    
    function fallbackCopy() {
        if (document.execCommand('copy')) {
            showCopyFeedback('Link copied!');
        } else {
            alert('Please manually copy the link');
        }
    }
    
    function showCopyFeedback(message) {
        const copyBtn = document.querySelector('.copy-btn');
        if (copyBtn) {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = message;
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        } else {
            alert(message);
        }
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
    
    // Add ESC key listener for modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeShareModal();
        }
    });
    
    // Add click outside modal to close
    const shareOverlay = document.getElementById('shareOverlay');
    shareOverlay?.addEventListener('click', (e) => {
        if (e.target === shareOverlay) {
            closeShareModal();
        }
    });
});

// Export functions to global scope
window.resetApp = resetApp;
window.translateSummary = translateSummary;
window.toggleTheme = toggleTheme;
window.downloadPDF = downloadPDF;
window.shareSummary = shareSummary;
window.copyShareLink = copyShareLink;
window.closeShareModal = closeShareModal;
