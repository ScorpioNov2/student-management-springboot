import { Purify } from "../purify.js";

export class ModalComponent {
    constructor(containerId, actionsCallbacks) {
        this.container = document.getElementById(containerId);
        this.callbacks = actionsCallbacks; // Содержит onSave, onDelete и т.д.
    }

    // Метод открытия основного модального окна (Просмотр / Добавление / Редактирование)
    open(mode, studentObject = null) {
        this.container.classList.remove('hidden');
        this.render(mode, studentObject);
    }

    // Метод закрытия всей структуры модального окна
    close() {
        this.container.classList.add('hidden');
        this.container.innerHTML = "";
    }

    render(mode, student) {
        let titleText = "Информация о студенте";
        if (mode === "add") titleText = "Добавление нового студента";
        if (mode === "edit") titleText = "Редактирование данных студента";

        const isReadOnly = mode === "view";

        this.container.innerHTML = `
            <div class="modal-window" id="modal-content-window">
                <div class="modal-header">
                    <span class="modal-title">${titleText}</span>
                    <button class="close-modal-button" id="close-modal-x-btn">×</button>
                </div>
                <div class="modal-body">
                    <form id="student-modal-form">
                        <div class="form-group">
                            <label>ФИО студента *</label>
                            <input type="text" id="form-fullName" class="form-control" value="${Purify.escapeHtml(student?.fullName)}" required ${isReadOnly ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label>Группа *</label>
                            <input type="text" id="form-groupName" class="form-control" value="${Purify.escapeHtml(student?.groupName)}" required ${isReadOnly ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label>ИСУ ID *</label>
                            <input type="number" id="form-isuId" class="form-control" value="${Purify.escapeHtml(student?.isuId)}" required ${isReadOnly ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label>Номер общежития *</label>
                            <input type="number" id="form-dormitoryNumber" class="form-control" value="${Purify.escapeHtml(student?.dormitoryNumber)}" required ${isReadOnly ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label>Комната *</label>
                            <input type="text" id="form-roomNumber" class="form-control" value="${Purify.escapeHtml(student?.roomNumber)}" required ${isReadOnly ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label>Срок заселения *</label>
                            <input type="date" id="form-settlementTerm" class="form-control" value="${Purify.escapeHtml(student?.settlementTerm)}" required ${isReadOnly ? 'disabled' : ''}>
                        </div>
                        <div class="form-check">
                            <input type="checkbox" id="form-isForeigner" ${student?.isForeigner ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''}>
                            <label for="form-isForeigner">Является ли student иностранцем</label>
                        </div>
                        <div class="form-group" style="margin-top:12px;">
                            <label>Заметки</label>
                            <textarea id="form-notes" class="form-control" rows="3" ${isReadOnly ? 'disabled' : ''}>${Purify.escapeHtml(student?.notes)}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer" id="modal-footer-actions"></div>
            </div>

            <!-- Дополнительное кастомное модальное окно подтверждения удаления -->
            <div id="custom-confirm-sub-modal" class="modal-overlay hidden" style="background-color: rgba(0,0,0,0.5); z-index: 1100;">
                <div class="modal-window" style="max-width: 400px; animation: toastPopIn 0.2s ease;">
                    <div class="modal-header">
                        <span class="modal-title">Подтверждение удаления</span>
                    </div>
                    <div class="modal-body">
                        <p style="font-size: 14px; line-height: 1.5;">Вы уверены, что хотите окончательно удалить этого студента из базы данных?</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="confirm-cancel-btn">Отмена</button>
                        <button class="btn btn-danger" id="confirm-accept-btn">Удалить</button>
                    </div>
                </div>
            </div>
        `;

        this.renderFooterButtons(mode);
        this.bindEvents(mode, student?.isuId);
    }

    renderFooterButtons(mode) {
        const footerElement = this.container.querySelector("#modal-footer-actions");
        
        if (mode === "view") {
            footerElement.innerHTML = `
                <button class="btn btn-secondary" id="modal-btn-to-edit">Обновить</button>
                <button class="btn btn-danger" id="modal-btn-delete">Удалить</button>
            `;
        } else if (mode === "add") {
            footerElement.innerHTML = `
                <button class="btn btn-secondary" type="button" id="modal-btn-reset">Сбросить</button>
                <button class="btn btn-success" type="button" id="modal-btn-submit">Добавить</button>
            `;
        } else if (mode === "edit") {
            footerElement.innerHTML = `
                <button class="btn btn-secondary" type="button" id="modal-btn-cancel">Отмена</button>
                <button class="btn btn-primary" type="button" id="modal-btn-submit">Сохранить</button>
            `;
        }
    }

    bindEvents(mode, isuId) {
        // Закрытие при клике на кнопку X
        this.container.querySelector("#close-modal-x-btn").addEventListener('click', () => this.close());

        // Закрытие при клике вне области основного модального окна
        this.container.addEventListener('click', (event) => {
            const modalWindow = this.container.querySelector("#modal-content-window");
            const confirmSubModal = this.container.querySelector("#custom-confirm-sub-modal");
            
            // Закрытие происходит только при клике вне основного окна и когда окно подтверждения скрыто
            if (modalWindow && !modalWindow.contains(event.target) && confirmSubModal.classList.contains('hidden')) {
                this.close();
            }
        });

        // Обработка событий для режима просмотра
        if (mode === "view") {
            this.container.querySelector("#modal-btn-to-edit").addEventListener('click', (event) => {
                // The view modal is replaced during the click; prevent the old
                // overlay listener from treating this as an outside click.
                event.stopPropagation();
                this.callbacks.onSwitchToEdit(isuId);
            });

            const confirmSubModal = this.container.querySelector("#custom-confirm-sub-modal");
            
            this.container.querySelector("#modal-btn-delete").addEventListener('click', () => {
                confirmSubModal.classList.remove('hidden'); // Показ дополнительного окна
            });

            // Кнопка отмены в окне подтверждения удаления
            this.container.querySelector("#confirm-cancel-btn").addEventListener('click', () => {
                confirmSubModal.classList.add('hidden');
            });

            // Кнопка подтверждения в окне подтверждения удаления
            this.container.querySelector("#confirm-accept-btn").addEventListener('click', () => {
                this.callbacks.onDelete(isuId);
                this.close(); // Закрытие всего интерфейса модального окна
            });
        } 
        
        // Обработка событий для режимов добавления и редактирования
        else {
            const formSubmitButton = this.container.querySelector("#modal-btn-submit");
            formSubmitButton?.addEventListener('click', () => {
                const formData = {
                    fullName: this.container.querySelector("#form-fullName").value,
                    groupName: this.container.querySelector("#form-groupName").value,
                    isuId: Number(this.container.querySelector("#form-isuId").value),
                    dormitoryNumber: Number(this.container.querySelector("#form-dormitoryNumber").value),
                    roomNumber: this.container.querySelector("#form-roomNumber").value,
                    settlementTerm: this.container.querySelector("#form-settlementTerm").value,
                    isForeigner: this.container.querySelector("#form-isForeigner").checked,
                    notes: this.container.querySelector("#form-notes").value,
                };
                this.callbacks.onSave(mode, isuId, formData);
            });

            this.container.querySelector("#modal-btn-reset")?.addEventListener('click', () => {
                this.container.querySelector("#student-modal-form").reset();
            });

            this.container.querySelector("#modal-btn-cancel")?.addEventListener('click', async (event) => {
                event.stopPropagation();
                const studentData = await this.callbacks.getStudentData(isuId);
                this.open("view", studentData);
            });
        }
    }
}
