import { type Request, type Response } from "express";
import prisma from "../config/prisma.js";

// 1. Get All Wallets
export const getWallets = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const wallets = await prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(wallets);
  } catch (error) {
    return res.status(500).json({ message: "Gagal mengambil data wallet.", error });
  }
};

// Create Wallet
export const createWallet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { name, balance, isIncludedInTotal } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!name) return res.status(400).json({ message: "Nama wallet wajib diisi." });

    const wallet = await prisma.wallet.create({
      data: {
        name,
        balance: balance ? parseFloat(balance) : 0,
        isIncludedInTotal: isIncludedInTotal !== undefined ? Boolean(isIncludedInTotal) : true,
        userId,
      },
    });

    return res.status(201).json(wallet);
  } catch (error) {
    return res.status(500).json({ message: "Gagal membuat wallet.", error });
  }
};

// Update Wallet
export const updateWallet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { name, balance, isIncludedInTotal } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (balance !== undefined) updateData.balance = parseFloat(balance);
    if (isIncludedInTotal !== undefined) updateData.isIncludedInTotal = Boolean(isIncludedInTotal);

    const result = await prisma.wallet.updateMany({
      where: { 
        id: String(id),
        userId: userId 
      },
      data: updateData,
    });

    if (result.count === 0) {
      return res.status(404).json({ message: "Wallet tidak ditemukan atau akses ditolak." });
    }

    return res.status(200).json({ message: "Wallet berhasil diperbarui." });
  } catch (error) {
    return res.status(500).json({ message: "Gagal mengedit wallet.", error });
  }
};

// 4. Delete Wallet
export const deleteWallet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const result = await prisma.wallet.deleteMany({
      where: {
        id: String(id),
        userId: userId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: "Wallet tidak ditemukan atau akses ditolak." });
    }

    return res.status(200).json({ message: "Wallet berhasil dihapus." });
  } catch (error) {
    return res.status(500).json({ message: "Gagal menghapus wallet.", error });
  }
};