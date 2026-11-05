import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function criarRota(request: Request, response: Response) {
  const { nome, cidade_id, origem, destino, distancia_km, tempo_estimado_min } = request.body;

  if (
    typeof nome !== "string" || nome.trim() === "" ||
    !Number.isInteger(cidade_id) ||
    typeof origem !== "string" || origem.trim() === "" ||
    typeof destino !== "string" || destino.trim() === ""
  ) {
    return response.status(400).json({ erro: "Informe nome, cidade_id, origem e destino válidos." });
  }

  if (distancia_km != null && (typeof distancia_km !== "number" || distancia_km < 0)) {
    return response.status(400).json({ erro: "distancia_km deve ser um número positivo." });
  }

  if (tempo_estimado_min != null && (!Number.isInteger(tempo_estimado_min) || tempo_estimado_min <= 0)) {
    return response.status(400).json({ erro: "tempo_estimado_min deve ser um número inteiro maior que zero." });
  }

  const cidade = await prisma.cidade.findUnique({ where: { id: cidade_id } });
  if (!cidade) {
    return response.status(404).json({ erro: "Cidade não encontrada." });
  }

  const rota = await prisma.rota.create({
    data: {
      nome: nome.trim(),
      cidade_id,
      origem: origem.trim(),
      destino: destino.trim(),
      distancia_km: distancia_km ?? null,
      tempo_estimado_min: tempo_estimado_min ?? null,
    },
  });

  return response.status(201).json(rota);
}

export async function listarRotas(_request: Request, response: Response) {
  const rotas = await prisma.rota.findMany({
    orderBy: { nome: "asc" },
    include: { cidade: { select: { id: true, nome: true, uf: true } } },
  });

  return response.status(200).json(rotas);
}
