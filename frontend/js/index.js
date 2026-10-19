import { DatabaseManager } from './database.js';
import { FormValidator } from './validation.js';
import { TableComponent } from './components/table.js';
import { PaginationComponent } from './components/pagination.js';
import { ModalComponent } from './components/modal.js';
import { AlertManager } from './components/alert.js';
import { initThemeDecorator } from './theme-decorator.js';

class ApplicationController {
    constructor() {
        // ИНИЦИАЛИЗАЦИЯ СЛОЯ АРХИТЕКТУРЫ МОДЕЛИ: Прямое подключение к слою Django API и SQLite
        this.database = new DatabaseManager();
        this.alertManager = new AlertManager();

        // ЧТЕНИЕ ПАРАМЕТРОВ URL ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ДЛЯ ВОССТАНОВЛЕНИЯ СОСТОЯНИЯ
        const urlParams = new URLSearchParams(window.location.search);

        // ПАРАМЕТРЫ УПРАВЛЕНИЯ ТЕКУЩИМ СОСТОЯНИЕМ
        // Получение значения из URL при инициализации, если отсутствует — устанавливается пустая строка
        this.searchKeyword = urlParams.get('search') || ""; 
        this.currentSortField = urlParams.get('sort') || "";
        this.currentSortDirection = urlParams.get('direction') || "asc";
        this.rowsPerPageLimit = 10; // Количество отображаемых строк на одной странице
        this.currentPageNumber = 1;

        // Синхронизация строки запроса (query string)
        const savedPage = Number(urlParams.get('page')) || 1;
        this.currentOffset = (savedPage - 1) * this.rowsPerPageLimit;

        const searchInputElement = document.getElementById("global-search-input");
        if (searchInputElement) {
            searchInputElement.value = this.searchKeyword;
        }

        this.initializeComponents();
        this.bindGlobalEvents();
        this.refreshApplicationView();
    }

    initializeComponents() {
        // Инициализация тем
        initThemeDecorator({
            wrapperId: 'theme-frame-container',     // id theme container
            maxFallingItems: 25,                    // max falling entity quantity
            spawnInterval: 350                      // speed create new entity (ms)
        });

        // Инициализация компонента таблицы данных
        this.tableComponent = new TableComponent(
            "table-component-container",
            () => this.handleRowClicked(),
            (studentId) => this.handleRowDoubleClicked(studentId),
            (sortField) => this.handleSortRequested(sortField)
        );

        // Инициализация компонента пагинации
        this.paginationComponent = new PaginationComponent(
            "pagination-component-container",
            (targetPage) => this.handlePageChanged(targetPage)
        );

        // Инициализация компонента модального окна (Переведено на асинхронный механизм Async/Await для ожидания данных от API)
        this.modalComponent = new ModalComponent(
            "modal-component-container",
            {
                onSwitchToEdit: async (isuId) => {
                    const studentData = await this.database.getStudentByIsuId(isuId);
                    this.modalComponent.open("edit", studentData);
                },
                onDelete: async (isuId) => {
                    const success = await this.database.deleteById(isuId);
                    if (success) {
                        this.alertManager.success("Студент успешно удален.");
                    } else {
                        this.alertManager.error("Не удалось удалить студента.");
                    }
                    await this.refreshApplicationView();
                },
                getStudentData: async (isuId) => {
                    return await this.database.getStudentByIsuId(isuId);
                },
                onSave: (mode, isuId, formData) => this.handleFormSubmitted(mode, isuId, formData)
            }
        );
    }

