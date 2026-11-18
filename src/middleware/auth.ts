import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request { usuario?: { id: number; perfil: string } }

export function exigirAutenticacao(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token || !process.env.JWT_SECRET) return res.status(401).json({ erro: "Autenticação necessária." });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET) as { id: number; perfil: string };
    return next();
  } catch {
    return res.status(401).json({ 
      erro: "Token inválido ou expirado." 
    });
  }
}

export function exigirAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.usuario?.perfil !== "admin") 
    return res.status(403).json({ 
  erro: "Acesso restrito a administradores." 
});
  return next();
}
