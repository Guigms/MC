# PRD — Sistema para Moto Clubs (Biker 85 Girls / white-label)

## Original problem statement
crie um sistema para clubs de moto, com area de membro
area do administrador, onde ele pode ver os eventos, os encontros adicionados pelos administradores.
deve ter a pagina do club e a ´pagina do membro
deve ter o controle de mensalidade para ver quem esta pagando ou nao, controle de usuario.
a imagem anexada, é a logo do moto club, mas quero que voce faça de uma forma que a seja de facil customização para quando for aplicado a novos moto clubs
User choices: login e-mail+senha; admin marca mensalidade manualmente; página do club pública, eventos só para membros; mensalidade R$30; "faça o melhor site de club de motos do mundo, efeitos visuais que remetam a motos".

## Architecture
FastAPI + MongoDB (users, events, payments, settings, login_attempts) / React + shadcn + framer-motion. JWT (Bearer + httpOnly cookie). Branding stored in `settings` doc and applied at runtime as CSS vars (--club-primary, --club-accent, --primary HSL).

## Personas
Admin do club; Membro (piloto).

## Implemented (2026-10-28)
- Landing pública: hero com logo, estrada animada, farol, marquee, velocímetros (stats), teaser de eventos bloqueado, galeria, contato, menu mobile
- Login (sem cadastro aberto), proteção brute-force por e-mail
- Área do membro: carteirinha digital, status de mensalidade do ano, eventos/encontros com confirmação de presença, edição de perfil e senha
- Admin: visão geral, matriz de mensalidades (12 meses, clique p/ pago/pendente), CRUD de membros (perfil admin/membro, ativo/inativo), CRUD de eventos/encontros com lista de confirmados, Personalização (nome, logo upload/URL, cores, textos, mensalidade, contatos, galeria) com prévia ao vivo
- Admin excluído das contagens de mensalidade/membros

## Backlog
- P1: recuperação de senha por e-mail; datas com seletor pt-BR
- P2: exportar relatório de mensalidades (PDF/Excel); lembrete de mensalidade; fotos por evento; multi-club (vários clubs numa instância)
