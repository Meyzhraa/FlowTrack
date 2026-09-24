import { type Response } from 'express';
import prisma from '../config/prisma.js';
import { type AuthRequest } from '../middlewares/authMiddleware.js';
import { CategoryType } from '@prisma/client';

// Helper untuk mengambil User ID secara aman
const getUserId = (req: AuthRequest): string | null => {
  return req.userId || req.user?.id || null;
};

// 1. Ambil Semua Kategori Milik User (Termasuk Kalkulasi Akumulasi Transaksi/spentAmount)
export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak ditemukan.' });
    }

    // Ambil kategori beserta transaksi terkait
    const categories = await prisma.category.findMany({
      where: { userId },
      include: {
        transactions: {
          select: {
            amount: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Hitung total nilai spentAmount untuk tiap kategori
    const categoriesWithSpent = categories.map((cat) => {
      const spentAmount = cat.transactions.reduce(
        (sum, tx) => sum + Number(tx.amount || 0),
        0
      );

      // Keluarkan array transactions dari response JSON agar data tetap rapi
      const { transactions, ...categoryData } = cat;

      return {
        ...categoryData,
        spentAmount, // Properti ini kini otomatis terisi sesuai total transaksi
      };
    });

    return res.json(categoriesWithSpent);
  } catch (error: any) {
    console.error('Error Prisma getCategories:', error);
    return res.status(500).json({ message: 'Gagal mengambil kategori.', error: error.message });
  }
};

// 2. Buat Kategori Baru
export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, color, budgetLimit } = req.body;

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak ditemukan.' });
    }

    // Validasi enum CategoryType (INCOME / EXPENSE)
    const validTypes: string[] = Object.values(CategoryType);
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ 
        message: `Tipe kategori tidak valid. Harus salah satu dari: ${validTypes.join(', ')}` 
      });
    }

    const category = await prisma.category.create({
      data: {
        name,
        type: type as CategoryType,
        color: color || '#5046E5',
        budgetLimit: budgetLimit ? Number(budgetLimit) : 0,
        userId: userId,
      },
    });

    return res.status(201).json(category);
  } catch (error: any) {
    console.error('Error Prisma createCategory:', error);
    return res.status(500).json({ message: 'Gagal membuat kategori.', error: error.message });
  }
};

// 3. Update / Edit Kategori
export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, color, budgetLimit } = req.body;

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak ditemukan.' });
    }

    // Pastikan kategori milik user yang sedang login
    const existingCategory = await prisma.category.findFirst({
      where: { id: String(id), userId },
    });

    if (!existingCategory) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
    }

    if (type) {
      const validTypes: string[] = Object.values(CategoryType);
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          message: `Tipe kategori tidak valid. Harus salah satu dari: ${validTypes.join(', ')}`,
        });
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: String(id) },
      data: {
        name,
        type: type ? (type as CategoryType) : undefined,
        color,
        budgetLimit: budgetLimit !== undefined ? Number(budgetLimit) : undefined,
      },
    });

    return res.json(updatedCategory);
  } catch (error: any) {
    console.error('Error Prisma updateCategory:', error);
    return res.status(500).json({ message: 'Gagal memperbarui kategori.', error: error.message });
  }
};

// 4. Hapus Kategori
export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak ditemukan.' });
    }

    // Pastikan kategori milik user yang sedang login
    const existingCategory = await prisma.category.findFirst({
      where: { id: String(id), userId },
    });

    if (!existingCategory) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
    }

    await prisma.category.delete({
      where: { id: String(id) },
    });

    return res.json({ message: 'Kategori berhasil dihapus.' });
  } catch (error: any) {
    console.error('Error Prisma deleteCategory:', error);
    return res.status(500).json({ message: 'Gagal menghapus kategori.', error: error.message });
  }
};