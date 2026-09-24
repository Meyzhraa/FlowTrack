import { type Response } from 'express';
import prisma from '../config/prisma.js';
import { type AuthRequest } from '../middlewares/authMiddleware.js';
import { CategoryType } from '@prisma/client';

// Helper untuk mengambil User ID secara fleksibel
const getUserId = (req: AuthRequest): string | null => {
  return req.userId || req.user?.id || null;
};

// 1. Ambil Semua Transaksi Milik User
export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak ditemukan.' });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { 
        wallet: true, 
        category: true 
      },
      orderBy: { date: 'desc' },
    });

    return res.json(transactions);
  } catch (error: any) {
    console.error('Error getTransactions:', error);
    return res.status(500).json({ message: 'Gagal mengambil transaksi.', error: error.message });
  }
};

// 2. Tambah Transaksi Baru (Beserta Update Saldo Dompet)
export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, type, description, walletId, categoryId, date, receiptUrl } = req.body;

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak ditemukan.' });
    }

    // Validasi field wajib
    if (!amount || !type || !walletId || !categoryId) {
      return res.status(400).json({ message: 'Lengkapi semua field yang wajib diisi.' });
    }

    // Validasi enum type
    const validTypes: string[] = Object.values(CategoryType);
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: `Tipe transaksi tidak valid. Harus salah satu dari: ${validTypes.join(', ')}` });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Nominal transaksi harus berupa angka lebih dari 0.' });
    }

    // Gunakan $transaction Prisma agar penambahan transaksi & update saldo berjalan secara atomic
    const transaction = await prisma.$transaction(async (tx) => {
      // Pastikan dompet milik user
      const existingWallet = await tx.wallet.findFirst({
        where: { id: String(walletId), userId },
      });

      if (!existingWallet) {
        throw new Error('Dompet tidak ditemukan atau bukan milik Anda.');
      }

      // Buat transaksi
      const newTx = await tx.transaction.create({
        data: {
          amount: numAmount,
          type: type as CategoryType,
          description,
          walletId: String(walletId),
          categoryId: String(categoryId),
          userId,
          date: date ? new Date(date) : new Date(),
          receiptUrl: receiptUrl || null,
        },
        include: {
          wallet: true,
          category: true,
        },
      });

      // Update Saldo Dompet (INCOME = Tambah, EXPENSE = Kurang)
      const balanceChange = type === 'INCOME' ? numAmount : -numAmount;
      await tx.wallet.update({
        where: { id: String(walletId) },
        data: { balance: { increment: balanceChange } },
      });

      return newTx;
    });

    return res.status(201).json(transaction);
  } catch (error: any) {
    console.error('Error createTransaction:', error);
    return res.status(500).json({ message: error.message || 'Gagal menambah transaksi.', error: error.message });
  }
};

// 3. Edit / Update Transaksi (Beserta Penyesuaian Saldo Dompet)
export const updateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, type, description, categoryId, walletId, date, receiptUrl } = req.body;

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak ditemukan.' });
    }

    // Cari transaksi lama untuk validasi kepemilikan dan penyesuaian saldo
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id: String(id), userId },
    });

    if (!existingTransaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Nominal transaksi harus berupa angka lebih dari 0.' });
    }

    // Validasi enum type
    const validTypes: string[] = Object.values(CategoryType);
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ message: `Tipe transaksi tidak valid. Harus salah satu dari: ${validTypes.join(', ')}` });
    }

    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // 1. BATALKAN dampak saldo dari transaksi LAMA
      const oldAmount = existingTransaction.amount;
      const oldType = existingTransaction.type;
      const oldWalletId = existingTransaction.walletId;

      const oldBalanceRevert = oldType === 'INCOME' ? -oldAmount : oldAmount;
      await tx.wallet.update({
        where: { id: oldWalletId },
        data: { balance: { increment: oldBalanceRevert } },
      });

      // 2. TERAPKAN dampak saldo untuk transaksi BARU
      const targetWalletId = walletId ? String(walletId) : oldWalletId;
      const targetType = type || oldType;
      const newBalanceChange = targetType === 'INCOME' ? parsedAmount : -parsedAmount;

      await tx.wallet.update({
        where: { id: targetWalletId },
        data: { balance: { increment: newBalanceChange } },
      });

      // 3. Update data transaksi di database
      return await tx.transaction.update({
        where: { id: String(id) },
        data: {
          amount: parsedAmount,
          type: targetType as CategoryType,
          description: description !== undefined ? description : existingTransaction.description,
          categoryId: categoryId ? String(categoryId) : existingTransaction.categoryId,
          walletId: targetWalletId,
          date: date ? new Date(date) : existingTransaction.date,
          receiptUrl: receiptUrl !== undefined ? receiptUrl : existingTransaction.receiptUrl,
        },
        include: {
          category: true,
          wallet: true,
        },
      });
    });

    return res.status(200).json({
      message: 'Transaksi berhasil diperbarui',
      data: updatedTransaction,
    });
  } catch (error: any) {
    console.error('Error updateTransaction:', error);
    return res.status(500).json({ message: 'Gagal memperbarui transaksi.', error: error.message });
  }
};

// 4. Hapus Transaksi (Beserta Revert Saldo Dompet)
export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak ditemukan.' });
    }

    const existingTx = await prisma.transaction.findFirst({
      where: { 
        id: String(id), 
        userId 
      },
    });

    if (!existingTx) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    await prisma.$transaction(async (tx) => {
      // Revert / Kembalikan saldo dompet sebelum transaksi dihapus
      const balanceRevert = existingTx.type === 'INCOME' ? -existingTx.amount : existingTx.amount;
      
      await tx.wallet.update({
        where: { id: existingTx.walletId },
        data: { balance: { increment: balanceRevert } },
      });

      // Hapus transaksi dari database
      await tx.transaction.delete({ 
        where: { id: String(id) } 
      });
    });

    return res.json({ message: 'Transaksi berhasil dihapus.' });
  } catch (error: any) {
    console.error('Error deleteTransaction:', error);
    return res.status(500).json({ message: 'Gagal menghapus transaksi.', error: error.message });
  }
};