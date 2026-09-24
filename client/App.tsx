import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BusinessDashboard from "./pages/business/Dashboard";
import NewApplication from "./pages/business/NewApplication";
import ApplicationSubmitted from "./pages/business/ApplicationSubmitted";
import Instruments from "./pages/business/Instruments";
import Payments from "./pages/business/Payments";
import Helpdesk from "./pages/business/Helpdesk";
import BusinessSettings from "./pages/business/Settings";
import AdminDashboard from "./pages/admin/Dashboard";
import Pendency from "./pages/admin/Pendency";
import Registrations from "./pages/admin/Registrations";
import Gatc from "./pages/admin/Gatc";
import Revenue from "./pages/admin/Revenue";
import MasterData from "./pages/admin/MasterData";
import AdminSettings from "./pages/admin/Settings";
import GatcDashboard from "./pages/gatc/Dashboard";
import SocketTest from "./pages/Socketio-test";
import QRCodes from "./pages/business/QrCode";
import VerifyCertificate from "./pages/VerifyCertificate";
import { GatewayApiProvider } from "./contexts/GatewayApiContext";
import RegistrationPage from "./pages/RegistrationPage";
import { getCurrentUser } from "./lib/current-user";

import { loadWeglot } from "./lib/weglot";
import GatcRegistration from "./pages/gatc/Registration";
import GatcSettings from "./pages/gatc/Settings";
import { ProtectedRoute } from "./components/emaap/ProtectedRoute";
import StateAdminDashboard from "./pages/admin/state/stateAdminDashboard";

const queryClient = new QueryClient();

const App = () => {
  // Try to get dynamic user from localStorage, fallback to empty string if not logged in
  const currentUser = getCurrentUser();
  const userId = currentUser?.userId || "";

  return (
    <QueryClientProvider client={queryClient}>
      <GatewayApiProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route
                path="/verify/:certificateId"
                element={<VerifyCertificate />}
              />

              <Route path="/socket-test" element={<SocketTest />} />
              <Route element={<ProtectedRoute allowedRoles={["business"]} />}>
                <Route
                  path="/business/dashboard"
                  element={<BusinessDashboard userId={userId} />}
                />
                <Route
                  path="/business/new-application"
                  element={<NewApplication />}
                />
                <Route
                  path="/business/application-submitted"
                  element={<ApplicationSubmitted />}
                />
                <Route
                  path="/business/instruments"
                  element={<Instruments userId={userId} />}
                />
                <Route
                  path="/business/payments"
                  element={<Payments userId={userId} />}
                />
                <Route path="/business/helpdesk" element={<Helpdesk />} />
                <Route
                  path="/business/settings"
                  element={<BusinessSettings />}
                />
                <Route
                  path="/business/qr-codes"
                  element={<QRCodes userId={userId} />}
                />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/pendency" element={<Pendency />} />
                <Route
                  path="/admin/registrations"
                  element={<Registrations />}
                />
                <Route path="/admin/gatc" element={<Gatc />} />
                <Route path="/admin/revenue" element={<Revenue />} />
                <Route path="/admin/master-data" element={<MasterData />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route
                  path="/state-admin/dashboard"
                  element={<StateAdminDashboard />}
                />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["gatc"]} />}>
                <Route path="/gatc/dashboard" element={<GatcDashboard />} />

                <Route
                  path="/gatc/registration"
                  element={<GatcRegistration />}
                />

                <Route path="/gatc/settings" element={<GatcSettings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </GatewayApiProvider>
    </QueryClientProvider>
  );
};

loadWeglot().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
