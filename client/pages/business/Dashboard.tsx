import { Link } from "react-router-dom";
import { Boxes, Clock, Hourglass, Plus, Search } from "lucide-react";
import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { KpiCard } from "@/components/emaap/KpiCard";
import { StatusPill } from "@/components/emaap/StatusPill";
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
import { recentApplications } from "@/lib/emaap-data";

export default function BusinessDashboard() {
  return (
    <DashboardLayout role="business">
      <div className="flex flex-col gap-7">
      <div className="flex flex-col justify-between gap-4 rounded-xl bg-linear-to-r from-primary to-[#0d4bad] p-4 text-white sm:flex-row sm:items-center sm:p-6">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              Welcome, Reliance Retail Ltd.
            </h1>
            <p className="mt-1 text-sm text-white/75">
              CIN: L99999MH1973PLC019786 · 214 registered instruments across 18
              states
            </p>
          </div>
          <Button
            asChild
            className="bg-saffron text-saffron-foreground hover:bg-saffron/90"
          >
            <Link to="/business/new-application">
              <Plus className="mr-1.5 h-4 w-4" /> New Verification Application
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            label="Active Instruments"
            value="182"
            icon={Boxes}
            tone="success"
            trend={{ value: "+6.2%", positive: true }}
          />
          <KpiCard
            label="Expiring in 30 Days"
            value="14"
            icon={Clock}
            tone="warning"
            trend={{ value: "+3", positive: false }}
          />
          <KpiCard
            label="Total Applications Pendency"
            value="9"
            icon={Hourglass}
            tone="primary"
            trend={{ value: "-2 this week", positive: true }}
          />
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex flex-col justify-between gap-3 border-b border-border p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Recent Applications
              </h2>
              <p className="text-sm text-muted-foreground">
                Track the status of your submitted verification requests.
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search application ID..."
                className="w-full pl-8 sm:w-64"
              />
            </div>
          </div>
          <Table className="mobile-card-table">
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Instrument</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium text-foreground">
                    {app.id}
                  </TableCell>
                  <TableCell>{app.instrument}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {app.location}, {app.state}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {app.submitted}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={app.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground">
            <span>Showing 5 of 42 applications</span>
            <Button asChild variant="link" className="text-primary">
              <Link to="/business/instruments">View all instruments →</Link>
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
