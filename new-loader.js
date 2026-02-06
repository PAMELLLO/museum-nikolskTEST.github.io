/**
 * ПРОСТАЯ ЗАГРУЗКА НОВОСТЕЙ ИЗ GOOGLE SHEETS
 * Для Никольского музея
 */

// ⭐ ВАШ ID ТАБЛИЦЫ ⭐
const GOOGLE_SHEET_ID = '19MFPSy-RnJQstAQKus5RX4fKrctfZZWC8gM6C-oX1IQ';
const GOOGLE_SHEET_NAME = 'Новости'; // Название листа в таблице

// Флаг для отладки
const DEBUG = true;

/**
 * Главная функция загрузки новостей
 */
async function loadNewsFromGoogleSheets(limit = 0) {
    if (DEBUG) console.log('🔄 Начинаю загрузку новостей...');

    try {
        // Формируем URL для загрузки
        const url = `https://opensheet.elk.sh/${GOOGLE_SHEET_ID}/${GOOGLE_SHEET_NAME}`;

        if (DEBUG) {
            console.log('📡 Загружаю с URL:', url);
        }

        // Загружаем данные
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Ошибка HTTP ${response.status}: ${response.statusText}`);
        }

        const rawData = await response.json();

        if (DEBUG) {
            console.log('✅ Данные получены:', rawData.length, 'записей');
            if (rawData.length > 0) {
                console.log('Первая запись:', rawData[0]);
            }
        }

        // Преобразуем данные в удобный формат
        const news = formatNewsData(rawData);

        if (DEBUG) {
            console.log('📝 Отформатировано новостей:', news.length);
        }

        // Сортируем по дате (новые сверху)
        news.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Ограничиваем количество если нужно
        return limit > 0 ? news.slice(0, limit) : news;

    } catch (error) {
        console.error('❌ Ошибка загрузки новостей:', error);

        // Возвращаем тестовые данные на случай ошибки
        return getFallbackNews();
    }
}

/**
 * Форматирование данных из таблицы
 */
function formatNewsData(rawData) {
    if (!rawData || !Array.isArray(rawData)) {
        return [];
    }

    return rawData
        .map((row, index) => {
            // Ищем данные в разных вариантах названий колонок
            const getValue = (possibleNames) => {
                for (const name of possibleNames) {
                    if (row[name] !== undefined && row[name] !== '') {
                        return row[name];
                    }
                }
                return '';
            };

            const newsItem = {
                id: `news_${Date.now()}_${index}`,
                date: formatDate(getValue(['Дата', 'дата', 'Date', 'date'])),
                title: getValue(['Заголовок', 'заголовок', 'Title', 'title']) || 'Без названия',
                content: getValue(['Текст', 'текст', 'Content', 'content', 'Текст новости', 'Описание']),
                image: getValue(['Картинка', 'картинка', 'Image', 'image', 'Фото', 'фото', 'Изображение']),
                category: getValue(['Категория', 'категория', 'Category', 'category']) || 'Новости',
            };

            // Создаем короткое описание
            if (newsItem.content && newsItem.content.length > 150) {
                newsItem.shortContent = newsItem.content.substring(0, 150) + '...';
            } else {
                newsItem.shortContent = newsItem.content || '';
            }

            // Если нет картинки - ставим заглушку
            if (!newsItem.image || newsItem.image.trim() === '') {
                newsItem.image = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80';
            }

            return newsItem;
        })
        .filter(item => item.title && item.title !== 'Без названия' && item.content)
        .filter(item => item.date); // Фильтруем без дат
}

/**
 * Форматирование даты
 */
function formatDate(dateString) {
    if (!dateString) return new Date().toISOString().split('T')[0];

    try {
        // Пробуем разные форматы
        // Формат ДД.ММ.ГГГГ
        if (dateString.includes('.')) {
            const parts = dateString.split('.');
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                return `${year}-${month}-${day}`;
            }
        }

        // Формат ГГГГ-ММ-ДД
        if (dateString.includes('-')) {
            const parts = dateString.split('-');
            if (parts.length === 3 && parts[0].length === 4) {
                return dateString;
            }
        }

        // Пробуем создать Date
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }

        return new Date().toISOString().split('T')[0];
    } catch {
        return new Date().toISOString().split('T')[0];
    }
}

/**
 * Тестовые новости на случай ошибки
 */
function getFallbackNews() {
    return [
        {
            id: 'fallback_1',
            date: new Date().toISOString().split('T')[0],
            title: 'Добро пожаловать в Никольский музей!',
            content: 'Мы рады приветствовать вас на сайте Никольского музея. Здесь вы найдете информацию о выставках, мероприятиях и истории нашего края.',
            shortContent: 'Добро пожаловать в наш музей! Здесь вы найдете информацию о выставках...',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
            category: 'Новости музея'
        },
        {
            id: 'fallback_2',
            date: new Date().toISOString().split('T')[0],
            title: 'Следите за нашими новостями',
            content: 'На этой странице будут появляться анонсы выставок, мероприятий и важные объявления музея.',
            shortContent: 'На этой странице будут появляться анонсы выставок и мероприятий.',
            image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&h=300&fit=crop&q=80',
            category: 'Объявления'
        }
    ];
}

/**
 * Отображение новостей на главной странице (3 последние)
 */
async function displayNewsOnHomepage() {
    const container = document.getElementById('newsContainer');

    if (!container) {
        console.log('Контейнер новостей не найден на этой странице');
        return;
    }

    // Показываем загрузку
    container.innerHTML = `
        <div class="news-loading">
            <div class="spinner"></div>
            <p>Загружаем новости...</p>
        </div>
    `;

    try {
        // Загружаем 3 последние новости
        const news = await loadNewsFromGoogleSheets(3);

        if (news.length === 0) {
            container.innerHTML = `
                <div class="no-news">
                    <p>Новостей пока нет. Следите за обновлениями!</p>
                </div>
            `;
            return;
        }

        // Генерируем HTML
        let html = '';
        news.forEach((item, index) => {
            const displayDate = formatDisplayDate(item.date);

            html += `
                <article class="news-card" data-id="${item.id}">
                    <div class="news-image">
                        <img src="${item.image}" 
                             alt="${item.title}"
                             loading="${index < 2 ? 'eager' : 'lazy'}">
                        <span class="news-category">${item.category}</span>
                    </div>
                    <div class="news-content">
                        <time class="news-date">📅 ${displayDate}</time>
                        <h3 class="news-title">${escapeHtml(item.title)}</h3>
                        <p class="news-excerpt">${escapeHtml(item.shortContent)}</p>
                        <a href="news.html#${item.id}" class="news-link">Читать далее →</a>
                    </div>
                </article>
            `;
        });

        container.innerHTML = html;

        // Анимация появления
        animateNewsCards();

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
 * Отображение всех новостей на странице news.html
 */
async function displayAllNews() {
    const container = document.getElementById('allNewsContainer');

    if (!container) {
        console.log('Контейнер всех новостей не найден');
        return;
    }

    // Показываем загрузку
    container.innerHTML = `
        <div class="news-loading">
            <div class="spinner"></div>
            <p>Загружаем все новости...</p>
        </div>
    `;

    try {
        // Загружаем все новости
        const news = await loadNewsFromGoogleSheets();

        if (news.length === 0) {
            container.innerHTML = `
                <div class="no-news">
                    <p>Пока нет новостей. Загляните позже!</p>
                </div>
            `;
            return;
        }

        // Генерируем HTML
        let html = '';
        news.forEach((item, index) => {
            const displayDate = formatDisplayDate(item.date);

            html += `
                <article class="news-card news-card-full" id="${item.id}">
                    <div class="news-header">
                        <time class="news-date">📅 ${displayDate}</time>
                        <span class="news-category-badge">${item.category}</span>
                    </div>
                    
                    <h2 class="news-title-full">${escapeHtml(item.title)}</h2>
                    
                    ${item.image ? `
                    <div class="news-image-full">
                        <img src="${item.image}" 
                             alt="${item.title}"
                             loading="${index < 3 ? 'eager' : 'lazy'}">
                    </div>
                    ` : ''}
                    
                    <div class="news-content-full">
                        ${formatNewsContent(item.content)}
                    </div>
                    
                    <div class="news-divider"></div>
                </article>
            `;
        });

        container.innerHTML = html;

        // Прокрутка к якорю если есть в URL
        const hash = window.location.hash;
        if (hash) {
            const element = document.getElementById(hash.substring(1));
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }

    } catch (error) {
        console.error('Ошибка отображения всех новостей:', error);
        container.innerHTML = `
            <div class="news-error">
                <p>Не удалось загрузить новости. Попробуйте обновить страницу.</p>
            </div>
        `;
    }
}

/**
 * Форматирование даты для отображения
 */
function formatDisplayDate(dateString) {
    try {
        const date = new Date(dateString);
        const options = {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        };
        return date.toLocaleDateString('ru-RU', options);
    } catch {
        return dateString;
    }
}

/**
 * Форматирование контента новости
 */
function formatNewsContent(content) {
    if (!content) return '';

    // Разбиваем на абзацы
    const paragraphs = content.split('\n').filter(p => p.trim() !== '');

    return paragraphs.map(p => `
        <p>${escapeHtml(p)}</p>
    `).join('');
}

/**
 * Анимация карточек новостей
 */
function animateNewsCards() {
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
 * Экранирование HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Инициализация при загрузке страницы
 */
function initNews() {
    if (DEBUG) console.log('📰 Инициализация модуля новостей');

    // Проверяем, на какой странице мы
    if (document.getElementById('newsContainer')) {
        if (DEBUG) console.log('Загружаем новости на главную страницу');
        displayNewsOnHomepage();
    }

    if (document.getElementById('allNewsContainer')) {
        if (DEBUG) console.log('Загружаем все новости');
        displayAllNews();
    }
}

// Запускаем при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNews);
} else {
    initNews();
}