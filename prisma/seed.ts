import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

// Creates the admin user (the only user of the system)
async function main() {
  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;

  const passwordHash = await bcrypt.hash(password, 10);

 const admin = await prisma.usuario.upsert({
  where: { email },
  update: { senha_hash: passwordHash },
  create: { nome: "Admin", email, senha_hash: passwordHash, perfil: "admin" },
});

  console.log(`Admin user ready: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());