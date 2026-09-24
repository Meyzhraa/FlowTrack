import { type Request, type Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

// 1. Registrasi User Baru
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    return res.status(201).json({ message: 'Registrasi berhasil.', userId: user.id });
  } catch (error: any) {
    console.error("Error register:", error);
    return res.status(500).json({ message: 'Gagal melakukan registrasi.', error: error?.message });
  }
};

// 2. Login User
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }

    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'rahasia_jwt_kamu', 
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image || null,
      },
    });
  } catch (error: any) {
    console.error("Error login:", error);
    return res.status(500).json({ message: 'Gagal melakukan login.', error: error?.message });
  }
};

// 3. Change Password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.userId || req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Sesi tidak valid / tidak terautentikasi.' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Password lama dan password baru wajib diisi.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password lama Anda salah.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({ message: 'Password berhasil diperbarui.' });
  } catch (error: any) {
    console.error("Error change password:", error);
    return res.status(500).json({ message: 'Gagal memperbarui password.', error: error?.message });
  }
};

// 4. Minta Link Reset Password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email wajib diisi.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(200).json({ message: 'Jika email terdaftar, instruksi reset password akan dikirimkan.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 Jam dari sekarang

    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    const resetUrl = `http://localhost:3000/auth/reset-password?token=${resetToken}`;
    console.log(`[RESET PASSWORD LINK]: ${resetUrl}`);

    return res.status(200).json({ 
      message: 'Instruksi reset password telah dikirim ke email Anda.',
      resetUrl 
    });
  } catch (error: any) {
    console.error("Error forgot password:", error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error?.message });
  }
};

// 5. Eksekusi Reset Password Baru
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token dan password baru wajib diisi.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token tidak valid atau sudah kadaluwarsa.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return res.status(200).json({ message: 'Password berhasil diperbarui. Silakan login kembali.' });
  } catch (error: any) {
    console.error("Error reset password:", error);
    return res.status(500).json({ message: 'Terjadi kesalahan saat mereset password.', error: error?.message });
  }
};