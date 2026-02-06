// Мобильное меню
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav ul');

menuToggle.addEventListener('click', () => {
    mainNav.classList.toggle('show');
});

// Плавная прокрутка
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Анимация при прокрутке
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Наблюдаем за карточками
document.querySelectorAll('.exhibition-card, .info-item, .staff-member, .collection-category, .excursion-option, .service-item, .staff-contact, .social-platform').forEach(item => {
    item.style.opacity = 0;
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(item);
});

// Текущая дата в футере
const now = new Date();
document.querySelector('.footer-bottom p').innerHTML =
    `© ${now.getFullYear()} Краеведческий музей Никольска. Все права защищены.`;

// Проверка, если iframe карты не загрузился
window.addEventListener('load', () => {
    const mapIframes = document.querySelectorAll('iframe[src*="google.com/maps"]');
    mapIframes.forEach(map => {
        if (!map.src.includes('google.com/maps')) {
            console.warn('Карта не загружена. Проверьте URL в iframe.');
        }
    });
});

// Добавление текущего года в заголовки страниц
document.addEventListener('DOMContentLoaded', function () {
    const yearSpan = document.createElement('span');
    yearSpan.textContent = new Date().getFullYear();

    // Добавляем год в заголовки, если нужно
    const titleElements = document.querySelectorAll('h1, h2, h3');
    titleElements.forEach(el => {
        if (el.textContent.includes('2026')) {
            el.innerHTML = el.innerHTML.replace('2026', `<span style="color:${getComputedStyle(document.documentElement).getPropertyValue('--accent-color')}">${yearSpan.textContent}</span>`);
        }
    });
});
// Загрузка и отображение новостей на главной странице
async function loadNewsForHome() {
    try {
        const response = await fetch('data/news.json');
        const data = await response.json();

        // Проверяем локальные новости (для демо)
        const localNews = JSON.parse(localStorage.getItem('tempNews'));
        const allNews = localNews || data.news;

        displayNewsOnHome(allNews.slice(0, 3)); // Показываем 3 последние новости
    } catch (error) {
        console.error('Ошибка загрузки новостей:', error);
    }
}

function displayNewsOnHome(news) {
    const container = document.getElementById('newsContainer');
    if (!container) return;

    if (news.length === 0) {
        container.innerHTML = '<p>Новостей пока нет. Загляните позже!</p>';
        return;
    }

    let html = '';
    news.forEach(item => {
        html += `
            <article class="news-card">
                <img src="${item.image}" alt="${item.title}" class="news-image">
                <div class="news-content">
                    <span class="news-date">📅 ${item.date}</span>
                    <h3>${item.title}</h3>
                    <p class="news-text">${item.content.substring(0, 150)}...</p>
                    <button class="toggle-btn" onclick="toggleNewsContent(this)">
                        Читать полностью
                    </button>
                </div>
            </article>
        `;
    });

    container.innerHTML = html;

    // Анимация появления
    document.querySelectorAll('.news-card').forEach(card => {
        card.style.opacity = 0;
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

        setTimeout(() => {
            card.style.opacity = 1;
            card.style.transform = 'translateY(0)';
        }, 100);
    });
}

// Функция для показа/скрытия полного текста
function toggleNewsContent(btn) {
    const newsCard = btn.closest('.news-card');
    const textElement = newsCard.querySelector('.news-text');

    if (btn.textContent === 'Читать полностью') {
        const newsId = newsCard.dataset.newsId;
        const fullContent = getFullNewsContent(newsId); // В реальном проекте получаем полный текст
        textElement.textContent = fullContent;
        btn.textContent = 'Свернуть';
    } else {
        textElement.textContent = textElement.textContent.substring(0, 150) + '...';
        btn.textContent = 'Читать полностью';
    }
}

// Загружаем новости при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('newsContainer')) {
        loadNewsForHome();
    }
});