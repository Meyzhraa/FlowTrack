// src/routes/walletRoutes.ts
import { Router } from 'express';
import { 
  getWallets, 
  createWallet, 
  updateWallet, 
  deleteWallet 
} from '../controllers/walletController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Proteksi seluruh endpoint wallet menggunakan JWT Authentication Middleware
router.use(authenticateToken);

// 1. Get all wallets milik user yang sedang login
router.get('/', getWallets);

// 2. Tambah wallet baru
router.post('/', createWallet);

// 3. Update/Edit data wallet berdasarkan ID
router.put('/:id', updateWallet);

// 4. Hapus wallet berdasarkan ID
router.delete('/:id', deleteWallet);

export default router;