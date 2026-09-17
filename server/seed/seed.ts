import { prisma } from "../lib/prisma";

import { states } from "./states.js";
import { categories } from "./categories.js";
import { stateFees } from "./feeRules.js";
import { AccuracyClass } from "../generated/prisma/enums.js";
import { adminUsersData, businessUsersData, gatcUsersData } from "./users.js";

async function seed() {
  console.log("Begin Seeding States");

  await prisma.businessProfile.deleteMany();
  await prisma.gatcCentre.deleteMany();
  await prisma.feeRule.deleteMany();
  await prisma.instrumentCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.state.deleteMany();

  for (const state of states) {
    await prisma.state.upsert({
      where: {
        state_code: state.state_code,
      },
      update: {
        state_name: state.state_name,
      },
      create: {
        state_code: state.state_code,
        state_name: state.state_name,
      },
    });
  }

  console.log("Begin Seeding Categories");

  for (const category of categories) {
    await prisma.instrumentCategory.upsert({
      where: {
        category_code: category.category_code,
      },
      update: {
        category_name: category.category_name,
        accuracy_class: category.accuracy_class as AccuracyClass,
        oiml_standard_ref: category.oiml_standard_ref,
        verification_cycle_months: category.verification_cycle_months,
      },
      create: {
        category_code: category.category_code,
        category_name: category.category_name,
        accuracy_class: category.accuracy_class as AccuracyClass,
        oiml_standard_ref: category.oiml_standard_ref,
        verification_cycle_months: category.verification_cycle_months,
      },
    });
  }

  console.log("Begin Seeding Fee Rules");

  for (const stateFee of stateFees) {
    const state = await prisma.state.findUnique({
      where: {
        state_code: stateFee[0].state_code,
      },
    });

    if (!state) {
      throw new Error(`State not found: ${state}`);
    }

    const category = await prisma.instrumentCategory.findUnique({
      where: {
        category_code: stateFee[0].category_code,
      },
    });

    if (!category) {
      throw new Error(`Category not found: ${category}`);
    }

    for (const feeRule of stateFee) {
      await prisma.feeRule.create({
        data: {
          state_id: state.state_id,
          category_id: category.category_id,
          min_value: feeRule.min_value,
          max_value: feeRule.max_value,
          unit: feeRule.unit,
          fee_amount: feeRule.fee_amount,
          fee_basis: feeRule.fee_basis,
          condition: feeRule.condition,
          additional_fee: feeRule.additional_fee,
          additional_unit: feeRule.additional_unit,
          maximum_fee: feeRule.maximum_fee,
        },
      });
    }
  }

  console.log("Begin Seeding Users");

  for (const user of adminUsersData) {
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        jurisdiction_district: user.jurisdiction_district,
        jurisdiction_state: user.jurisdiction_state,
      },
    });
  }

  for (const gatc of gatcUsersData) {
    const user = await prisma.user.create({
      data: {
        name: gatc.name,
        email: gatc.email,
        role: gatc.role,
        jurisdiction_district: gatc.jurisdiction_district,
        jurisdiction_state: gatc.jurisdiction_state,
      },
    });

    await prisma.gatcCentre.create({
      data: {
        centre_code: gatc.centre_code,

        approval_cert_no: gatc.approval_cert_no,
        ind_mark_code: gatc.ind_mark_code,
        valid_from: gatc.valid_from,
        valid_to: gatc.valid_to,
        status: gatc.status,
        approved_categories: gatc.approved_categories,
        lat: gatc.lat,
        long: gatc.long,
        principal_officer_id: user.user_id,
      },
    });
  }

  for (const business of businessUsersData) {
    const user = await prisma.user.create({
      data: {
        name: business.name,
        email: business.email,
        role: business.role,
        jurisdiction_district: business.jurisdiction_district,
        jurisdiction_state: business.jurisdiction_state,
      },
    });

    const state = await prisma.state.findUnique({
      where: {
        state_code: business.state_code,
      },
    });

    if (!state) {
      throw new Error(`State not found: ${state} of user: ${user.name}`);
    }

    await prisma.businessProfile.create({
      data: {
        registration_number: business.registration_number,
        trade_name: business.trade_name,
        entity_type: business.entity_type,
        geo_address: business.geo_address,
        state_id: state.state_id,
        user_id: user.user_id,
      },
    });
  }

  console.log("Seeding completed");
}

seed()
  .catch((err) => {
    console.log("Seeding failed");
    console.log(err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect;
  });
