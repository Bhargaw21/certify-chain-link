
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "@/context/Web3Context";
import { UserProvider } from "@/context/UserContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import StudentLogin from "./pages/StudentLogin";
import InstituteLogin from "./pages/InstituteLogin";
import StudentDashboard from "./pages/StudentDashboard";
import InstituteDashboard from "./pages/InstituteDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Web3Provider>
        <UserProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/student-login" element={<StudentLogin />} />
              <Route path="/institute-login" element={<InstituteLogin />} />
              <Route path="/student-dashboard" element={<StudentDashboard />} />
              <Route path="/institute-dashboard" element={<InstituteDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </UserProvider>
      </Web3Provider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
