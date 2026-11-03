import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'guilhermesaldanha@gmsolutionti.com.br' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'guilhermesaldanha@gmsolutionti.com.br',
      passwordHash: 'hhK%9971', // Em produção, utilize bcrypt para gerar o hash real
      role: 'admin', 
    },
  });
  console.log('Administrador criado com sucesso:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });