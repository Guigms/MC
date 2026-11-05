import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import path from "path";
import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

const app = express();
const prisma = new PrismaClient();

type OverviewPayment = {
  month: number;
  amount: number | string | { toString(): string };
  user: { active: boolean; joinedAt: Date };
};

type DuesPayment = {
  month: number;
  amount: number | string | { toString(): string };
};

type DuesMember = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  joinedAt: Date;
  payments: DuesPayment[];
};

type ProductResponseItem = {
  name: string;
  email: string;
  want: boolean;
  size: string;
  quantity: number;
};

type EventEmailRecipient = {
  email: string;
  name: string;
};

type ActiveMemberSummary = {
  joinedAt: Date;
};

type ProductOrderForResponse = {
  want: boolean;
  size: string;
  quantity: number;
  user: {
    name: string;
    nickname: string | null;
    email: string;
  };
};

const port = Number(
  process.env.BACKEND_PORT ?? process.env.PORT ?? 3001
);

const getAuthenticatedUserId = (authorization: string | undefined) => {
  if (!authorization) return "";

  const bearerMatch = authorization.match(/^Bearer\s+(\S+)$/i);
  const token = bearerMatch?.[1] ?? authorization.trim();

  return token.startsWith("token-jwt-")
    ? token.slice("token-jwt-".length)
    : "";
};

const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = getAuthenticatedUserId(req.headers.authorization);

  if (!userId) {
    return res.status(401).json({ message: "Autenticação necessária." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, active: true },
    });

    if (!user?.active || user.role !== "admin") {
      return res.status(403).json({ message: "Acesso restrito a administradores." });
    }

    return next();
  } catch (error) {
    console.error("[Admin] Erro ao validar administrador:", error);

    return res.status(500).json({
      message: "Não foi possível validar as permissões do administrador.",
    });
  }
};

const getActiveUserId = async (authorization: string | undefined) => {
  const userId = getAuthenticatedUserId(authorization);
  if (!userId) return null;

  const user = await prisma.user.findFirst({
    where: { id: userId, active: true },
    select: { id: true },
  });
  return user?.id ?? null;
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  } as Record<string, string>)[character]);

const notifyMembersOfNewEvent = async (event: {
  title: string;
  type: string;
  date: string;
  location: string;
  description: string;
}): Promise<{
  status: "disabled" | "sent" | "partial" | "failed" | "unconfigured";
  total: number;
  sent: number;
  failed: number;
}> => {
  if (process.env.EMAIL_NOTIFICATIONS_ENABLED !== "true") {
    return { status: "disabled", total: 0, sent: 0, failed: 0 };
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !user || !pass || !from) {
    console.error("[Email] Notificações de evento não enviadas: configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e SMTP_FROM.");
    return { status: "unconfigured", total: 0, sent: 0, failed: 0 };
  }

  try {
    const members = await prisma.user.findMany({
      where: { role: "member", active: true },
      select: { email: true, name: true },
    });
    const recipients = members.filter(
      (member: { email: string }) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)
    );
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    const localDateMatch = event.date.match(
      /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/
    );
    const date = new Date(event.date);
    const formattedDate = localDateMatch
      ? `${localDateMatch[3]}/${localDateMatch[2]}/${localDateMatch[1]} às ${localDateMatch[4]}:${localDateMatch[5]}`
      : Number.isNaN(date.getTime())
        ? event.date
        : new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "long",
            timeStyle: "short",
            timeZone: "America/Fortaleza",
          }).format(date);
    const safeTitle = escapeHtml(event.title);
    const safeType = escapeHtml(event.type);
    const safeDate = escapeHtml(formattedDate);
    const safeLocation = escapeHtml(event.location);
    const safeDescription = escapeHtml(event.description).replace(/\r?\n/g, "<br>");
    let sent = 0;

    for (let index = 0; index < recipients.length; index += 5) {
      const batch = recipients.slice(index, index + 5);
      const results = await Promise.allSettled(
        batch.map((recipient: EventEmailRecipient) =>
          transporter.sendMail({
            from,
            to: recipient.email,
            subject: `Novo ${event.type}: ${event.title}`,
            text: [
              `Olá, ${recipient.name}!`,
              "",
              `Um novo ${event.type} foi cadastrado para o Biker Girls 85: ${event.title}.`,
              `Data: ${formattedDate}`,
              event.location ? `Local: ${event.location}` : "",
              event.description ? `Descrição: ${event.description}` : "",
            ].filter(Boolean).join("\n"),
            html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#242424"><h2>Novo ${safeType}: ${safeTitle}</h2><p>Olá, ${escapeHtml(recipient.name)}! Um novo evento foi cadastrado para o Biker Girls 85.</p><p><strong>Data:</strong> ${safeDate}</p>${safeLocation ? `<p><strong>Local:</strong> ${safeLocation}</p>` : ""}${safeDescription ? `<p><strong>Descrição:</strong><br>${safeDescription}</p>` : ""}<p>Esperamos você!</p></div>`,
          })
        )
      );
      sent += results.filter((result) => result.status === "fulfilled").length;
      results.forEach((result) => {
        if (result.status === "rejected") {
          console.error(
            `[Email] Falha ao notificar um membro sobre o evento "${event.title}":`,
            result.reason
          );
        }
      });
    }

    const failed = recipients.length - sent;
    return {
      status: failed === 0 ? "sent" : sent === 0 ? "failed" : "partial",
      total: recipients.length,
      sent,
      failed,
    };
  } catch (error) {
    console.error("[Email] Erro ao enviar notificações do novo evento:", error);
    return { status: "failed", total: 0, sent: 0, failed: 0 };
  }
};

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);


app.use(
  "/api/settings/hero-image",
  express.json({ limit: "12mb" })
);
app.use(express.json({ limit: "12mb" }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(
    `[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`
  );
  next();
});

app.get("/", (_req: Request, res: Response) => {
  return res.json({
    message: "API Node.js + Prisma online",
  });
});

