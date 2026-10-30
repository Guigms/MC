# Backend

Backend em Node.js, Express, TypeScript e Prisma com banco MySQL.

## Configuração

1. Edite `backend/.env` e substitua `USUARIO`, `SENHA`, o host, a porta e o nome do banco pelos dados da sua instalação MySQL.
2. No diretório `backend`, instale as dependências e gere o cliente Prisma:

   ```sh
   npm install
   npm run db:generate
   ```

3. Crie/aplique as migrações do Prisma:

   ```sh
   npm run db:migrate
   ```

4. Inicie o servidor:

   ```sh
   npm run dev
   ```

A API fica em `http://localhost:3001`. O endpoint `GET /api/health` verifica a conexão com o banco. Em desenvolvimento, o frontend encaminha as chamadas `/api` para essa URL. Em produção, configure `REACT_APP_BACKEND_URL` no ambiente de build do frontend com a URL pública do backend.

`backend/.env.example` contém o formato esperado das variáveis. Não compartilhe nem versione o arquivo `.env`.
