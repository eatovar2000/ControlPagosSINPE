import { useState } from "react";
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";

export default function RegistrarPage() {
  const [selectedType, setSelectedType] = useState(null);

  return (
    <div data-testid="registrar-page" className="p-5 pt-8">
      <header className="mb-6">
        <p className="text-xs font-semibold text-[#8D99AE] tracking-[0.2em] uppercase mb-1">
          Suma
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2D3142] font-heading">
          Registrar
        </h1>
        <p className="text-base text-[#4F5D75] mt-1">Nuevo movimiento</p>
      </header>

      <div className="space-y-4">
        {/* Type selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            data-testid="type-income-btn"
            onClick={() => setSelectedType("income")}
            className={`rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-300 border-2 active:scale-[0.97] ${
              selectedType === "income"
                ? "border-[#1B4D3E] bg-[#E8F5F1] shadow-md"
                : "border-transparent bg-white shadow-[0_2px_8px_rgba(27,77,62,0.08)]"
            }`}
          >
            <div className="bg-[#1B4D3E]/10 rounded-xl p-3">
              <TrendingUp className="w-6 h-6 text-[#1B4D3E]" />
            </div>
            <span className="font-semibold text-[#2D3142]">Ingreso</span>
          </button>
          <button
            data-testid="type-expense-btn"
            onClick={() => setSelectedType("expense")}
            className={`rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-300 border-2 active:scale-[0.97] ${
              selectedType === "expense"
                ? "border-[#E07A5F] bg-[#FCF3F0] shadow-md"
                : "border-transparent bg-white shadow-[0_2px_8px_rgba(27,77,62,0.08)]"
            }`}
          >
            <div className="bg-[#E07A5F]/10 rounded-xl p-3">
              <TrendingDown className="w-6 h-6 text-[#E07A5F]" />
            </div>
            <span className="font-semibold text-[#2D3142]">Gasto</span>
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="text-sm font-semibold text-[#2D3142] mb-1.5 block">
            Monto (CRC)
          </label>
          <input
            data-testid="amount-input"
            type="number"
            placeholder="0"
            className="w-full rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-[#1B4D3E] focus:border-transparent h-14 px-4 text-2xl font-bold text-[#2D3142] shadow-sm transition-all placeholder:text-gray-300 outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-semibold text-[#2D3142] mb-1.5 block">
            Descripcion
          </label>
          <input
            data-testid="description-input"
            type="text"
            placeholder="Que fue este movimiento?"
            className="w-full rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-[#1B4D3E] focus:border-transparent h-12 px-4 text-base text-[#2D3142] shadow-sm transition-all placeholder:text-gray-400 outline-none"
          />
        </div>

        {/* Quick fields — skeleton placeholders */}
        <div className="space-y-2">
          {["Unidad de negocio", "Responsable", "Etiquetas"].map((field) => (
            <button
              key={field}
              data-testid={`field-${field.toLowerCase().replace(/ /g, "-")}`}
              className="w-full rounded-xl bg-white p-4 flex items-center justify-between text-left shadow-[0_2px_8px_rgba(27,77,62,0.06)] border border-[#1B4D3E]/5 transition-all hover:shadow-md active:scale-[0.99]"
            >
              <span className="text-[#4F5D75] text-sm font-medium">
                {field}
              </span>
              <ChevronRight className="w-4 h-4 text-[#8D99AE]" />
            </button>
          ))}
        </div>

        {/* Submit */}
        <button
          data-testid="submit-movement-btn"
          disabled={!selectedType}
          className={`w-full rounded-full h-14 font-semibold text-white text-lg tracking-wide shadow-lg transition-all duration-300 ${
            selectedType
              ? "bg-[#1B4D3E] hover:bg-[#123D31] hover:shadow-xl active:scale-[0.98]"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Guardar movimiento
        </button>
      </div>
    </div>
  );
}
