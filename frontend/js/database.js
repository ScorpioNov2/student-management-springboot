export class DatabaseManager {
    constructor() {
        this.baseUrl = "http://127.0.0.1:8000/api/students/";
    }

    /**
     * Вспомогательная функция: Преобразование данных из snake_case (Django) в camelCase (Frontend)
     */
    _mapToCamelCase(student) {
        if (!student) return null;
        return {
            fullName: student.full_name,
            groupName: student.group_name,
            isuId: student.isu_id,
            dormitoryNumber: student.dormitory_number,
            roomNumber: student.room_number,
            settlementTerm: student.settlement_term,
            isForeigner: student.is_foreigner,
            notes: student.notes || ""
        };
    }

    /**
     * Вспомогательная функция: Преобразование данных из camelCase (Form Frontend) в snake_case перед отправкой в Django
     */
    _mapToSnakeCase(formData) {
        return {
            full_name: formData.fullName,
            group_name: formData.groupName,
            isu_id: Number(formData.isuId),
            dormitory_number: Number(formData.dormitoryNumber),
            room_number: formData.roomNumber,
            settlement_term: formData.settlementTerm,
            is_foreigner: formData.isForeigner || false,
            notes: formData.notes || ""
        };
    }

    /**
     * Получение данных с пагинацией, фильтрацией и сортировкой напрямую из Django API
     */
    async paginate(searchKeyword = "", sortField = "", sortDirection = "asc", offset = 0, limit = 10) {
        const url = new URL(this.baseUrl);

        // Вычисление номера страницы (page) на основе offset и limit для соответствия пагинации Django
        const currentPageNumber = Math.floor(offset / limit) + 1;
        url.searchParams.append('page', currentPageNumber);
        url.searchParams.append('page_size', limit);

        // Добавление параметров поиска и сортировки в URL, если они заданы (Django распознает их через QueryString)
        if (searchKeyword.trim() !== "") {
            url.searchParams.append('search', searchKeyword.trim());
        }

        if (sortField) {
            // Преобразование имени поля сортировки в snake_case, чтобы Django смог его обработать
            const mappingFields = {
                fullName: 'full_name',
                groupName: 'group_name',
                isuId: 'isu_id',
                dormitoryNumber: 'dormitory_number',
                roomNumber: 'room_number'
            };
            const backendSortField = mappingFields[sortField] || sortField;
            const ordering = sortDirection === 'desc' ? `-${backendSortField}` : backendSortField;
            url.searchParams.append('ordering', ordering);
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Не удалось подключиться к Django API");

            const backendData = await response.json();

            // Преобразование полученного массива результатов в camelCase, чтобы не нарушить работу TableComponent
            const camelCaseList = (backendData.results || []).map(student => this._mapToCamelCase(student));

            return {
                data: camelCaseList,
                total: backendData.total_records || 0,
                currentPage: backendData.current_page || 1,
                totalPages: backendData.total_pages || 1
            };
        } catch (error) {
            console.error("Ошибка загрузки данных пагинации из Django:", error);
            return { data: [], total: 0, currentPage: 1, totalPages: 1 };
        }
    }

    /**
     * Получение детальной информации о студенте (GET)
     */
    async getStudentByIsuId(isuId) {
        try {
            const response = await fetch(`${this.baseUrl}${isuId}/`);
            if (!response.ok) return null;
            const student = await response.json();
            return this._mapToCamelCase(student);
        } catch (error) {
            console.error("Ошибка при получении данных студента:", error);
            return null;
        }
    }

    /**
     * Добавление нового студента в SQLite (POST)
     */
    async insert(formData) {
        const backendData = this._mapToSnakeCase(formData);
        return await fetch(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendData)
        });
    }

    /**
     * Обновление информации о студенте в SQLite (PUT)
     */
    async updateById(id, formData) {
        const backendData = this._mapToSnakeCase(formData);
        return await fetch(`${this.baseUrl}${id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendData)
        });
    }

    /**
     * Удаление студента из системы (DELETE)
     */
    async deleteById(id) {
        try {
            const response = await fetch(`${this.baseUrl}${id}/`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error("Ошибка при удалении студента:", error);
            return false;
        }
    }
}

// export class DatabaseManager {
//     constructor(storageDriver) {
//         this.storageKey = "students_database_v1";
//         this.storage = storageDriver; // Внедрение зависимости (Dependency Injection)
//         this.studentsData = [];
//         this.totalCount = 0;

//         this.loadFromStorage();
//     }

//     loadFromStorage() {
//         const rawDataString = this.storage.get(this.storageKey);
//         if (rawDataString) {
//             try {
//                 const packageObject = JSON.parse(rawDataString);
//                 this.studentsData = packageObject.data || [];
//                 this.totalCount = packageObject.total || this.studentsData.length;
//             } catch (error) {
//                 console.error("Ошибка парсинга структуры данных, инициализация заново:", error);
//                 this.studentsData = [];
//                 this.totalCount = 0;
//             }
//         }
//     }

//     saveToStorage() {
//         const packageObject = {
//             total: this.totalCount,
//             data: this.studentsData
//         };
//         this.storage.set(this.storageKey, JSON.stringify(packageObject));
//     }

//     getStudentById(id) {
//         return this.studentsData.find(student => student.id === Number(id)) || null;
//     }

//     isIsuIdUnique(isuId, excludedStudentId = null) {
//         const normalizedIsuId = Number(isuId);
//         const normalizedExcludedId = excludedStudentId === null ? null : Number(excludedStudentId);

//         return !this.studentsData.some(student =>
//             Number(student.isuId) === normalizedIsuId &&
//             student.id !== normalizedExcludedId
//         );
//     }

//     insert(studentItem) {
//         if (!this.isIsuIdUnique(studentItem.isuId)) {
//             return null;
//         }

//         studentItem.id = Date.now(); // Создание уникального ID на основе метки времени - ISU
//         this.studentsData.push(studentItem);
//         this.totalCount++;
//         this.saveToStorage();
//         return studentItem;
//     }

//     updateById(id, updatedFields) {
//         const targetIndex = this.studentsData.findIndex(student => student.id === Number(id));
//         if (targetIndex !== -1) {
//             if (
//                 Object.prototype.hasOwnProperty.call(updatedFields, "isuId") &&
//                 !this.isIsuIdUnique(updatedFields.isuId, id)
//             ) {
//                 return false;
//             }

//             this.studentsData[targetIndex] = { ...this.studentsData[targetIndex], ...updatedFields, id: Number(id) };
//             this.saveToStorage();
//             return true;
//         }
//         return false;
//     }

//     deleteById(id) {
//         const targetIndex = this.studentsData.findIndex(student => student.id === Number(id));
//         if (targetIndex !== -1) {
//             this.studentsData.splice(targetIndex, 1);
//             this.totalCount--;
//             this.saveToStorage();
//             return true;
//         }
//         return false;
//     }

//     // Механизм нечеткого поиска (Fuzzy Search) с конкатенацией строк, пагинацией и сортировкой колонок данных
//     paginate(searchKeyword = "", sortField = "", sortDirection = "asc", offset = 0, limit = 10) {
//         let processedList = [...this.studentsData];

//         // 1. Конкатенация строк для нечеткого поиска
//         if (searchKeyword.trim() !== "") {
//             const cleanKeyword = searchKeyword.toLowerCase().trim();
//             processedList = processedList.filter(student => {
//                 const unifiedString = `${student.fullName} ${student.groupName} ${student.isuId} ${student.dormitoryNumber} ${student.roomNumber}`.toLowerCase();
//                 return unifiedString.includes(cleanKeyword);
//             });
//         }

//         // Slice first then sort for performance and sort elms on current page only
//         const startIndex = Math.max(0, offset);
//         const endIndex = startIndex + Math.max(1, limit);
//         const totalItemsAfterFiltering = processedList.length;
//         let paginatedList = processedList.slice(startIndex, endIndex)

//         // 2. Динамическая сортировка на основе типа данных столбца
//         if (sortField) {
//             paginatedList.sort((itemA, itemB) => {
//                 let valueA = itemA[sortField];
//                 let valueB = itemB[sortField];

//                 // Если значение является строкой
//                 if (typeof valueA === 'string') {
//                     return sortDirection === 'asc' 
//                         ? valueA.localeCompare(valueB) 
//                         : valueB.localeCompare(valueA);
//                 }
//                 // Если значение является числом
//                 return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
//             });
//         }

//         return {
//             data: paginatedList,
//             total: searchKeyword.trim() !== "" ? totalItemsAfterFiltering : this.totalCount,
//             currentPage: Math.floor(startIndex / limit) + 1,
//             totalPages: Math.ceil(totalItemsAfterFiltering / limit) || 1
//         };
//     }
// }
