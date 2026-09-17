export type ApplicationStatus =
  | "Draft"
  | "Pending Allocation"
  | "In Field Inspection"
  | "Verified"
  | "Expired";

export interface Application {
  id: string;
  instrument: string;
  location: string;
  state: string;
  submitted: string;
  status: ApplicationStatus;
}

export const recentApplications: Application[] = [
  {
    id: "APP-2024-88213",
    instrument: "CNG Dispenser - Multi-Nozzle",
    location: "Andheri East, Mumbai",
    state: "Maharashtra",
    submitted: "12 Mar 2024",
    status: "In Field Inspection",
  },
  {
    id: "APP-2024-88190",
    instrument: "Electronic Weighbridge - 100T",
    location: "Kalamboli, Navi Mumbai",
    state: "Maharashtra",
    submitted: "08 Mar 2024",
    status: "Pending Allocation",
  },
  {
    id: "APP-2024-87965",
    instrument: "Petrol Dispensing Unit - 4 Nozzle",
    location: "Sector 62, Noida",
    state: "Uttar Pradesh",
    submitted: "02 Mar 2024",
    status: "Verified",
  },
  {
    id: "APP-2024-87801",
    instrument: "Digital Platform Scale - 2T",
    location: "Peenya Industrial Area, Bengaluru",
    state: "Karnataka",
    submitted: "24 Feb 2024",
    status: "Draft",
  },
  {
    id: "APP-2023-79422",
    instrument: "LPG Bulk Storage Meter",
    location: "Manali, Chennai",
    state: "Tamil Nadu",
    submitted: "14 Nov 2023",
    status: "Expired",
  },
];

export interface Instrument {
  id: string;
  category: string;
  location: string;
  state: string;
  lastVerified: string;
  expiryDate: string;
  expiryStatus: "ok" | "expiring" | "expired";
}

export const instrumentRepository: Instrument[] = [
  {
    id: "EM-MH-104829",
    category: "CNG Dispenser - Multi-Nozzle",
    location: "Adani Gas - CNG Station #402, Thane",
    state: "Maharashtra",
    lastVerified: "18 Apr 2023",
    expiryDate: "17 Apr 2024",
    expiryStatus: "expiring",
  },
  {
    id: "EM-UP-093122",
    category: "Petrol Dispensing Unit - 6 Nozzle",
    location: "Reliance Petroleum, Sector 18, Noida",
    state: "Uttar Pradesh",
    lastVerified: "02 Jun 2023",
    expiryDate: "01 Jun 2025",
    expiryStatus: "ok",
  },
  {
    id: "EM-KA-071145",
    category: "Electronic Weighbridge - 60T",
    location: "Peenya Industrial Area, Bengaluru",
    state: "Karnataka",
    lastVerified: "22 Jan 2023",
    expiryDate: "21 Jan 2024",
    expiryStatus: "expired",
  },
  {
    id: "EM-GJ-088310",
    category: "LPG Bulk Storage Meter",
    location: "Hazira Industrial Estate, Surat",
    state: "Gujarat",
    lastVerified: "30 Aug 2023",
    expiryDate: "29 Aug 2025",
    expiryStatus: "ok",
  },
  {
    id: "EM-TN-055983",
    category: "Digital Platform Scale - 5T",
    location: "Manali Industrial Zone, Chennai",
    state: "Tamil Nadu",
    lastVerified: "10 May 2023",
    expiryDate: "09 May 2024",
    expiryStatus: "expiring",
  },
];

export const statePendencyData = [
  { state: "Uttar Pradesh", pending: 842 },
  { state: "Maharashtra", pending: 731 },
  { state: "Tamil Nadu", pending: 588 },
  { state: "Gujarat", pending: 512 },
  { state: "Karnataka", pending: 467 },
  { state: "Rajasthan", pending: 401 },
  { state: "West Bengal", pending: 356 },
  { state: "Punjab", pending: 289 },
];

