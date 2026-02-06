/**
 * Основные скрипты сайта музея
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('Сайт Никольского музея загружен');

    // Мобильное меню
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav ul');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('show');
            menuToggle.textContent = mainNav.classList.contains('show') ? '✕' : '☰';
        });

        // Закрытие меню при клике на ссылку
        document.querySelectorAll('.main-nav a').forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('show');
                menuToggle.textContent = '☰';
            });
        });
    }

    // Текущий год в футере
    const yearElement = document.querySelector('.current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Плавная прокрутка для внутренних ссылок
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Анимация карточек при прокрутке
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Наблюдаем за элементами
    document.querySelectorAll('.exhibition-card, .info-item, .collection-item').forEach(item => {
        observer.observe(item);
    });
});