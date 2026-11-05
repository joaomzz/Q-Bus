import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function criarOnibus(request: Request, response: Response) {
  const { numero, placa, capacidade, rota_ids } = request.body;

  if (
    typeof numero !== "string" || numero.trim() === "" ||
    typeof placa !== "string" || placa.trim() === "" ||
    !Number.isInteger(capacidade) || capacidade <= 0 ||
    !Array.isArray(rota_ids) || rota_ids.length === 0 ||
    !rota_ids.every((id: unknown) => Number.isInteger(id)) ||
    new Set(rota_ids).size !== rota_ids.length
  ) {
    return response.status(400).json({
      erro: "Informe numero, placa, capacidade positiva e ao menos um rota_id válido, sem repetição.",
    });
  }

  const rotas = await prisma.rota.findMany({
    where: { id: { in: rota_ids } },
    select: { id: true },
  });

  if (rotas.length !== rota_ids.length) {
    return response.status(404).json({ erro: "Uma ou mais rotas informadas não foram encontradas." });
  }

  const onibus = await prisma.onibus.create({
    data: {
      numero: numero.trim(),
      placa: placa.trim().toUpperCase(),
      capacidade,
      onibus_rota: {
        create: rota_ids.map((rota_id: number) => ({ rota: { connect: { id: rota_id } } })),
      },
    },
    include: {
      onibus_rota: {
        include: { rota: { select: { id: true, nome: true, origem: true, destino: true } } },
      },
    },
  });

  return response.status(201).json(onibus);
}

export async function listarOnibus(_request: Request, response: Response) {
  const onibus = await prisma.onibus.findMany({
    orderBy: { numero: "asc" },
    include: {
      onibus_rota: {
        include: { rota: { select: { id: true, nome: true, origem: true, destino: true } } },
      },
    },
  });

  return response.status(200).json(onibus);
}
