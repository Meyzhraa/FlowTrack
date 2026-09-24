import { Router } from 'express';
import { updateProfile } from '../controllers/userController.js'; // jika logika dipisah ke controller
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Proteksi semua endpoint user dengan middleware autentikasi
router.use(authenticateToken);

// Route untuk memperbarui profil pengguna yang sedang login
router.put('/profile', updateProfile);

export default router;