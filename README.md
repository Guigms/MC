# Here are your Instructions

## Executar localmente

Instale as dependências na raiz e em `backend` e `frontend` antes da primeira execução. Na raiz do projeto:

- `npm run dev` inicia o backend em modo de desenvolvimento e o frontend.
- `npm start` compila e inicia o backend e também inicia o frontend.

Os dois comandos mantêm os serviços em execução juntos; encerrar um dos serviços também encerra o outro.

O frontend usa `PORT` para configurar sua porta. O backend usa `BACKEND_PORT` ou, se não definido, `PORT` do arquivo `backend/.env` (padrão: `3001`).

## Notificações de novos eventos

O envio está desativado por padrão para permitir a publicação inicial sem disparar e-mails. Ao cadastrar eventos, o sistema os cria normalmente e informa no painel que as notificações estão em espera.

Quando estiver pronto para ativar os avisos, configure o SMTP no `backend/.env`:

- `EMAIL_NOTIFICATIONS_ENABLED=true`: habilita o envio (o padrão é `false`).
- `SMTP_HOST`: servidor SMTP do provedor.
- `SMTP_PORT`: porta SMTP (normalmente `587` para STARTTLS ou `465` para TLS).
- `SMTP_USER` e `SMTP_PASS`: credenciais SMTP.
- `SMTP_FROM`: endereço remetente autorizado pelo provedor (por exemplo, `Biker Girls 85 <eventos@seudominio.com>`).

Depois de ativar, reinicie o backend. Falhas de envio serão indicadas no painel e registradas no log do backend.
