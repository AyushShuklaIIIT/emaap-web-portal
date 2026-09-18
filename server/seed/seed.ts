import { prisma } from "../lib/prisma";

import { states } from "./states.js";
import { categories } from "./categories.js";
import { stateFees } from "./feeRules.js";
import {
  AccuracyClass,
  AppType,
  InstrumentStatus,
  PaymentMethod,
  PaymentStatus,
  WorkflowStatus,
} from "../generated/prisma/enums.js";
import { adminUsersData, businessUsersData, gatcUsersData } from "./users.js";
import { verificationAppsData } from "./verificationApp.js";
import { measuringInstrumentsData } from "./instruments.js";
import { inspectionRecordsData } from "./inspection.js";
import { digitalCertificatesData } from "./certificates.js";
import { paymentReceiptsData } from "./payment.js";

async function seed() {
  console.log("Begin Seeding States");

  await prisma.digitalCertificate.deleteMany();
  await prisma.sealEvidence.deleteMany();
  await prisma.inspectionRecord.deleteMany();
  await prisma.paymentReceipt.deleteMany();
  await prisma.verificationApp.deleteMany();
  await prisma.measuringInstrument.deleteMany();
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

  console.log("Seeding Measuring Instrument");

  for (const instrument of measuringInstrumentsData) {
    const user = await prisma.user.findUnique({
      where: { email: instrument.business_email },
    });

    if (!user) {
      throw new Error(`User not found: ${instrument.business_email}`);
    }

    const business = await prisma.businessProfile.findUnique({
      where: { user_id: user.user_id },
    });

    if (!business) {
      throw new Error(`User not found: ${instrument.business_email}`);
    }

    const category = await prisma.instrumentCategory.findUnique({
      where: {
        category_code: instrument.category_code,
      },
    });

    if (!category) {
      throw new Error(
        `Instrument category not found: ${instrument.category_code}`,
      );
    }

    await prisma.measuringInstrument.create({
      data: {
        serial_number: instrument.serial_number,
        model_no: instrument.model_no,
        model_approval_no: instrument.model_approval_no,
        manufacturer_name: instrument.manufacturer_name,

        accuracy_class: instrument.accuracy_class as AccuracyClass,
        metric: instrument.metric,

        capacity_value: instrument.capacity_value,
        capacity_unit: instrument.capacity_unit,

        address: instrument.address,
        pincode: instrument.pincode,
        state: instrument.state,
        lat: instrument.lat,
        long: instrument.long,

        status: instrument.status as InstrumentStatus,

        business_id: business.business_id,
        category_id: category.category_id,
      },
    });
  }

  console.log("Seeding Verification App");

  for (const app of verificationAppsData) {
    const business = await prisma.businessProfile.findFirst({
      where: {
        user: {
          email: app.business_email,
        },
      },
    });

    if (!business) {
      throw new Error(`Business not found for ${app.business_email}`);
    }

    const instrument = await prisma.measuringInstrument.findFirst({
      where: {
        serial_number: app.instrument_serial_number,
      },
    });

    if (!instrument) {
      throw new Error(`Instrument not found: ${app.instrument_serial_number}`);
    }

    const officer = app.assigned_officer_email
      ? await prisma.user.findUnique({
          where: {
            email: app.assigned_officer_email,
          },
        })
      : null;

    const gatc = app.assigned_gatc_code
      ? await prisma.gatcCentre.findUnique({
          where: {
            centre_code: app.assigned_gatc_code,
          },
        })
      : null;

    await prisma.verificationApp.create({
      data: {
        application_no: app.application_no,
        app_type: app.app_type as AppType,
        workflow_status: app.workflow_status as WorkflowStatus,

        business_id: business.business_id,
        instrument_id: instrument.instrument_id,

        assigned_officer_id: officer?.user_id,
        assigned_gatc_id: gatc?.gatc_id,
      },
    });
  }

  console.log("Seeding Inspection");

  for (const inspection of inspectionRecordsData) {
    const application = await prisma.verificationApp.findUnique({
      where: {
        application_no: inspection.application_no,
      },
    });

    if (!application) {
      throw new Error(`Application not found: ${inspection.application_no}`);
    }

    const inspector = await prisma.user.findUnique({
      where: {
        email: inspection.inspector_email,
      },
    });

    if (!inspector) {
      throw new Error(`Inspector not found: ${inspection.inspector_email}`);
    }
    await prisma.inspectionRecord.create({
      data: {
        inspection_date: inspection.inspection_date,
        time_taken_minutes: inspection.time_taken_minutes,
        inspection_mode: inspection.inspection_mode,
        test_verdict: inspection.test_verdict,
        geo_latitude: inspection.geo_latitude,
        geo_longitude: inspection.geo_longitude,

        app_id: application.app_id,
        inspector_id: inspector.user_id,
      },
    });
  }

  for (const payment of paymentReceiptsData) {
    const application = await prisma.verificationApp.findUnique({
      where: {
        application_no: payment.application_no,
      },
    });

    if (!application) {
      console.log(`Application not found: ${payment.application_no}`);
      continue;
    }

    await prisma.paymentReceipt.create({
      data: {
        receipt_no: payment.receipt_no,
        transaction_id: payment.transaction_id,
        transaction_date: payment.transaction_date,
        payment_method: payment.payment_method as PaymentMethod,
        due_date: payment.due_date,
        statutory_fee: payment.statutory_fee,
        carriage_charges: payment.carriage_charges,
        adjusting_charges: payment.adjusting_charges,
        total_amount: payment.total_amount,
        govt_share: payment.govt_share,
        gatc_share: payment.gatc_share,
        payment_status: payment.payment_status as PaymentStatus,

        app_id: application.app_id,
      },
    });
  }

  console.log("Seeding Certifictes");

  for (const certificate of digitalCertificatesData) {
    const application = await prisma.verificationApp.findUnique({
      where: {
        application_no: certificate.application_no,
      },
    });

    if (!application) {
      throw new Error(`Application not found: ${certificate.application_no}`);
    }

    const inspection = await prisma.inspectionRecord.findFirst({
      where: {
        app_id: application.app_id,
      },
    });

    if (!inspection) {
      throw new Error(
        `Inspection not found for application: ${certificate.application_no}`,
      );
    }

    const instrument = await prisma.measuringInstrument.findFirst({
      where: {
        serial_number: certificate.instrument_serial_number,
      },
    });

    if (!instrument) {
      throw new Error(
        `Instrument not found: ${certificate.instrument_serial_number}`,
      );
    }

    await prisma.digitalCertificate.create({
      data: {
        certificate_no: certificate.certificate_no,
        stamping_quarter_code: certificate.stamping_quarter_code,
        issue_date: certificate.issue_date,
        expiry_date: certificate.expiry_date,
        sha256_hash: certificate.sha256_hash,
        dynamic_qr_url: certificate.dynamic_qr_url,
        rejection_reason: certificate.rejection_reason,

        inspection_id: inspection.inspection_id,
        instrument_id: instrument.instrument_id,
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
