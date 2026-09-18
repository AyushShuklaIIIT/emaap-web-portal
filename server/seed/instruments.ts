import { InstrumentStatus } from "../generated/prisma/enums";

export const measuringInstrumentsData = [
  {
    serial_number: "HW-WM-001",
    model_approval_no: "MOA-WM-2024-001",
    manufacturer_name: "Hardware Stanley",
    capacity_value: 100,
    capacity_unit: "L/min",
    geo_location:
      "Plot 42, Okhla Industrial Area, Phase-III, New Delhi, Delhi 110020",
    status: InstrumentStatus.VERIFIED,

    business_email: "kubrick@gmail.com",
    category_code: "WATER_METER",
  },

  {
    serial_number: "HW-CT-001",
    model_approval_no: "MOA-CT-2024-002",
    manufacturer_name: "Hardware Stanley",
    capacity_value: 50,
    capacity_unit: "°C",
    geo_location:
      "Plot 42, Okhla Industrial Area, Phase-III, New Delhi, Delhi 110020",
    status: InstrumentStatus.VERIFIED,

    business_email: "kubrick@gmail.com",
    category_code: "CLINICAL_THERMOMETER",
  },

  {
    serial_number: "TK-BS-001",
    model_approval_no: "MOA-BS-2025-001",
    manufacturer_name: "Tarkovsky Dealers",
    capacity_value: 150,
    capacity_unit: "kg",
    geo_location: "Block 2B, 1st Floor, Z Square Mall, Kanpur, Uttar Pradesh",
    status: InstrumentStatus.VERIFIED,

    business_email: "andrei@gmail.com",
    category_code: "BEAM_SCALES_CLASS_C_D",
  },

  {
    serial_number: "TK-TM-001",
    model_approval_no: "MOA-TM-2025-002",
    manufacturer_name: "Tarkovsky Dealers",
    capacity_value: 30,
    capacity_unit: "m",
    geo_location: "Block 2B, 1st Floor, Z Square Mall, Kanpur, Uttar Pradesh",
    status: InstrumentStatus.VERIFIED,

    business_email: "andrei@gmail.com",
    category_code: "FABRIC_PLASTIC_WOVEN_STEEL_TAPES",
  },

  {
    serial_number: "BG-LC-001",
    model_approval_no: "MOA-LC-2025-001",
    manufacturer_name: "Bergman Instruments",
    capacity_value: 500,
    capacity_unit: "kg",
    geo_location:
      "Container Freight Terminal 4, Navi Mumbai, Maharashtra 400703",
    status: InstrumentStatus.VERIFIED,

    business_email: "bergman@gmail.com",
    category_code: "NON_AUTOMATIC_WEIGHING_ELECTRONIC_CLASS_III_IV",
  },

  {
    serial_number: "BG-WB-001",
    model_approval_no: "MOA-WB-2025-002",
    manufacturer_name: "Bergman Instruments",
    capacity_value: 50000,
    capacity_unit: "kg",
    geo_location:
      "Container Freight Terminal 4, Navi Mumbai, Maharashtra 400703",
    status: InstrumentStatus.EXPIRED,

    business_email: "bergman@gmail.com",
    category_code: "HIGH_CAPACITY_WEIGHING_STANDARD_WEIGHTS",
  },
];
