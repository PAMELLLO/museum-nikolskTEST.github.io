/**
 * Обработчик формы добавления новостей
 */

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('newsForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Устанавливаем сегодняшнюю дату
    const dateField = document.getElementById('date');
    if (dateField) {
        const today = new Date().toISOString().split('T')[0];
        dateField.value = today;
    }
});

function handleFormSubmit(event) {
    event.preventDefault();

    // Получаем данные формы
    const formData = {
        title: document.getElementById('title').value.trim(),
        date: document.getElementById('date').value,
        category: document.getElementById('category').value,
        image: document.getElementById('image').value.trim(),
        content: document.getElementById('content').value.trim()
    };

    // Валидация
    if (!formData.title) {
        alert('Введите заголовок новости');
        return;
    }

    if (!formData.content) {
        alert('Введите текст новости');
        return;
    }

    // Форматируем данные для таблицы
    const tableData = formatForGoogleSheets(formData);

    // Показываем результат
    showResult(tableData, formData);

    // Прокручиваем к результату
    document.getElementById('resultBox').scrollIntoView({
        behavior: 'smooth'
    });
}

function formatForGoogleSheets(data) {
    // Форматируем дату в ДД.ММ.ГГГГ
    const dateObj = new Date(data.date);
    const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}.${(dateObj.getMonth() + 1).toString().padStart(2, '0')}.${dateObj.getFullYear()}`;

    return {
        // Для колонки "Дата"
        date: formattedDate,

        // Для колонки "Заголовок"
        title: data.title,

        // Для колонки "Текст"
        content: data.content,

        // Для колонки "Картинка"
        image: data.image || '',

        // Для колонки "Категория"
        category: data.category
    };
}

function showResult(tableData, originalData) {
    const resultBox = document.getElementById('resultBox');
    const resultData = document.getElementById('resultData');

    // Создаем блоки для копирования
    resultData.innerHTML = `
        <div class="data-block">
            <h4>Дата:</h4>
            <div class="copy-box" onclick="copyToClipboard('${tableData.date}')">
                <code>${tableData.date}</code>
                <button class="copy-btn">Копировать</button>
            </div>
        </div>
        
        <div class="data-block">
            <h4>Заголовок:</h4>
            <div class="copy-box" onclick="copyToClipboard('${escapeHtml(tableData.title)}')">
                <code>${escapeHtml(tableData.title)}</code>
                <button class="copy-btn">Копировать</button>
            </div>
        </div>
        
        <div class="data-block">
            <h4>Текст новости:</h4>
            <div class="copy-box" onclick="copyToClipboard('${escapeHtml(tableData.content)}')">
                <code class="content-code">${escapeHtml(tableData.content.substring(0, 100))}...</code>
                <button class="copy-btn">Копировать</button>
            </div>
        </div>
        
        ${tableData.image ? `
        <div class="data-block">
            <h4>Ссылка на картинку:</h4>
            <div class="copy-box" onclick="copyToClipboard('${tableData.image}')">
                <code>${tableData.image}</code>
                <button class="copy-btn">Копировать</button>
            </div>
        </div>
        ` : ''}
        
        <div class="data-block">
            <h4>Категория:</h4>
            <div class="copy-box" onclick="copyToClipboard('${tableData.category}')">
                <code>${tableData.category}</code>
                <button class="copy-btn">Копировать</button>
            </div>
        </div>
    `;

    // Показываем блок
    resultBox.style.display = 'block';
}

// Функция копирования в буфер обмена
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Показываем уведомление
        showNotification('Скопировано!');
    }).catch(err => {
        console.error('Ошибка копирования:', err);
        showNotification('Ошибка копирования');
    });
}

// Функция очистки формы
function clearForm() {
    if (confirm('Очистить все поля?')) {
        document.getElementById('newsForm').reset();
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        document.getElementById('resultBox').style.display = 'none';
    }
}

// Уведомления
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}