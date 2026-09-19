import { VerificationAppSeedData } from "../types";

export const verificationAppsData: VerificationAppSeedData[] = [
  {
    application_no: "EMAAP-VER-2026-0001",
    app_type: "INITIAL",
    workflow_status: "SUBMITTED",

    business_email: "kubrick@gmail.com",
    instrument_serial_number: "HW-WM-001",
  },

  {
    application_no: "EMAAP-VER-2026-0002",
    app_type: "INITIAL",
    workflow_status: "SUBMITTED",

    business_email: "andrei@gmail.com",
    instrument_serial_number: "TK-BS-001",
  },

  {
    application_no: "EMAAP-VER-2026-0005",
    app_type: "RE_VERIFICATION",
    workflow_status: "CERTIFIED",

    instrument_serial_number: "HW-WM-001",
    business_email: "kubrick@gmail.com",
  },

  {
    application_no: "EMAAP-VER-2026-0003",
    app_type: "RE_VERIFICATION",
    workflow_status: "CERTIFIED",

    business_email: "bergman@gmail.com",
    instrument_serial_number: "BG-LC-001",

    assigned_officer_email: "director@maha-weights.org",
    assigned_gatc_code: "GATC-MH-002",
  },

  {
    application_no: "EMAAP-VER-2026-0004",
    app_type: "INITIAL",
    workflow_status: "REJECTED",

    business_email: "kubrick@gmail.com",
    instrument_serial_number: "HW-CT-001",

    assigned_officer_email: "director@maha-weights.org",
    assigned_gatc_code: "GATC-MH-002",
  },

  {
    application_no: "EMAAP-VER-2026-0006",
    app_type: "RE_VERIFICATION",
    workflow_status: "ALLOCATED",

    business_email: "andrei@gmail.com",
    instrument_serial_number: "TK-TM-001",

    assigned_officer_email: "principal@delhi-metrology-lab.com",
    assigned_gatc_code: "GATC-DL-001",
  },
];
