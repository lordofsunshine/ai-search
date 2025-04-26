document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('image-upload');
    const previewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const changeImageBtn = document.getElementById('change-image-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resultsSection = document.getElementById('results-section');
    const promptLoading = document.getElementById('prompt-loading');
    const promptContent = document.getElementById('prompt-content');
    const thinkingText = document.getElementById('thinking-text');
    const promptText = document.getElementById('prompt-text');
    const copyBtn = document.getElementById('copy-btn');
    const translateBtn = document.getElementById('translate-btn');
    
    let currentImage = null;
    let promptData = {
        originalPrompt: '',
        translatedPrompt: '',
        isTranslated: false
    };

    document.querySelector('.browse-link').addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileSelect);

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    uploadArea.addEventListener('drop', handleDrop, false);

    changeImageBtn.addEventListener('click', () => {
        previewContainer.style.display = 'none';
        uploadArea.style.display = 'flex';
        resultsSection.style.display = 'none';
        currentImage = null;
    });

    analyzeBtn.addEventListener('click', analyzeImage);

    copyBtn.addEventListener('click', copyPromptToClipboard);

    translateBtn.addEventListener('click', toggleTranslation);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        uploadArea.classList.add('highlight');
    }

    function unhighlight() {
        uploadArea.classList.remove('highlight');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            fileInput.files = files;
            handleFileSelect();
        }
    }

    function handleFileSelect() {
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            
            if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/webp')) {
                showError('Пожалуйста, загрузите изображение в формате JPG, PNG или WebP.');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                showError('Размер файла превышает 5MB. Пожалуйста, выберите файл меньшего размера.');
                return;
            }

            const reader = new FileReader();
            
            reader.onload = function(e) {
                uploadArea.style.display = 'none';
                previewContainer.style.display = 'block';
                
                currentImage = e.target.result;
                
                const img = document.createElement('img');
                img.src = currentImage;
                imagePreview.innerHTML = '';
                imagePreview.appendChild(img);
            };
            
            reader.readAsDataURL(file);
        }
    }

    async function analyzeImage() {
        if (!currentImage) {
            showError('Пожалуйста, сначала загрузите изображение.');
            return;
        }

        resultsSection.style.display = 'block';
        promptLoading.style.display = 'flex';
        promptContent.style.display = 'none';
        
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        try {
            const base64Data = currentImage.split(',')[1];
            
            const response = await fetch('/api/img2prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: base64Data })
            });

            const data = await response.json();
            
            if (!response.ok || data.error) {
                throw new Error(data.error || 'Ошибка при обработке изображения');
            }
            
            promptLoading.style.display = 'none';
            promptContent.style.display = 'block';
            
            thinkingText.textContent = data.thinking || 'Изображение успешно проанализировано';
            promptText.textContent = data.prompt;
            
            promptData.originalPrompt = data.prompt;
            promptData.translatedPrompt = data.translated_prompt || '';
            promptData.isTranslated = false;
            
            if (data.translated_prompt) {
                translateBtn.style.display = 'block';
            } else {
                translateBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Error:', error);
            promptLoading.style.display = 'none';
            promptContent.style.display = 'block';
            thinkingText.textContent = error.message || 'Произошла ошибка при анализе изображения';
            promptText.textContent = 'Пожалуйста, попробуйте еще раз или загрузите другое изображение.';
            translateBtn.style.display = 'none';
        }
    }

    function copyPromptToClipboard() {
        const textToCopy = promptData.isTranslated ? promptData.translatedPrompt : promptData.originalPrompt;
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                </svg>
                Скопировано!
            `;
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Не удалось скопировать текст: ', err);
        });
    }

    function toggleTranslation() {
        if (promptData.isTranslated) {
            promptText.textContent = promptData.originalPrompt;
            translateBtn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><g fill="currentColor"><path d="M4.545 6.714L4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286zm1.634-.736L5.5 3.956h-.049l-.679 2.022z"/><path d="M0 2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm7.138 9.995q.289.451.63.846c-.748.575-1.673 1.001-2.768 1.292c.178.217.451.635.555.867c1.125-.359 2.08-.844 2.886-1.494c.777.665 1.739 1.165 2.93 1.472c.133-.254.414-.673.629-.89c-1.125-.253-2.057-.694-2.82-1.284c.681-.747 1.222-1.651 1.621-2.757H14V8h-3v1.047h.765c-.318.844-.74 1.546-1.272 2.13a6 6 0 0 1-.415-.492a2 2 0 0 1-.94.31"/></g></svg>
                Перевести на русский
            `;
        } else {
            promptText.textContent = promptData.translatedPrompt;
            translateBtn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><g fill="currentColor"><path d="M4.545 6.714L4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286zm1.634-.736L5.5 3.956h-.049l-.679 2.022z"/><path d="M0 2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm7.138 9.995q.289.451.63.846c-.748.575-1.673 1.001-2.768 1.292c.178.217.451.635.555.867c1.125-.359 2.08-.844 2.886-1.494c.777.665 1.739 1.165 2.93 1.472c.133-.254.414-.673.629-.89c-1.125-.253-2.057-.694-2.82-1.284c.681-.747 1.222-1.651 1.621-2.757H14V8h-3v1.047h.765c-.318.844-.74 1.546-1.272 2.13a6 6 0 0 1-.415-.492a2 2 0 0 1-.94.31"/></g></svg>
            Показать оригинал
            `;
        }
        
        promptData.isTranslated = !promptData.isTranslated;
    }

    function showError(message) {
        alert(message);
    }
});