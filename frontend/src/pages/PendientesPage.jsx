import { useEffect, useState } from "react";
import { Clock, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PendientesPage() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        await axios.post(`${API}/seed`);
        const res = await axios.get(`${API}/v1/movements?status=pending`);
        setMovements(res.data);
      } catch (e) {
        console.error("Error fetching movements:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMovements();
  }, []);

  const formatCRC = (amount) =>
    new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div data-testid="pendientes-page" className="p-5 pt-8">
      <header className="mb-6">
        <p className="text-xs font-semibold text-[#8D99AE] tracking-[0.2em] uppercase mb-1">
          Suma
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2D3142] font-heading">
          Pendientes
        </h1>
        <p className="text-base text-[#4F5D75] mt-1">
          {movements.length} movimiento{movements.length !== 1 ? "s" : ""} por
          clasificar
        </p>
      </header>

      {loading ? (
        <div className="space-y-3 animate-stagger">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 h-[76px] animate-pulse"
            />
          ))}
        </div>
      ) : movements.length === 0 ? (
        <div data-testid="empty-state" className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E8F5F1] mb-4">
            <Clock className="w-7 h-7 text-[#1B4D3E]" />
          </div>
          <p className="text-lg font-bold text-[#2D3142] font-heading">
            Todo al dia
          </p>
          <p className="text-[#4F5D75] text-sm mt-1">
            No hay movimientos pendientes
          </p>
        </div>
      ) : (
        <div className="space-y-3 animate-stagger">
          {movements.map((mov, i) => (
            <div
              key={mov.id}
              data-testid={`movement-card-${i}`}
              className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(27,77,62,0.08)] border border-[#1B4D3E]/5 flex items-center justify-between hover:-translate-y-0.5 transition-all duration-300 cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`rounded-xl p-2.5 ${
                    mov.type === "income" ? "bg-[#E8F5F1]" : "bg-[#FCF3F0]"
                  }`}
                >
                  {mov.type === "income" ? (
                    <TrendingUp className="w-5 h-5 text-[#1B4D3E]" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-[#E07A5F]" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[#2D3142] text-sm leading-tight">
                    {mov.description}
                  </p>
                  <p className="text-xs text-[#8D99AE] mt-0.5">
                    {mov.date}
                    {mov.responsible ? ` · ${mov.responsible}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span
                  className={`font-bold text-sm tabular-nums ${
                    mov.type === "income"
                      ? "text-[#1B4D3E]"
                      : "text-[#E07A5F]"
                  }`}
                >
                  {mov.type === "income" ? "+" : "-"}
                  {formatCRC(mov.amount)}
                </span>
                <ArrowRight className="w-4 h-4 text-[#8D99AE]" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
