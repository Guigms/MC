# Here are your Instructions

## Executar localmente

Instale as dependências na raiz e em `backend` e `frontend` antes da primeira execução. Na raiz do projeto:

- `npm run dev` inicia o backend em modo de desenvolvimento e o frontend.
- `npm start` compila e inicia o backend e também inicia o frontend.

Os dois comandos mantêm os serviços em execução juntos; encerrar um dos serviços também encerra o outro.

O frontend usa `PORT` para configurar sua porta. O backend usa `BACKEND_PORT` ou, se não definido, `PORT` do arquivo `backend/.env` (padrão: `3001`).
