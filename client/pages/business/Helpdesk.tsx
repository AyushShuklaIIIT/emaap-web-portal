import { useMemo, useState } from "react";
import { BookOpen, Mail, Phone, Plus, Search } from "lucide-react";
import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const tickets = [
  {
    id: "TKT-89012",
    date: "02 Sep 2026",
    category: "Payment Issue",
    subject: "Fee paid for CNG Dispenser but application status shows pending.",
    status: "Open",
  },
  {
    id: "TKT-88745",
    date: "28 Aug 2026",
    category: "Field Inspection",
    subject:
      "Assigned GATC-MH-04 did not visit the site on the scheduled date.",
    status: "In Progress",
  },
  {
    id: "TKT-81200",
    date: "10 Jul 2026",
    category: "Technical Error",
    subject: "Unable to download digital certificate PDF; receiving 404 error.",
    status: "Resolved",
  },
];

function ContactCard({
  icon: Icon,
  title,
  value,
  subtext,
  children,
}: {
  icon: typeof Phone;
  title: string;
  value: string;
  subtext: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#E0E0E0] bg-white p-5 shadow-card">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-[#0B3D91]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-bold text-[#1A1A2E]">{title}</h3>
      {children ?? (
        <p className="mt-2 text-base font-semibold text-[#0B3D91]">{value}</p>
      )}
      <p className="mt-1 text-xs leading-5 text-[#5C5C70]">{subtext}</p>
    </div>
  );
}

export default function Helpdesk() {
  const [query, setQuery] = useState("");
  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return tickets;
    return tickets.filter((ticket) =>
      `${ticket.id} ${ticket.category} ${ticket.subject}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query]);

  return (
    <DashboardLayout role="business">
      <section className="mx-auto max-w-310 overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        <div className="flex flex-col justify-between gap-4 px-7 pb-6 pt-7 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E]">
            Helpdesk &amp; Support
          </h1>
          <Button className="h-10 w-fit rounded-lg bg-[#FF6F00] px-4 font-bold text-white shadow-none hover:bg-[#E66000]">
            <Plus className="mr-1.5 h-4 w-4" /> Raise New Ticket
          </Button>
        </div>

        <div className="border-t border-[#E8E9EC]" />

        <div className="px-7 pb-8 pt-7">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ContactCard
              icon={Phone}
              title="National Toll-Free Helpline"
              value="1800-11-4000"
              subtext="Mon-Sat, 9:00 AM to 6:00 PM"
            />
            <ContactCard
              icon={Mail}
              title="Technical Support"
              value="support-emaap@nic.in"
              subtext="Average response time: 24-48 hours"
            />
            <ContactCard
              icon={BookOpen}
              title="Knowledge Base & FAQs"
              value="View User Manuals"
              subtext="Guides for applications, payments & renewals"
            >
              <button className="mt-2 text-left text-base font-semibold text-[#0B3D91] hover:underline">
                View User Manuals
              </button>
            </ContactCard>
          </div>

          <div className="mt-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-lg font-bold text-[#0B3D91]">
              My Support Tickets
            </h2>
            <div className="relative sm:w-72.5">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A98]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tickets by ID or keyword..."
                className="h-10 rounded-lg border-[#E0E0E0] pl-9 text-sm shadow-none hover:border-primary focus-visible:border-primary focus-visible:ring-primary/15"
              />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-[#E0E0E0]">
            <div className="overflow-x-auto">
              <Table className="min-w-230">
                <TableHeader>
                  <TableRow className="border-b border-[#E0E0E0] bg-[#F5F7FA] hover:bg-[#F5F7FA]">
                    <TableHead className="h-12 px-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Ticket ID &amp; Date
                    </TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Category
                    </TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Subject
                    </TableHead>
                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Status
                    </TableHead>
                    <TableHead className="h-12 pr-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="border-b border-[#E8E9EC] hover:bg-[#FAFBFC]"
                    >
                      <TableCell className="px-5 py-5 align-top">
                        <p className="font-semibold text-[#1A1A2E]">
                          {ticket.id}
                        </p>
                        <p className="mt-1 text-xs text-[#5C5C70]">
                          {ticket.date}
                        </p>
                      </TableCell>
                      <TableCell className="py-5 align-top text-sm font-medium text-[#1A1A2E]">
                        {ticket.category}
                      </TableCell>
                      <TableCell className="max-w-82.5 py-5 align-top text-sm leading-5 text-[#1A1A2E]">
                        {ticket.subject}
                      </TableCell>
                      <TableCell className="py-5 align-top">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            ticket.status === "Open"
                              ? "bg-[#F9A825] text-[#1A1A2E]"
                              : ticket.status === "In Progress"
                                ? "bg-[#E3F2FD] text-[#0B3D91]"
                                : "bg-[#1E8E3E] text-white"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </TableCell>
                      <TableCell className="pr-5 py-5 align-top">
                        <Button
                          variant="ghost"
                          className="h-9 px-2 text-xs font-semibold text-[#0B3D91] hover:bg-primary/5 hover:text-[#0B3D91]"
                        >
                          View Ticket
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTickets.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-12 text-center text-sm text-[#5C5C70]"
                      >
                        No tickets match your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#E8E9EC] px-5 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[#5C5C70]">
                Showing 1 to 3 of 12 tickets
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="h-9 text-sm text-[#5C5C70] hover:text-[#0B3D91]"
                >
                  &lt; Previous
                </Button>
                <Button
                  variant="ghost"
                  className="h-9 font-semibold text-[#0B3D91] hover:bg-primary/5"
                >
                  Next &gt;
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
