import { prisma } from './lib/prisma';
async function checkApps() {
  const apps = await prisma.verificationApp.findMany({
    orderBy: { submission_timestamp: 'desc' },
    take: 3,
    include: { receipts: true }
  });
  console.log(JSON.stringify(apps, null, 2));
}
checkApps().catch(console.error).finally(() => prisma.$disconnect());