    bindGlobalEvents() {
        // Событие ввода для нечеткого поиска
        const searchInputElement = document.getElementById("global-search-input");
        searchInputElement.addEventListener('input', (event) => {
            this.searchKeyword = event.target.value;
            this.currentOffset = 0; // Возврат на первую страницу при поиске
            this.refreshApplicationView();
        });

        // Событие клика по кнопке добавления нового студента
        const addActionButton = document.getElementById("action-add-button");
        addActionButton.addEventListener('click', () => {
            this.modalComponent.open("add");
        });

        // Поток редактирования с кнопки на панели инструментов
        document.getElementById("action-edit-button").addEventListener('click', async () => {
            const focusedId = this.tableComponent.getFocusedIsuId();
            if (!focusedId) {
                this.alertManager.error("Пожалуйста, выберите (кликните) студента в таблице для редактирования!");
                return;
            }
            const studentObject = await this.database.getStudentByIsuId(focusedId);
            this.modalComponent.open("edit", studentObject);
        });

        // Поток удаления с кнопки на панели инструментов
        document.getElementById("action-delete-button").addEventListener('click', async () => {
            const focusedId = this.tableComponent.getFocusedIsuId();
            if (!focusedId) {
                this.alertManager.error("Пожалуйста, выберите (кликните) студента в таблице для удаления!");
                return;
            }
            // Вызов встроенного кастомного окна подтверждения удаления внутри модального окна
            const studentObject = await this.database.getStudentByIsuId(focusedId);
            this.modalComponent.open("view", studentObject);
            
            // Симуляция клика по кнопке удаления внутри для мгновенного отображения sub-modal confirm
            setTimeout(() => {
                document.getElementById("modal-btn-delete")?.click();
            }, 50);
        });

        // Отслеживание клика вне таблицы для снятия фокуса со строки
        document.addEventListener("click", (e) => {
            const tableNode = this.tableComponent ? document.querySelector("#table-component-container") : null;
            
            if (tableNode && !tableNode.contains(e.target)) {
                this.handleOutSideTableClicked();
            }
        });
    }

    handleRowClicked() {
        this.refreshButtonState();
    }

    handleOutSideTableClicked() {
       this.tableComponent.clearFocusedIsuId();
       this.refreshButtonState();
    }

    async handleRowDoubleClicked(isuId) {
        const studentObject = await this.database.getStudentByIsuId(isuId);
        this.refreshButtonState();
        if (studentObject) {
            this.modalComponent.open("view", studentObject);
        }
    }

    handleSortRequested(sortField) {
        if (this.currentSortField === sortField) {
            // Изменение направления сортировки при повторном клике на тот же столбец
            this.currentSortDirection = this.currentSortDirection === "asc" ? "desc" : this.currentSortDirection === "desc" ? "" : "asc";
        } else {
            this.currentSortField = sortField;
            this.currentSortDirection = "asc";
        }
        this.refreshApplicationView();
    }

    handlePageChanged(targetPage) {
        this.currentOffset = (targetPage - 1) * this.rowsPerPageLimit;
        this.refreshApplicationView();
    }

    handleStatusCode(mode, statusCode) {
        if (mode == "edit" && statusCode === 499) {
            console.log("Обнаружена ошибка дублирования данных из Django (499 duplicate id)");
            // Здесь можно обработать специальные визуальные эффекты (например, автоматическую подсветку поля ввода ISU ID красным цветом)
        }
    }

    // Перевод функции handleFormSubmitted на async/await для прямого сетевого взаимодействия с Django API
    async handleFormSubmitted(mode, isuId, formData) {
        const validationResult = FormValidator.validateStudentForm(formData);
        
        // Замена старого alert() на визуальные сообщения об ошибках от AlertManager
        if (!validationResult.isValid) {
            validationResult.errors.forEach(errorMessage => {
                this.alertManager.error(errorMessage);
            });
            return;
        }

        try {
            let response;
            
            if (mode === "add") {
                response = await this.database.insert(formData);
                if (response.ok) {
                    this.alertManager.success("Студент успешно добавлен!");
                    this.modalComponent.close();
                    await this.refreshApplicationView();
                } else {
                    const errorData = await response.json();
                    this.handleStatusCode(mode, response.status)
                    this.displayBackendErrors(errorData);
                }
            } else if (mode === "edit") {
                response = await this.database.updateById(isuId, formData);
                if (response.ok) {
                    this.alertManager.success("Данные студента обновлены!");
                    this.modalComponent.close();
                    await this.refreshApplicationView();
                } else {
                    const errorData = await response.json();
                    this.handleStatusCode(mode, response.status)
                    this.displayBackendErrors(errorData);
                }
            }
        } catch (error) {
            console.error(error);
            this.alertManager.error("Ошибка подключения к серверу Django Backend!");
        }
    }

