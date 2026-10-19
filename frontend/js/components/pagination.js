export class PaginationComponent {
    constructor(containerId, onPageChangeCallback) {
        this.container = document.getElementById(containerId);
        this.onPageChange = onPageChangeCallback;
    }

    generatePaginationRange(currentPage, totalPages) {
        const totalNumbers = 7;
        if (totalPages <= totalNumbers) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const shouldShowLeftDots = currentPage > 4;
        const shouldShowRightDots = currentPage < totalPages - 3;

        if (!shouldShowLeftDots && shouldShowRightDots) {
            let leftRange = Array.from({ length: 5 }, (_, i) => i + 1);
            return [...leftRange, "...", totalPages];
        }

        if (shouldShowLeftDots && !shouldShowRightDots) {
            let rightRange = Array.from({ length: 5 }, (_, i) => totalPages - 5 + i + 1);
            return [1, "...", ...rightRange];
        }

        if (shouldShowLeftDots && shouldShowRightDots) {
            let middleRange = [currentPage - 1, currentPage, currentPage + 1];
            return [1, "...", ...middleRange, "...", totalPages];
        }
    }

    render(currentPage, totalPages) {
        if (totalPages <= 1) {
            this.container.innerHTML = "";
            return;
        }

        const rangeElements = this.generatePaginationRange(currentPage, totalPages);

        this.container.innerHTML = `
            <ul class="pagination-list">
                <li class="pagination-item">
                    <button id="prev-page-button" ${currentPage === 1 ? "disabled" : ""}>&lt; prev</button>
                </li>
                ${rangeElements.map(item => {
                    if (item === "...") {
                        return `<li class="pagination-item dots">...</li>`;
                    }
                    return `
                        <li class="pagination-item ${item === currentPage ? 'active' : ''}">
                            <button class="page-number-button" data-page="${item}">${item}</button>
                        </li>
                    `;
                }).join('')}
                <li class="pagination-item">
                    <button id="next-page-button" ${currentPage === totalPages ? "disabled" : ""}>next &gt;</button>
                </li>
            </ul>
        `;

        this.bindEvents(currentPage, totalPages);
    }

    bindEvents(currentPage, totalPages) {
        this.container.querySelector("#prev-page-button")?.addEventListener('click', () => {
            if (currentPage > 1) this.onPageChange(currentPage - 1);
        });

        this.container.querySelector("#next-page-button")?.addEventListener('click', () => {
            if (currentPage < totalPages) this.onPageChange(currentPage + 1);
        });

        this.container.querySelectorAll('.page-number-button').forEach(buttonElement => {
            buttonElement.addEventListener('click', () => {
                const targetPage = Number(buttonElement.getAttribute('data-page'));
                this.onPageChange(targetPage);
            });
        });
    }
}
