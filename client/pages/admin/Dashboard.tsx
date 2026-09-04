import { ArrowUpRight, Download, Radio } from "lucide-react";
import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";

const kpis = [
  {
    title: "Total Revenue Collected",
    value: "₹84.5 Cr",
    detail: "Govt: ₹67.6 Cr | GATCs: ₹16.9 Cr (80:20 Split)",
    accent: "text-[#1A1A2E]",
    trend: "+12% YoY",
  },
  {
    title: "Active GATCs & LMOs",
    value: "412 Units",
    detail: "25 newly authorized under 2026 rules",
    accent: "text-[#1A1A2E]",
  },
  {
    title: "National Pendency Rate",
    value: "8.4%",
    detail: "Alert: High backlog detected in Uttar Pradesh",
    accent: "text-[#F9A825]",
  },
  {
    title: "Total Instruments Verified",
    value: "1.24 Million",
    detail: "100% Cryptographically Secured",
    accent: "text-[#1E8E3E]",
  },
];

const linePoints = {
  lmo: "38,148 104,131 170,116 236,122 302,91 368,72",
  gatc: "38,164 104,153 170,145 236,149 302,130 368,111",
};

const routingRows = [
  "APP-8842 (CNG Dispenser) → Auto-assigned to GATC-MH-04 (Distance: 4.2 km)",
  "APP-8843 (Weighbridge) → Auto-assigned to LMO-HR-12 (Distance: 12.1 km)",
  "APP-8844 (Retail Scale) → Auto-assigned to LMO-UP-02 (Distance: 1.5 km)",
];

export default function AdminDashboard() {
  return (
    <DashboardLayout role="admin">
      <section className="mx-auto max-w-[1280px]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E]">
              Pan-India Executive Overview
            </h1>
            <p className="mt-1 text-sm text-[#5C5C70]">
              National compliance, revenue and field operations at a glance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none hover:border-primary focus:border-primary">
              <option>Region: All India</option>
              <option>Region: North Zone</option>
              <option>Region: South Zone</option>
            </select>
            <select className="h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A2E] outline-none hover:border-primary focus:border-primary">
              <option>Financial Year: 2026-2027</option>
              <option>Financial Year: 2025-2026</option>
            </select>
            <Button className="h-10 rounded-lg bg-[#FF6F00] font-bold text-white shadow-none hover:bg-[#E66000]">
              <Download className="mr-1.5 h-4 w-4" /> Export Report
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.title} className="rounded-lg border border-[#E0E0E0] bg-white p-5 shadow-card">
              <p className="text-sm font-medium text-[#5C5C70]">{kpi.title}</p>
              <p className={`mt-3 text-2xl font-extrabold tracking-tight ${kpi.accent}`}>
                {kpi.value}
              </p>
              <p className="mt-2 min-h-10 text-xs leading-5 text-[#5C5C70]">{kpi.detail}</p>
              {kpi.trend && (
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#1E8E3E]">
                  <ArrowUpRight className="h-3.5 w-3.5" /> {kpi.trend}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[3fr_2fr]">
          <div className="rounded-lg border border-[#E0E0E0] bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#0B3D91]">Monthly Verification Volume (YTD)</h2>
                <p className="mt-1 text-xs text-[#5C5C70]">Instrument verifications completed by channel</p>
              </div>
              <div className="flex gap-3 text-[11px] text-[#5C5C70]">
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#0B3D91]" /> LMO</span>
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#FF6F00]" /> GATC</span>
              </div>
            </div>
            <div className="mt-5 h-[230px] w-full">
              <svg viewBox="0 0 410 205" className="h-full w-full" role="img" aria-label="Monthly verification volume line chart">
                {[35, 75, 115, 155].map((y) => (
                  <line key={y} x1="38" y1={y} x2="388" y2={y} stroke="#E8E9EC" strokeWidth="1" />
                ))}
                <line x1="38" y1="155" x2="388" y2="155" stroke="#BFC4CC" strokeWidth="1" />
                <text x="5" y="39" fill="#8A8A98" fontSize="10">300k</text>
                <text x="8" y="79" fill="#8A8A98" fontSize="10">200k</text>
                <text x="8" y="119" fill="#8A8A98" fontSize="10">100k</text>
                <text x="21" y="159" fill="#8A8A98" fontSize="10">0</text>
                <polyline points={linePoints.lmo} fill="none" stroke="#0B3D91" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points={linePoints.gatc} fill="none" stroke="#FF6F00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {linePoints.lmo.split(" ").map((point) => {
                  const [cx, cy] = point.split(",");
                  return <circle key={`lmo-${point}`} cx={cx} cy={cy} r="3.5" fill="white" stroke="#0B3D91" strokeWidth="2" />;
                })}
                {linePoints.gatc.split(" ").map((point) => {
                  const [cx, cy] = point.split(",");
                  return <circle key={`gatc-${point}`} cx={cx} cy={cy} r="3.5" fill="white" stroke="#FF6F00" strokeWidth="2" />;
                })}
                {[
                  [38, "Apr"], [104, "May"], [170, "Jun"], [236, "Jul"], [302, "Aug"], [368, "Sep"],
                ].map(([x, month]) => <text key={month} x={x} y="181" textAnchor="middle" fill="#8A8A98" fontSize="10">{month}</text>)}
              </svg>
            </div>
          </div>

          <div className="rounded-lg border border-[#E0E0E0] bg-white p-5 shadow-card">
            <div>
              <h2 className="text-base font-bold text-[#0B3D91]">Critical Pendency by State</h2>
              <p className="mt-1 text-xs text-[#5C5C70]">Applications awaiting field action</p>
            </div>
            <div className="mt-7 space-y-5">
              {[
                ["UP", "84%", "bg-[#D32F2F]", "High"],
                ["MH", "62%", "bg-[#F9A825]", "Medium"],
                ["DL", "36%", "bg-[#1E8E3E]", "Normal"],
                ["GJ", "28%", "bg-[#1E8E3E]", "Normal"],
              ].map(([state, width, color, severity]) => (
                <div key={state}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1A1A2E]">{state}</span>
                    <span className="text-[#5C5C70]">{severity}</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#F0F1F3]">
                    <div className={`h-3 rounded-full ${color}`} style={{ width }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-7 flex gap-4 border-t border-[#E8E9EC] pt-4 text-[11px] text-[#5C5C70]">
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#D32F2F]" /> High</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#F9A825]" /> Medium</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#1E8E3E]" /> Normal</span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-[#E0E0E0] bg-white shadow-card">
          <div className="flex items-center gap-2 border-b border-[#E8E9EC] px-5 py-4">
            <Radio className="h-4 w-4 animate-pulse text-[#1E8E3E]" />
            <h2 className="text-base font-bold text-[#0B3D91]">Live Algorithmic Allocations</h2>
            <span className="text-xs text-[#1E8E3E]">Live Data</span>
          </div>
          <div className="divide-y divide-[#E8E9EC]">
            {routingRows.map((row) => (
              <div key={row} className="flex flex-col gap-2 px-5 py-4 text-sm text-[#1A1A2E] sm:flex-row sm:items-center sm:justify-between">
                <span>{row}</span>
                <span className="w-fit rounded-full bg-[#E8F5E9] px-2.5 py-1 text-xs font-bold text-[#1E8E3E]">Dispatched</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
