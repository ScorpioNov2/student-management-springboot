export class AlertManager {
    constructor() {
        this.container = null;
        this.initializeContainer();
    }

    // Автоматическое создание фиксированного контейнера в правом верхнем углу экрана
    initializeContainer() {
        let existingContainer = document.getElementById("alert-global-container");
        if (!existingContainer) {
            existingContainer = document.createElement("div");
            existingContainer.id = "alert-global-container";
            existingContainer.className = "alert-toast-container";
            document.body.appendChild(existingContainer);
        }
        this.container = existingContainer;
    }

    // Базовый метод для создания и отображения всплывающего уведомления (Toast)
    show(message, type = "info", duration = 4000) {
        const toast = document.createElement("div");
        // Назначение модификаторов классов: toast-success, toast-error, toast-info
        toast.className = `alert-toast toast-${type}`;
        
        toast.innerHTML = `
            <span class="toast-message">${message}</span>
            <button class="toast-close-btn">×</button>
        `;

        this.container.appendChild(toast);

        // Событие клика по кнопке X для мгновенного закрытия уведомления
        toast.querySelector(".toast-close-btn").addEventListener("click", () => {
            this.removeToast(toast);
        });

        // Автоматическое удаление уведомления по истечении указанного времени
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
    }

    // Методы быстрого вызова (Shorthand methods) для сокращения кода
    success(message) { this.show(message, "success"); }
    error(message) { this.show(message, "error"); }
    info(message) { this.show(message, "info"); }

    removeToast(toast) {
        toast.classList.add("toast-fade-out");
        // Ожидание завершения анимации CSS исчезновения перед удалением из DOM
        toast.addEventListener("animationend", () => {
            toast.remove();
        });
    }
}