app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Falha ao verificar conexão com MySQL:", error);

    return res.status(503).json({
      status: "error",
      database: "disconnected",
    });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({
      message: "E-mail e senha são obrigatórios.",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: "E-mail ou senha inválidos.",
      });
    }

    if (!user.active) {
      return res.status(403).json({
        message: "Conta desativada.",
      });
    }

    let passwordValid = false;

    if (user.passwordHash.startsWith("$2")) {
      passwordValid = await bcrypt.compare(
        password,
        user.passwordHash
      );
    } else if (user.passwordHash === password) {
      passwordValid = true;
      const newHash = await bcrypt.hash(password, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
    }

    if (!passwordValid) {
      return res.status(401).json({
        message: "E-mail ou senha inválidos.",
      });
    }

    const { passwordHash, ...userWithoutPassword } = user;

    return res.json({
      user: userWithoutPassword,
      token: `token-jwt-${user.id}`,
    });
  } catch (error) {
    console.error("[Login] Erro ao autenticar:", error);

    return res.status(500).json({
      message: "Erro interno no servidor ao realizar login.",
    });
  }
});

app.post("/api/auth/logout", (_req: Request, res: Response) => {
  return res.json({
    message: "Sessão encerrada.",
  });
});

app.get("/api/auth/me", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.json(null);
  }

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
  } catch (error) {
    console.error("[Auth] Erro ao consultar usuário:", error);
    return res.json(null);
  }
});

app.get("/api/settings/hero-image", async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.clubSettings.findUnique({
      where: { id: "club" },
      select: { heroImage: true },
    });

    return res.json({ hero_image: settings?.heroImage ?? null });
  } catch (error) {
    console.error("[Settings] Erro ao buscar imagem de fundo:", error);

    return res.status(500).json({
      message: "Não foi possível carregar a imagem de fundo.",
    });
  }
});

app.put("/api/settings/hero-image", requireAdmin, async (req: Request, res: Response) => {
  const heroImage = req.body?.hero_image;

  if (typeof heroImage !== "string" || heroImage.length === 0) {
    return res.status(400).json({
      message: "Informe uma URL ou imagem válida para o fundo.",
    });
  }

  if (heroImage.length > 5_000_000) {
    return res.status(413).json({
      message: "A imagem de fundo excede o tamanho permitido.",
    });
  }

  const isImageDataUrl =
    /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(
      heroImage
    );
  let isHttpUrl = false;

  try {
    const url = new URL(heroImage);
    isHttpUrl = url.protocol === "http:" || url.protocol === "https:";
  } catch {
    isHttpUrl = false;
  }

  if (!isImageDataUrl && !isHttpUrl) {
    return res.status(400).json({
      message: "Use uma URL HTTP(S) ou envie um arquivo de imagem.",
    });
  }

  try {
    const settings = await prisma.clubSettings.upsert({
      where: { id: "club" },
      update: { heroImage },
      create: {
        heroImage,
        heroSubtitle:
          "Um moto grupo feito de irmandade, liberdade e quilômetros compartilhados.",
        aboutText:
          "Somos um motogrupo feminino movido pela paixão por motos, pela liberdade e pela força da união.\n\nMais do que rolês, construímos amizades, compartilhamos experiências e vivemos histórias incríveis sobre duas rodas.\n\nAqui, cada encontro vira uma lembrança e cada quilômetro fortalece nossa irmandade.\n\n**Não é só sobre motos. É sobre tudo que vivemos juntas!**",
        logoUrl: "/logo.png",
      },
      select: { heroImage: true },
    });

    return res.json({ hero_image: settings.heroImage });
  } catch (error) {
    console.error("[Settings] Erro ao salvar imagem de fundo:", error);

    return res.status(500).json({
      message: "Não foi possível salvar a imagem de fundo.",
    });
  }
});

app.get("/api/settings/gallery", async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.clubSettings.findUnique({
      where: { id: "club" },
      select: { gallery: true },
    });

    return res.json({
      gallery: Array.isArray(settings?.gallery) ? settings.gallery : null,
    });
  } catch (error) {
    console.error("[Settings] Erro ao carregar histórias do club:", error);

    return res.status(500).json({
      message: "Não foi possível carregar a galeria do club.",
    });
  }
});

