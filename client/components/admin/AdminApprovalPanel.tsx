import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, FileText, Image as ImageIcon, LoaderCircle, Search, XCircle } from "lucide-react";
import { useGatewayApi } from "@/contexts/GatewayApiContext";
import { backendUrl } from "@/lib/backend-url";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type RoleFilter = "ALL" | "STAKEHOLDER" | "ADMIN" | "GATC_OPERATOR";

interface RegistrationDocument {
  id: string;
  docType: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  uploadedAt: string;
}

interface RegistrationApplication {
  id: string;
  role: Exclude<RoleFilter, "ALL">;
  status: string;
  submittedAt: string;
  rejectionReason?: string | null;
  user: {
    user_id: string;
    fullName?: string | null;
    email: string;
    mobile: string;
    businessName?: string | null;
    jurisdiction_state?: string | null;
    uploadedDocs: RegistrationDocument[];
  };
}

interface QueueResponse {
  applications: RegistrationApplication[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

const roleLabels: Record<Exclude<RoleFilter, "ALL">, string> = {
  STAKEHOLDER: "Stakeholder",
  ADMIN: "Admin", 
  GATC_OPERATOR: "LMO / GATC",
};

export function AdminApprovalPanel() {
  const { request, isLoading } = useGatewayApi();
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [search, setSearch] = useState("");
  const [queue, setQueue] = useState<QueueResponse>({ applications: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });
  const [selected, setSelected] = useState<RegistrationApplication | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionError, setActionError] = useState<string>();

  const loadQueue = useCallback(async () => {
    const query = new URLSearchParams({ page: "1", pageSize: "50" });
    if (role !== "ALL") query.set("role", role);
    const result = await request<RegistrationApplication[] & QueueResponse["pagination"]>({
      endpoint: `/api/v1/admin/registrations/pending?${query.toString()}`,
      method: "GET",
      headers: adminHeaders(),
    });
    const response = result as unknown as QueueResponse;
    setQueue({
      applications: Array.isArray(result) ? result : (response.applications ?? []),
      pagination: response.pagination ?? { page: 1, pageSize: 50, total: 0, totalPages: 0 },
    });
  }, [request, role]);

  useEffect(() => {
    void loadQueue().catch((error) => setActionError(error instanceof Error ? error.message : "Unable to load registrations"));
  }, [loadQueue]);

  const filteredApplications = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return queue.applications;
    return queue.applications.filter((application) =>
      [application.id, application.user.fullName, application.user.email, application.user.businessName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [queue.applications, search]);

  const approve = async () => {
    if (!selected) return;
    setActionError(undefined);
    try {
      await request({ endpoint: `/api/v1/admin/registrations/${selected.id}/approve`, method: "POST", headers: adminHeaders() });
      setSelected(null);
      await loadQueue();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to approve registration");
    }
  };

  const reject = async () => {
    if (!selected || !rejectionReason.trim()) return;
    setActionError(undefined);
    try {
      await request({
        endpoint: `/api/v1/admin/registrations/${selected.id}/reject`,
        method: "POST",
        headers: adminHeaders(),
        data: { rejectionReason: rejectionReason.trim() },
      });
      setRejecting(false);
      setRejectionReason("");
      setSelected(null);
      await loadQueue();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to reject registration");
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Registration approvals</h1>
          <p className="mt-1 text-sm text-[#5C5C70]">Review identity documents before activating access.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select value={role} onChange={(event) => setRole(event.target.value as RoleFilter)} className="h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm">
            <option value="ALL">All supported roles</option>
            <option value="STAKEHOLDER">Stakeholder</option>
            <option value="ADMIN">Admin</option>
            <option value="GATC_OPERATOR">LMO / GATC</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search applicant" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </div>
      </div>
      {actionError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">{actionError}</p>}
      <div className="overflow-hidden rounded-lg border border-[#E0E0E0] bg-white">
        <Table>
          <TableHeader><TableRow><TableHead>Applicant</TableHead><TableHead>Role</TableHead><TableHead>Submitted</TableHead><TableHead>Documents</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="py-10 text-center"><LoaderCircle className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>}
            {!isLoading && filteredApplications.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No pending registrations found.</TableCell></TableRow>}
            {filteredApplications.map((application) => (
              <TableRow key={application.id}>
                <TableCell><p className="font-medium">{application.user.fullName ?? "Unnamed applicant"}</p><p className="text-xs text-muted-foreground">{application.user.email}</p></TableCell>
                <TableCell>{roleLabels[application.role]}</TableCell>
                <TableCell>{new Date(application.submittedAt).toLocaleDateString()}</TableCell>
                <TableCell>{application.user.uploadedDocs.length}</TableCell>
                <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => setSelected(application)}><Eye className="mr-2 h-4 w-4" />Review</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(selected) && !rejecting} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader><DialogTitle>Review registration</DialogTitle><DialogDescription>Applicant details and uploaded documents.</DialogDescription></DialogHeader>
          {selected && <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3 rounded-lg border p-4">
              <Detail label="Full name" value={selected.user.fullName} />
              <Detail label="Email" value={selected.user.email} />
              <Detail label="Mobile" value={selected.user.mobile} />
              <Detail label="Role" value={roleLabels[selected.role]} />
              <Detail label="Business" value={selected.user.businessName} />
              <Detail label="Jurisdiction" value={selected.user.jurisdiction_state} />
              <div><p className="text-xs font-medium text-muted-foreground">Application ID</p><p className="break-all text-sm">{selected.id}</p></div>
            </div>
            <DocumentPreview documents={selected.user.uploadedDocs} />
          </div>}
          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={() => setRejecting(true)}><XCircle className="mr-2 h-4 w-4" />Reject with Comments</Button>
            <Button onClick={approve}><CheckCircle2 className="mr-2 h-4 w-4" />Approve &amp; Activate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject registration</DialogTitle><DialogDescription>Provide a reason that the applicant can act on.</DialogDescription></DialogHeader>
          <Label htmlFor="rejection-reason">Comments</Label>
          <textarea id="rejection-reason" className="min-h-28 rounded-md border p-3 text-sm" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Explain what needs correction..." />
          <DialogFooter><Button variant="outline" onClick={() => setRejecting(false)}>Cancel</Button><Button variant="destructive" disabled={!rejectionReason.trim()} onClick={reject}>Reject registration</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function adminHeaders() {
  return {};
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="text-sm">{value || "—"}</p></div>;
}

function DocumentPreview({ documents }: { documents: RegistrationDocument[] }) {
  const [active, setActive] = useState<RegistrationDocument | undefined>(documents[0]);
  const [source, setSource] = useState("");

  useEffect(() => {
    if (!active) {
      setSource("");
      return;
    }
    
    let url = active.storagePath;
    // Upgrade HTTP to HTTPS to prevent mixed content blocking in iframes/embeds
    if (url.startsWith("http://")) {
      url = url.replace("http://", "https://");
    }
    
    // If it's a PDF but the URL lacks the .pdf extension (e.g. legacy uploads),
    // append .pdf so Cloudinary sets the correct application/pdf MIME type.
    if (active.fileType === "application/pdf" && !url.toLowerCase().endsWith(".pdf")) {
      url = `${url}.pdf`;
    }
    
    setSource(url);
  }, [active]);

  if (!documents.length) return <div className="rounded-lg border p-6 text-sm text-muted-foreground">No uploaded documents.</div>;
  return <div className="space-y-3 rounded-lg border p-4">
    <div className="flex flex-wrap gap-2">{documents.map((document) => <Button key={document.id} type="button" variant={active?.id === document.id ? "default" : "outline"} size="sm" onClick={() => setActive(document)}>{document.fileType.startsWith("image/") ? <ImageIcon className="mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}{document.docType}</Button>)}</div>
    <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-md bg-muted/30 p-2 relative group">
      {active?.fileType.startsWith("image/") ? (
        <img src={source} alt={active.fileName} className="max-h-[55vh] max-w-full object-contain" />
      ) : (
        <embed 
          src={source} 
          type="application/pdf" 
          className="h-[55vh] w-full rounded border bg-white" 
        />
      )}
      
      {!active?.fileType.startsWith("image/") && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="secondary" size="sm" onClick={() => window.open(source, "_blank")}>
            Open PDF in new tab
          </Button>
        </div>
      )}
    </div>
    <p className="truncate text-xs text-muted-foreground">{active?.fileName} · {active ? (active.fileSize / 1024).toFixed(0) : 0} KB</p>
  </div>;
}
