import { DigitalCertificateData } from "../types";

export const digitalCertificatesData: DigitalCertificateData[] = [
  {
    certificate_no: "EMAAP-CERT-2026-0001",
    stamping_quarter_code: "Q3-2026",

    issue_date: new Date("2026-09-10T11:30:00Z"),
    expiry_date: new Date("2027-09-10T23:59:59Z"),

    sha256_hash:
      "8f14e45fceea167a5a36dedd4bea2543f8c4b3f9e6f7a8c1d2e3f4a5b6c7d8e9",

    dynamic_qr_url: "https://emaap.gov.in/verify/EMAAP-CERT-2026-0001",

    rejection_reason: null,

    application_no: "EMAAP-VER-2026-0003",
  },
  {
    certificate_no: "EMAAP-CERT-2026-0002",
    stamping_quarter_code: "Q3-2026",

    issue_date: new Date("2026-09-18T11:00:00Z"),
    expiry_date: new Date("2027-09-18T23:59:59Z"),

    sha256_hash:
      "4a7d1ed414474e4033ac29ccb8653d9b7b7e5f4f3c2d1a0e9f8e7d6c5b4a3928",

    dynamic_qr_url: "https://emaap.gov.in/verify/EMAAP-CERT-2026-0002",

    rejection_reason: null,

    application_no: "EMAAP-VER-2026-0005",
  },
];
