import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function criarOnibus(request: Request, response: Response) {
  const { numero, placa, capacidade, rota_ids, motorista_id } = request.body;

  if (
    typeof numero !== "string" || numero.trim() === "" ||
    typeof placa !== "string" || placa.trim() === "" ||
    !Number.isInteger(capacidade) || capacidade <= 0 ||
    !Array.isArray(rota_ids) || rota_ids.length === 0 ||
    !rota_ids.every((id: unknown) => Number.isInteger(id)) ||
    new Set(rota_ids).size !== rota_ids.length ||
    (motorista_id != null && !Number.isInteger(motorista_id))
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

  if (motorista_id != null) {
    const motorista = await prisma.motorista.findUnique({ where: { usuario_id: motorista_id } });
    if (!motorista) return response.status(404).json({ erro: "Motorista não encontrado." });
  }

  const onibus = await prisma.onibus.create({
    data: {
      numero: numero.trim(),
      placa: placa.trim().toUpperCase(),
      capacidade,
      ...(motorista_id != null ? { motorista: { connect: { usuario_id: motorista_id } } } : {}),
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

export async function atribuirMotorista(request: Request, response: Response) {
  const onibus_id = Number(request.params.id);
  const { motorista_id } = request.body as { motorista_id?: unknown };
  if (!Number.isInteger(onibus_id) || onibus_id <= 0) return response.status(400).json({ erro: "ID do ônibus inválido." });
  if (motorista_id !== null && !Number.isInteger(motorista_id)) return response.status(400).json({ erro: "motorista_id deve ser um número ou null para remover a atribuição." });
  if (motorista_id != null) {
    const motorista = await prisma.motorista.findUnique({ where: { usuario_id: motorista_id as number } });
    if (!motorista) return response.status(404).json({ erro: "Motorista não encontrado." });
  }
  return response.json(await prisma.onibus.update({
    where: { id: onibus_id },
    data: motorista_id === null ? { motorista: { disconnect: true } } : { motorista: { connect: { usuario_id: motorista_id as number } } },
    include: { motorista: { include: { usuario: { select: { id: true, nome: true } } } } },
  }));
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
