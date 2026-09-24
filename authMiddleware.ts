import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    userId?: string;
  };
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        userId?: string;
      };
    }
  }
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization || req.headers["authorization"];
  const token = authHeader && (authHeader as string).split(" ")[1];

  if (!token) {
    return res.status(401).json({ 
      message: "Akses ditolak. Token tidak ditemukan." 
    });
  }

  try {
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "rahasia_jwt_kamu";
    const decoded = jwt.verify(token, secret) as any;

    const extractedUserId = decoded.userId || decoded.id || decoded.sub;

    if (!extractedUserId) {
      return res.status(401).json({ 
        message: "Token tidak valid: ID Pengguna tidak ditemukan dalam token." 
      });
    }

    req.userId = extractedUserId;
    req.user = { id: extractedUserId, userId: extractedUserId };

    next();
  } catch (error: any) {
    console.error("JWT Verification Error:", error.message);
    return res.status(403).json({ 
      message: "Token tidak valid atau telah kadaluwarsa." 
    });
  }
};

// Alias agar kompatibel jika diimpor dengan nama verifyToken
export const verifyToken = authenticateToken;