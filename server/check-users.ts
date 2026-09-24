import { prisma } from "./lib/prisma";
async function main() {
    const users = await prisma.user.findMany({
        select: { user_id: true, name: true, registrationRole: true, jurisdiction_state: true }
    });
    console.log(users);
}
main().catch(console.error);
