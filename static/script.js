document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const resultsContainer = document.getElementById('results-container');
    const resultsHeader = document.querySelector('.results-header h3');
    const searchExamples = document.querySelectorAll('.search-examples span');
    const paginationContainer = document.getElementById('pagination-container');
    
    let allResults = [];
    let currentPage = 1;
    const resultsPerPage = 3;
    let isSearchResults = false;
    
    let placeholders = [
        'Найти нейросеть для создания изображений...',
        'Написать текст с помощью ИИ...',
        'Обработать данные нейросетью...',
        'Преобразовать речь в текст...',
        'Создать код с помощью ИИ...'
    ];
    
    let currentPlaceholder = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 80;
    
    function getPricingBadge(pricing) {
        let badgeClass, badgeText, badgeIcon;
        
        switch(pricing) {
            case 'free':
                badgeClass = 'pricing-badge free';
                badgeText = 'Бесплатный';
                badgeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>';
                break;
            case 'paid':
                badgeClass = 'pricing-badge paid';
                badgeText = 'Платный';
                badgeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>';
                break;
            case 'freemium':
                badgeClass = 'pricing-badge freemium';
                badgeText = 'Условно-бесплатный';
                badgeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>';
                break;
            default:
                badgeClass = 'pricing-badge unknown';
                badgeText = 'Неизвестно';
                badgeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="8"></line></svg>';
        }
        
        return `<div class="${badgeClass}">${badgeIcon} ${badgeText}</div>`;
    }

    function createResultCard(result) {
        const card = document.createElement('div');
        card.className = 'result-card';
        
        const pricingBadge = getPricingBadge(result.pricing);
        
        const serviceUrl = result.url ? result.url : '#';
        
        card.innerHTML = `
            <div class="result-image">
                <div class="svg-icon">${result.icon}</div>
            </div>
            <div class="result-content">
                <div class="result-header">
                    <h4 class="result-title">${result.name}</h4>
                    ${pricingBadge}
                </div>
                <div class="result-category">${result.category}</div>
                <p class="result-description">${result.description}</p>
                <a href="${serviceUrl}" target="_blank" class="result-link">Перейти к сервису</a>
            </div>
        `;
        
        return card;
    }
    
    function displayResultsPage(page) {
        resultsContainer.innerHTML = '';
        
        if (allResults.length === 0) {
            displayNoResults();
            return;
        }
        
        resultsHeader.textContent = isSearchResults ? 'Результаты поиска' : 'Популярные сервисы';
        
        const startIndex = (page - 1) * resultsPerPage;
        const endIndex = Math.min(startIndex + resultsPerPage, allResults.length);
        
        for (let i = startIndex; i < endIndex; i++) {
            const card = createResultCard(allResults[i]);
            card.style.animationDelay = `${(i - startIndex) * 0.15}s`;
            resultsContainer.appendChild(card);
        }
        
        updatePagination();
    }
    
    function displayNoResults() {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem;">
                <div class="svg-icon" style="margin: 0 auto 1rem; width: 64px; height: 64px;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <h3 style="margin-bottom: 1rem;">Ничего не найдено</h3>
                <p>Попробуйте изменить запрос или выбрать один из примеров ниже.</p>
                <div class="search-examples" style="margin-top: 1.5rem;">
                    <span>создать изображение</span>
                    <span>написать текст</span>
                    <span>анализ данных</span>
                </div>
            </div>
        `;
        resultsContainer.appendChild(noResults);
        
        paginationContainer.style.display = 'none';
    }
    
    function updatePagination() {
        paginationContainer.innerHTML = '';
        
        if (allResults.length === 0) {
            paginationContainer.style.display = 'none';
            return;
        }
        
        paginationContainer.style.display = 'flex';
        
        const totalPages = Math.ceil(allResults.length / resultsPerPage);
        
        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-button prev';
        prevButton.textContent = 'Назад';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayResultsPage(currentPage);
            }
        });
        paginationContainer.appendChild(prevButton);
        
        const firstPageButton = document.createElement('button');
        firstPageButton.className = `pagination-button page-number ${currentPage === 1 ? 'active' : ''}`;
        firstPageButton.textContent = '1';
        firstPageButton.addEventListener('click', () => {
            currentPage = 1;
            displayResultsPage(currentPage);
        });
        paginationContainer.appendChild(firstPageButton);
        
        if (currentPage > 3) {
            const ellipsisBefore = document.createElement('span');
            ellipsisBefore.className = 'pagination-ellipsis';
            ellipsisBefore.textContent = '...';
            paginationContainer.appendChild(ellipsisBefore);
        }
        
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            if (i === 1 || i === totalPages) continue;
            
            const pageButton = document.createElement('button');
            pageButton.className = `pagination-button page-number ${currentPage === i ? 'active' : ''}`;
            pageButton.textContent = i.toString();
            pageButton.addEventListener('click', () => {
                currentPage = i;
                displayResultsPage(currentPage);
            });
            paginationContainer.appendChild(pageButton);
        }
        
        if (currentPage < totalPages - 2) {
            const ellipsisAfter = document.createElement('span');
            ellipsisAfter.className = 'pagination-ellipsis';
            ellipsisAfter.textContent = '...';
            paginationContainer.appendChild(ellipsisAfter);
        }
        
        if (totalPages > 1) {
            const lastPageButton = document.createElement('button');
            lastPageButton.className = `pagination-button page-number ${currentPage === totalPages ? 'active' : ''}`;
            lastPageButton.textContent = totalPages.toString();
            lastPageButton.addEventListener('click', () => {
                currentPage = totalPages;
                displayResultsPage(currentPage);
            });
            paginationContainer.appendChild(lastPageButton);
        }
        
        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-button next';
        nextButton.textContent = 'Вперед';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayResultsPage(currentPage);
            }
        });
        paginationContainer.appendChild(nextButton);
    }
    
    function performSearch(query) {
        resultsContainer.innerHTML = '';
        paginationContainer.style.display = 'none';
        allResults = [];
        currentPage = 1;
        isSearchResults = true;
        
        if (!query.trim()) return;
        
        const loadingText = document.createElement('div');
        loadingText.className = 'loading-text';
        loadingText.id = 'loading-indicator';
        loadingText.textContent = 'Ищем подходящие ИИ-сервисы...';
        loadingText.style.textAlign = 'center';
        loadingText.style.padding = '2rem';
        loadingText.style.color = 'var(--text-secondary)';
        loadingText.style.fontSize = '1.1rem';
        resultsContainer.appendChild(loadingText);
        
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'loading-spinner';
        loadingSpinner.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke="var(--text-secondary)" stroke-width="4" />
                <circle cx="25" cy="25" r="20" fill="none" stroke="var(--text-color)" stroke-width="4" stroke-dasharray="60 120" />
            </svg>
        `;
        loadingText.prepend(loadingSpinner);
        
        fetch(`/api/search?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                const loadingIndicator = document.getElementById('loading-indicator');
                if (loadingIndicator) {
                    resultsContainer.removeChild(loadingIndicator);
                }
                
                if (data.thinking) {
                    console.log('Мысли ИИ:', data.thinking);
                    
                    const thinkingContainer = document.createElement('div');
                    thinkingContainer.className = 'thinking-container';
                    thinkingContainer.innerHTML = `
                        <div class="thinking-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                            </svg>
                        </div>
                        <p class="thinking-text">${data.thinking}</p>
                    `;
                    resultsContainer.appendChild(thinkingContainer);
                }
                
                const matchedServices = data.services || data;
                
                allResults = matchedServices;
                
                displayResultsPage(currentPage);
            })
            .catch(error => {
                console.error('Ошибка при поиске:', error);
                const loadingIndicator = document.getElementById('loading-indicator');
                if (loadingIndicator) {
                    resultsContainer.removeChild(loadingIndicator);
                }
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.innerHTML = `
                    <div style="text-align: center; padding: 3rem 1rem;">
                        <div class="svg-icon" style="margin: 0 auto 1rem; width: 64px; height: 64px; color: #e74c3c;">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        </div>
                        <h3 style="margin-bottom: 1rem;">Произошла ошибка</h3>
                        <p>Не удалось выполнить поиск. Пожалуйста, попробуйте позже.</p>
                    </div>
                `;
                resultsContainer.appendChild(errorDiv);
                paginationContainer.style.display = 'none';
            });
    }
    
    function loadPopularServices() {
        isSearchResults = false;
        
        const loadingText = document.createElement('div');
        loadingText.className = 'loading-text';
        loadingText.id = 'loading-indicator';
        loadingText.textContent = 'Загружаем популярные ИИ-сервисы...';
        loadingText.style.textAlign = 'center';
        loadingText.style.padding = '2rem';
        loadingText.style.color = 'var(--text-secondary)';
        loadingText.style.fontSize = '1.1rem';
        resultsContainer.appendChild(loadingText);
        
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'loading-spinner';
        loadingSpinner.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke="var(--text-secondary)" stroke-width="4" />
                <circle cx="25" cy="25" r="20" fill="none" stroke="var(--text-color)" stroke-width="4" stroke-dasharray="60 120" />
            </svg>
        `;
        loadingText.prepend(loadingSpinner);
        
        fetch('/api/search?q=популярные')
            .then(response => response.json())
            .then(data => {
                const loadingIndicator = document.getElementById('loading-indicator');
                if (loadingIndicator) {
                    resultsContainer.removeChild(loadingIndicator);
                }
                
                if (data.thinking) {
                    console.log('Мысли ИИ (популярные сервисы):', data.thinking);
                    
                    const thinkingContainer = document.createElement('div');
                    thinkingContainer.className = 'thinking-container';
                    thinkingContainer.innerHTML = `
                        <div class="thinking-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                            </svg>
                        </div>
                        <p class="thinking-text">${data.thinking}</p>
                    `;
                    resultsContainer.appendChild(thinkingContainer);
                }
                
                const services = data.services || data;
                
                allResults = services;
                displayResultsPage(1);
            })
            .catch(error => {
                console.error('Ошибка при загрузке популярных сервисов:', error);
                
                const loadingIndicator = document.getElementById('loading-indicator');
                if (loadingIndicator) {
                    resultsContainer.removeChild(loadingIndicator);
                }
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.innerHTML = `
                    <div style="text-align: center; padding: 3rem 1rem;">
                        <div class="svg-icon" style="margin: 0 auto 1rem; width: 64px; height: 64px; color: #e74c3c;">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        </div>
                        <h3 style="margin-bottom: 1rem;">Не удалось загрузить сервисы</h3>
                        <p>Произошла ошибка при загрузке популярных сервисов. Пожалуйста, попробуйте позже.</p>
                    </div>
                `;
                resultsContainer.appendChild(errorDiv);
            });
    }
    
    function checkScroll() {
        const elements = document.querySelectorAll('.result-card');
        const windowHeight = window.innerHeight;
        
        elements.forEach(element => {
            const elementPos = element.getBoundingClientRect().top;
            if (elementPos < windowHeight - 50) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    }
    
    function typeEffect() {
        const currentText = placeholders[currentPlaceholder];
        
        if (isDeleting) {
            searchInput.setAttribute('placeholder', currentText.substring(0, charIndex - 1));
            charIndex--;
            typingSpeed = 40;
        } else {
            searchInput.setAttribute('placeholder', currentText.substring(0, charIndex + 1));
            charIndex++;
            typingSpeed = 80;
        }
        
        if (!isDeleting && charIndex === currentText.length) {
            isDeleting = true;
            typingSpeed = 1500;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            currentPlaceholder = (currentPlaceholder + 1) % placeholders.length;
            typingSpeed = 500;
        }
        
        setTimeout(typeEffect, typingSpeed);
    }
    
    searchExamples.forEach(example => {
        example.addEventListener('click', () => {
            searchInput.value = example.textContent;
            searchInput.focus();
        });
    });
    
    searchButton.addEventListener('click', () => {
        performSearch(searchInput.value);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });
    
    window.addEventListener('scroll', checkScroll);
    
    searchInput.addEventListener('focus', () => {
        document.querySelector('.search-box').classList.add('focused');
    });
    
    searchInput.addEventListener('blur', () => {
        document.querySelector('.search-box').classList.remove('focused');
    });
    
    setTimeout(typeEffect, 1000);
});