app.put("/api/settings/gallery", requireAdmin, async (req: Request, res: Response) => {
  const gallery = req.body?.gallery;

  if (
    !Array.isArray(gallery) ||
    gallery.length > 20 ||
    gallery.some(
      (item: any) =>
        typeof item !== "string" ||
        item.trim().length === 0 ||
        item.trim().length > 2048
    )
  ) {
    return res.status(400).json({
      message: "Informe até 20 URLs válidas de fotos ou vídeos.",
    });
  }

  const mediaUrls = gallery.map((item: string) => item.trim());
  const validMediaUrls = mediaUrls.every((item: string) => {
    if (/^\/(?!\/)/.test(item)) return true;

    try {
      const url = new URL(item);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  });

  if (!validMediaUrls) {
    return res.status(400).json({
      message: "Use URLs HTTP(S) ou caminhos locais válidos para as mídias.",
    });
  }

  try {
    const settings = await prisma.clubSettings.upsert({
      where: { id: "club" },
      update: { gallery: mediaUrls },
      create: {
        gallery: mediaUrls,
        heroImage:
          "https://images.unsplash.com/photo-1681335056244-9dd3d5de8b60?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
        heroSubtitle:
          "Um moto grupo feito de irmandade, liberdade e quilômetros compartilhados.",
        aboutText:
          "Somos um motogrupo feminino movido pela paixão por motos, pela liberdade e pela força da união.\n\nMais do que rolês, construímos amizades, compartilhamos experiências e vivemos histórias incríveis sobre duas rodas.\n\nAqui, cada encontro vira uma lembrança e cada quilômetro fortalece nossa irmandade.\n\n**Não é só sobre motos. É sobre tudo que vivemos juntas!**",
        logoUrl: "/logo.png",
      },
      select: { gallery: true },
    });

    return res.json({
      gallery: Array.isArray(settings.gallery) ? settings.gallery : [],
    });
  } catch (error) {
    console.error("[Settings] Erro ao salvar histórias do club:", error);

    return res.status(500).json({
      message: "Não foi possível salvar a galeria do club.",
    });
  }
});

const defaultClubSettings = {
  id: "club",
  clubName: "Biker Girls 85",
  tagline: "Moto Grupo",
  heroTitle: "Mulheres, motores e estrada",
  heroSubtitle: "Um moto grupo feito de irmandade, liberdade e quilômetros compartilhados.",
  aboutText:
    "Somos um motogrupo feminino movido pela paixão por motos, pela liberdade e pela força da união.\n\nMais do que rolês, construímos amizades, compartilhamos experiências e vivemos histórias incríveis sobre duas rodas.\n\nAqui, cada encontro vira uma lembrança e cada quilômetro fortalece nossa irmandade.\n\n**Não é só sobre motos. É sobre tudo que vivemos juntas!**",
  logoUrl: "/logo.png",
  heroImage:
    "https://images.unsplash.com/photo-1681335056244-9dd3d5de8b60?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
  primaryColor: "#e85a9b",
  accentColor: "#ff2a85",
  monthlyFee: 30,
  city: "Fortaleza - CE",
  contactEmail: "[contato@seuclub.com]",
  contactPhone: "85999588651",
  instagram: "",
  whatsapp: "",
  gallery: [
    "/gallery/foto1.png",
    "/gallery/foto2.png",
    "/gallery/foto3.png",
    "/gallery/foto4.png",
  ],
};

const settingsToResponse = (settings: typeof defaultClubSettings | {
  id: string;
  clubName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  logoUrl: string;
  heroImage: string;
  primaryColor: string;
  accentColor: string;
  monthlyFee: { toString(): string } | number;
  city: string;
  foundedYear?: string;
  contactEmail: string;
  contactPhone: string;
  instagram: string;
  whatsapp: string;
  gallery: unknown;
}) => ({
  club_name: settings.clubName,
  tagline: settings.tagline,
  hero_title: settings.heroTitle,
  hero_subtitle: settings.heroSubtitle,
  about_text: settings.aboutText,
  logo_url: settings.logoUrl,
  hero_image: settings.heroImage,
  primary_color: settings.primaryColor,
  accent_color: settings.accentColor,
  monthly_fee: Number(settings.monthlyFee),
  city: settings.city,
  contact_email: settings.contactEmail,
  contact_phone: settings.contactPhone,
  instagram: settings.instagram,
  whatsapp: settings.whatsapp,
  gallery: Array.isArray(settings.gallery) ? settings.gallery : [],
});

app.get("/api/settings", async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.clubSettings.findUnique({
      where: { id: "club" },
    });

    return res.json(settingsToResponse(settings ?? defaultClubSettings));
  } catch (error) {
    console.error("[Settings] Erro ao carregar configurações:", error);

    return res.status(500).json({
      message: "Não foi possível carregar as configurações do clube.",
    });
  }
});

app.put("/api/settings", requireAdmin, async (req: Request, res: Response) => {
  const body = req.body ?? {};
  let current: Awaited<ReturnType<typeof prisma.clubSettings.findUnique>> = null;
  try {
    current = await prisma.clubSettings.findUnique({
      where: { id: "club" },
    });
  } catch (error) {
    console.error("[Settings] Erro ao consultar configuração atual:", error);
    return res.status(500).json({
      message: "Não foi possível carregar a configuração atual do clube.",
    });
  }

  const text = (key: string, fallback: string, maxLength: number) => {
    const value = body[key] ?? fallback;
    return typeof value === "string" && value.trim().length <= maxLength
      ? value.trim()
      : null;
  };
  const clubName = text("club_name", current?.clubName ?? defaultClubSettings.clubName, 160);
  const tagline = text("tagline", current?.tagline ?? defaultClubSettings.tagline, 255);
  const heroTitle = text("hero_title", current?.heroTitle ?? defaultClubSettings.heroTitle, 255);
  const heroSubtitle = text("hero_subtitle", current?.heroSubtitle ?? defaultClubSettings.heroSubtitle, 60000);
  const aboutText = text("about_text", current?.aboutText ?? defaultClubSettings.aboutText, 60000);
  const logoUrl = text("logo_url", current?.logoUrl ?? defaultClubSettings.logoUrl, 5_000_000);
  const heroImage = text("hero_image", current?.heroImage ?? defaultClubSettings.heroImage, 5_000_000);
  const primaryColor = text("primary_color", current?.primaryColor ?? defaultClubSettings.primaryColor, 20);
  const accentColor = text("accent_color", current?.accentColor ?? defaultClubSettings.accentColor, 20);
  const city = text("city", current?.city ?? defaultClubSettings.city, 160);
  const contactEmail = text("contact_email", current?.contactEmail ?? defaultClubSettings.contactEmail, 254);
  const contactPhone = text("contact_phone", current?.contactPhone ?? defaultClubSettings.contactPhone, 40);
  const instagram = text("instagram", current?.instagram ?? defaultClubSettings.instagram, 255);
  const whatsapp = text("whatsapp", current?.whatsapp ?? defaultClubSettings.whatsapp, 40);
  const monthlyFee = Number(body.monthly_fee ?? current?.monthlyFee ?? defaultClubSettings.monthlyFee);
  const gallery = body.gallery ?? current?.gallery ?? defaultClubSettings.gallery;
  const validImage = (value: string | null) => Boolean(
    value &&
    (/^\/(?!\/)/.test(value) ||
      /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value) ||
      (() => {
        try {
          return ["http:", "https:"].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      })())
  );
  const validGallery = (value: unknown): value is string =>
    typeof value === "string" &&
    (/^\/(?!\/)/.test(value) ||
      (() => {
        try {
          return ["http:", "https:"].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      })());

  if (
    !clubName || !tagline || !heroTitle ||
    !validImage(logoUrl) || !validImage(heroImage) ||
    !primaryColor || !/^#[0-9a-f]{6}$/i.test(primaryColor) ||
    !accentColor || !/^#[0-9a-f]{6}$/i.test(accentColor) ||
    city === null || contactEmail === null || contactPhone === null ||
    instagram === null || whatsapp === null ||
    !Number.isFinite(monthlyFee) || monthlyFee < 0 ||
    !Array.isArray(gallery) || gallery.length > 20 ||
    gallery.some((item: any) => !validGallery(item) || item.trim().length > 2048)
  ) {
    return res.status(400).json({
      message: "Revise os dados de personalização e tente novamente.",
    });
  }

  if (
    heroSubtitle === null || aboutText === null ||
    logoUrl === null || heroImage === null
  ) {
    return res.status(400).json({
      message: "Revise os dados de personalização e tente novamente.",
    });
  }

  try {
    const settings = await prisma.clubSettings.upsert({
      where: { id: "club" },
      update: {
        clubName, tagline, heroTitle, heroSubtitle, aboutText, logoUrl, heroImage,
        primaryColor, accentColor, monthlyFee, city, contactEmail, contactPhone,
        instagram, whatsapp, gallery: gallery.map((item: any) => item.trim()),
      },
      create: {
        ...defaultClubSettings,
        clubName, tagline, heroTitle, heroSubtitle, aboutText, logoUrl, heroImage,
        primaryColor, accentColor, monthlyFee, city, contactEmail, contactPhone,
        instagram, whatsapp, gallery: gallery.map((item: any) => item.trim()),
      },
    });

    return res.json(settingsToResponse(settings));
  } catch (error) {
    console.error("[Settings] Erro ao salvar configurações:", error);

    return res.status(500).json({
      message: "Não foi possível salvar as configurações do clube.",
    });
  }
});

app.get("/api/public/stats", async (_req: Request, res: Response) => {
  try {
    const membersCount = await prisma.user.count({
      where: { active: true },
    });

    return res.json({
      members: membersCount,
      events: 0,
      rides: 0,
    });
  } catch (error) {
    console.error("[Stats] Erro:", error);

    return res.json({
      members: 0,
      events: 0,
      rides: 0,
    });
  }
});

const getUsersHandler = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
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

    return res.json(users.map(memberFields));
  } catch (error) {
    console.error("[Users] Erro ao buscar membros:", error);

    return res.status(500).json({
      message: "Erro ao buscar membros.",
    });
  }
};

