import { FormEvent, useState } from "react";
import { CheckCircle2, Copy, Loader2, UserPlus } from "lucide-react";
import { DashboardLayout } from "@/components/emaap/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegisterGatcOfficer } from "@/hooks/useGatc";

interface FormState {
  fullName: string;
  email: string;
  mobile: string;
  employeeId: string;
}

const initialForm: FormState = {
  fullName: "",
  email: "",
  mobile: "",
  employeeId: "",
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return error instanceof Error ? error.message : fallback;
};

export default function GatcRegistration() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [temporaryPassword, setTemporaryPassword] = useState("");

  const mutation = useRegisterGatcOfficer();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setTemporaryPassword("");

    try {
      const result = await mutation.mutateAsync(form);

      setTemporaryPassword(result.temporary_password);

      setForm(initialForm);
    } catch {
      return;
    }
  };

  const copyPassword = async () => {
    if (!temporaryPassword) {
      return;
    }

    await navigator.clipboard.writeText(temporaryPassword);
  };

  return (
    <DashboardLayout role="gatc">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">GATC Principal Portal</p>

          <h1 className="text-2xl font-semibold">Officer Registration</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Register an officer for your GATC centre.
          </p>
        </div>

        {temporaryPassword && (
          <Card className="border-primary/30">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    Officer registered successfully
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Give the temporary password to the officer. It is shown here
                    only after registration.
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <div className="rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                      {temporaryPassword}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copyPassword}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {mutation.isError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {getErrorMessage(mutation.error, "Officer registration failed.")}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>

              <div>
                <CardTitle>Register GATC Officer</CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the official officer details.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>

                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>

                  <Input
                    id="employeeId"
                    value={form.employeeId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        employeeId: event.target.value,
                      }))
                    }
                    placeholder="Enter employee ID"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>

                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="officer@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>

                  <Input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.mobile}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        mobile: event.target.value.replace(/\D/g, ""),
                      }))
                    }
                    placeholder="10-digit mobile number"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Register Officer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
