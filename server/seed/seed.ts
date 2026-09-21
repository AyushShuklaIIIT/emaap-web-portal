import { prisma } from "../lib/prisma";

import { BusinessUser, GatcUser } from "../types";

import { states } from "./states.js";
import { categories } from "./categories.js";
import { stateFees } from "./feeRules.js";
import { allMockUsers } from "./users.js";
import { AccuracyClass } from "../generated/prisma/enums.js";

async function seed() {
  console.log("Begin Seeding States");

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

  console.log("States seeded successfully");

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

  console.log("Categories seeded successfully");

  console.log("Begin Seeding Fee Rules");

  await prisma.feeRule.deleteMany();

  for (const feeRuleArray of stateFees) {
    for (const feeRule of feeRuleArray) {
      const state = await prisma.state.findUnique({
        where: {
          state_code: feeRule.state_code,
        },
      });

      const category = await prisma.instrumentCategory.findUnique({
        where: {
          category_code: feeRule.category_code,
        },
      });

      if (!state) {
        console.warn(
          `Skipping fee rule: state not found: ${feeRule.state_code}`,
        );
        continue;
      }

      if (!category) {
        console.warn(
          `Skipping fee rule: category not found: ${feeRule.category_code}`,
        );
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

  console.log("Fee rules seeded successfully");

  console.log("Begin Seeding Users");

  for (const u of allMockUsers) {
    const {
      name,
      email,
      role,
      jurisdiction_district,
      jurisdiction_state,
      fullName,
      mobile,
      registrationRole,
      passwordHash,
    } = u;

    const baseUser = {
      name,
      email,
      role,
      jurisdiction_district,
      jurisdiction_state,
      fullName,
      mobile,
      registrationRole,
      passwordHash,
      isActive: true,
      emailVerified: true,
      mobileVerified: true,
    };

    let createdUser;

    if (role === "BUSINESS") {
      const bu = u as any;
      const bp = {
        registration_number: bu.registration_number,
        trade_name: bu.trade_name,
        entity_type: bu.entity_type,
        geo_address: bu.geo_address,
      };

      const state = await prisma.state.findUnique({
        where: { state_code: bu.state_code },
      });

      if (!state) {
        console.warn(
          `Skipping business profile creation for ${email} due to missing state_code: ${bu.state_code}`,
        );
        createdUser = await prisma.user.upsert({
          where: { email },
          update: baseUser,
          create: baseUser,
        });
        continue;
      }

      createdUser = await prisma.user.upsert({
        where: { email },
        update: baseUser,
        create: baseUser,
      });

      await prisma.businessProfile.upsert({
        where: { user_id: createdUser.user_id },
        update: {
          ...bp,
          registration_number: bu.registration_number,
          state_id: state.state_id,
        },
        create: {
          ...bp,
          registration_number: bu.registration_number,
          user_id: createdUser.user_id,
          state_id: state.state_id,
        },
      });
    } else if (role === "GATC_PRINCIPAL") {
      const gu = u as any;
      const gc = {
        centre_code: gu.centre_code,
        approval_cert_no: gu.approval_cert_no,
        ind_mark_code: gu.ind_mark_code,
        valid_from: gu.valid_from,
        valid_to: gu.valid_to,
        status: gu.status,
        approved_categories: gu.approved_categories,
        lat: gu.lat,
        long: gu.long,
      };

      createdUser = await prisma.user.upsert({
        where: { email },
        update: baseUser,
        create: baseUser,
      });

      await prisma.gatcCentre.upsert({
        where: { principal_officer_id: createdUser.user_id },
        update: {
          ...gc,
          centre_code: gu.centre_code,
        },
        create: {
          ...gc,
          centre_code: gu.centre_code,
          principal_officer_id: createdUser.user_id,
        },
      });
    } else {
      createdUser = await prisma.user.upsert({
        where: { email },
        update: baseUser,
        create: baseUser,
      });
    }
    console.log(`Seeded user: ${email}`);
  }

  console.log("Constant Data Seeding completed");
}

seed()
  .catch((err) => {
    console.error("Seeding failed");
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
