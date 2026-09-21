import { VerificationAppSeedData } from "../types";

export const verificationAppsData: VerificationAppSeedData[] = [
  // =========================================================
  // SUBMITTED
  // =========================================================

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
    application_no: "EMAAP-VER-2026-0007",
    app_type: "INITIAL",
    workflow_status: "SUBMITTED",

    business_email: "bergman@gmail.com",
    instrument_serial_number: "BG-LC-001",
  },

  {
    application_no: "EMAAP-VER-2026-0008",
    app_type: "INITIAL",
    workflow_status: "SUBMITTED",

    business_email: "kubrick@gmail.com",
    instrument_serial_number: "HW-CT-001",
  },

  {
    application_no: "EMAAP-VER-2026-0015",
    app_type: "INITIAL",
    workflow_status: "SUBMITTED",

    business_email: "andrei@gmail.com",
    instrument_serial_number: "TK-TM-001",
  },

  // =========================================================
  // ALLOCATED
  // =========================================================

  // Delhi business + Delhi GATC
  // HW-WM-001 = WATER_METER
  // GATC-DL-001 supports WATER_METER
  {
    application_no: "EMAAP-VER-2026-0006",
    app_type: "RE_VERIFICATION",
    workflow_status: "ALLOCATED",

    business_email: "kubrick@gmail.com",
    instrument_serial_number: "HW-WM-001",

    assigned_officer_email: "principal@delhi-metrology-lab.com",
    assigned_gatc_code: "GATC-DL-001",
  },

  // UP business + UP GATC
  // TK-BS-001 = BEAM_SCALES_CLASS_A_B
  // GATC-UP-010 supports BEAM_SCALES_CLASS_A_B
  {
    application_no: "EMAAP-VER-2026-0009",
    app_type: "INITIAL",
    workflow_status: "ALLOCATED",

    business_email: "andrei@gmail.com",
    instrument_serial_number: "TK-BS-001",

    assigned_officer_email: "principal@kanpur-metrology.gov.in",
    assigned_gatc_code: "GATC-UP-010",
  },

  // Maharashtra business + Maharashtra GATC
  // BG-LC-001 = NON_AUTOMATIC_WEIGHING_CLASS_I_II
  // GATC-MH-002 supports this category
  {
    application_no: "EMAAP-VER-2026-0010",
    app_type: "INITIAL",
    workflow_status: "ALLOCATED",

    business_email: "bergman@gmail.com",
    instrument_serial_number: "BG-LC-001",

    assigned_officer_email: "director@maha-weights.org",
    assigned_gatc_code: "GATC-MH-002",
  },

  // Maharashtra business + another Maharashtra GATC
  // BG-LC-001 = NON_AUTOMATIC_WEIGHING_CLASS_I_II
  // GATC-MH-003 supports this category
  {
    application_no: "EMAAP-VER-2026-0016",
    app_type: "INITIAL",
    workflow_status: "ALLOCATED",

    business_email: "bergman@gmail.com",
    instrument_serial_number: "BG-LC-001",

    assigned_officer_email: "principal@pune-metrology.gov.in",
    assigned_gatc_code: "GATC-MH-003",
  },

  // Maharashtra business + Nagpur
  {
    application_no: "EMAAP-VER-2026-0017",
    app_type: "INITIAL",
    workflow_status: "ALLOCATED",

    business_email: "bergman@gmail.com",
    instrument_serial_number: "BG-LC-001",

    assigned_officer_email: "principal@nagpur-metrology.gov.in",
    assigned_gatc_code: "GATC-MH-004",
  },

  // =========================================================
  // CERTIFIED
  // =========================================================

  // Delhi
  {
    application_no: "EMAAP-VER-2026-0005",
    app_type: "RE_VERIFICATION",
    workflow_status: "CERTIFIED",

    business_email: "kubrick@gmail.com",
    instrument_serial_number: "HW-WM-001",

    assigned_officer_email: "principal@delhi-metrology-lab.com",
    assigned_gatc_code: "GATC-DL-001",
  },

  // UP
  {
    application_no: "EMAAP-VER-2026-0011",
    app_type: "INITIAL",
    workflow_status: "CERTIFIED",

    business_email: "andrei@gmail.com",
    instrument_serial_number: "TK-BS-001",

    assigned_officer_email: "principal@kanpur-metrology.gov.in",
    assigned_gatc_code: "GATC-UP-010",
  },

  // Maharashtra
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
    application_no: "EMAAP-VER-2026-0019",
    app_type: "RE_VERIFICATION",
    workflow_status: "CERTIFIED",

    business_email: "bergman@gmail.com",
    instrument_serial_number: "BG-LC-001",

    assigned_officer_email: "principal@solapur-metrology.gov.in",
    assigned_gatc_code: "GATC-MH-009",
  },

  // =========================================================
  // REJECTED
  // =========================================================

  // Delhi
  {
    application_no: "EMAAP-VER-2026-0004",
    app_type: "INITIAL",
    workflow_status: "REJECTED",

    business_email: "kubrick@gmail.com",
    instrument_serial_number: "HW-CT-001",

    assigned_officer_email: "principal@delhi-metrology-lab.com",
    assigned_gatc_code: "GATC-DL-001",
  },

  // UP
  {
    application_no: "EMAAP-VER-2026-0013",
    app_type: "INITIAL",
    workflow_status: "REJECTED",

    business_email: "andrei@gmail.com",
    instrument_serial_number: "TK-TM-001",

    assigned_officer_email: "principal@lucknow-metrology.gov.in",
    assigned_gatc_code: "GATC-UP-011",
  },

  // Maharashtra
  {
    application_no: "EMAAP-VER-2026-0014",
    app_type: "INITIAL",
    workflow_status: "REJECTED",

    business_email: "bergman@gmail.com",
    instrument_serial_number: "BG-LC-001",

    assigned_officer_email: "principal@nagpur-metrology.gov.in",
    assigned_gatc_code: "GATC-MH-004",
  },

  // =========================================================
  // ADDITIONAL PENDING APPLICATIONS
  // These are intentionally SUBMITTED so the pendency page
  // has several applications to work with.
  // =========================================================

  {
    application_no: "EMAAP-VER-2026-0020",
    app_type: "INITIAL",
    workflow_status: "SUBMITTED",

    business_email: "kubrick@gmail.com",
    instrument_serial_number: "HW-WM-001",
  },

  {
    application_no: "EMAAP-VER-2026-0021",
    app_type: "INITIAL",
    workflow_status: "SUBMITTED",

    business_email: "kubrick@gmail.com",
    instrument_serial_number: "HW-CT-001",
  },

  {
    application_no: "EMAAP-VER-2026-0022",
    app_type: "INITIAL",
    workflow_status: "SUBMITTED",

    business_email: "andrei@gmail.com",
    instrument_serial_number: "TK-BS-001",
  },

  {
    application_no: "EMAAP-VER-2026-0023",
    app_type: "RE_VERIFICATION",
    workflow_status: "SUBMITTED",

    business_email: "andrei@gmail.com",
    instrument_serial_number: "TK-TM-001",
  },

  {
    application_no: "EMAAP-VER-2026-0024",
    app_type: "INITIAL",
    workflow_status: "SUBMITTED",

    business_email: "bergman@gmail.com",
    instrument_serial_number: "BG-LC-001",
  },

  // =========================================================
  // MORE ALLOCATED MAHARASHTRA APPLICATIONS
  // Useful for testing allocation/pendency UI.
  // =========================================================

  {
    application_no: "EMAAP-VER-2026-0025",
    app_type: "INITIAL",
    workflow_status: "ALLOCATED",

    business_email: "bergman@gmail.com",
    instrument_serial_number: "BG-LC-001",

    assigned_officer_email: "principal@nashik-metrology.gov.in",
    assigned_gatc_code: "GATC-MH-005",
  },

  {
    application_no: "EMAAP-VER-2026-0026",
    app_type: "RE_VERIFICATION",
    workflow_status: "ALLOCATED",

    business_email: "bergman@gmail.com",
    instrument_serial_number: "BG-LC-001",

    assigned_officer_email: "principal@aurangabad-metrology.gov.in",
    assigned_gatc_code: "GATC-MH-006",
  },

  {
    application_no: "EMAAP-VER-2026-0027",
    app_type: "INITIAL",
    workflow_status: "ALLOCATED",

    business_email: "bergman@gmail.com",
    instrument_serial_number: "BG-LC-001",

    assigned_officer_email: "principal@kolhapur-metrology.gov.in",
    assigned_gatc_code: "GATC-MH-007",
  },

  {
    application_no: "EMAAP-VER-2026-0028",
    app_type: "RE_VERIFICATION",
    workflow_status: "ALLOCATED",

    business_email: "bergman@gmail.com",
    instrument_serial_number: "BG-LC-001",

    assigned_officer_email: "principal@thane-metrology.gov.in",
    assigned_gatc_code: "GATC-MH-008",
  },
];
