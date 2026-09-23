import { scryptSync } from "node:crypto";

import { User, GatcUser, BusinessUser, LmoOfficerSeed } from "../types";
import { LmoDesignation } from "../generated/prisma/enums";

function generateHash(password: string): string {
  return `mock-salt:${scryptSync(password, "mock-salt", 64).toString("hex")}`;
}

export const adminUsersData: User[] = [
  {
    name: "Directorate Admin Central",
    fullName: "Directorate Admin Central",
    email: "admin.central@emaap.gov.in",
    mobile: "9000000001",
    registrationRole: "ADMIN",
    jurisdiction_district: "Central",
    jurisdiction_state: "Central",
    password: "admin",
    passwordHash: generateHash("admin"),
  },
  {
    name: "Controller Legal Metrology Maharashtra",
    fullName: "Controller Legal Metrology Maharashtra",
    email: "controller.lm@maharashtra.gov.in",
    mobile: "9000000002",
    registrationRole: "ADMIN",
    jurisdiction_state: "MH",
    jurisdiction_district: "Central",
    password: "mhadmin",
    passwordHash: generateHash("mhadmin"),
  },
];

export const gatcUsersData: GatcUser[] = [
  {
    name: "Dr. Christopher Nolan",
    fullName: "Dr. Christopher Nolan",
    email: "principal@delhi-metrology-lab.com",
    mobile: "9000000003",
    registrationRole: "GATC_PRINCIPAL",
    jurisdiction_district: "New Delhi",
    jurisdiction_state: "DL",
    password: "memento",
    passwordHash: generateHash("memento"),

    centre_code: "GATC-DL-001",
    approval_cert_no: "GOI/GOVERNMENT APPROVED TEST CENTRE/07/2024/001",
    ind_mark_code: "IND/24/01",

    valid_from: new Date("2024-01-01T00:00:00Z"),
    valid_to: new Date("2029-01-01T00:00:00Z"),

    status: "ACTIVE",

    approved_categories: [
      "WATER_METER",
      "CLINICAL_THERMOMETER",
      "FABRIC_PLASTIC_WOVEN_STEEL_TAPES",
      "NON_AUTOMATIC_WEIGHING_MECHANICAL_CLASS_III_IV",
      "NON_AUTOMATIC_WEIGHING_ELECTRONIC_CLASS_III_IV",
    ],

    lat: 28.6139,
    long: 77.209,
  },

  {
    name: "David Lynch",
    fullName: "David Lynch",
    email: "director@maha-weights.org",
    mobile: "9000000004",
    registrationRole: "GATC_PRINCIPAL",
    jurisdiction_district: "Mumbai Suburban",
    jurisdiction_state: "MH",
    password: "bluevelvet",
    passwordHash: generateHash("bluevelvet"),

    centre_code: "GATC-MH-002",
    approval_cert_no: "GOI/GOVERNMENT APPROVED TEST CENTRE/27/2025/002",
    ind_mark_code: "IND/25/02",

    valid_from: new Date("2025-06-01T00:00:00Z"),
    valid_to: new Date("2030-05-31T00:00:00Z"),

    status: "ACTIVE",

    approved_categories: [
      "BEAM_SCALES_CLASS_A_B",
      "BEAM_SCALES_CLASS_C_D",
      "AUTOMATIC_WEIGHING_INSTRUMENTS",
      "NON_AUTOMATIC_WEIGHING_CLASS_I_II",
    ],

    lat: 19.076,
    long: 72.8777,
  },

  {
    name: "Satyajit Ray",
    fullName: "Satyajit Ray",
    email: "principal@pune-metrology.gov.in",
    mobile: "9000000008",

    registrationRole: "GATC_PRINCIPAL",
    jurisdiction_district: "Pune",
    jurisdiction_state: "MH",
    password: "charulata",
    passwordHash: generateHash("charulata"),

    centre_code: "GATC-MH-003",
    approval_cert_no: "GOI/GOVERNMENT APPROVED TEST CENTRE/27/2025/003",
    ind_mark_code: "IND/25/03",

    valid_from: new Date("2025-03-01T00:00:00Z"),
    valid_to: new Date("2030-02-28T00:00:00Z"),

    status: "ACTIVE",

    approved_categories: [
      "WATER_METER",
      "CLINICAL_THERMOMETER",
      "BEAM_SCALES_CLASS_A_B",
      "NON_AUTOMATIC_WEIGHING_CLASS_I_II",
    ],

    lat: 18.5204,
    long: 73.8567,
  },

  {
    name: "Agnès Varda",
    fullName: "Agnès Varda",
    email: "principal@nagpur-metrology.gov.in",
    mobile: "9000000009",

    registrationRole: "GATC_PRINCIPAL",
    jurisdiction_district: "Nagpur",
    jurisdiction_state: "MH",
    password: "cleo",
    passwordHash: generateHash("cleo"),

    centre_code: "GATC-MH-004",
    approval_cert_no: "GOI/GOVERNMENT APPROVED TEST CENTRE/27/2025/004",
    ind_mark_code: "IND/25/04",

    valid_from: new Date("2025-04-01T00:00:00Z"),
    valid_to: new Date("2030-03-31T00:00:00Z"),

    status: "ACTIVE",

    approved_categories: [
      "WATER_METER",
      "AUTOMATIC_WEIGHING_INSTRUMENTS",
      "NON_AUTOMATIC_WEIGHING_MECHANICAL_CLASS_III_IV",
      "NON_AUTOMATIC_WEIGHING_ELECTRONIC_CLASS_III_IV",
    ],

    lat: 21.1458,
    long: 79.0882,
  },

  {
    name: "Wong Kar-wai",
    fullName: "Wong Kar-wai",
    email: "principal@aurangabad-metrology.gov.in",
    mobile: "9000000011",

    registrationRole: "GATC_PRINCIPAL",
    jurisdiction_district: "Aurangabad",
    jurisdiction_state: "MH",
    password: "chungking",
    passwordHash: generateHash("chungking"),

    centre_code: "GATC-MH-006",
    approval_cert_no: "GOI/GOVERNMENT APPROVED TEST CENTRE/27/2025/006",
    ind_mark_code: "IND/25/06",

    valid_from: new Date("2025-06-15T00:00:00Z"),
    valid_to: new Date("2030-06-14T00:00:00Z"),

    status: "ACTIVE",

    approved_categories: [
      "WATER_METER",
      "AUTOMATIC_WEIGHING_INSTRUMENTS",
      "NON_AUTOMATIC_WEIGHING_CLASS_I_II",
      "BEAM_SCALES_CLASS_A_B",
    ],

    lat: 19.8762,
    long: 75.3433,
  },

  {
    name: "Claire Denis",
    fullName: "Claire Denis",
    email: "principal@kolhapur-metrology.gov.in",
    mobile: "9000000012",

    registrationRole: "GATC_PRINCIPAL",
    jurisdiction_district: "Kolhapur",
    jurisdiction_state: "MH",
    password: "beau",
    passwordHash: generateHash("beau"),

    centre_code: "GATC-MH-007",
    approval_cert_no: "GOI/GOVERNMENT APPROVED TEST CENTRE/27/2025/007",
    ind_mark_code: "IND/25/07",

    valid_from: new Date("2025-07-01T00:00:00Z"),
    valid_to: new Date("2030-06-30T00:00:00Z"),

    status: "ACTIVE",

    approved_categories: [
      "BEAM_SCALES_CLASS_A_B",
      "BEAM_SCALES_CLASS_C_D",
      "CLINICAL_THERMOMETER",
      "WATER_METER",
    ],

    lat: 16.705,
    long: 74.2433,
  },

  {
    name: "Hayao Miyazaki",
    fullName: "Hayao Miyazaki",
    email: "principal@thane-metrology.gov.in",
    mobile: "9000000013",

    registrationRole: "GATC_PRINCIPAL",
    jurisdiction_district: "Thane",
    jurisdiction_state: "MH",
    password: "totoro",
    passwordHash: generateHash("totoro"),

    centre_code: "GATC-MH-008",
    approval_cert_no: "GOI/GOVERNMENT APPROVED TEST CENTRE/27/2025/008",
    ind_mark_code: "IND/25/08",

    valid_from: new Date("2025-08-01T00:00:00Z"),
    valid_to: new Date("2030-07-31T00:00:00Z"),

    status: "ACTIVE",

    approved_categories: [
      "WATER_METER",
      "FABRIC_PLASTIC_WOVEN_STEEL_TAPES",
      "NON_AUTOMATIC_WEIGHING_MECHANICAL_CLASS_III_IV",
      "NON_AUTOMATIC_WEIGHING_ELECTRONIC_CLASS_III_IV",
    ],

    lat: 19.2183,
    long: 72.9781,
  },

  {
    name: "Park Chan-wook",
    fullName: "Park Chan-wook",
    email: "principal@solapur-metrology.gov.in",
    mobile: "9000000014",

    registrationRole: "GATC_PRINCIPAL",
    jurisdiction_district: "Solapur",
    jurisdiction_state: "MH",
    password: "oldboy",
    passwordHash: generateHash("oldboy"),

    centre_code: "GATC-MH-009",
    approval_cert_no: "GOI/GOVERNMENT APPROVED TEST CENTRE/27/2025/009",
    ind_mark_code: "IND/25/09",

    valid_from: new Date("2025-09-01T00:00:00Z"),
    valid_to: new Date("2030-08-31T00:00:00Z"),

    status: "ACTIVE",

    approved_categories: [
      "AUTOMATIC_WEIGHING_INSTRUMENTS",
      "NON_AUTOMATIC_WEIGHING_CLASS_I_II",
      "BEAM_SCALES_CLASS_C_D",
    ],

    lat: 17.6599,
    long: 75.9064,
  },

  {
    name: "Akira Kurosawa",
    fullName: "Akira Kurosawa",
    email: "principal@kanpur-metrology.gov.in",
    mobile: "9000000015",

    registrationRole: "GATC_PRINCIPAL",
    jurisdiction_district: "Kanpur",
    jurisdiction_state: "UP",
    password: "rashomon",
    passwordHash: generateHash("rashomon"),

    centre_code: "GATC-UP-010",
    approval_cert_no: "GOI/GOVERNMENT APPROVED TEST CENTRE/09/2025/010",
    ind_mark_code: "IND/25/10",

    valid_from: new Date("2025-02-01T00:00:00Z"),
    valid_to: new Date("2030-01-31T00:00:00Z"),

    status: "ACTIVE",

    approved_categories: [
      "WATER_METER",
      "AUTOMATIC_WEIGHING_INSTRUMENTS",
      "BEAM_SCALES_CLASS_C_D",
      "NON_AUTOMATIC_WEIGHING_CLASS_I_II",
    ],

    lat: 26.4499,
    long: 80.3319,
  },

  {
    name: "Martin Scorsese",
    fullName: "Martin Scorsese",
    email: "principal@lucknow-metrology.gov.in",
    mobile: "9000000016",

    registrationRole: "GATC_PRINCIPAL",
    jurisdiction_district: "Lucknow",
    jurisdiction_state: "UP",
    password: "taxidriver",
    passwordHash: generateHash("taxidriver"),

    centre_code: "GATC-UP-011",
    approval_cert_no: "GOI/GOVERNMENT APPROVED TEST CENTRE/09/2025/011",
    ind_mark_code: "IND/25/11",

    valid_from: new Date("2025-03-01T00:00:00Z"),
    valid_to: new Date("2030-02-28T00:00:00Z"),

    status: "ACTIVE",

    approved_categories: [
      "CLINICAL_THERMOMETER",
      "WATER_METER",
      "FABRIC_PLASTIC_WOVEN_STEEL_TAPES",
    ],

    lat: 26.8467,
    long: 80.9462,
  },

  {
    name: "Bong Joon-ho",
    fullName: "Bong Joon-ho",
    email: "principal@bhopal-metrology.gov.in",
    mobile: "9000000017",

    registrationRole: "GATC_PRINCIPAL",
    jurisdiction_district: "Bhopal",
    jurisdiction_state: "MP",
    password: "parasite",
    passwordHash: generateHash("parasite"),

    centre_code: "GATC-MP-012",
    approval_cert_no: "GOI/GOVERNMENT APPROVED TEST CENTRE/23/2025/012",
    ind_mark_code: "IND/25/12",

    valid_from: new Date("2025-04-01T00:00:00Z"),
    valid_to: new Date("2030-03-31T00:00:00Z"),

    status: "ACTIVE",

    approved_categories: [
      "WATER_METER",
      "BEAM_SCALES_CLASS_A_B",
      "NON_AUTOMATIC_WEIGHING_CLASS_I_II",
      "CLINICAL_THERMOMETER",
    ],

    lat: 23.2599,
    long: 77.4126,
  },

  {
    name: "Paul Thomas Anderson",
    fullName: "Paul Thomas Anderson",
    email: "principal@jaipur-metrology.gov.in",
    mobile: "9000000018",

    registrationRole: "GATC_PRINCIPAL",
    jurisdiction_district: "Jaipur",
    jurisdiction_state: "RJ",
    password: "magnolia",
    passwordHash: generateHash("magnolia"),

    centre_code: "GATC-RJ-013",
    approval_cert_no: "GOI/GOVERNMENT APPROVED TEST CENTRE/08/2025/013",
    ind_mark_code: "IND/25/13",

    valid_from: new Date("2025-05-01T00:00:00Z"),
    valid_to: new Date("2030-04-30T00:00:00Z"),

    status: "ACTIVE",

    approved_categories: [
      "AUTOMATIC_WEIGHING_INSTRUMENTS",
      "BEAM_SCALES_CLASS_C_D",
      "WATER_METER",
    ],

    lat: 26.9124,
    long: 75.7873,
  },

  {
    name: "Denis Villeneuve",
    fullName: "Denis Villeneuve",
    email: "principal@ahmedabad-metrology.gov.in",
    mobile: "9000000019",

    registrationRole: "GATC_PRINCIPAL",
    jurisdiction_district: "Ahmedabad",
    jurisdiction_state: "GJ",
    password: "arrival",
    passwordHash: generateHash("arrival"),

    centre_code: "GATC-GJ-014",
    approval_cert_no: "GOI/GOVERNMENT APPROVED TEST CENTRE/24/2025/014",
    ind_mark_code: "IND/25/14",

    valid_from: new Date("2025-06-01T00:00:00Z"),
    valid_to: new Date("2030-05-31T00:00:00Z"),

    status: "ACTIVE",

    approved_categories: [
      "WATER_METER",
      "NON_AUTOMATIC_WEIGHING_MECHANICAL_CLASS_III_IV",
      "NON_AUTOMATIC_WEIGHING_ELECTRONIC_CLASS_III_IV",
    ],

    lat: 23.0225,
    long: 72.5714,
  },

  {
    name: "David Fincher",
    fullName: "David Fincher",
    email: "principal@bangalore-metrology.gov.in",
    mobile: "9000000020",

    registrationRole: "GATC_PRINCIPAL",
    jurisdiction_district: "Bangalore Urban",
    jurisdiction_state: "KA",
    password: "se7en",
    passwordHash: generateHash("se7en"),

    centre_code: "GATC-KA-015",
    approval_cert_no: "GOI/GOVERNMENT APPROVED TEST CENTRE/29/2025/015",
    ind_mark_code: "IND/25/15",

    valid_from: new Date("2025-07-01T00:00:00Z"),
    valid_to: new Date("2030-06-30T00:00:00Z"),

    status: "ACTIVE",

    approved_categories: [
      "AUTOMATIC_WEIGHING_INSTRUMENTS",
      "NON_AUTOMATIC_WEIGHING_CLASS_I_II",
      "CLINICAL_THERMOMETER",
      "WATER_METER",
    ],

    lat: 12.9716,
    long: 77.5946,
  },
];

