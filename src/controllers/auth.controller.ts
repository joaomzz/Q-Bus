import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export async function login(req: Request, res: Response) {
  const { email, senha } = req.body as Record<string, unknown>;
  if (typeof email !== "string" || typeof senha !== "string") return res.status(400).json({ erro: "Informe email e senha." });
  const usuario = await prisma.usuario.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!usuario || !usuario.ativo || !(await bcrypt.compare(senha, usuario.senha_hash))) return res.status(401).json({ erro: "Email ou senha inválidos." });
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado.");
  const token = jwt.sign({ id: usuario.id, perfil: usuario.perfil }, secret, { expiresIn: "8h" });
  return res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil } });
}
