//Build a pagination utility here
// Accept key value pairs for page number, page size, and total items
// Return paginated data along with metadata like total pages, current page, total items
// This utility can be used across different services for consistent pagination handling
// Items number is always equal to page size cause will be paging in database first
// Format of returned data:
// {
//   data: [...], // paginated items
//   pagination: {
//     page: number,
//     pageSize: number,
//     totalItems: number,
//     totalPages: number
//   }
// }

export interface Pagination {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

export function paginate<T>(items: T[], page: number, pageSize: number, totalItems: number): { data: T[]; pagination: Pagination } {
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);
    return {
        data: paginatedItems,
        pagination: {
            page,
            pageSize,
            totalItems,
            totalPages,
        },
    };
}
