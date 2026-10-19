export class FormValidator {
    static validateStudentForm(formData) {
        const errorMessages = [];

        if (!formData.fullName || formData.fullName.trim() === "" || /\d/.test(formData.fullName)) {
            errorMessages.push("ФИО студента не должно быть пустым или содержать число!");
        }

        if (!formData.groupName || formData.groupName.trim() === "") {
            errorMessages.push("Название группы/класса не должно быть пустым!");
        }

        if (!formData.isuId || isNaN(formData.isuId)) {
            errorMessages.push("Номер ISU ID должен быть корректным числом!");
        }

        if (!formData.dormitoryNumber || isNaN(formData.dormitoryNumber)) {
            errorMessages.push("Номер корпуса общежития должен быть числом!");
        }

        if (!formData.roomNumber || formData.roomNumber.trim() === "") {
            errorMessages.push("Номер комнаты не должен быть пустым!");
        }

        if (!formData.settlementTerm) {
            errorMessages.push("Пожалуйста, выберите срок проживания!");
        }

        return {
            isValid: errorMessages.length === 0,
            errors: errorMessages
        };
    }
}
