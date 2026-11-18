import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function listarHorarios(_req: Request, res: Response) {
  return res.json(await prisma.horario.findMany({ orderBy: [{ saida: "asc" }], include: { onibus_rota: { include: { onibus: true, rota: true } } } }));
}

export async function criarHorario(req: Request, res: Response) {
  const { onibus_id, rota_id, saida, chegada_prevista, dias_semana } = req.body as Record<string, unknown>;
  const time = (value: unknown) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);
  if (!Number.isInteger(onibus_id) || !Number.isInteger(rota_id) || !time(saida) || !time(chegada_prevista) || (dias_semana !== undefined && (!Array.isArray(dias_semana) || !dias_semana.every(d => Number.isInteger(d) && d >= 0 && d <= 6)))) {
    return res.status(400).json({ erro: "Informe ônibus, rota, horários HH:mm válidos e dias da semana entre 0 e 6." });
  }
  const horario = await prisma.horario.create({ data: { onibus_id: onibus_id as number, rota_id: rota_id as number, saida: new Date(`1970-01-01T${saida}:00Z`), chegada_prevista: new Date(`1970-01-01T${chegada_prevista}:00Z`), dias_semana: (dias_semana ?? [1, 2, 3, 4, 5]) as number[] }, include: { onibus_rota: { include: { onibus: true, rota: true } } } });
  return res.status(201).json(horario);
}