    /**
     * Вспомогательная функция для анализа и отображения ошибок, 
     * возвращаемых от Django REST Framework Serializer, на экране
     */
    displayBackendErrors(errorData) {
        Object.values(errorData).forEach(errorsArray => {
            if (Array.isArray(errorsArray)) {
                errorsArray.forEach(msg => this.alertManager.error(msg));
            } else if (typeof errorsArray === 'string') {
                this.alertManager.error(errorsArray);
            }
        });
    }

    refreshButtonState() {
        document.getElementById("action-edit-button").disabled = this.tableComponent.getFocusedIsuId() ? false : true;
        document.getElementById("action-delete-button").disabled = this.tableComponent.getFocusedIsuId() ? false : true;
    }

    // Перевод функции обновления интерфейса в асинхронный режим для загрузки данных пагинации/фильтрации из сети
    async refreshApplicationView() {
        const searchInput = document.getElementById("global-search-input");
        if (searchInput) {
            this.searchKeyword = searchInput.value;
        }

        // 1. РЕЗЕРВНОЕ ВОССТАНОВЛЕНИЕ: Срабатывает только если переменная действительно не инициализирована (null/undefined), 
        // и НЕ срабатывает, если пользователь намеренно очистил поле (пустая строка "" или пробелы).
        const urlParams = new URLSearchParams(window.location.search);
        if ((this.searchKeyword === null || this.searchKeyword === undefined) && urlParams.get('search')) {
            this.searchKeyword = urlParams.get('search');
            if (searchInput) searchInput.value = this.searchKeyword;
        }

        if (!this.currentSortField && urlParams.get('sort')) {
            this.currentSortField = urlParams.get('sort');
            this.currentSortDirection = urlParams.get('direction') || "asc";
        }

        // 2. Вычисление текущего номера страницы на основе offset для отображения в URL
        this.currentPageNumber = Math.floor(this.currentOffset / this.rowsPerPageLimit) + 1;

        // 3. ЗАПИСЬ ПАРАМЕТРОВ В АДРЕСНУЮ СТРОКУ БРАУЗЕРА (URL)
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('page', this.currentPageNumber);

        // Безопасная проверка перед вызовом trim(), чтобы избежать падения (crash), если переменная null/undefined
        if (this.searchKeyword && this.searchKeyword.trim() !== "") {
            currentUrl.searchParams.set('search', this.searchKeyword.trim());
        } else {
            currentUrl.searchParams.delete('search');
        }

        // Обновление состояния сортировки (при наличии)
        if (this.currentSortField && this.currentSortDirection) {
            currentUrl.searchParams.set('sort', this.currentSortField);
            currentUrl.searchParams.set('direction', this.currentSortDirection);
        } else {
            currentUrl.searchParams.delete('sort');
            currentUrl.searchParams.delete('direction');
        }

        // Запись чистого URL в адресную строку браузера без перезагрузки страницы
        window.history.replaceState({}, '', currentUrl);

        // Получение пакета данных пагинации из DatabaseManager (сетевое взаимодействие через fetch)
        const paginationPackage = await this.database.paginate(
            this.searchKeyword,
            this.currentSortField,
            this.currentSortDirection,
            this.currentOffset,
            this.rowsPerPageLimit
        );

        if (!paginationPackage) return;

        // Freeze the bug
        // Auto back to previos page when current page is empty 1 time.
        // activated when delete the last record of current page
        // if(paginationPackage.total == 0) {
        //     this.currentPageNumber = this.currentPageNumber - 1
        //     currentUrl.searchParams.set('page', this.currentPageNumber);
        //     // window.history.replaceState({}, '', currentUrl);     // update url string only
        //     window.location.href = currentUrl.toString();           // refresh page with current url
        //     can_reload = false
        // }

        // Обновление общего счетчика отображаемых данных
        document.getElementById("total-students-badge").innerText = `Всего: ${paginationPackage.total} студентов`;

        // СОХРАНЕНИЕ 100% ИСХОДНОЙ СТРУКТУРЫ РЕНДЕРИНГА ОРИГИНАЛЬНЫХ КОМПОНЕНТОВ
        this.tableComponent.render(paginationPackage.data, this.currentSortField, this.currentSortDirection);
        this.paginationComponent.render(paginationPackage.currentPage, paginationPackage.totalPages);
    }
}

// Запуск всей системы после готовности дерева DOM
document.addEventListener("DOMContentLoaded", () => {
    new ApplicationController();
});
