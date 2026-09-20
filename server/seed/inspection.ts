import { InspectionData } from "../types";

export const inspectionRecordsData: InspectionData[] = [
  {
    inspection_date: new Date("2026-09-10T10:30:00Z"),
    time_taken_minutes: 35,
    inspection_mode: "LAB",
    test_verdict: "PASS",

    geo_latitude: 19.076,
    geo_longitude: 72.8777,

    application_no: "EMAAP-VER-2026-0003",
    inspector_email: "director@maha-weights.org",
  },

  {
    inspection_date: new Date("2026-09-08T14:15:00Z"),
    time_taken_minutes: 42,
    inspection_mode: "FIELD_OFFLINE",
    test_verdict: "FAIL",

    geo_latitude: 26.4499,
    geo_longitude: 80.3319,

    application_no: "EMAAP-VER-2026-0004",
    inspector_email: "director@maha-weights.org",
  },

  {
    inspection_date: new Date("2026-09-18T10:00:00Z"),
    time_taken_minutes: 30,
    inspection_mode: "FIELD_OFFLINE",
    test_verdict: "PASS",

    geo_latitude: 28.5355,
    geo_longitude: 77.2732,

    application_no: "EMAAP-VER-2026-0005",
    inspector_email: "director@maha-weights.org",
  },
];
