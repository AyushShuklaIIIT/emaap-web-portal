import { prisma } from "../lib/prisma";
import { states } from "./states.js";
import { categories } from "./categories.js";
import { stateFees } from "./feeRules.js";

async function seed() {
  console.log("Begin Seeding States");

  for (const state of states) {
    await prisma.state.upsert({
      where: { state_code: state.state_code },
      update: { state_name: state.state_name },
      create: state,
    });
  }

  console.log("Begin Seeding Categories");

  for (const category of categories) {
    await prisma.instrumentCategory.upsert({
      where: { category_code: category.category_code },
      update: {
        category_name: category.category_name,
        verification_cycle_months: category.verification_cycle_months,
      },
      create: category,
    });
  }

  console.log("Begin Seeding Fee Rules");
  
  await prisma.feeRule.deleteMany();
  for (const feeRuleArray of stateFees) {
    for (const feeRule of feeRuleArray) {
      const state = await prisma.state.findUnique({
        where: { state_code: feeRule.state_code },
      });
      const category = await prisma.instrumentCategory.findUnique({
        where: { category_code: feeRule.category_code },
      });
      if (!state || !category) {
        console.warn("Skipping fee rule due to missing state or category");
        continue;
      }

      await prisma.feeRule.create({
        data: {
          state_id: state.state_id,
          category_id: category.category_id,
          min_value: feeRule.min_value,
          max_value: feeRule.max_value,
          unit: feeRule.unit,
          fee_amount: feeRule.fee_amount,
          fee_basis: feeRule.fee_basis as any,
          condition: feeRule.condition,
          additional_fee: feeRule.additional_fee,
          additional_unit: feeRule.additional_unit,
          maximum_fee: feeRule.maximum_fee,
        },
      });
    }
  }

  console.log("Constant Data Seeding completed");
}

seed()
  .catch((err) => {
    console.log("Seeding failed");
    console.log(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
