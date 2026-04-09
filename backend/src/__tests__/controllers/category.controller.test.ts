jest.mock('../../services/category.service', () => ({
  listCategories: jest.fn(),
  listCategoriesByUser: jest.fn(),
  createCategory: jest.fn(),
  getCategoryById: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
}));

import {
  listCategories,
  listCategoriesByUser,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../../services/category.service';
import {
  listCategoriesController,
  listCategoriesByUserController,
  createCategoryController,
  getCategoryById as getCategoryByIdController,
  updateCategoryController,
  deleteCategoryController,
} from '../../controllers/category.controller';

describe('Category Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listCategoriesController', () => {
    it('calls listCategories with filter, page, pageSize', async () => {
      const mockResult = { data: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } };
      (listCategories as jest.Mock).mockResolvedValue(mockResult);

      const req: any = { user: undefined, query: { type: 'expense', page: '1', pageSize: '10' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await listCategoriesController(req, res, next);

      expect(listCategories).toHaveBeenCalledWith({ type: 'expense' }, 1, 10);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('listCategoriesByUserController', () => {
    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined, query: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await listCategoriesByUserController(req, res, next);

      expect(listCategoriesByUser).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('calls listCategoriesByUser when authenticated', async () => {
      const mockResult = { data: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } };
      (listCategoriesByUser as jest.Mock).mockResolvedValue(mockResult);

      const req: any = { user: { id: 'user123' }, query: { page: '1', pageSize: '10' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await listCategoriesByUserController(req, res, next);

      expect(listCategoriesByUser).toHaveBeenCalledWith('user123', 1, 10);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('createCategoryController', () => {
    it('sends 400 when name or type missing', async () => {
      const req: any = { user: { id: 'u1' }, body: { name: 'Test' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await createCategoryController(req, res, next);

      expect(createCategory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('calls createCategory with payload', async () => {
      const mockResult = { id: 'c1', name: 'Food', type: 'expense', icon: '', color: '#000', createdAt: new Date(), updatedAt: new Date(), parentCategory: null, user: 'u1' };
      (createCategory as jest.Mock).mockResolvedValue(mockResult);

      const req: any = {
        user: { id: 'user123' },
        body: { name: 'Food', type: 'expense', icon: '🍔', color: '#FF0000' },
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await createCategoryController(req, res, next);

      expect(createCategory).toHaveBeenCalledWith({
        name: 'Food',
        type: 'expense',
        parentCategory: undefined,
        user: 'user123',
        icon: '🍔',
        color: '#FF0000',
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getCategoryById', () => {
    it('sends 404 when category not found', async () => {
      (getCategoryById as jest.Mock).mockResolvedValue(null);

      const req: any = { params: { id: 'fake-id' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await getCategoryByIdController(req, res, next);

      expect(getCategoryById).toHaveBeenCalledWith('fake-id');
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateCategoryController', () => {
    it('sends 404 when update returns null', async () => {
      (updateCategory as jest.Mock).mockResolvedValue(null);

      const req: any = { params: { id: 'c1' }, body: { name: 'Updated' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await updateCategoryController(req, res, next);

      expect(updateCategory).toHaveBeenCalledWith('c1', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteCategoryController', () => {
    it('sends 404 when delete returns deleted: false', async () => {
      (deleteCategory as jest.Mock).mockResolvedValue({ deleted: false });

      const req: any = { params: { id: 'c1' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await deleteCategoryController(req, res, next);

      expect(deleteCategory).toHaveBeenCalledWith('c1');
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
