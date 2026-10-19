import { Purify } from "../purify.js";

export class TableComponent {
    constructor(containerId, onRowClickCallback, onRowDoubleClickCallback, onSortCallback) {
        this.container = document.getElementById(containerId);
        this.onRowClick = onRowClickCallback;
        this.onRowDoubleClick = onRowDoubleClickCallback;
        this.onSort = onSortCallback;
        this.focusedStudentId = null; // Управление ID выбранной строки
    }

    render(studentsList, currentSortField, currentSortDirection) {
        if (studentsList.length === 0) {
            this.container.innerHTML = `<p style="padding: 20px; text-align: center;">Список пуст или результаты не найдены.</p>`;
            return;
        }

        const renderSortIcon = (field) => {
            if (currentSortField !== field) return "";
            return currentSortDirection === "asc" ? "▲" : currentSortDirection === "desc" ? "▼" : "";
        };

        this.container.innerHTML = `
            <table class="custom-table">
                <thead>
                    <tr>
                        <th data-field="fullName">ФИО Студента<span class="asc-ico">${renderSortIcon("fullName")}</span></th>
                        <th data-field="groupName">Группа<span class="asc-ico">${renderSortIcon("groupName")}</span></th>
                        <th data-field="isuId">ИСУ ID<span class="asc-ico">${renderSortIcon("isuId")}</span></th>
                        <th data-field="dormitoryNumber">Общежитие №<span class="asc-ico">${renderSortIcon("dormitoryNumber")}</span></th>
                        <th data-field="roomNumber">Комната<span class="asc-ico">${renderSortIcon("roomNumber")}</span></th>
                    </tr>
                </thead>
                <tbody>
                    ${studentsList.map(student => {
                        const isFocused = Number(student.isuId) === Number(this.focusedStudentId);
                        return `
                            <tr data-id="${student.isuId}" class="${isFocused ? 'focused-row' : ''}">
                                <td><strong>${Purify.escapeHtml(student.fullName)}</strong></td>
                                <td>${Purify.escapeHtml(student.groupName)}</td>
                                <td>${Purify.escapeHtml(student.isuId)}</td>
                                <td>№ ${Purify.escapeHtml(student.dormitoryNumber)}</td>
                                <td>${Purify.escapeHtml(student.roomNumber)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        this.bindEvents();
    }

    bindEvents() {
        this.container.querySelectorAll('th').forEach(headerCell => {
            headerCell.addEventListener('click', () => {
                const targetField = headerCell.getAttribute('data-field');
                this.onSort(targetField);
            });
        });

        this.container.querySelectorAll('tbody tr').forEach(tableRow => {
            const targetStudentId = tableRow.getAttribute('data-id');

            tableRow.addEventListener('click', () => {
                // Удаление фонового цвета у предыдущей выбранной строки
                this.container.querySelectorAll('tbody tr').forEach(row => {
                    row.classList.remove('focused-row');
                });
    
                // Активация фокуса для новой строки
                tableRow.classList.add('focused-row');
                this.focusedStudentId = targetStudentId;
                this.onRowClick()
            });

            tableRow.addEventListener('dblclick', () => {
                // Открытие модального окна просмотра деталей
                this.onRowDoubleClick(targetStudentId);
            });
        });
    }

    // Метод получения ID выбранной строки для контроллера
    getFocusedIsuId() {
        return this.focusedStudentId;
    }

    clearFocusedIsuId() {
        this.container.querySelector(".focused-row")?.classList.remove("focused-row");
        this.focusedStudentId = null;
    }
}
