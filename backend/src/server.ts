import "dotenv/config";
import cors from "cors";
import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.json({ message: "API Node.js online" }));

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Falha ao verificar conexão com MySQL.", error);
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

const server = app.listen(port, async () => {
  try {
    await prisma.$connect();
    console.log(`API online na porta ${port}; conexão MySQL estabelecida.`);
  } catch (error) {
    console.error("API online, mas não foi possível conectar ao MySQL. Verifique DATABASE_URL no backend/.env.", error);
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