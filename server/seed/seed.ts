import { prisma } from "../lib/prisma";
import { states } from "./states.js";
import { categories } from "./categories.js";
import { stateFees } from "./feeRules.js";
import { allMockUsers, lmoOfficers } from "./users.js";
import { measuringInstrumentsData } from "./instruments.js";
import { verificationAppsData } from "./verificationApp.js";
import { paymentReceiptsData } from "./payment.js";
import { inspectionRecordsData } from "./inspection.js";
import { digitalCertificatesData } from "./certificates.js";
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

    if (registrationRole === "STAKEHOLDER") {
      const bu = u as any;

      const bp = {
        registration_number: bu.registration_number,
        trade_name: bu.trade_name,
        entity_type: bu.entity_type,
        geo_address: bu.geo_address,
      };

      const state = await prisma.state.findUnique({
        where: {
          state_code: bu.state_code,
        },
      });

      if (!state) {
        console.warn(
          `Skipping business profile creation for ${email} due to missing state_code: ${bu.state_code}`,
        );

        createdUser = await prisma.user.upsert({
          where: {
            email,
          },
          update: baseUser,
          create: baseUser,
        });

        continue;
      }

      createdUser = await prisma.user.upsert({
        where: {
          email,
        },
        update: baseUser,
        create: baseUser,
      });

      await prisma.businessProfile.upsert({
        where: {
          user_id: createdUser.user_id,
        },
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
    } else if (registrationRole === "GATC_OPERATOR") {
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
        where: {
          email,
        },
        update: baseUser,
        create: baseUser,
      });

      await prisma.gatcCentre.upsert({
        where: {
          principal_officer_id: createdUser.user_id,
        },
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
        where: {
          email,
        },
        update: baseUser,
        create: baseUser,
      });
    }

    console.log(`Seeded user: ${email}`);
  }

  console.log("Users seeded successfully");

  console.log("Begin Seeding LMO Officers");

  for (const officer of lmoOfficers) {
    const user = await prisma.user.findUnique({
      where: {
        email: officer.user_email,
      },
    });

    if (!user) {
      console.warn(
        `Skipping LMO officer ${officer.employee_code}: user not found: ${officer.user_email}`,
      );
      continue;
    }

    if (user.registrationRole !== "LMO") {
      console.warn(
        `Skipping LMO officer ${officer.employee_code}: user ${user.email} does not have role LMO`,
      );
      continue;
    }

    const state = await prisma.state.findUnique({
      where: {
        state_code: officer.state_code,
      },
    });

    if (!state) {
      console.warn(
        `Skipping LMO officer ${officer.employee_code}: state not found: ${officer.state_code}`,
      );
      continue;
    }

    await prisma.lmoOfficer.upsert({
      where: {
        user_id: user.user_id,
      },
      update: {
        employee_id: officer.employee_id,
        employee_code: officer.employee_code,
        designation: officer.designation,
        jurisdiction_zone: officer.jurisdiction_zone,
        assigned_wsl_lab: officer.assigned_wsl_lab,
        is_nodal_officer: officer.is_nodal_officer,
        verification_stamp_code: officer.verification_stamp_code,
        digital_token_id: officer.digital_token_id,
        state_id: state.state_id,
      },
      create: {
        employee_id: officer.employee_id,
        user_id: user.user_id,
        employee_code: officer.employee_code,
        designation: officer.designation,
        jurisdiction_zone: officer.jurisdiction_zone,
        assigned_wsl_lab: officer.assigned_wsl_lab,
        is_nodal_officer: officer.is_nodal_officer,
        verification_stamp_code: officer.verification_stamp_code,
        digital_token_id: officer.digital_token_id,
        state_id: state.state_id,
      },
    });

    console.log(
      `Seeded LMO officer: ${officer.employee_code} - ${officer.designation}`,
    );
  }

  console.log("LMO Officers seeded successfully");

  console.log("Begin Seeding Instruments");

  for (const inst of measuringInstrumentsData) {
    const user = await prisma.user.findUnique({
      where: {
        email: inst.business_email,
      },
      include: {
        business_profile: true,
      },
    });

    const category = await prisma.instrumentCategory.findUnique({
      where: {
        category_code: inst.category_code,
      },
    });

    if (!user?.business_profile || !category) {
      continue;
    }

    const data = {
      serial_number: inst.serial_number,
      model_no: inst.model_no,
      model_approval_no: inst.model_approval_no,
      manufacturer_name: inst.manufacturer_name,
      accuracy_class: inst.accuracy_class as any,
      metric: inst.metric,
      capacity_value: inst.capacity_value,
      capacity_unit: inst.capacity_unit,
      address: inst.address,
      pincode: inst.pincode,
      state: inst.state,
      lat: inst.lat,
      long: inst.long,
      status: inst.status as any,
      business_id: user.business_profile.business_id,
      category_id: category.category_id,
    };

    const existing = await prisma.measuringInstrument.findFirst({
      where: {
        serial_number: inst.serial_number,
      },
    });

    if (existing) {
      await prisma.measuringInstrument.update({
        where: {
          instrument_id: existing.instrument_id,
        },
        data,
      });
    } else {
      await prisma.measuringInstrument.create({
        data,
      });
    }
  }

  console.log("Instruments seeded successfully");

  console.log("Begin Seeding Verification Apps");

  for (const app of verificationAppsData) {
    const user = await prisma.user.findUnique({
      where: {
        email: app.business_email,
      },
      include: {
        business_profile: true,
      },
    });

    const inst = await prisma.measuringInstrument.findFirst({
      where: {
        serial_number: app.instrument_serial_number,
      },
    });

    let officer_id = null;
    let gatc_id = null;

    if (app.assigned_officer_email) {
      const officer = await prisma.user.findUnique({
        where: {
          email: app.assigned_officer_email,
        },
      });

      officer_id = officer?.user_id ?? null;
    }

    if (app.assigned_gatc_code) {
      const gatc = await prisma.gatcCentre.findUnique({
        where: {
          centre_code: app.assigned_gatc_code,
        },
      });

      gatc_id = gatc?.gatc_id ?? null;
    }

    if (!user?.business_profile || !inst) {
      continue;
    }

    await prisma.verificationApp.upsert({
      where: {
        application_no: app.application_no,
      },
      update: {
        app_type: app.app_type as any,
        workflow_status: app.workflow_status as any,
        instrument_id: inst.instrument_id,
        business_id: user.business_profile.business_id,
        assigned_officer_id: officer_id,
        assigned_gatc_id: gatc_id,
      },
      create: {
        application_no: app.application_no,
        app_type: app.app_type as any,
        workflow_status: app.workflow_status as any,
        instrument_id: inst.instrument_id,
        business_id: user.business_profile.business_id,
        assigned_officer_id: officer_id,
        assigned_gatc_id: gatc_id,
      },
    });
  }

  console.log("Verification Apps seeded successfully");

  console.log("Begin Seeding Payments");

  for (const pay of paymentReceiptsData) {
    const app = await prisma.verificationApp.findUnique({
      where: {
        application_no: pay.application_no,
      },
    });

    if (!app) {
      continue;
    }

    await prisma.paymentReceipt.upsert({
      where: {
        receipt_no: pay.receipt_no,
      },
      update: {
        transaction_id: pay.transaction_id,
        transaction_date: pay.transaction_date,
        payment_method: pay.payment_method as any,
        due_date: pay.due_date,
        statutory_fee: pay.statutory_fee,
        carriage_charges: pay.carriage_charges,
        adjusting_charges: pay.adjusting_charges,
        total_amount: pay.total_amount,
        govt_share: pay.govt_share,
        gatc_share: pay.gatc_share,
        payment_status: pay.payment_status as any,
        app_id: app.app_id,
      },
      create: {
        receipt_no: pay.receipt_no,
        transaction_id: pay.transaction_id,
        transaction_date: pay.transaction_date,
        payment_method: pay.payment_method as any,
        due_date: pay.due_date,
        statutory_fee: pay.statutory_fee,
        carriage_charges: pay.carriage_charges,
        adjusting_charges: pay.adjusting_charges,
        total_amount: pay.total_amount,
        govt_share: pay.govt_share,
        gatc_share: pay.gatc_share,
        payment_status: pay.payment_status as any,
        app_id: app.app_id,
      },
    });
  }

  console.log("Payments seeded successfully");

  console.log("Begin Seeding Inspections");

  for (const ins of inspectionRecordsData) {
    const app = await prisma.verificationApp.findUnique({
      where: {
        application_no: ins.application_no,
      },
    });

    const inspector = await prisma.user.findUnique({
      where: {
        email: ins.inspector_email,
      },
    });

    if (!app || !inspector) {
      continue;
    }

    const data = {
      inspection_date: ins.inspection_date,
      time_taken_minutes: ins.time_taken_minutes,
      inspection_mode: ins.inspection_mode as any,
      test_verdict: ins.test_verdict as any,
      geo_latitude: ins.geo_latitude,
      geo_longitude: ins.geo_longitude,
      inspector_id: inspector.user_id,
      app_id: app.app_id,
    };

    const existing = await prisma.inspectionRecord.findFirst({
      where: {
        app_id: app.app_id,
      },
    });

    if (existing) {
      await prisma.inspectionRecord.update({
        where: {
          inspection_id: existing.inspection_id,
        },
        data,
      });
    } else {
      await prisma.inspectionRecord.create({
        data,
      });
    }
  }

  console.log("Inspections seeded successfully");

  console.log("Begin Seeding Certificates");

  for (const cert of digitalCertificatesData) {
    const app = await prisma.verificationApp.findUnique({
      where: {
        application_no: cert.application_no,
      },
    });

    if (!app) {
      continue;
    }

    const inspection = await prisma.inspectionRecord.findFirst({
      where: {
        app_id: app.app_id,
      },
    });

    if (!inspection) {
      continue;
    }

    await prisma.digitalCertificate.upsert({
      where: {
        certificate_no: cert.certificate_no,
      },
      update: {
        stamping_quarter_code: cert.stamping_quarter_code,
        issue_date: cert.issue_date,
        expiry_date: cert.expiry_date,
        sha256_hash: cert.sha256_hash,
        dynamic_qr_url: cert.dynamic_qr_url,
        rejection_reason: cert.rejection_reason,
        inspection_id: inspection.inspection_id,
        instrument_id: app.instrument_id,
      },
      create: {
        certificate_no: cert.certificate_no,
        stamping_quarter_code: cert.stamping_quarter_code,
        issue_date: cert.issue_date,
        expiry_date: cert.expiry_date,
        sha256_hash: cert.sha256_hash,
        dynamic_qr_url: cert.dynamic_qr_url,
        rejection_reason: cert.rejection_reason,
        inspection_id: inspection.inspection_id,
        instrument_id: app.instrument_id,
      },
    });
  }

  console.log("Certificates seeded successfully");
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
