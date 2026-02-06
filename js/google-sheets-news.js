/**
 * Класс для работы с новостями через Google Sheets
 * НЕ ТРЕБУЕТ API ключа!
 */

class MuseumNews {
    constructor() {
        // ⚠️ ЗАМЕНИТЕ ЭТОТ ID НА СВОЙ!
        this.sheetId = '19MFPSy-RnJQstAQKus5RX4fKrctfZZWC8gM6C-oX1IQ';
        this.sheetName = 'Новости';
        this.cacheDuration = 10 * 60 * 1000; // 10 минут кэша
        this.cacheKey = 'nikolsk_news_cache';
    }

    /**
     * Загружает новости из Google Sheets
     */
    async loadNews(limit = 0) {
        // Сначала проверяем кэш
        const cached = this.getCachedNews();
        if (cached && this.isCacheValid(cached.timestamp)) {
            console.log('Используем кэшированные новости');
            return limit > 0 ? cached.data.slice(0, limit) : cached.data;
        }

        try {
            console.log('Загружаем новости из Google Sheets...');

            // Используем opensheet.elk.sh как прокси
            const url = `https://opensheet.elk.sh/${this.sheetId}/${this.sheetName}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const rawData = await response.json();

            // Форматируем данные
            const newsData = this.formatNewsData(rawData);

            // Сохраняем в кэш
            this.saveToCache(newsData);

            console.log(`Загружено ${newsData.length} новостей`);

            return limit > 0 ? newsData.slice(0, limit) : newsData;

        } catch (error) {
            console.error('Ошибка загрузки новостей:', error);

            // Пробуем загрузить резервные новости
            const fallback = await this.loadFallbackNews();
            return limit > 0 ? fallback.slice(0, limit) : fallback;
        }
    }

    /**
     * Форматирует сырые данные из таблицы
     */
    formatNewsData(rawData) {
        if (!rawData || !Array.isArray(rawData)) {
            return [];
        }

        return rawData
            .map((row, index) => {
                // Определяем колонки (независимо от регистра)
                const getColumn = (variants) => {
                    for (const variant of variants) {
                        if (row.hasOwnProperty(variant)) {
                            return row[variant];
                        }
                    }
                    return '';
                };

                const newsItem = {
                    id: `news_${index}_${Date.now()}`,
                    date: this.parseDate(
                        getColumn(['Дата', 'дата', 'Date', 'date']) ||
                        new Date().toISOString().split('T')[0]
                    ),
                    title: getColumn(['Заголовок', 'заголовок', 'Title', 'title']) || 'Новая новость',
                    content: getColumn(['Текст', 'текст', 'Content', 'content', 'Текст новости']) || '',
                    image: this.validateImageUrl(
                        getColumn(['Картинка', 'картинка', 'Image', 'image', 'Фото', 'фото'])
                    ),
                    category: getColumn(['Категория', 'категория', 'Category', 'category']) || 'Новости музея',
                    shortContent: ''
                };

                // Создаем короткое описание
                if (newsItem.content) {
                    newsItem.shortContent = newsItem.content.length > 150
                        ? newsItem.content.substring(0, 150) + '...'
                        : newsItem.content;
                }

                return newsItem;
            })
            .filter(item => item.title && item.title !== 'Новая новость')
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Сортировка по дате
    }

    /**
     * Парсит дату в удобный формат
     */
    parseDate(dateString) {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                // Если дата в формате ДД.ММ.ГГГГ
                const parts = dateString.split('.');
                if (parts.length === 3) {
                    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
                return new Date().toISOString().split('T')[0];
            }
            return date.toISOString().split('T')[0];
        } catch {
            return new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Проверяет и форматирует URL картинки
     */
    validateImageUrl(url) {
        if (!url || url.trim() === '') {
            return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop';
        }

        // Если это прямой URL к изображению
        if (url.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
            return url.trim();
        }

        // Если это ссылка на ImgBB или подобный сервис
        if (url.includes('ibb.co') || url.includes('imgur.com') || url.includes('postimg.cc')) {
            return url.trim();
        }

        return url.trim();
    }

    /**
     * Работа с кэшем
     */
    saveToCache(data) {
        const cacheData = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    }

    getCachedNews() {
        const cached = localStorage.getItem(this.cacheKey);
        return cached ? JSON.parse(cached) : null;
    }

    isCacheValid(timestamp) {
        return Date.now() - timestamp < this.cacheDuration;
    }

    /**
     * Резервные новости на случай ошибки
     */
    async loadFallbackNews() {
        // Можете задать несколько дефолтных новостей
        return [
            {
                id: 'fallback_1',
                date: new Date().toISOString().split('T')[0],
                title: 'Добро пожаловать в музей!',
                content: 'Мы рады приветствовать вас на нашем сайте. Следите за новостями о выставках и мероприятиях.',
                image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w-400&h=300&fit=crop',
                category: 'Новости музея',
                shortContent: 'Добро пожаловать в наш музей!'
            }
        ];
    }

    /**
     * Получает одну новость по ID
     */
    async getNewsById(id) {
        const allNews = await this.loadNews();
        return allNews.find(news => news.id === id) || null;
    }

    /**
     * Получает новости по категории
     */
    async getNewsByCategory(category, limit = 0) {
        const allNews = await this.loadNews();
        const filtered = allNews.filter(news =>
            news.category.toLowerCase() === category.toLowerCase()
        );
        return limit > 0 ? filtered.slice(0, limit) : filtered;
    }
}

// Создаем глобальный экземпляр
window.museumNews = new MuseumNews();