app.get("/api/users", getUsersHandler);
app.get("/api/members", getUsersHandler);

const memberFields = (member: {
  id: string;
  name: string;
  email: string;
  role: string;
  nickname: string;
  phone: string;
  motorcycle: string;
  bloodType: string;
  birthDate: string;
  active: boolean;
  joinedAt: Date;
}) => ({
  id: member.id,
  name: member.name,
  email: member.email,
  role: member.role,
  nickname: member.nickname,
  phone: member.phone,
  motorcycle: member.motorcycle,
  blood_type: member.bloodType,
  birth_date: member.birthDate,
  active: member.active,
  joined_at: member.joinedAt,
});

const readMemberInput = (body: Record<string, unknown>) => {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body.role;
  const active = body.active;

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Informe um nome e um e-mail válido." } as const;
  }
  if (role !== "member" && role !== "admin") {
    return { error: "Selecione um perfil de acesso válido." } as const;
  }
  if (typeof active !== "boolean") {
    return { error: "Informe se a conta está ativa." } as const;
  }

  const optionalString = (snake: string, camel = snake) => {
    const value = body[snake] ?? body[camel];
    return typeof value === "string" ? value.trim() : "";
  };

  return {
    data: {
      name,
      email,
      role,
      active,
      nickname: optionalString("nickname"),
      phone: optionalString("phone"),
      motorcycle: optionalString("motorcycle"),
      bloodType: optionalString("blood_type", "bloodType"),
      birthDate: optionalString("birth_date", "birthDate"),
    },
  } as const;
};

app.post("/api/members", requireAdmin, async (req: Request, res: Response) => {
  const parsed = readMemberInput(req.body ?? {});
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";

  if ("error" in parsed) {
    return res.status(400).json({ message: parsed.error });
  }
  if (password.length < 8) {
    return res.status(400).json({
      message: "A senha deve ter pelo menos 8 caracteres.",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const member = await prisma.user.create({
      data: { ...parsed.data, passwordHash },
    });

    return res.status(201).json(memberFields(member));
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return res.status(409).json({
        message: "Já existe um membro cadastrado com este e-mail.",
      });
    }

    console.error("[Members] Erro ao cadastrar membro:", error);
    return res.status(500).json({ message: "Não foi possível cadastrar o membro." });
  }
});

app.put(
  "/api/members/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const parsed = readMemberInput(req.body ?? {});
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if ("error" in parsed) {
      return res.status(400).json({ message: parsed.error });
    }
    if (password && password.length < 8) {
      return res.status(400).json({
        message: "A nova senha deve ter pelo menos 8 caracteres.",
      });
    }

    try {
      const member = await prisma.user.update({
        where: { id },
        data: {
          ...parsed.data,
          ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
        },
      });

      return res.json(memberFields(member));
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error) {
        if (error.code === "P2025") {
          return res.status(404).json({ message: "Membro não encontrado." });
        }
        if (error.code === "P2002") {
          return res.status(409).json({
            message: "Já existe um membro cadastrado com este e-mail.",
          });
        }
      }

      console.error("[Members] Erro ao atualizar membro:", error);
      return res.status(500).json({ message: "Não foi possível atualizar o membro." });
    }
  }
);

app.delete(
  "/api/members/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    const id = String(req.params.id);

    try {
      await prisma.user.delete({ where: { id } });
      return res.status(204).end();
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
        return res.status(404).json({ message: "Membro não encontrado." });
      }

      console.error("[Members] Erro ao excluir membro:", error);
      return res.status(500).json({ message: "Não foi possível excluir o membro." });
    }
  }
);

const isMembershipMonthEligible = (
  joinedAt: Date,
  year: number,
  month: number
) => {
  const joinedYear = joinedAt.getFullYear();
  const joinedMonth = joinedAt.getMonth() + 1;

  return year > joinedYear || (year === joinedYear && month >= joinedMonth);
};

