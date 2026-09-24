import { prisma } from "./lib/prisma";
async function main() {
    const allReceipts = await prisma.paymentReceipt.findMany({
        where: { payment_status: "SUCCESS" }
    });
    console.log("All receipts:", allReceipts.reduce((a,b) => a + Number(b.total_amount), 0));
    
    const sept5 = new Date("2026-09-05T23:59:59.999Z");
    const filteredReceipts = allReceipts.filter(r => r.transaction_date <= sept5);
    console.log("Up to Sept 5:", filteredReceipts.reduce((a,b) => a + Number(b.total_amount), 0));
}
main().catch(console.error);
