import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function criarEscola(request: Request, response: Response) {
  const { nome, cidade_id, endereco } = request.body;

  if (typeof nome !== "string" || nome.trim() === "" || !Number.isInteger(cidade_id)) {
    return response.status(400).json({ erro: "Informe o nome da escola e o cidade_id." });
  }

  const escola = await prisma.escola.create({
    data: {
      nome: nome.trim(),
      cidade_id,
      endereco: typeof endereco === "string" ? endereco.trim() : null,
    },
  });

  return response.status(201).json(escola);
}

export async function listarEscolas(_request: Request, response: Response) {
  const escolas = await prisma.escola.findMany({ orderBy: { nome: "asc" } });
  return response.status(200).json(escolas);
}