app.get("/api/admin/overview", async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const [activeMembers, payments] = await Promise.all([
      prisma.user.findMany({
        where: { active: true },
        select: { joinedAt: true },
      }),
      prisma.payment.findMany({
        where: { year, paid: true },
        select: {
          month: true,
          amount: true,
          user: {
            select: {
              active: true,
              joinedAt: true,
            },
          },
        },
      }),
    ]);

    const eligiblePayments = (payments as OverviewPayment[]).filter(
      (payment: OverviewPayment) =>
        isMembershipMonthEligible(payment.user.joinedAt, year, payment.month)
    );
    const monthlyPayments = eligiblePayments.filter(
      (payment: OverviewPayment) => payment.month === month
    );
    const paidThisMonth = monthlyPayments.filter(
      (payment: OverviewPayment) => payment.user.active
    ).length;
    const eligibleMembers = (activeMembers as ActiveMemberSummary[]).filter(
      ({ joinedAt }: ActiveMemberSummary) =>
        isMembershipMonthEligible(joinedAt, year, month)
    ).length;
    const revenue_year = eligiblePayments.reduce(
      (total: number, payment: OverviewPayment) =>
        total + Number(payment.amount),
      0
    );
    const revenue_month = monthlyPayments.reduce(
      (total: number, payment: OverviewPayment) =>
        total + Number(payment.amount),
      0
    );

    return res.json({
      active_members: activeMembers.length,
      paid_this_month: paidThisMonth,
      month,
      unpaid_this_month: Math.max(0, eligibleMembers - paidThisMonth),
      year,
      revenue_year,
      revenue_month,
      upcoming: [],
    });
  } catch (error) {
    console.error("[Admin] Erro em overview:", error);

    return res.status(500).json({
      message: "Não foi possível carregar a visão geral do administrador.",
    });
  }
});

const getDuesHandler = async (req: Request, res: Response) => {
  const year = Number(req.query.year);

  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    return res.status(400).json({
      message: "Informe um ano válido para consultar as mensalidades.",
    });
  }

  try {
    const members = await prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        joinedAt: true,
        payments: {
          where: { year, paid: true },
          select: { month: true, amount: true },
        },
      },
    });

    return res.json({
      rows: (members as DuesMember[]).map(
        ({ payments, joinedAt, ...member }) => ({
          ...member,
          joined_year: joinedAt.getFullYear(),
          joined_month: joinedAt.getMonth() + 1,
          months: Object.fromEntries(
            payments
              .filter((payment: DuesPayment) =>
                isMembershipMonthEligible(joinedAt, year, payment.month)
              )
              .map((payment: DuesPayment) => [
                String(payment.month),
                { amount: Number(payment.amount) },
              ])
          ),
        })
      ),
    });
  } catch (error) {
    console.error("[Dues] Erro ao buscar mensalidades:", error);

    return res.status(500).json({
      message: "Não foi possível carregar as mensalidades.",
    });
  }
};

app.get("/api/admin/dues", getDuesHandler);
app.get("/api/dues", getDuesHandler);

app.post("/api/dues/toggle", async (req: Request, res: Response) => {
  const userId =
    typeof req.body?.user_id === "string" ? req.body.user_id.trim() : "";
  const year = Number(req.body?.year);
  const month = Number(req.body?.month);
  const { paid } = req.body ?? {};

  if (
    !userId ||
    !Number.isInteger(year) ||
    year < 1 ||
    year > 9999 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    typeof paid !== "boolean"
  ) {
    return res.status(400).json({
      message: "Informe membro, ano, mês e situação válidos.",
    });
  }

  try {
    const member = await prisma.user.findFirst({
      where: { id: userId, active: true },
      select: { id: true, joinedAt: true },
    });

    if (!member) {
      return res.status(404).json({
        message: "Membro ativo não encontrado.",
      });
    }

    if (!isMembershipMonthEligible(member.joinedAt, year, month)) {
      return res.status(400).json({
        message: "A mensalidade não se aplica aos meses anteriores à entrada do membro.",
      });
    }

    const settings = await prisma.clubSettings.findUnique({
      where: { id: "club" },
      select: { monthlyFee: true },
    });

    const payment = await prisma.payment.upsert({
      where: {
        userId_year_month: { userId, year, month },
      },
      update: {
        paid,
        amount: settings?.monthlyFee ?? 30,
        paidAt: paid ? new Date() : null,
      },
      create: {
        userId,
        year,
        month,
        paid,
        amount: settings?.monthlyFee ?? 30,
        paidAt: paid ? new Date() : null,
      },
    });

    return res.json({
      user_id: payment.userId,
      year: payment.year,
      month: payment.month,
      paid: payment.paid,
      amount: Number(payment.amount),
    });
  } catch (error) {
    console.error("[Dues] Erro ao atualizar mensalidade:", error);

    return res.status(500).json({
      message: "Não foi possível atualizar a mensalidade.",
    });
  }
});

app.post("/api/applications", async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      whatsapp,
      age,
      height,
      blood_type,
      city,
      profession,
      instagram,
      has_motorcycle,
      motorcycle_model,
      riding_since,
      styles,
      frequency,
      other_group,
      reason,
      commit_events,
      has_cnh_a,
      has_medication_allergy,
      medication_allergy_details,
      emergency_contact_1_name,
      emergency_contact_1_phone,
      emergency_contact_1_relationship,
      emergency_contact_2_name,
      emergency_contact_2_phone,
      emergency_contact_2_relationship,
    } = req.body;

    if (
      !name ||
      !email ||
      !whatsapp ||
      !city ||
      !reason ||
      !emergency_contact_1_name ||
      !emergency_contact_1_phone ||
      !emergency_contact_1_relationship ||
      !emergency_contact_2_name ||
      !emergency_contact_2_phone ||
      !emergency_contact_2_relationship
    ) {
      return res.status(400).json({
        message: "Preencha todos os campos obrigatórios.",
      });
    }

    const parsedAge =
      age === "" || age === null || age === undefined
        ? null
        : Number(age);

    if (
      parsedAge !== null &&
      (!Number.isInteger(parsedAge) || parsedAge <= 0)
    ) {
      return res.status(400).json({
        message: "A idade informada é inválida.",
      });
    }

    const application = await prisma.application.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        whatsapp: String(whatsapp),
        age: parsedAge,
        height: height || "",
        bloodType: blood_type || "",
        city: String(city).trim(),
        profession: profession || "",
        instagram: instagram || "",
        hasMotorcycle: has_motorcycle === true,
        motorcycleModel: motorcycle_model || "",
        ridingSince: riding_since || "",
        styles: Array.isArray(styles) ? styles : [],
        frequency: frequency || "",
        otherGroup: other_group === true,
        reason: String(reason),
        commitEvents: commit_events === true,
        hasCnhA: has_cnh_a === true,
        hasMedicationAllergy: has_medication_allergy === true,
        medicationAllergyDetails: medication_allergy_details || "",
        emergencyContact1Name: emergency_contact_1_name,
        emergencyContact1Phone: emergency_contact_1_phone,
        emergencyContact1Relationship: emergency_contact_1_relationship,
        emergencyContact2Name: emergency_contact_2_name,
        emergencyContact2Phone: emergency_contact_2_phone,
        emergencyContact2Relationship: emergency_contact_2_relationship,
        status: "pending",
        note: "",
      },
    });

    return res.status(201).json({
      message: "Inscrição enviada com sucesso!",
      application,
    });
  } catch (error) {
    console.error("[Inscrição] Erro ao cadastrar:", error);

    return res.status(500).json({
      message: "Não foi possível cadastrar a inscrição.",
    });
  }
});

