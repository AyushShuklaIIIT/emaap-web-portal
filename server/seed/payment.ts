export const paymentReceiptsData = [
  {
    receipt_no: "REC-2026-0001",

    transaction_id: "TXN-99823145",
    transaction_date: new Date("2026-08-20T10:15:00Z"),
    payment_method: "NET_BANKING",

    due_date: new Date("2026-08-25T23:59:59Z"),

    statutory_fee: 5000,
    carriage_charges: 0,
    adjusting_charges: 0,
    total_amount: 5000,

    govt_share: 3500,
    gatc_share: 1500,

    payment_status: "SUCCESS",

    application_no: "EMAAP-VER-2026-0003",
  },

  {
    receipt_no: "REC-2026-0002",

    transaction_id: "TXN-99781102",
    transaction_date: new Date("2026-07-15T09:30:00Z"),
    payment_method: "UPI",

    due_date: new Date("2026-07-20T23:59:59Z"),

    statutory_fee: 500,
    carriage_charges: 0,
    adjusting_charges: 0,
    total_amount: 500,

    govt_share: 350,
    gatc_share: 150,

    payment_status: "SUCCESS",

    application_no: "EMAAP-VER-2026-0004",
  },

  {
    receipt_no: "REC-2026-0003",

    transaction_id: "TXN-99750011",
    transaction_date: new Date("2026-07-14T11:45:00Z"),
    payment_method: "UPI",

    due_date: new Date("2026-07-18T23:59:59Z"),

    statutory_fee: 500,
    carriage_charges: 0,
    adjusting_charges: 0,
    total_amount: 500,

    govt_share: 350,
    gatc_share: 150,

    payment_status: "FAILED",

    application_no: "EMAAP-VER-2026-0005",
  },

  {
    receipt_no: "REC-2026-0004",

    transaction_id: null,
    transaction_date: null,
    payment_method: null,

    due_date: new Date("2026-09-25T23:59:59Z"),

    statutory_fee: 20000,
    carriage_charges: 0,
    adjusting_charges: 0,
    total_amount: 20000,

    govt_share: 14000,
    gatc_share: 6000,

    payment_status: "PENDING",

    application_no: "EMAAP-VER-2026-0006",
  },
];