export const verificationTrend = [
  { month: "Sep", verified: 3120 },
  { month: "Oct", verified: 3480 },
  { month: "Nov", verified: 3260 },
  { month: "Dec", verified: 3910 },
  { month: "Jan", verified: 4210 },
  { month: "Feb", verified: 4460 },
  { month: "Mar", verified: 4980 },
];

export interface Gatc {
  id: string;
  name: string;
  categories: string[];
  location: string;
  certValidity: string;
  govtShare: number;
  gatcShare: number;
  revenueYtd: string;
}

export const gatcs: Gatc[] = [
  {
    id: "GATC-0231",
    name: "Precision MetroCert Pvt. Ltd.",
    categories: ["CNG", "Weighbridge"],
    location: "Pune, Maharashtra",
    certValidity: "14 Sep 2026",
    govtShare: 80,
    gatcShare: 20,
    revenueYtd: "₹1.84 Cr",
  },
  {
    id: "GATC-0198",
    name: "NorthZone Calibration Labs",
    categories: ["Fuel Dispenser", "Weights"],
    location: "Gurugram, Haryana",
    certValidity: "02 Feb 2025",
    govtShare: 80,
    gatcShare: 20,
    revenueYtd: "₹2.21 Cr",
  },
  {
    id: "GATC-0176",
    name: "Southern Legal Metrology Testers",
    categories: ["Weighbridge", "Package Weights"],
    location: "Coimbatore, Tamil Nadu",
    certValidity: "29 Nov 2025",
    govtShare: 80,
    gatcShare: 20,
    revenueYtd: "₹1.36 Cr",
  },
  {
    id: "GATC-0142",
    name: "Gujarat Industrial Test Centre",
    categories: ["CNG", "LPG Meter"],
    location: "Vadodara, Gujarat",
    certValidity: "18 Jul 2026",
    govtShare: 80,
    gatcShare: 20,
    revenueYtd: "₹98.5 L",
  },
];

export const pendencyQueue = [
  {
    id: "APP-2024-88213",
    company: "Reliance Retail Ltd.",
    instrument: "CNG Dispenser - Multi-Nozzle",
    state: "Maharashtra",
    daysPending: 4,
    suggestedOfficer: "LMO Sanjay Deshmukh (3.2 km away)",
  },
  {
    id: "APP-2024-88301",
    company: "Adani Total Gas Ltd.",
    instrument: "LPG Bulk Storage Meter",
    state: "Gujarat",
    daysPending: 2,
    suggestedOfficer: "Gujarat Industrial Test Centre (GATC-0142)",
  },
  {
    id: "APP-2024-88276",
    company: "Bharat Petroleum Corp. Ltd.",
    instrument: "Petrol Dispensing Unit - 4 Nozzle",
    state: "Uttar Pradesh",
    daysPending: 9,
    suggestedOfficer: "NorthZone Calibration Labs (GATC-0198)",
  },
  {
    id: "APP-2024-88254",
    company: "Tata Steel Ltd.",
    instrument: "Electronic Weighbridge - 100T",
    state: "Jharkhand",
    daysPending: 6,
    suggestedOfficer: "LMO Priya Ranjan (7.8 km away)",
  },
];

export const notifications = {
  business: [
    {
      title: "Reminder: License for DL-Weighbridge expires in 15 days.",
      time: "2 hours ago",
      tone: "warning" as const,
    },
    {
      title: "Certificate generated for EM-GJ-088310.",
      time: "1 day ago",
      tone: "success" as const,
    },
    {
      title: "Payment received for APP-2024-87965.",
      time: "3 days ago",
      tone: "success" as const,
    },
  ],
  admin: [
    {
      title: "System Alert: High pendency detected in Uttar Pradesh zone.",
      time: "40 minutes ago",
      tone: "error" as const,
    },
    {
      title: "GATC-0198 revenue reconciliation completed.",
      time: "5 hours ago",
      tone: "success" as const,
    },
    {
      title: "12 new applications awaiting allocation.",
      time: "1 day ago",
      tone: "warning" as const,
    },
  ],
  gatc: [
    {
      title: "Complete your GATC recognition application to begin review.",
      time: "Today",
      tone: "warning" as const,
    },
  ],
};
