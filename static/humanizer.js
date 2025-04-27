document.addEventListener('DOMContentLoaded', function() {
    const textInput = document.getElementById('text-input');
    const charCounter = document.getElementById('char-counter');
    const clearBtn = document.getElementById('clear-btn');
    const analyzeBtn = document.getElementById('analyze-text-btn');
    const resultsSection = document.getElementById('results-section');
    const analysisLoading = document.getElementById('analysis-loading');
    const analysisContent = document.getElementById('analysis-content');
    const thinkingText = document.getElementById('thinking-text');
    const aiScoreFill = document.getElementById('ai-score-fill');
    const aiScoreValue = document.getElementById('ai-score-value');
    const aiScoreExplanation = document.getElementById('ai-score-explanation');
    const humanizeSection = document.getElementById('humanize-section');
    const humanizeBtn = document.getElementById('humanize-btn');
    const humanizedResult = document.getElementById('humanized-result');
    const humanizedText = document.getElementById('humanized-text');
    const copyHumanizedBtn = document.getElementById('copy-humanized-btn');
    const reanalyzeBtn = document.getElementById('reanalyze-btn');

    function updateCharCount() {
        const count = textInput.value.length;
        charCounter.textContent = `${count} символов`;
        
        if (count >= 6) {
            analyzeBtn.disabled = false;
            analyzeBtn.classList.remove('disabled');
        } else {
            analyzeBtn.disabled = true;
            analyzeBtn.classList.add('disabled');
        }
    }

    clearBtn.addEventListener('click', function() {
        textInput.value = '';
        updateCharCount();
    });

    textInput.addEventListener('input', updateCharCount);

    analyzeBtn.addEventListener('click', async function() {
        const text = textInput.value.trim();
        
        if (text.length < 6) {
            alert('Пожалуйста, введите текст длиной не менее 6 символов');
            return;
        }
        
        resultsSection.style.display = 'block';
        analysisLoading.style.display = 'flex';
        analysisContent.style.display = 'none';
        humanizedResult.style.display = 'none';
        
        const container = document.getElementById('analysis-container');
        container.style.animation = 'none';
        requestAnimationFrame(() => {
            container.style.animation = '';
        });
        
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        try {
            const response = await fetch('/api/analyze_text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });
            
            if (!response.ok) {
                throw new Error('Ошибка при анализе текста');
            }
            
            const data = await response.json();
            
            thinkingText.textContent = data.thinking || 'Анализ текста завершен';
            
            const score = data.ai_score;
            aiScoreFill.style.width = `${score}%`;
            aiScoreValue.textContent = `${score}%`;
            
            if (score < 30) {
                aiScoreFill.className = 'ai-score-fill ai-score-low';
            } else if (score < 70) {
                aiScoreFill.className = 'ai-score-fill ai-score-medium';
            } else {
                aiScoreFill.className = 'ai-score-fill ai-score-high';
            }
            
            aiScoreExplanation.textContent = data.explanation || '';
            
            if (score >= 50) {
                humanizeSection.style.display = 'block';
            } else {
                humanizeSection.style.display = 'none';
            }
            
            analysisLoading.style.display = 'none';
            analysisContent.style.display = 'block';
            
        } catch (error) {
            console.error('Error analyzing text:', error);
            thinkingText.textContent = 'Произошла ошибка при анализе текста. Пожалуйста, попробуйте еще раз.';
            analysisLoading.style.display = 'none';
            analysisContent.style.display = 'block';
        }
    });
    
    humanizeBtn.addEventListener('click', async function() {
        const text = textInput.value.trim();
        
        if (text.length < 6) {
            alert('Пожалуйста, введите текст длиной не менее 6 символов');
            return;
        }
        
        analysisLoading.style.display = 'flex';
        analysisContent.style.display = 'none';
        
        const container = document.getElementById('analysis-container');
        container.style.animation = 'none';
        requestAnimationFrame(() => {
            container.style.animation = '';
        });
        
        try {
            const response = await fetch('/api/humanize_text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });
            
            if (!response.ok) {
                throw new Error('Ошибка при обработке текста');
            }
            
            const data = await response.json();
            
            humanizedText.textContent = data.humanized_text || '';
            
            analysisLoading.style.display = 'none';
            analysisContent.style.display = 'block';
            humanizedResult.style.display = 'block';
            
        } catch (error) {
            console.error('Error humanizing text:', error);
            thinkingText.textContent = 'Произошла ошибка при обработке текста. Пожалуйста, попробуйте еще раз.';
            analysisLoading.style.display = 'none';
            analysisContent.style.display = 'block';
        }
    });
    
    copyHumanizedBtn.addEventListener('click', function() {
        const text = humanizedText.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyHumanizedBtn.innerHTML;
            copyHumanizedBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Скопировано
            `;
            
            setTimeout(() => {
                copyHumanizedBtn.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Error copying text: ', err);
        });
    });
    
    reanalyzeBtn.addEventListener('click', async function() {
        const text = humanizedText.textContent.trim();
        
        if (text.length < 6) {
            alert('Текст слишком короткий для анализа');
            return;
        }
        
        textInput.value = text;
        updateCharCount();
        
        analysisLoading.style.display = 'flex';
        analysisContent.style.display = 'none';
        
        const container = document.getElementById('analysis-container');
        container.style.animation = 'none';
        requestAnimationFrame(() => {
            container.style.animation = '';
        });
        
        try {
            const response = await fetch('/api/analyze_text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });
            
            if (!response.ok) {
                throw new Error('Ошибка при анализе текста');
            }
            
            const data = await response.json();
            
            thinkingText.textContent = data.thinking || 'Анализ текста завершен';
            
            const score = data.ai_score;
            aiScoreFill.style.width = `${score}%`;
            aiScoreValue.textContent = `${score}%`;
            
            if (score < 30) {
                aiScoreFill.className = 'ai-score-fill ai-score-low';
            } else if (score < 70) {
                aiScoreFill.className = 'ai-score-fill ai-score-medium';
            } else {
                aiScoreFill.className = 'ai-score-fill ai-score-high';
            }
            
            aiScoreExplanation.textContent = data.explanation || '';
            
            if (score >= 50) {
                humanizeSection.style.display = 'block';
            } else {
                humanizeSection.style.display = 'none';
            }
            
            analysisLoading.style.display = 'none';
            analysisContent.style.display = 'block';
            
        } catch (error) {
            console.error('Error analyzing text:', error);
            thinkingText.textContent = 'Произошла ошибка при анализе текста. Пожалуйста, попробуйте еще раз.';
            analysisLoading.style.display = 'none';
            analysisContent.style.display = 'block';
        }
    });
    
    updateCharCount();
});