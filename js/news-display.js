/**
 * Отображение новостей на сайте
 */

class NewsDisplay {
    constructor() {
        this.newsManager = window.museumNews;
    }

    /**
     * Показывает новости на главной странице
     */
    async displayHomepageNews() {
        const container = document.getElementById('newsContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="loading-news">
                <div class="spinner"></div>
                <p>Загружаем новости...</p>
            </div>
        `;

        try {
            const news = await this.newsManager.loadNews(3); // 3 последние новости

            if (news.length === 0) {
                container.innerHTML = `
                    <div class="no-news">
                        <p>Пока нет новостей. Загляните позже!</p>
                    </div>
                `;
                return;
            }

            let html = '';
            news.forEach((item, index) => {
                html += this.createNewsCard(item, index);
            });

            container.innerHTML = html;

            // Добавляем анимацию
            this.animateNewsCards();

        } catch (error) {
            console.error('Ошибка отображения новостей:', error);
            container.innerHTML = `
                <div class="news-error">
                    <p>Не удалось загрузить новости. Попробуйте обновить страницу.</p>
                </div>
            `;
        }
    }

    /**
     * Показывает все новости на странице news.html
     */
    async displayAllNews() {
        const container = document.getElementById('allNewsContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="loading-news">
                <div class="spinner"></div>
                <p>Загружаем все новости...</p>
            </div>
        `;

        try {
            const news = await this.newsManager.loadNews(); // Все новости

            if (news.length === 0) {
                container.innerHTML = `
                    <div class="no-news">
                        <p>Пока нет новостей. Загляните позже!</p>
                    </div>
                `;
                return;
            }

            let html = '<div class="all-news-grid">';
            news.forEach((item, index) => {
                html += this.createNewsCard(item, index, true);
            });
            html += '</div>';

            container.innerHTML = html;

            // Добавляем анимацию
            this.animateNewsCards();

        } catch (error) {
            console.error('Ошибка отображения новостей:', error);
            container.innerHTML = `
                <div class="news-error">
                    <p>Не удалось загрузить новости. Попробуйте обновить страницу.</p>
                </div>
            `;
        }
    }

    /**
     * Создает HTML карточки новости
     */
    createNewsCard(newsItem, index, isFullPage = false) {
        const formattedDate = this.formatDisplayDate(newsItem.date);

        return `
            <article class="news-card ${isFullPage ? 'news-card-full' : ''}" 
                     data-id="${newsItem.id}" 
                     data-index="${index}">
                
                <div class="news-card-image">
                    <img src="${newsItem.image}" 
                         alt="${newsItem.title}" 
                         loading="${index < 2 ? 'eager' : 'lazy'}">
                    <div class="news-card-category">
                        ${newsItem.category}
                    </div>
                </div>
                
                <div class="news-card-content">
                    <div class="news-card-date">
                        📅 ${formattedDate}
                    </div>
                    
                    <h3 class="news-card-title">
                        ${this.escapeHtml(newsItem.title)}
                    </h3>
                    
                    <div class="news-card-text">
                        <p>${this.escapeHtml(newsItem.shortContent || newsItem.content.substring(0, 150) + '...')}</p>
                    </div>
                    
                    <div class="news-card-actions">
                        <button class="btn-read-more" 
                                onclick="newsDisplay.showNewsDetail('${newsItem.id}')">
                            Читать полностью
                        </button>
                        ${isFullPage ? '' : `
                        <a href="news.html#news_${newsItem.id}" class="btn-link">
                            Ссылка на новость →
                        </a>
                        `}
                    </div>
                </div>
            </article>
        `;
    }

    /**
     * Показывает детальную страницу новости
     */
    async showNewsDetail(newsId) {
        const news = await this.newsManager.getNewsById(newsId);
        if (!news) {
            alert('Новость не найдена');
            return;
        }

        // Создаем модальное окно
        const modal = this.createNewsModal(news);
        document.body.appendChild(modal);

        // Показываем модальное окно
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Закрытие по клику вне окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeNewsModal();
            }
        });

        // Кнопка закрытия
        modal.querySelector('.close-modal').addEventListener('click', () => {
            this.closeNewsModal();
        });
    }

    /**
     * Создает модальное окно с новостью
     */
    createNewsModal(news) {
        const formattedDate = this.formatDisplayDate(news.date);

        const modal = document.createElement('div');
        modal.className = 'news-modal';
        modal.innerHTML = `
            <div class="news-modal-content">
                <button class="close-modal">&times;</button>
                
                <div class="news-modal-header">
                    <div class="news-modal-meta">
                        <span class="news-modal-date">📅 ${formattedDate}</span>
                        <span class="news-modal-category">${news.category}</span>
                    </div>
                    <h2 class="news-modal-title">${this.escapeHtml(news.title)}</h2>
                </div>
                
                <div class="news-modal-body">
                    ${news.image ? `
                    <div class="news-modal-image">
                        <img src="${news.image}" alt="${news.title}">
                    </div>
                    ` : ''}
                    
                    <div class="news-modal-text">
                        ${this.formatNewsContent(news.content)}
                    </div>
                </div>
                
                <div class="news-modal-footer">
                    <button class="btn btn-secondary" onclick="newsDisplay.closeNewsModal()">
                        Закрыть
                    </button>
                    <button class="btn btn-primary" onclick="window.print()">
                        🖨️ Распечатать
                    </button>
                </div>
            </div>
        `;

        return modal;
    }

    /**
     * Закрывает модальное окно
     */
    closeNewsModal() {
        const modal = document.querySelector('.news-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    /**
     * Форматирует дату для отображения
     */
    formatDisplayDate(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString;
        }

        const options = {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        };
        return date.toLocaleDateString('ru-RU', options);
    }

    /**
     * Форматирует контент новости
     */
    formatNewsContent(content) {
        // Заменяем переносы строк на параграфы
        const paragraphs = content.split('\n').filter(p => p.trim() !== '');

        return paragraphs.map(p => `
            <p>${this.escapeHtml(p)}</p>
        `).join('');
    }

    /**
     * Анимирует появление карточек
     */
    animateNewsCards() {
        const cards = document.querySelectorAll('.news-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';

            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    /**
     * Экранирует HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Создаем глобальный экземпляр
window.newsDisplay = new NewsDisplay();

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('newsContainer')) {
        window.newsDisplay.displayHomepageNews();
    }

    if (document.getElementById('allNewsContainer')) {
        window.newsDisplay.displayAllNews();
    }
});