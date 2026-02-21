import { useEffect, useState } from "react";
import {
  Wallet,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function KPIsPage() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const res = await axios.get(`${API}/v1/kpis/summary`);
        setKpis(res.data);
      } catch (e) {
        console.error("Error fetching KPIs:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchKPIs();
  }, []);

  const formatCRC = (amount) =>
    new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div data-testid="kpis-page" className="p-5 pt-8">
      <header className="mb-6">
        <p className="text-xs font-semibold text-[#8D99AE] tracking-[0.2em] uppercase mb-1">
          Suma
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2D3142] font-heading">
          KPIs
        </h1>
        <p className="text-base text-[#4F5D75] mt-1">
          Resumen de tu negocio
        </p>
      </header>

      {loading ? (
        <div className="space-y-4">
          <div className="bg-[#1B4D3E] rounded-2xl p-6 h-32 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-5 h-28 animate-pulse" />
            <div className="bg-white rounded-2xl p-5 h-28 animate-pulse" />
          </div>
          <div className="bg-white rounded-2xl p-5 h-20 animate-pulse" />
        </div>
      ) : kpis ? (
        <div className="space-y-4 animate-stagger">
          {/* Balance card */}
          <div
            data-testid="kpi-balance"
            className="bg-gradient-to-br from-[#1B4D3E] to-[#123D31] rounded-2xl p-6 text-white shadow-[0_10px_30px_rgba(27,77,62,0.25)]"
          >
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 opacity-80" />
              <span className="text-sm font-medium opacity-80 tracking-wide">
                Balance
              </span>
            </div>
            <p className="text-3xl font-extrabold tracking-tight font-heading">
              {formatCRC(kpis.balance)}
            </p>
            <p className="text-sm opacity-50 mt-1">
              {kpis.movement_count} movimientos totales
            </p>
          </div>

          {/* Income / Expense */}
          <div className="grid grid-cols-2 gap-3">
            <div
              data-testid="kpi-income"
              className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(27,77,62,0.08)] border border-[#1B4D3E]/5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-[#E8F5F1] rounded-lg p-1.5">
                  <ArrowUpRight className="w-4 h-4 text-[#1B4D3E]" />
                </div>
                <span className="text-xs font-medium text-[#8D99AE] tracking-wide">
                  Ingresos
                </span>
              </div>
              <p className="text-xl font-bold text-[#1B4D3E] font-heading">
                {formatCRC(kpis.total_income)}
              </p>
            </div>

            <div
              data-testid="kpi-expense"
              className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(27,77,62,0.08)] border border-[#1B4D3E]/5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-[#FCF3F0] rounded-lg p-1.5">
                  <ArrowDownRight className="w-4 h-4 text-[#E07A5F]" />
                </div>
                <span className="text-xs font-medium text-[#8D99AE] tracking-wide">
                  Gastos
                </span>
              </div>
              <p className="text-xl font-bold text-[#E07A5F] font-heading">
                {formatCRC(kpis.total_expense)}
              </p>
            </div>
          </div>

          {/* Pending card */}
          <div
            data-testid="kpi-pending"
            className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-[0_2px_8px_rgba(27,77,62,0.08)] border border-[#1B4D3E]/5"
          >
            <div className="flex items-center gap-3">
              <div className="bg-[#FFF3E0] rounded-xl p-2.5">
                <Clock className="w-5 h-5 text-[#EE6C4D]" />
              </div>
              <div>
                <p className="font-semibold text-[#2D3142]">Pendientes</p>
                <p className="text-xs text-[#8D99AE]">
                  Movimientos sin clasificar
                </p>
              </div>
            </div>
            <span className="text-2xl font-extrabold text-[#EE6C4D] font-heading">
              {kpis.pending_count}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-[#4F5D75]">No se pudieron cargar los KPIs</p>
        </div>
      )}
    </div>
  );
}
