import express from "express";
import { criarCidade, listarCidades } from "./controllers/cidade.controller";
import { criarEscola, listarEscolas } from "./controllers/escola.controller";
import { atribuirMotorista, criarOnibus, listarOnibus } from "./controllers/onibus.controller";
import { criarRota, listarRotas } from "./controllers/rota.controller";
import { login } from "./controllers/auth.controller";
import { finalizarViagem, iniciarViagem, listarViagens } from "./controllers/viagem.controller";
import { exigirAdmin, exigirAutenticacao } from "./middleware/auth";
import { criarHorario, listarHorarios } from "./controllers/horario.controller";
import { criarOcorrencia, listarOcorrencias, resolverOcorrencia } from "./controllers/ocorrencia.controller";
import { criarUsuario } from "./controllers/usuario.controller";

const app = express();

app.use(express.json());
app.post("/auth/login", login);
app.post("/usuarios", exigirAutenticacao, exigirAdmin, criarUsuario);
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.post("/cidades", exigirAutenticacao, exigirAdmin, criarCidade);
app.get("/cidades", listarCidades);

app.post("/escolas", exigirAutenticacao, exigirAdmin, criarEscola);
app.get("/escolas", listarEscolas);

app.post("/rotas", exigirAutenticacao, exigirAdmin, criarRota);
app.get("/rotas", listarRotas);

app.post("/onibus", exigirAutenticacao, exigirAdmin, criarOnibus);
app.patch("/onibus/:id/motorista", exigirAutenticacao, exigirAdmin, atribuirMotorista);
app.get("/onibus", listarOnibus);

app.get("/viagens", exigirAutenticacao, listarViagens);
app.post("/viagens", exigirAutenticacao, iniciarViagem);
app.patch("/viagens/:id/finalizar", exigirAutenticacao, finalizarViagem);

app.get("/horarios", listarHorarios);
app.post("/horarios", exigirAutenticacao, exigirAdmin, criarHorario);
app.get("/ocorrencias", exigirAutenticacao, listarOcorrencias);
app.post("/ocorrencias", exigirAutenticacao, criarOcorrencia);
app.patch("/ocorrencias/:id/resolver", exigirAutenticacao, resolverOcorrencia);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const code = (err as { code?: string })?.code;
  
  if (code === "P2002") return res.status(409).json({
     erro: "Já existe um registro com esses dados únicos."
     });

  if (code === "P2003") return res.status(400).json({
     erro: "Referência inválida: confira os IDs relacionados."
     });

  if (code === "P2025") return res.status(404).json({
     erro: "Registro não encontrado."
     });

  return res.status(500).json({
    erro: "Erro interno do servidor." });
});

export default app;
