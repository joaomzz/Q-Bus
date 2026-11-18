import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth";

const tipos = ["problema_mecanico", "falta_combustivel", "atolamento", "bloqueio_estrada", "atraso", "cancelamento"];

export async function listarOcorrencias(_req: Request, res: Response) {
  return res.json(await prisma.ocorrencia.findMany({ orderBy: { criada_em: "desc" }, include: { rota: true, onibus: true, motorista: { include: { usuario: { select: { id: true, nome: true } } } } } }));
}

export async function criarOcorrencia(req: AuthRequest, res: Response) {
  const { tipo, descricao, local, onibus_id, rota_id, motorista_id, previsao_normalizacao } = req.body as Record<string, unknown>;
  if (typeof tipo !== "string" || !tipos.includes(tipo) || !Number.isInteger(onibus_id) || !Number.isInteger(rota_id) || !Number.isInteger(motorista_id) || (descricao != null && typeof descricao !== "string") || (local != null && typeof local !== "string")) return res.status(400).json({ erro: "Dados da ocorrência inválidos." });
  if (req.usuario?.perfil !== "motorista" && req.usuario?.perfil !== "admin") return res.status(403).json({ erro: "Apenas motoristas podem registrar ocorrências." });
  const motoristaId = req.usuario.perfil === "motorista" ? req.usuario.id : motorista_id as number;
  const ocorrencia = await prisma.ocorrencia.create({ data: { tipo, descricao: descricao as string | undefined, local: local as string | undefined, onibus_id: onibus_id as number, rota_id: rota_id as number, motorista_id: motoristaId, previsao_normalizacao: previsao_normalizacao ? new Date(String(previsao_normalizacao)) : null } });
  return res.status(201).json(ocorrencia);
}

export async function resolverOcorrencia(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ erro: "ID inválido." });
  const atual = await prisma.ocorrencia.findUnique({ where: { id } });
  if (!atual) return res.status(404).json({ erro: "Ocorrência não encontrada." });
  if (req.usuario?.perfil !== "admin" && atual.motorista_id !== req.usuario?.id) return res.status(403).json({ erro: "Você só pode encerrar suas próprias ocorrências." });
  if (atual.status !== "em_andamento") return res.status(409).json({ erro: "Ocorrência já encerrada." });
  return res.json(await prisma.ocorrencia.update({ where: { id }, data: { status: "resolvida", resolvida_em: new Date() } }));
}
