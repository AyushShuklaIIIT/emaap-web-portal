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

import { useBusinessDashboard } from "@/hooks/useBusinessDashboard";

export default function BusinessDashboard({ userId }: { userId: string }) {
  const { dashboard, applications, isLoading, isError } =
    useBusinessDashboard(userId);

  if (isLoading) {
    return (
      <DashboardLayout role="business">
        <div className="flex min-h-100 items-center justify-center">
          Loading dashboard...
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !dashboard) {
    return (
      <DashboardLayout role="business">
        <div className="flex min-h-100 items-center justify-center text-red-500">
          Failed to load dashboard.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="business">
      <div className="flex flex-col gap-7">
        <div className="flex flex-col justify-between gap-4 rounded-xl bg-linear-to-r from-primary to-[#0d4bad] p-4 text-white sm:flex-row sm:items-center sm:p-6">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              Business Dashboard
            </h1>

            <p className="mt-1 text-sm text-white/75">
              Manage your instruments and verification applications.
            </p>
          </div>

          <Button
            asChild
            className="bg-saffron text-saffron-foreground hover:bg-saffron/90"
          >
            <Link to="/business/new-application">
              <Plus className="mr-1.5 h-4 w-4" />
              New Verification Application
            </Link>
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            label="Active Instruments"
            value={dashboard.active_instruments}
            icon={Boxes}
            tone="success"
          />

          <KpiCard
            label="Expiring in 30 Days"
            value={dashboard.expires_in}
            icon={Clock}
            tone="warning"
          />

          <KpiCard
            label="Total Applications Pendency"
            value={dashboard.pending}
            icon={Hourglass}
            tone="primary"
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
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.app_id}>
                  <TableCell className="font-medium text-foreground">
                    {application.application_no}
                  </TableCell>

                  <TableCell>
                    {application.instrument.category.category_name}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {new Date(
                      application.submission_timestamp,
                    ).toLocaleDateString()}
                  </TableCell>

                  <TableCell>
                    <StatusPill status={application.workflow_status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground">
            <span>Showing {applications.length} applications</span>

            <Button asChild variant="link" className="text-primary">
              <Link to="/business/applications">View all applications →</Link>
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
