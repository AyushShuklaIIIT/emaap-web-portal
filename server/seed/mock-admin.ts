import { scryptSync } from "node:crypto";
import { prisma } from "../lib/prisma";

const MOCK_ADMIN_ID = "00000000-0000-4000-8000-000000000001";
const MOCK_ADMIN_PASSWORD = "Admin@2026!";
const passwordHash = `mock-salt:${scryptSync(MOCK_ADMIN_PASSWORD, "mock-salt", 64).toString("hex")}`;

async function seedMockAdmin() {
  const admin = await prisma.user.upsert({
    where: { user_id: MOCK_ADMIN_ID },
    update: {
      name: "eMaap Mock Administrator",
      fullName: "eMaap Mock Administrator",
      email: "mock.admin@emaap.local",
      mobile: "9000000001",
      passwordHash,
      role: "ADMIN",
      jurisdiction_district: "Central",
      jurisdiction_state: "Delhi",
      isActive: true,
      emailVerified: true,
      mobileVerified: true,
    },
    create: {
      user_id: MOCK_ADMIN_ID,
      name: "eMaap Mock Administrator",
      fullName: "eMaap Mock Administrator",
      email: "mock.admin@emaap.local",
      mobile: "9000000001",
      passwordHash,
      role: "ADMIN",
      jurisdiction_district: "Central",
      jurisdiction_state: "Delhi",
      isActive: true,
      emailVerified: true,
      mobileVerified: true,
    },
    select: { user_id: true, email: true, mobile: true },
  });

  console.log(JSON.stringify({ ...admin, password: MOCK_ADMIN_PASSWORD }, null, 2));
}

seedMockAdmin()
  .catch((error) => {
    console.error("Failed to seed mock administrator", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
