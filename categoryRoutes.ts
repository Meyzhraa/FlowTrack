import { Router } from 'express';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../controllers/categoryController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Proteksi semua endpoint kategori dengan middleware autentikasi
router.use(authenticateToken);

// Route untuk mendapatkan semua kategori dan membuat kategori baru
router.get('/', getCategories);
router.post('/', createCategory);

// Route untuk memperbarui dan menghapus kategori berdasarkan ID
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;