app.get("/api/applications", async (_req: Request, res: Response) => {
  try {
    const applications = await prisma.application.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(applications);
  } catch (error) {
    console.error("[Inscrição] Erro ao listar:", error);

    return res.status(500).json({
      message: "Erro ao buscar inscrições.",
    });
  }
});

app.get(
  "/api/admin/applications",
  async (_req: Request, res: Response) => {
    try {
      const applications = await prisma.application.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json(applications);
    } catch (error) {
      console.error("[Admin] Erro ao buscar inscrições:", error);

      return res.status(500).json({
        message: "Erro ao carregar inscrições administrativas.",
      });
    }
  }
);

app.post(
  "/api/applications/:id/approve",
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);

      const application = await prisma.application.findUnique({
        where: { id },
      });

      if (!application) {
        return res.status(404).json({
          message: "Inscrição não encontrada.",
        });
      }

      if (application.status !== "pending") {
        return res.status(400).json({
          message: "Esta inscrição já foi analisada.",
        });
      }

      const email = application.email.trim().toLowerCase();

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          message:
            "Já existe uma conta cadastrada com o e-mail desta inscrição.",
        });
      }

      const tempPassword = randomBytes(9).toString("base64url");
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const user = await tx.user.create({
          data: {
            name: application.name,
            email,
            passwordHash,
            role: "member",
            nickname: application.name,
            phone: application.whatsapp,
            motorcycle: application.motorcycleModel,
            bloodType: application.bloodType,
            active: true,
          },
        });

        const updatedCount = await tx.application.updateMany({
          where: {
            id,
            status: "pending",
          },
          data: {
            status: "approved",
            userId: user.id,
            reviewedAt: new Date(),
            reviewedBy: "Administrador",
          },
        });

        if (updatedCount.count !== 1) {
          throw new Error(
            "A inscrição foi alterada por outra operação. A aprovação foi cancelada."
          );
        }

        return user;
      });

      return res.status(200).json({
        message: "Inscrição aprovada e conta criada com sucesso.",
        email: result.email,
        temp_password: tempPassword,
      });
    } catch (error: any) {
      console.error("[Admin] Erro ao aprovar inscrição:", error);

      if (error?.code === "P2002") {
        return res.status(409).json({
          message:
            "Já existe uma conta com esse e-mail. Verifique os usuários cadastrados.",
        });
      }

      return res.status(500).json({
        message:
          error?.message ||
          "Erro ao aprovar inscrição e criar conta.",
      });
    }
  }
);

app.post(
  "/api/applications/:id/reject",
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const { note } = req.body;

      const application = await prisma.application.findUnique({
        where: { id },
      });

      if (!application) {
        return res.status(404).json({
          message: "Inscrição não encontrada.",
        });
      }

      if (application.status !== "pending") {
        return res.status(400).json({
          message: "Esta inscrição já foi analisada.",
        });
      }

      const updated = await prisma.application.updateMany({
        where: {
          id,
          status: "pending",
        },
        data: {
          status: "rejected",
          note: note || "",
          reviewedAt: new Date(),
          reviewedBy: "Administrador",
        },
      });

      if (updated.count !== 1) {
        return res.status(409).json({
          message: "A inscrição já foi alterada.",
        });
      }

      return res.json({
        message: "Inscrição recusada.",
      });
    } catch (error) {
      console.error("[Admin] Erro ao recusar inscrição:", error);

      return res.status(500).json({
        message: "Erro ao recusar inscrição.",
      });
    }
  }
);

app.delete(
  "/api/applications/:id",
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);

      const application = await prisma.application.findUnique({
        where: { id },
      });

      if (!application) {
        return res.status(404).json({
          message: "Inscrição não encontrada.",
        });
      }

      if (application.status === "approved") {
        return res.status(409).json({
          message:
            "Não é possível excluir uma inscrição aprovada. A conta de membro já foi criada.",
        });
      }

      await prisma.application.delete({
        where: { id },
      });

      return res.json({
        message: "Inscrição excluída com sucesso.",
      });
    } catch (error) {
      console.error("[Admin] Erro ao excluir inscrição:", error);

      return res.status(500).json({
        message: "Erro ao excluir inscrição.",
      });
    }
  }
);

const eventToResponse = (event: {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  description: string;
  imageUrl: string;
  createdBy: string;
  rsvps: {
    userId: string;
    user: { name: string; nickname: string; email: string };
  }[];
}, userId: string | null) => ({
  id: event.id,
  title: event.title,
  type: event.type,
  date: event.date,
  location: event.location,
  description: event.description,
  image_url: event.imageUrl,
  created_by: event.createdBy,
  rsvps: event.rsvps.map(({ userId: rsvpUserId }: { userId: string }) => rsvpUserId),
  attendees: event.rsvps.map(({ userId: rsvpUserId, user }: { userId: string; user: { name: string; nickname: string; email: string } }) => ({
    id: rsvpUserId,
    name: user.nickname || user.name,
    email: user.email,
  })),
  rsvp_count: event.rsvps.length,
  going: Boolean(userId && event.rsvps.some(({ userId: rsvpUserId }: { userId: string }) => rsvpUserId === userId)),
});

const getEvents = async (req: Request, res: Response) => {
  try {
    const userId = await getActiveUserId(req.headers.authorization);
    const events = await prisma.event.findMany({
      include: {
        rsvps: {
          select: {
            userId: true,
            user: { select: { name: true, nickname: true, email: true } },
          },
        },
      },
      orderBy: [{ date: "asc" }, { createdAt: "desc" }],
    });

    return res.json(events.map((event: any) => eventToResponse(event, userId)));
  } catch (error) {
    console.error("[Events] Erro ao carregar eventos:", error);

    return res.status(500).json({ message: "Não foi possível carregar os eventos." });
  }
};

