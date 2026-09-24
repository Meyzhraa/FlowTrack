import { type Request, type Response } from "express";
import prisma from "../config/prisma.js";

/**
 * Memperbarui profil pengguna (Nama & Foto Profil)
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { name, image } = req.body;

    // 1. Autentikasi Pengguna
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: Akses ditolak." });
    }

    // 2. Susun Data Perubahan secara Dinamis
    const updateData: { name?: string; image?: string } = {};

    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (image !== undefined) {
      updateData.image = image;
    }

    // Pastikan setidaknya ada 1 field yang di-update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        message: "Tidak ada data profil yang dikirimkan untuk diperbarui." 
      });
    }

    // 3. Eksekusi Update ke PostgreSQL via Prisma
    const updatedUser = await prisma.user.update({
      where: { id: String(userId) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        // Menyembunyikan password agar aman tidak terikut di response JSON
      },
    });

    // 4. Kirimkan Data Pengguna Terbaru
    return res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error("Error saat update profile di Prisma:", error);

    return res.status(500).json({ 
      message: error?.message || "Gagal memperbarui profil di database." 
    });
  }
};