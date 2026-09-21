import { scryptSync } from "node:crypto";

import { User, GatcUser, BusinessUser } from "../types";

function generateHash(password: string): string {
  return `mock-salt:${scryptSync(password, "mock-salt", 64).toString("hex")}`;
}

export const adminUsersData: User[] = [
  {
    name: "Directorate Admin Central",
    fullName: "Directorate Admin Central",
    email: "admin.central@emaap.gov.in",
    mobile: "9000000001",
    role: "ADMIN",
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
    role: "ADMIN",
    registrationRole: "ADMIN",
    jurisdiction_state: "Maharashtra",
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
    role: "GATC_PRINCIPAL",
    registrationRole: "GATC_OPERATOR",
    jurisdiction_district: "New Delhi",
    jurisdiction_state: "Delhi",
    password: "memento",
    passwordHash: generateHash("memento"),
    centre_code: "GATC-DL-001",
    approval_cert_no: "GOI/GOVERNMENT APPROVED TEST CENTRE/07/2024/001",
    ind_mark_code: "IND/24/01",
    valid_from: new Date("2024-01-01T00:00:00Z"),
    valid_to: new Date("2029-01-01T00:00:00Z"),
    status: "ACTIVE",
    approved_categories: [
      "WATER_METERS",
      "CLINICAL_THERMOMETERS",
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
    role: "GATC_PRINCIPAL",
    registrationRole: "GATC_OPERATOR",
    jurisdiction_district: "Mumbai Suburban",
    jurisdiction_state: "Maharashtra",
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
];

export const businessUsersData: BusinessUser[] = [
  {
    name: "Stanley Kubrick",
    fullName: "Stanley Kubrick",
    email: "kubrick@gmail.com",
    mobile: "9000000005",
    role: "BUSINESS",
    registrationRole: "STAKEHOLDER",
    jurisdiction_district: "New Delhi",
    jurisdiction_state: "Delhi",
    password: "2001",
    passwordHash: generateHash("2001"),
    registration_number: "07AAAAA0000A1Z5",
    trade_name: "Hardware Stanley",
    entity_type: "MANUFACTURER",
    geo_address:
      "Plot 42, Okhla Industrial Area, Phase-III, New Delhi, Delhi 110020",
    state_code: "DL",
  },
  {
    name: "Andrei Tarkovsky",
    fullName: "Andrei Tarkovsky",
    email: "andrei@gmail.com",
    mobile: "9000000006",
    role: "BUSINESS",
    registrationRole: "STAKEHOLDER",
    jurisdiction_district: "Kanpur",
    jurisdiction_state: "Uttar Pradesh",
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
    role: "BUSINESS",
    registrationRole: "STAKEHOLDER",
    jurisdiction_district: "Mumbai Suburban",
    jurisdiction_state: "Maharashtra",
    password: "seventhseal",
    passwordHash: generateHash("seventhseal"),
    registration_number: "27CCCCC2222C1Z9",
    trade_name: "Bergman Instruments",
    entity_type: "USER",
    geo_address:
      "Container Freight Terminal 4, Navi Mumbai, Maharashtra 400703",
    state_code: "MH",
  },
];

export const allMockUsers: (User | GatcUser | BusinessUser)[] = [
  ...adminUsersData,
  ...gatcUsersData,
  ...businessUsersData,
];
