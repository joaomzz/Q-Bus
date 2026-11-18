import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

export async function criarUsuario(req: Request, res: Response) {
  const { nome, email, senha, telefone, perfil, matricula, escola_id, cidade_id, identificacao } = req.body as Record<string, unknown>;
  if (typeof nome !== "string" || !nome.trim() || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email) || typeof senha !== "string" || senha.length < 8 || !["aluno", "motorista", "admin"].includes(String(perfil))) 
    return res.status(400).json({erro: "Informe nome, email válido, senha com ao menos 8 caracteres e perfil válido." 
  });

  if (perfil === "aluno" && (typeof matricula !== "string" || !matricula.trim() || !Number.isInteger(escola_id) || !Number.isInteger(cidade_id))) 
    return res.status(400).json({erro: "Aluno exige matrícula, escola_id e cidade_id." });

  if (perfil === "motorista" && (typeof identificacao !== "string" || !identificacao.trim())) 
    return res.status(400).json({erro: "Motorista exige identificacao." });

  const senha_hash = await bcrypt.hash(senha, 12);
  const usuario = await prisma.usuario.create({
    data: {
      nome: nome.trim(), email: email.trim().toLowerCase(), senha_hash,
      telefone: typeof telefone === "string" ? telefone.trim() : null, perfil: String(perfil),
      ...(perfil === "aluno" ? { aluno: { create: { matricula: (matricula as string).trim(), escola_id: escola_id as number, cidade_id: cidade_id as number } } } : {}),
      ...(perfil === "motorista" ? { motorista: { create: { identificacao: (identificacao as string).trim() } } } : {}),
    },
    select: { id: true, nome: true, email: true, telefone: true, perfil: true, ativo: true, criado_em: true },
  });
  return res.status(201).json(usuario);
}
