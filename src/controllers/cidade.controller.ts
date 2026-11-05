import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function criarCidade(request: Request, response: Response) {
  const { nome, uf } = request.body;

  if (typeof nome !== "string" || nome.trim() === "" || typeof uf !== "string" || uf.trim().length !== 2) {
    return response.status(400).json({ erro: "Informe o nome da cidade e a UF com duas letras." });
  }

  const cidade = await prisma.cidade.create({
    data: { nome: nome.trim(), uf: uf.trim().toUpperCase() },
  });

  return response.status(201).json(cidade);
}

export async function listarCidades(_request: Request, response: Response) {
  const cidades = await prisma.cidade.findMany({ orderBy: { nome: "asc" } });
  return response.status(200).json(cidades);
}
