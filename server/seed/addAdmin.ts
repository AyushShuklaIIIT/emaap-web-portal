import { prisma } from "../lib/prisma";
import crypto from "node:crypto";

async function addAdmin() {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt("password123", salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey);
    });
  });
  const passwordHash = ${salt}:;

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
      passwordHash: passwordHash,
      emailVerified: true,
      mobileVerified: true,
      isActive: true,
    }
  });

  console.log("Admin created successfully!");
  console.log("User ID:", admin.user_id);
}

addAdmin().catch(console.error).finally(() => prisma.$disconnect());
