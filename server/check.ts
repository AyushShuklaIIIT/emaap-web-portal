import { prisma } from "./lib/prisma";
import jwt from "jsonwebtoken";

async function main() {
  const allUsers = await prisma.user.findMany({ select: { user_id: true, registrationRole: true, jurisdiction_state: true } });
  const admin = allUsers.find(u => (u.registrationRole as any).includes("STATE"));
  if (!admin) {
      console.log("no state admin in DB", allUsers.slice(0, 5));
      return;
  }
  console.log("Using found admin:", admin);
  const token = jwt.sign({ sub: admin.user_id }, process.env.JWT_SECRET || "2fc0280ebdbb10857ef51a774640108398e09e20ebdd50244439c276332da759");

  const res = await fetch("http://localhost:8008/api/state-admin/pendency?slaStatus=ALL&page=1&limit=20", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  console.log("Response status:", res.status);
  console.log("Response body:", await res.text());
}

main().catch(console.error);
