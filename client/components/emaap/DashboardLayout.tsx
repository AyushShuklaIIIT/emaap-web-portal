import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus2,
  Boxes,
  Wallet,
  QrCode,
  LifeBuoy,
  ListChecks,
  Building2,
  BarChart3,
  Database,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  Globe,
  User,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { TricolorBar } from "./TricolorBar";
import { EmaapLogo } from "./EmaapLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { notifications } from "@/lib/emaap-data";

type Role = "business" | "admin" | "gatc";

const NAV: Record<
  Role,
  { label: string; href: string; icon: typeof LayoutDashboard }[]
> = {
  business: [
    { label: "Dashboard", href: "/business/dashboard", icon: LayoutDashboard },
    {
      label: "New Application",
      href: "/business/new-application",
      icon: FilePlus2,
    },
    { label: "My Instruments", href: "/business/instruments", icon: Boxes },
    { label: "Payments", href: "/business/payments", icon: Wallet },
    { label: "QR Codes", href: "/business/qr-codes", icon: QrCode },
    { label: "Helpdesk", href: "/business/helpdesk", icon: LifeBuoy },
  ],
  admin: [
    { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Pendency Queue", href: "/admin/pendency", icon: ListChecks },
    { label: "GATC Management", href: "/admin/gatc", icon: Building2 },
    { label: "Revenue Reports", href: "/admin/revenue", icon: BarChart3 },
    { label: "Master Data", href: "/admin/master-data", icon: Database },
  ],
  gatc: [
    { label: "Recognition Application", href: "/gatc/dashboard", icon: FilePlus2 },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  business: "Reliance Retail Ltd.",
  admin: "Central Controller · New Delhi",
  gatc: "Private Laboratory Applicant",
};

export function DashboardLayout({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [lang, setLang] = useState<"EN" | "HI">("EN");
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMobile = useIsMobile();
  const items = NAV[role];
  const roleNotifications = notifications[role];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <TricolorBar />
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {isMobile && (
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <button
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-muted"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[min(18rem,85vw)] bg-sidebar p-0 text-sidebar-foreground"
              >
                <SheetHeader className="border-b border-sidebar-border px-5 py-4 text-left">
                  <SheetTitle className="text-sidebar-foreground">
                    {role === "business" ? "Business Portal" : "Administrator Portal"}
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-3 py-5">
                  {items.map((item) => {
                    const active = location.pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                          active
                            ? "bg-sidebar-accent text-white"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            active ? "text-saffron" : "text-sidebar-foreground/60",
                          )}
                        />
                        {item.label}
                        {active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-saffron" />
                        )}
                      </Link>
                    );
                  })}
                  <Link
                    to={`/${role}/settings`}
                    onClick={() => setMobileNavOpen(false)}
                    className="mt-3 flex items-center gap-3 rounded-lg border-t border-sidebar-border px-3 py-4 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white"
                  >
                    <Settings className="h-4 w-4 text-sidebar-foreground/60" />
                    Settings &amp; Profile
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          )}
          <EmaapLogo className="min-w-0" />
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            onClick={() => setLang(lang === "EN" ? "HI" : "EN")}
            className="flex h-9 items-center gap-1.5 rounded-md border border-border px-2 text-sm font-medium text-foreground hover:bg-muted sm:px-3"
          >
            <Globe className="h-4 w-4" />
            {lang === "EN" ? "EN" : "हिं"}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          <button
            onClick={() => setNotifOpen(true)}
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-saffron" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md py-1.5 pl-1.5 pr-2 hover:bg-muted">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-white text-xs font-semibold">
                    {role === "business" ? "RR" : "AC"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left leading-tight sm:block">
                  <div className="text-sm font-medium text-foreground">
                    {role === "business"
                      ? "Reliance Retail Ltd."
                      : "Admin Controller"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {role === "business" ? "Business User" : "Administrator"}
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link
                  to={`/${role}/settings`}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to={`/${role}/settings`}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-error focus:text-error"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 flex-col justify-between bg-sidebar px-3 py-5 md:flex">
          <nav className="flex flex-col gap-1">
            <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {role === "business" ? "Business Portal" : "Administrator Portal"}
            </div>
            {items.map((item) => {
              const active = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-white"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      active ? "text-saffron" : "text-sidebar-foreground/60",
                    )}
                  />
                  {item.label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-saffron" />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-col gap-1 border-t border-sidebar-border pt-3">
            <Link
              to={`/${role}/settings`}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white"
            >
              <Settings className="h-4 w-4 text-sidebar-foreground/60" />
              Settings &amp; Profile
            </Link>
            <div className="mt-2 rounded-lg bg-sidebar-accent/40 px-3 py-2.5 text-xs text-sidebar-foreground/60">
              {ROLE_LABEL[role]}
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
          {children}
        </main>
      </div>

      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Notifications</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-3">
            {roleNotifications.map((n, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-3 shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <Badge
                    className={cn(
                      "mt-0.5 h-2 w-2 shrink-0 rounded-full p-0",
                      n.tone === "warning" && "bg-warning",
                      n.tone === "success" && "bg-success",
                      n.tone === "error" && "bg-error",
                    )}
                  />
                  <div>
                    <p className="text-sm text-foreground">{n.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