export const businessUsersData: BusinessUser[] = [
  {
    name: "Stanley Kubrick",
    fullName: "Stanley Kubrick",
    email: "kubrick@gmail.com",
    mobile: "9000000005",
    registrationRole: "STAKEHOLDER",
    jurisdiction_district: "Bhopal",
    jurisdiction_state: "MP",
    password: "2001",
    passwordHash: generateHash("2001"),
    registration_number: "07AAAAA0000A1Z5",
    trade_name: "Hardware Stanley",
    entity_type: "MANUFACTURER",
    geo_address:
      "Plot 42, Okhla Industrial Area, Phase-III, New Delhi, Delhi 110020",
    state_code: "MP",
  },
  {
    name: "Andrei Tarkovsky",
    fullName: "Andrei Tarkovsky",
    email: "andrei@gmail.com",
    mobile: "9000000006",
    registrationRole: "STAKEHOLDER",
    jurisdiction_district: "Kanpur",
    jurisdiction_state: "UP",
    password: "stalker",
    passwordHash: generateHash("stalker"),
    registration_number: "27BBBBB1111B1Z2",
    trade_name: "Tarkovsky Dealers",
    entity_type: "DEALER",
    geo_address: "Block 2b, 1st Floor, Z Square Mall, Kanpur, Uttar Pradesh",
    state_code: "UP",
  },
  {
    name: "Ingmar Bergman",
    fullName: "Ingmar Bergman",
    email: "bergman@gmail.com",
    mobile: "9000000007",
    registrationRole: "STAKEHOLDER",
    jurisdiction_district: "Mumbai Suburban",
    jurisdiction_state: "MH",
    password: "seventhseal",
    passwordHash: generateHash("seventhseal"),
    registration_number: "27CCCCC2222C1Z9",
    trade_name: "Bergman Instruments",
    entity_type: "USER",
    geo_address:
      "Container Freight Terminal 4, Navi Mumbai, Maharashtra 400703",
    state_code: "MH",
  },
  {
    name: "Rob Reiner",
    fullName: "Rob Reiner",
    email: "rob@gmail.com",
    mobile: "9000000099",
    registrationRole: "STAKEHOLDER",
    jurisdiction_district: "Jaipur",
    jurisdiction_state: "RJ",
    password: "standbyme",
    passwordHash: generateHash("standbyme"),
    registration_number: "07AAAAA0000A1M1",
    trade_name: "Princess Hardwares",
    entity_type: "MANUFACTURER",
    geo_address: "Plot 42, Okhla Industrial Area, Phase-III, Jaipur, Rajasthan",
    state_code: "RJ",
  },
];

