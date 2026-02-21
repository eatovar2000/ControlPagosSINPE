import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Clock, PlusCircle, BarChart3 } from "lucide-react";
import PendientesPage from "@/pages/PendientesPage";
import RegistrarPage from "@/pages/RegistrarPage";
import KPIsPage from "@/pages/KPIsPage";

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = location.pathname;

  const tabs = [
    { path: "/", label: "Pendientes", icon: Clock },
    { path: "/registrar", label: "Registrar", icon: PlusCircle },
    { path: "/kpis", label: "KPIs", icon: BarChart3 },
  ];

  return (
    <nav
      data-testid="bottom-navigation"
      className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 h-20 z-50 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {tabs.map(({ path, label, icon: Icon }) => {
        const isActive = current === path;
        const isRegister = path === "/registrar";

        return (
          <button
            key={path}
            data-testid={`nav-${label.toLowerCase()}`}
            data-active={isActive}
            onClick={() => navigate(path)}
            aria-label={label}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
              isRegister
                ? ""
                : isActive
                ? "text-[#1B4D3E]"
                : "text-gray-400 hover:text-[#1B4D3E]"
            }`}
          >
            {isRegister ? (
              <div
                className={`rounded-full p-3.5 -mt-7 shadow-lg transition-all duration-300 ${
                  isActive
                    ? "bg-[#C95D40] shadow-[#E07A5F]/30 scale-105"
                    : "bg-[#E07A5F] hover:bg-[#C95D40]"
                }`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
            ) : (
              <Icon className="w-6 h-6" />
            )}
            <span
              className={`text-[10px] font-medium tracking-wide ${
                isRegister
                  ? isActive
                    ? "text-[#E07A5F]"
                    : "text-gray-400"
                  : ""
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function AppShell() {
  return (
    <div className="min-h-screen bg-[#F4F1DE] pb-24">
      <Routes>
        <Route path="/" element={<PendientesPage />} />
        <Route path="/registrar" element={<RegistrarPage />} />
        <Route path="/kpis" element={<KPIsPage />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