app.get("/api/admin/events", requireAdmin, getEvents);
app.get("/api/events", getEvents);

app.post("/api/events", requireAdmin, async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const type = typeof body.type === "string" ? body.type : "";
  const date = typeof body.date === "string" ? body.date.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const imageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";
  const dateValue = new Date(date);
  const validImage = !imageUrl || /^\/(?!\/)/.test(imageUrl) ||
    /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(imageUrl) ||
    (() => {
      try {
        return ["http:", "https:"].includes(new URL(imageUrl).protocol);
      } catch {
        return false;
      }
    })();

  if (
    !title || title.length > 255 || !["evento", "encontro"].includes(type) ||
    !date || Number.isNaN(dateValue.getTime()) || date.length > 30 ||
    location.length > 255 || description.length > 60000 ||
    imageUrl.length > 5_000_000 || !validImage
  ) {
    return res.status(400).json({ message: "Revise os dados do evento e tente novamente." });
  }

  try {
    const userId = getAuthenticatedUserId(req.headers.authorization);
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    const event = await prisma.event.create({
      data: {
        title, type, date, location, description, imageUrl,
        createdBy: admin?.name ?? "Administrador",
      },
      include: {
        rsvps: {
          select: {
            userId: true,
            user: { select: { name: true, nickname: true, email: true } },
          },
        },
      },
    });
    const emailNotifications = await notifyMembersOfNewEvent(event);

    return res.status(201).json({
      ...eventToResponse(event, userId),
      email_notifications: emailNotifications,
    });
  } catch (error) {
    console.error("[Events] Erro ao criar evento:", error);

    return res.status(500).json({ message: "Não foi possível criar o evento." });
  }
});

app.put("/api/events/:id", requireAdmin, async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const id = String(req.params.id);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const type = typeof body.type === "string" ? body.type : "";
  const date = typeof body.date === "string" ? body.date.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const imageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";
  const validImage = !imageUrl || /^\/(?!\/)/.test(imageUrl) ||
    /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(imageUrl) ||
    (() => {
      try {
        return ["http:", "https:"].includes(new URL(imageUrl).protocol);
      } catch {
        return false;
      }
    })();

  if (
    !title || title.length > 255 || !["evento", "encontro"].includes(type) ||
    !date || Number.isNaN(new Date(date).getTime()) || date.length > 30 ||
    location.length > 255 || description.length > 60000 ||
    imageUrl.length > 5_000_000 || !validImage
  ) {
    return res.status(400).json({ message: "Revise os dados do evento e tente novamente." });
  }

  try {
    const event = await prisma.event.update({
      where: { id },
      data: { title, type, date, location, description, imageUrl },
      include: {
        rsvps: {
          select: {
            userId: true,
            user: { select: { name: true, nickname: true, email: true } },
          },
        },
      },
    });

    return res.json(eventToResponse(event, getAuthenticatedUserId(req.headers.authorization)));
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return res.status(404).json({ message: "Evento não encontrado." });
    }

    console.error("[Events] Erro ao atualizar evento:", error);
    return res.status(500).json({ message: "Não foi possível atualizar o evento." });
  }
});

app.delete("/api/events/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.event.delete({ where: { id: String(req.params.id) } });
    return res.json({ message: "Evento excluído com sucesso." });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return res.status(404).json({ message: "Evento não encontrado." });
    }

    console.error("[Events] Erro ao excluir evento:", error);
    return res.status(500).json({ message: "Não foi possível excluir o evento." });
  }
});

app.post("/api/events/:id/rsvp", async (req: Request, res: Response) => {
  try {
    const userId = await getActiveUserId(req.headers.authorization);
    if (!userId) {
      return res.status(401).json({ message: "Entre na sua conta para confirmar presença." });
    }

    const eventId = String(req.params.id);
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) return res.status(404).json({ message: "Evento não encontrado." });

    const existing = await prisma.eventRsvp.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing) {
      await prisma.eventRsvp.delete({ where: { eventId_userId: { eventId, userId } } });
      return res.json({ going: false });
    }

    await prisma.eventRsvp.create({ data: { eventId, userId } });
    return res.json({ going: true });
  } catch (error) {
    console.error("[Events] Erro ao atualizar confirmação:", error);
    return res.status(500).json({ message: "Não foi possível confirmar presença." });
  }
});

const productToResponse = (product: {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: { toString(): string } | number;
  sizes: unknown;
  deadline: string;
  active: boolean;
  createdAt: Date;
  orders?: { id: string; want: boolean; size: string; quantity: number }[];
}) => ({
  id: product.id,
  name: product.name,
  description: product.description,
  image_url: product.imageUrl,
  price: Number(product.price),
  sizes: Array.isArray(product.sizes) ? product.sizes : [],
  deadline: product.deadline,
  active: product.active,
  created_at: product.createdAt,
  my_response: product.orders?.[0] ?? null,
});