export const lmoUsersData: User[] = [
  {
    user_id: "lmo12",
    name: "LMO Inspector MP",
    fullName: "Quentin Tarantino",
    email: "quentin.mp@emaap.gov.in",
    mobile: "9000000021",
    registrationRole: "LMO",
    jurisdiction_state: "MP",
    jurisdiction_district: "Bhopal",
    employeeId: "LMO-001",
    password: "pulpfiction",
    passwordHash: generateHash("pulpfiction"),
  },
];
export const lmoOfficers: LmoOfficerSeed[] = [
  {
    userId: "lmo12",
    employee_id: "LMO-001",
    user_email: "quentin.mp@emaap.gov.in",
    designation: LmoDesignation.INSPECTOR,
    cadre: "Legal Metrology",
    jurisdiction_zone: "Bhopal",
    assigned_wsl_lab: "Bhopal WSL",
    is_nodal_officer: false,
    verification_stamp_code: "MP-INS-001",
    digital_token_id: "MP-TOKEN-001",
    state_code: "MP",
  },
];

export const gatcOfficersData = [
  {
    name: "Federico Fellini",
    fullName: "Federico Fellini",
    email: "fellini@gmail.com",
    mobile: "9000000010",
    registrationRole: "GATC_OFFICER",
    jurisdiction_district: "Nashik",
    jurisdiction_state: "MH",
    password: "eightandahalf",
    passwordHash: generateHash("eightandahalf"),
    centre_code: "GATC-UP-010",
  },
] as any[];

export const allMockUsers: (User | GatcUser | BusinessUser)[] = [
  ...adminUsersData,
  ...gatcUsersData,
  ...gatcOfficersData,
  ...businessUsersData,
  ...lmoUsersData,
];
