import { BusinessUser, GatcUser, User } from "../types";

export const adminUsersData: User[] = [
  {
    name: "Directorate Admin Central",
    email: "admin.central@emaap.gov.in",
    role: "ADMIN",
    jurisdiction_district: "Central",
    jurisdiction_state: "Central",
  },
  {
    name: "Controller Legal Metrology Maharashtra",
    email: "controller.lm@maharashtra.gov.in",
    role: "ADMIN",
    jurisdiction_state: "Maharashtra",
    jurisdiction_district: "Central",
  },
];

export const gatcUsersData: GatcUser[] = [
  {
    name: "Dr. Christopher Nolan",
    email: "principal@delhi-metrology-lab.com",
    role: "GATC_PRINCIPAL",
    jurisdiction_district: "New Delhi",
    jurisdiction_state: "Delhi",

    centre_code: "GATC-DL-001",
    approval_cert_no: "GOI/ GOVERNMENT APPROVED TEST CENTRE/07/2024/001",
    ind_mark_code: "IND/24/01",
    valid_from: new Date("2024-01-01T00:00:00Z"),
    valid_to: new Date("2029-01-01T00:00:00Z"),
    status: "ACTIVE",
    approved_categories: [
      "Water meter",
      "Clinical Thermometer",
      "Tape Measures",
      "Non-automatic weighing instrument of Accuracy Class-IIII/ Class-III (upto 150kg)",
    ],
    lat: 28.6139,
    long: 77.209,
  },

  {
    name: "David Lynch",
    email: "director@maha-weights.org",
    role: "GATC_PRINCIPAL",
    jurisdiction_district: "Mumbai Suburban",
    jurisdiction_state: "Maharashtra",

    centre_code: "GATC-MH-002",
    approval_cert_no: "GOI/ GOVERNMENT APPROVED TEST CENTRE/27/2025/002",
    ind_mark_code: "IND/25/02",
    valid_from: new Date("2025-06-01T00:00:00Z"),
    valid_to: new Date("2030-05-31T00:00:00Z"),
    status: "ACTIVE",
    approved_categories: [
      "Automatic Rail Weighbridges",
      "Load cell",
      "Beam Scale",
    ],
    lat: 19.076,
    long: 72.8777,
  },
];

export const businessUsersData: BusinessUser[] = [
  {
    user_id: "68abe63f-d9dc-40a4-9225-45fcb3b268bd",
    name: "Stanley Kubrick",
    email: "kubrick@gmail.com",
    role: "BUSINESS",
    jurisdiction_district: "New Delhi",
    jurisdiction_state: "Delhi",

    registration_number: "07AAAAA0000A1Z5",
    trade_name: "Hardware Stanley",
    entity_type: "MANUFACTURER",
    geo_address:
      "Plot 42, Okhla Industrial Area, Phase-III, New Delhi, Delhi 110020",
    state_code: "DL",
  },

  {
    name: "Andrei Tarkovsky",
    email: "andrei@gmail.com",
    role: "BUSINESS",
    jurisdiction_district: "Kanpur",
    jurisdiction_state: "Uttar Pradesh",

    registration_number: "27BBBBB1111B1Z2",
    trade_name: "Tarkovsky Dealers",
    entity_type: "DEALER",
    geo_address: "Block 2b, 1st Floor, Z Square Mall, Kanpur, Uttar Pradesh",
    state_code: "UP",
  },

  {
    name: "Ingmar Bergman",
    email: "bergman@gmail.com",
    role: "BUSINESS",
    jurisdiction_district: "Mumbai Suburban",
    jurisdiction_state: "Maharashtra",

    registration_number: "27CCCCC2222C1Z9",
    trade_name: "Bergman Instruments",
    entity_type: "USER",
    geo_address:
      "Container Freight Terminal 4, Navi Mumbai, Maharashtra 400703",
    state_code: "MH",
  },
];

export const allMockUsers = [
  ...adminUsersData,
  ...gatcUsersData,
  ...businessUsersData,
];
