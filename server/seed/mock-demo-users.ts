import { scryptSync } from "node:crypto";
import { prisma } from "../lib/prisma";

const MOCK_PASSWORD = "Demo@2026!";
const passwordHash = `mock-salt:${scryptSync(MOCK_PASSWORD, "mock-salt", 64).toString("hex")}`;

const users = [
  {
    user_id: "00000000-0000-4000-8000-000000000002",
    name: "eMaap Mock Business",
    email: "mock.business@emaap.local",
    mobile: "9000000002",
    role: "BUSINESS" as const,
    jurisdiction_district: "Central",
    jurisdiction_state: "Delhi",
  },
  {
    user_id: "00000000-0000-4000-8000-000000000003",
    name: "eMaap Mock LMO / GATC",
    email: "mock.gatc@emaap.local",
    mobile: "9000000003",
    role: "GATC_PRINCIPAL" as const,
    jurisdiction_district: "Central",
    jurisdiction_state: "Delhi",
  },
];

async function seedMockDemoUsers() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { user_id: user.user_id },
      update: {
        ...user,
        passwordHash,
        isActive: true,
        emailVerified: true,
        mobileVerified: true,
      },
      create: {
        ...user,
        passwordHash,
        isActive: true,
        emailVerified: true,
        mobileVerified: true,
      },
    });
  }

  console.log(JSON.stringify({
    password: MOCK_PASSWORD,
    users: users.map(({ user_id, email, mobile, role }) => ({ user_id, email, mobile, role })),
  }, null, 2));
}

seedMockDemoUsers()
  .catch((error) => {
    console.error("Failed to seed mock demo users", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
