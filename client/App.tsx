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
import Instruments from "./pages/business/Instruments";
import Payments from "./pages/business/Payments";
import Helpdesk from "./pages/business/Helpdesk";
import BusinessSettings from "./pages/business/Settings";
import AdminDashboard from "./pages/admin/Dashboard";
import Pendency from "./pages/admin/Pendency";
import Gatc from "./pages/admin/Gatc";
import Revenue from "./pages/admin/Revenue";
import MasterData from "./pages/admin/MasterData";
import AdminSettings from "./pages/admin/Settings";
import GatcDashboard from "./pages/gatc/Dashboard";
import SocketTest from "./pages/Socketio-test";
import QRCodes from "./pages/business/QrCode";

const queryClient = new QueryClient();
let userId = "68abe63f-d9dc-40a4-9225-45fcb3b268bd";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          <Route path="/socket-test" element={<SocketTest />} />

          <Route
            path="/business/dashboard"
            element={<BusinessDashboard userId={userId} />}
          />
          <Route
            path="/business/new-application"
            element={<NewApplication />}
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
          <Route path="/business/settings" element={<BusinessSettings />} />

          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/pendency" element={<Pendency />} />
          <Route path="/admin/gatc" element={<Gatc />} />
          <Route path="/admin/revenue" element={<Revenue />} />
          <Route path="/admin/master-data" element={<MasterData />} />
          <Route path="/admin/settings" element={<AdminSettings />} />

          <Route path="/gatc/dashboard" element={<GatcDashboard />} />
          <Route
            path="/business/qr-codes"
            element={<QRCodes userId={userId} />}
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
