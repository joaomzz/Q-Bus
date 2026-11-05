import express from "express";
import { criarCidade, listarCidades } from "./controllers/cidade.controller";
import { criarEscola, listarEscolas } from "./controllers/escola.controller";
import { criarOnibus, listarOnibus } from "./controllers/onibus.controller";
import { criarRota, listarRotas } from "./controllers/rota.controller";

const app = express();

app.use(express.json());

app.post("/cidades", criarCidade);
app.get("/cidades", listarCidades);

app.post("/escolas", criarEscola);
app.get("/escolas", listarEscolas);

app.post("/rotas", criarRota);
app.get("/rotas", listarRotas);

app.post("/onibus", criarOnibus);
app.get("/onibus", listarOnibus);

export default app;
