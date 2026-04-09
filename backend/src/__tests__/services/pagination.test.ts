import { paginate } from '../../utils/pagination';

describe('Pagination Utility', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it('should return correct structure', () => {
    const result = paginate(items, 1, 5, 10);
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('pagination');
    expect(result.pagination).toMatchObject({
      page: 1,
      pageSize: 5,
      totalItems: 10,
      totalPages: 2,
    });
  });

  it('should slice items correctly for page 1', () => {
    const result = paginate(items, 1, 3, 10);
    expect(result.data).toEqual([1, 2, 3]);
  });

  it('should slice items correctly for page 2', () => {
    const result = paginate(items, 2, 3, 10);
    expect(result.data).toEqual([4, 5, 6]);
  });

  it('should calculate totalPages correctly', () => {
    const result = paginate(items, 1, 4, 10);
    expect(result.pagination.totalPages).toBe(3);
  });

  it('should handle empty items', () => {
    const result = paginate([], 1, 10, 0);
    expect(result.data).toEqual([]);
    expect(result.pagination.totalPages).toBe(0);
  });
});
