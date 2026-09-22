import { prisma } from "./lib/prisma.js";

async function runTest() {
  const user = await prisma.user.findUnique({
    where: { user_id: "2cd77b11-4d0c-4880-8a7c-168c74fc64c4" }
  });
  console.log("User:", user ? "Found" : "Not Found");
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
