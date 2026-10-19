const themeDecorations = {
    halloween: {
        corners: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        lines: ['top', 'bottom', 'left', 'right'],
        slots: [
            'top-1', 'top-2', 'top-3', 'top-4',
            'left-1', 'left-2', 'left-3',
            'right-1', 'right-2', 'right-3',
            'bottom-1', 'bottom-2', 'bottom-3', 'bottom-4'
        ]
    },
    chrismas: {
        corners: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        lines: ['top', 'bottom', 'left', 'right'],
        slots: ['left-1', 'right-1']
    }
};

/**
 * ФУНКЦИЯ 1: Инициализация базового движка для автопадающих объектов.
 * (Рандомно выбирает 1 из 5 типов спрайтов, заданных в CSS)
 * 
 * @param {number} maxItems - Лимит объектов на экране (макс. количество)
 * @param {number} spawnInterval - Интервал генерации новых объектов (в мс)
 */
export function startFallingEffect(maxItems = 30, spawnInterval = 300) {
    let container = document.querySelector('.falling-container-wrapper');
    if (!container) {
        container = document.createElement('div');
        container.className = 'falling-container-wrapper';
        document.body.appendChild(container);
    }

    function spawnItem() {
        const computedStyle = getComputedStyle(document.documentElement);
        const hasEffect = computedStyle.getPropertyValue('--has-falling-effect').trim();
        if (hasEffect !== 'true') return;
        if (container.children.length >= maxItems) return;

        // Определяем картинок: последний спрайт - это земля,
        // поэтому для эффекта падения рандомим строго с 1 по 6 если всего 7.
        const itemCount = parseInt(computedStyle.getPropertyValue('--theme-falling-item-count').trim()) || 7;
        const maxFallingTypes = itemCount > 1 ? itemCount - 1 : 1; // если всего 7 спрайтов, то в выборку летят только с 1 по 6

        const item = document.createElement('div');
        item.className = 'falling-item';

        // Рандомим индекс объекта от 1 до (sum - 1) для запуска в воздухе.
        const randomIndex = Math.floor(Math.random() * maxFallingTypes) + 1;
        item.setAttribute('data-index', randomIndex);

        const randomLeft = Math.random() * 100;
        const randomSize = Math.random() * 20 + 20;
        const randomDuration = Math.random() * 5 + 4; // Таймаут свободного падения (в сек)
        const randomDelay = Math.random() * 4;

        item.style.left = `${randomLeft}%`;
        item.style.width = `${randomSize}px`;
        item.style.height = `${randomSize}px`;
        item.style.animationDuration = `${randomDuration}s, ${Math.random() * 3 + 2}s`;
        item.style.animationDelay = `${randomDelay}s, 0s`;

        container.appendChild(item);

        // ДВОЙНОЙ ТАЙМЕР:
        // Этап 1: Ждем окончания полного жизненного цикла объекта (Задержка спавна + Время падения)
        const totalFallTime = (randomDelay + randomDuration) * 1000;

        setTimeout(() => {
            // Валидация: проверяем, жив ли ещё элемент в DOM (профилактика багов при смене страниц)
            if (!item.parentElement) return;

            // Смена состояния: объект коснулся земли. Врубаем последний спрайт и стопорим анимацию
            item.classList.add('landed');
            // Добавляем рандомный угол поворота при приземлении для дефолтного хаоса
            item.style.transform = `rotate(${Math.random() * 360}deg)`;

            // Этап 2: Объект лежит 4 сек, на 5-й уходит в инвиз и выпиливается (Итого: 5 сек)
            setTimeout(() => {
                if (!item.parentElement) return;
                item.style.opacity = '0'; // Плавное затухание (отрабатывает CSS transition)

                setTimeout(() => {
                    item.remove(); // Полная деструкция: удаляем из DOM-дерева
                }, 1000);

            }, 4000);

        }, totalFallTime);
    }

    // setTimeout(() => { item.remove(); }, (randomDuration + randomDelay) * 1000);

    setInterval(spawnItem, spawnInterval);
}

/**
 * ФУНКЦИЯ 2: Автоматическая инжекция декоративных div-элементов (углы и грани) в главный контейнер.
 * 
 * @param {string} wrapperId - ID родительского элемента (обёртки рамки)
 */
export function renderThemeFrames(wrapperId = 'theme-frame-container') {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'default';
    const config = themeDecorations[currentTheme];
    if (!config) return;

    const fragment = document.createDocumentFragment();

    if (config.corners) {
        config.corners.forEach(pos => {
            const el = document.createElement('div');
            el.className = `frame-corner frame-corner-${pos}`;
            fragment.appendChild(el);
        });
    }

    if (config.lines) {
        config.lines.forEach(pos => {
            const el = document.createElement('div');
            el.className = `frame-line-border border-${pos}`;
            fragment.appendChild(el);
        });
    }

    if (config.slots) {
        config.slots.forEach(pos => {
            const el = document.createElement('div');
            el.className = `frame-decor-slot slot-${pos}`;
            fragment.appendChild(el);
        });
    }

    wrapper.insertBefore(fragment, wrapper.firstChild);
}

/**
 * МАСТЕР-ФУНКЦИЯ: Комплексная инициализация всех декоративных фич модуля Decorator.
 * 
 * @param {Object} options - Конфиг с кастомными параметрами, переданными извне
 */
export function initThemeDecorator(options = {}) {
    const wrapperId = options.wrapperId || 'theme-frame-container';
    const maxItems = options.maxFallingItems || 25;
    const spawnInterval = options.spawnInterval || 350;

    // Параллельный вызов обоих дочерних методов.
    renderThemeFrames(wrapperId);
    startFallingEffect(maxItems, spawnInterval);
}
