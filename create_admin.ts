import { prisma } from "./server/lib/prisma.js";

async function addAdmin() {
  const admin = await prisma.user.create({
    data: {
      name: "Directorate Admin Central",
      fullName: "Directorate Admin Central",
      email: "admin.central@emaap.gov.in",
      mobile: "9999999999",
      role: "ADMIN",
      registrationRole: "ADMIN",
      jurisdiction_district: "Central",
      jurisdiction_state: "Central",
      passwordHash: "dummyhash",
      emailVerified: true,
      mobileVerified: true,
      isActive: true,
    }
  });

  console.log("Admin ID:", admin.user_id);
}

addAdmin().catch(console.error).finally(async () => { await prisma.$disconnect(); });