const getProducts = async (req: Request, res: Response, includeInactive = false) => {
  try {
    const userId = await getActiveUserId(req.headers.authorization);
    const currentUser = userId
      ? await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
      : null;
    const isAdmin = currentUser?.role === "admin";
    const products = await prisma.product.findMany({
      where: includeInactive || isAdmin ? undefined : { active: true },
      include: {
        orders: {
          where: { userId: userId ?? "__none__" },
          select: { id: true, want: true, size: true, quantity: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(products.map((product: any) => productToResponse(product)));
  } catch (error) {
    console.error("[Products] Erro ao carregar produtos:", error);
    return res.status(500).json({ message: "Não foi possível carregar os produtos." });
  }
};

app.get("/api/admin/products", requireAdmin, (req: Request, res: Response) => getProducts(req, res, true));
app.get("/api/products", (req: Request, res: Response) => getProducts(req, res));

const productFields = (body: Record<string, unknown>) => {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const imageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";
  const price = Number(body.price ?? 0);
  const sizes = body.sizes;
  const deadline = typeof body.deadline === "string" ? body.deadline.trim() : "";
  const active = body.active === undefined ? true : body.active;
  const validImage = !imageUrl || /^\/(?!\/)/.test(imageUrl) ||
    /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(imageUrl) ||
    (() => {
      try {
        return ["http:", "https:"].includes(new URL(imageUrl).protocol);
      } catch {
        return false;
      }
    })();

  if (
    !name || name.length > 120 || description.length > 60000 ||
    imageUrl.length > 5_000_000 || !validImage ||
    !Number.isFinite(price) || price < 0 || price > 99_999_999 ||
    !Array.isArray(sizes) || sizes.length > 30 ||
    sizes.some((size: any) => typeof size !== "string" || !size.trim() || size.trim().length > 40) ||
    new Set(sizes.map((size: any) => typeof size === "string" ? size.trim().toLowerCase() : "")).size !== sizes.length ||
    (deadline !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) ||
    typeof active !== "boolean"
  ) {
    return null;
  }

  return {
    name, description, imageUrl, price,
    sizes: sizes.map((size: string) => size.trim()),
    deadline, active,
  };
};

app.post("/api/products", requireAdmin, async (req: Request, res: Response) => {
  const data = productFields(req.body ?? {});
  if (!data) return res.status(400).json({ message: "Revise os dados do produto e tente novamente." });

  try {
    const product = await prisma.product.create({
      data,
      include: { orders: { where: { userId: "__none__" }, select: { id: true, want: true, size: true, quantity: true } } },
    });
    return res.status(201).json(productToResponse(product));
  } catch (error) {
    console.error("[Products] Erro ao criar produto:", error);
    return res.status(500).json({ message: "Não foi possível criar o produto." });
  }
});

app.put("/api/products/:id", requireAdmin, async (req: Request, res: Response) => {
  const data = productFields(req.body ?? {});
  if (!data) return res.status(400).json({ message: "Revise os dados do produto e tente novamente." });

  try {
    const product = await prisma.product.update({
      where: { id: String(req.params.id) },
      data,
      include: { orders: { where: { userId: "__none__" }, select: { id: true, want: true, size: true, quantity: true } } },
    });
    return res.json(productToResponse(product));
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return res.status(404).json({ message: "Produto não encontrado." });
    }
    console.error("[Products] Erro ao atualizar produto:", error);
    return res.status(500).json({ message: "Não foi possível atualizar o produto." });
  }
});

app.delete("/api/products/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.product.delete({ where: { id: String(req.params.id) } });
    return res.json({ message: "Produto excluído com sucesso." });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return res.status(404).json({ message: "Produto não encontrado." });
    }
    console.error("[Products] Erro ao excluir produto:", error);
    return res.status(500).json({ message: "Não foi possível excluir o produto." });
  }
});

app.post("/api/products/:id/response", async (req: Request, res: Response) => {
  const want = req.body?.want;
  const size = typeof req.body?.size === "string" ? req.body.size.trim() : "";
  const quantity = req.body?.quantity;
  if (
    typeof want !== "boolean" ||
    (want && (!Number.isInteger(quantity) || quantity < 1 || quantity > 50)) ||
    (!want && (quantity !== 0 || size !== ""))
  ) {
    return res.status(400).json({ message: "Informe uma resposta válida para o produto." });
  }

  try {
    const userId = await getActiveUserId(req.headers.authorization);
    if (!userId) return res.status(401).json({ message: "Entre na sua conta para responder." });

    const productId = String(req.params.id);
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.active) {
      return res.status(404).json({ message: "Produto não encontrado ou indisponível." });
    }
    if (product.deadline && product.deadline < new Date().toISOString().slice(0, 10)) {
      return res.status(400).json({ message: "O prazo para responder a este produto encerrou." });
    }
    const sizes = Array.isArray(product.sizes)
      ? product.sizes.filter(
          (item: unknown): item is string => typeof item === "string"
        )
      : [];
    if (want && ((sizes.length && !sizes.includes(size)) || (!sizes.length && size))) {
      return res.status(400).json({ message: "Escolha um tamanho válido para o produto." });
    }

    const order = await prisma.productOrder.upsert({
      where: { productId_userId: { productId, userId } },
      update: { want, size: want ? size : "", quantity: want ? quantity : 0 },
      create: { productId, userId, want, size: want ? size : "", quantity: want ? quantity : 0 },
    });
    return res.json({ want: order.want, size: order.size, quantity: order.quantity });
  } catch (error) {
    console.error("[Products] Erro ao registrar resposta:", error);
    return res.status(500).json({ message: "Não foi possível registrar sua resposta." });
  }
});

app.get("/api/products/:id/responses", requireAdmin, async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: String(req.params.id) },
      include: {
        orders: {
          include: { user: { select: { name: true, nickname: true, email: true } } },
          orderBy: { updatedAt: "desc" },
        },
      },
    });
    if (!product) return res.status(404).json({ message: "Produto não encontrado." });

    const items: ProductResponseItem[] = (
      product.orders as ProductOrderForResponse[]
    ).map((order: ProductOrderForResponse) => ({
      name: order.user.nickname || order.user.name,
      email: order.user.email,
      want: order.want,
      size: order.size,
      quantity: order.quantity,
    }));
    const by_size = items.reduce<Record<string, number>>((acc, item) => {
      if (item.want && item.size) {
        acc[item.size] = (acc[item.size] ?? 0) + item.quantity;
      }
      return acc;
    }, {});

    return res.json({
      yes: items.filter((item: ProductResponseItem) => item.want).length,
      no: items.filter((item: ProductResponseItem) => !item.want).length,
      total: items.reduce((sum: number, item: ProductResponseItem) => sum + (item.want ? item.quantity : 0), 0),
      by_size,
      items,
    });
  } catch (error) {
    console.error("[Products] Erro ao carregar respostas:", error);
    return res.status(500).json({ message: "Não foi possível carregar as respostas." });
  }
});

app.use("/api", (_req: Request, res: Response) => {
  return res.status(404).json({
    message: "Endpoint não encontrado.",
  });
});

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================

// Inicia a escuta da porta APENAS quando NÃO estiver rodando no ambiente da Vercel
if (!process.env.VERCEL) {
  const server = app.listen(port, async () => {
    try {
      await prisma.$connect();
      console.log(
        `API online localmente na porta ${port}; conexão MySQL estabelecida.`
      );
    } catch (error) {
      console.error(
        "API online localmente, mas não foi possível conectar ao MySQL na HostGator.",
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
}

export default app;