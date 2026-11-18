# QBus IFCE API

API REST para gerenciamento do transporte escolar, construída com Express, Prisma 7 e PostgreSQL 17.

## Desenvolvimento

1. Instale Node.js e Docker.
2. Copie `.env.example` para `.env` e configure `JWT_SECRET`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
3. Instale dependências com `npm install`.
4. Inicie o banco com `docker compose up -d`.
5. Aplique o schema: `npm run db:migrate` e `npm run db:generate`.
6. Crie o administrador: `npm run db:seed`.
7. Inicie a API: `npm run dev` (padrão: http://localhost:3000).

Para compilar para produção, use `npm run build` e depois `npm start`. Em produção aplique migrations com `npx prisma migrate deploy`.

## Autenticação

`POST /auth/login` recebe `{ "email": "...", "senha": "..." }` e retorna um token JWT válido por 8 horas. Envie `Authorization: Bearer <token>` nas rotas protegidas. Criações administrativas exigem o perfil `admin`.

## Rotas

| Método | Caminho | Acesso | Uso |
| --- | --- | --- | --- |
| GET | `/health` | Público | Verifica se a API está ativa |
| POST | `/auth/login` | Público | Login |
| POST | `/usuarios` | Admin | Cadastrar usuário (aluno, motorista ou admin) |
| GET/POST | `/cidades` | Leitura pública / admin | Listar e cadastrar cidades |
| GET/POST | `/escolas` | Leitura pública / admin | Listar e cadastrar escolas |
| GET/POST | `/rotas` | Leitura pública / admin | Listar e cadastrar rotas |
| GET/POST | `/onibus` | Leitura pública / admin | Listar e cadastrar ônibus |
| PATCH | `/onibus/:id/motorista` | Admin | Atribuir motorista (`motorista_id`) ou remover com `null` |
| GET/POST | `/horarios` | Leitura pública / admin | Listar e cadastrar horários |
| GET | `/viagens` | Autenticado | Listar viagens |
| POST | `/viagens` | Autenticado | Iniciar viagem (`horario_id`, `motorista_id`) |
| PATCH | `/viagens/:id/finalizar` | Autenticado | Finalizar viagem |
| GET/POST | `/ocorrencias` | Autenticado | Listar e registrar ocorrências |
| PATCH | `/ocorrencias/:id/resolver` | Autenticado | Resolver ocorrência |

## Banco de dados

`prisma/schema.prisma` define o modelo usado pela aplicação. `prisma/migrations` contém o histórico; `schema.sql` também está disponível como referência SQL. A primeira migration antiga cria uma tabela `User` de um protótipo anterior; a migration seguinte adiciona o schema QBus. Em bancos existentes, revise os dados dessa tabela legada e o estado das migrations antes de migrar. Não execute reset em bancos com dados importantes.
