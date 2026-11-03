import "dotenv/config";
import cors from "cors";
import express, { Request, Response } from "express";
import path from "path";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.BACKEND_PORT ?? process.env.PORT ?? 3001);

// Configuração de CORS compatível com credentials: true do Axios
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// Servir pasta de uploads estáticos
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Log de requisições no terminal do backend
app.use((req: Request, _res: Response, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Rota Raiz & Healthcheck
app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "API Node.js + Prisma online" });
});

app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Falha ao verificar conexão com MySQL.", error);
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

// ==========================================
// 1. AUTENTICAÇÃO E USUÁRIOS (MYSQL)
// ==========================================

// POST /api/auth/login
app.post("/api/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "E-mail e senha são obrigatórios." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ message: "E-mail ou senha inválidos." });
    }

    if (!user.active) {
      return res.status(403).json({ message: "Conta desativada." });
    }

    const { passwordHash, ...userWithoutPassword } = user;

    return res.json({
      user: userWithoutPassword,
      token: `token-jwt-${user.id}`,
    });
  } catch (error: any) {
    console.error("Erro ao autenticar usuário no MySQL:", error);
    return res.status(500).json({ message: "Erro interno no servidor ao realizar login." });
  }
});

// POST /api/auth/logout
app.post("/api/auth/logout", (_req: Request, res: Response) => {
  return res.json({ message: "Sessão encerrada." });
});

// GET /api/auth/me - Verificação de sessão
app.get("/api/auth/me", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.json(null);

  try {
    const userId = authHeader.replace("Bearer token-jwt-", "");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        nickname: true,
        phone: true,
        motorcycle: true,
        bloodType: true,
        birthDate: true,
        active: true,
        joinedAt: true,
      },
    });

    return res.json(user ?? null);
  } catch {
    return res.json(null);
  }
});

// ==========================================
// 2. PAINEL / DASHBOARD DO CLUBE
// ==========================================

// GET /api/settings - Configurações (preserva imagens originais do React)
// Trata requisições acidentais por /undefined para limpar o erro vermelho do console
app.get("/api/settings", (_req: Request, res: Response) => {
  return res.status(404).json({ message: "Ativar mecanismo de segurança do frontend" });
});



// GET /api/public/stats - Contagem dinâmica no MySQL
app.get("/api/public/stats", async (_req: Request, res: Response) => {
  try {
    const membersCount = await prisma.user.count({ where: { active: true } });
    return res.json({ members: membersCount, events: 0, rides: 0 });
  } catch {
    return res.json({ members: 0, events: 0, rides: 0 });
  }
});

// GET /api/users e /api/members - Lista de usuárias do banco
const getUsersHandler = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { active: true },
    });
    return res.json(users);
  } catch (error) {
    console.error("Erro ao buscar membros:", error);
    return res.json([]);
  }
};

app.get("/api/users", getUsersHandler);
app.get("/api/members", getUsersHandler);


// GET /api/admin/overview
// GET /api/admin/overview
app.get("/api/admin/overview", async (_req: Request, res: Response) => {
  try {
    const active_members = await prisma.user.count({ where: { active: true } });
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    return res.json({
      active_members,
      paid_this_month: 0,
      month,
      unpaid_this_month: 0,
      year,
      revenue_year: 0,
      revenue_month: 0,
      upcoming: [], // Array essencial para evitar o erro de .length
    });
  } catch (error) {
    console.error("Erro em /api/admin/overview:", error);
    const now = new Date();
    return res.json({
      active_members: 0,
      paid_this_month: 0,
      month: now.getMonth() + 1,
      unpaid_this_month: 0,
      year: now.getFullYear(),
      revenue_year: 0,
      revenue_month: 0,
      upcoming: [],
    });
  }
});
// ==========================================
// 4. ROTAS DO PAINEL ADMIN (Dues, Applications, Events, Products)
// ==========================================

// Mensalidades (Dues)
const handleEmptyArray = (_req: Request, res: Response) => {
  res.json([]);
};

app.get("/api/admin/dues", handleEmptyArray);
app.get("/api/dues", handleEmptyArray);

// Inscrições (Applications)
app.get("/api/admin/applications", handleEmptyArray);
app.get("/api/applications", handleEmptyArray);

// Eventos (Events)
app.get("/api/admin/events", handleEmptyArray);
app.get("/api/events", handleEmptyArray);

// Produtos (Products)
app.get("/api/admin/products", handleEmptyArray);
app.get("/api/products", handleEmptyArray);


// Salvaguarda para qualquer endpoint /api/* secundário não tratado acima
app.use("/api", (_req: Request, res: Response) => {
  res.json([]);
});

// ==========================================
// 3. INICIALIZAÇÃO DO SERVIDOR
// ==========================================
const server = app.listen(port, async () => {
  try {
    await prisma.$connect();
    console.log(`API online na porta ${port}; conexão MySQL estabelecida.`);
  } catch (error) {
    console.error(
      "API online, mas não foi possível conectar ao MySQL. Verifique DATABASE_URL no backend/.env.",
      error
    );
  }
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}
