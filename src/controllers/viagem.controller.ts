import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth";

export async function iniciarViagem(req: AuthRequest, res: Response) {
  const { 
    horario_id,
    motorista_id: motoristaInformado
   } = req.body as Record<string, unknown>;

  if (req.usuario?.perfil !== "motorista" && req.usuario?.perfil !== "admin")
    return res.status(403).json({ erro: "Apenas motoristas podem iniciar viagens." 
  });
  const motorista_id = req.usuario.perfil === "motorista" ? req.usuario.id : motoristaInformado;
  if (!Number.isInteger(horario_id) || !Number.isInteger(motorista_id)) {
    return res.status(400).json({ erro: "Informe horario_id e, para administrador, motorista_id válidos." });
  }

  const [horario, motorista] = await Promise.all([
    prisma.horario.findUnique({ where: { id: horario_id as number }, include: { onibus_rota: { include: { onibus: true } } } }),
    prisma.motorista.findUnique({ where: { usuario_id: motorista_id as number }, include: { usuario: true } }),
  ]);
  if (!horario) return res.status(404).json({ 
    erro: "Horário não encontrado." 
  });

  if (!motorista || !motorista.usuario.ativo) 
    return res.status(404).json({ 
  erro: "Motorista não encontrado ou inativo."
 });

  if (horario.onibus_rota.onibus.motorista_id !== motorista_id) 
    return res.status(403).json({ 
  erro: "O ônibus deste horário não está atribuído a esse motorista." 
});

  const viagemAberta = await prisma.viagem.findFirst({ where: { motorista_id: motorista_id as number, finalizada_em: null } });
  if (viagemAberta) return res.status(409).json({ erro: "O motorista já possui uma viagem em andamento." });

  const viagem = await prisma.viagem.create({
    data: { horario_id: horario.id, motorista_id: motorista_id as number },
    include: { horario: { include: { onibus_rota: { include: { onibus: true, rota: true } } } }, motorista: { include: { usuario: { select: { id: true, nome: true } } } } },
  });
  return res.status(201).json(viagem);
}

export async function finalizarViagem(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ erro: "ID de viagem inválido." });
  const viagem = await prisma.viagem.findUnique({ where: { id } });
  if (!viagem) return res.status(404).json({ erro: "Viagem não encontrada." });
  if (req.usuario?.perfil !== "admin" && viagem.motorista_id !== req.usuario?.id) return res.status(403).json({ erro: "Você só pode finalizar sua própria viagem." });
  if (viagem.finalizada_em) return res.status(409).json({ erro: "Esta viagem já foi finalizada." });
  return res.json(await prisma.viagem.update({ where: { id }, data: { finalizada_em: new Date() } }));
}

export async function listarViagens(_req: Request, res: Response) {
  return res.json(await prisma.viagem.findMany({ orderBy: { iniciada_em: "desc" }, include: { horario: { include: { onibus_rota: { include: { onibus: true, rota: true } } } }, motorista: { include: { usuario: { select: { id: true, nome: true } } } } } }));
}
