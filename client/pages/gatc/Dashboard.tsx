import { useMemo } from "react";

import {
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardLayout } from "@/components/emaap/DashboardLayout";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";

import { useGatcDashboard } from "@/hooks/useGatc";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const formatLongDate = (value: string) => {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name: string) => {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

export default function GatcDashboard() {
  const { data, isLoading, isError, error, refetch } = useGatcDashboard();

  const chartData = useMemo(() => {
    return (data?.revenue ?? []).map((item) => ({
      ...item,
      displayDate: formatDate(item.date),
    }));
  }, [data?.revenue]);

  if (isLoading) {
    return (
      <DashboardLayout role="gatc">
        <div className="flex min-h-125 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !data) {
    return (
      <DashboardLayout role="gatc">
        <div className="flex min-h-125 flex-col items-center justify-center gap-4">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Unable to load GATC dashboard."}
          </p>

          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="gatc">
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">GATC Principal Portal</p>

          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>

          <p className="text-sm text-muted-foreground">
            Monitor your GATC centre, officers, assignments and revenue.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Officers
                  </p>

                  <p className="mt-2 text-3xl font-semibold">
                    {data.metrics.total_officers}
                  </p>
                </div>

                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Assigned Officers
                  </p>

                  <p className="mt-2 text-3xl font-semibold">
                    {data.metrics.assigned_officers}
                  </p>
                </div>

                <div className="rounded-lg bg-primary/10 p-2.5">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Free Officers</p>

                  <p className="mt-2 text-3xl font-semibold">
                    {data.metrics.free_officers}
                  </p>
                </div>

                <div className="rounded-lg bg-primary/10 p-2.5">
                  <UserX className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>

                  <p className="mt-2 text-3xl font-semibold">
                    {formatCurrency(data.metrics.total_revenue)}
                  </p>
                </div>

                <div className="rounded-lg bg-primary/10 p-2.5">
                  <CircleDollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Generated</CardTitle>
          </CardHeader>

          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
                No successful payment transactions found.
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="displayDate"
                      tickLine={false}
                      axisLine={false}
                    />

                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        `₹${Number(value).toLocaleString("en-IN")}`
                      }
                    />

                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      labelFormatter={(_, payload) => {
                        const item = payload?.[0]?.payload;

                        return item?.date ? formatLongDate(item.date) : "";
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="revenue"
                      fill="currentColor"
                      fillOpacity={0.12}
                      stroke="currentColor"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>GATC Centre</CardTitle>

            <p className="text-sm text-muted-foreground">
              {data.gatc.centre_code}
            </p>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Approval Certificate
                </p>

                <p className="mt-1 text-sm font-medium">
                  {data.gatc.approval_cert_no}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">IND Mark Code</p>

                <p className="mt-1 text-sm font-medium">
                  {data.gatc.ind_mark_code}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Status</p>

                <div className="mt-1">
                  <Badge variant="outline">{data.gatc.status}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Officers</CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Officers registered by this Principal Officer.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Officer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {data.officers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-32 text-center text-sm text-muted-foreground"
                      >
                        No GATC officers have been registered yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.officers.map((officer) => (
                      <TableRow key={officer.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {getInitials(officer.full_name)}
                            </div>

                            <div>
                              <p className="font-medium">{officer.full_name}</p>

                              <p className="text-xs text-muted-foreground">
                                {officer.is_active ? "Active" : "Inactive"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>{officer.email}</TableCell>

                        <TableCell>{officer.mobile}</TableCell>

                        <TableCell>{officer.employee_id ?? "—"}</TableCell>

                        <TableCell>
                          {officer.status === "ASSIGNED" ? (
                            <Badge className="gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Assigned
                            </Badge>
                          ) : (
                            <Badge variant="outline">Free</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
