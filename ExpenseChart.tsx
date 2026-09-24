"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTranslation } from "@/src/hooks/useTranslation";

// Data alokasi pengeluaran menggunakan nameKey
const data = [
  { nameKey: "food", value: 1000000, percentage: "40%", color: "#007A5E" },
  { nameKey: "bills", value: 625000, percentage: "25%", color: "#4F46E5" },
  { nameKey: "transport", value: 375000, percentage: "15%", color: "#F59E0B" },
  { nameKey: "shopping", value: 300000, percentage: "12%", color: "#EC4899" },
  { nameKey: "entertainment", value: 200000, percentage: "8%", color: "#8B5CF6" },
];

function ExpenseChartContent() {
  const [Recharts, setRecharts] = useState<any>(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Import recharts secara aman di client side
    import("recharts").then((mod) => {
      setRecharts(mod);
    });
  }, []);

  if (!Recharts) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm w-full h-[300px] flex items-center justify-center">
        <div className="w-48 h-48 rounded-full border-8 border-gray-100 animate-pulse" />
      </div>
    );
  }

  const { PieChart, Pie, Cell, ResponsiveContainer } = Recharts;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm w-full">
      <h3 className="text-base font-bold text-gray-900">
        {t?.expenseAllocation || "Expense Allocation"}
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        {t?.monthlyDistribution || "Monthly distribution by category"}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Donut Chart Container */}
        <div className="w-48 h-48 relative flex items-center justify-center flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-base font-bold text-gray-900">Rp 2.5M</span>
            <span className="text-[10px] text-gray-400 font-medium">
              {t?.totalSpent || "Total Spent"}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-2.5 w-full">
          {data.map((item) => {
            const categoryName = t?.categories?.[item.nameKey as keyof typeof t.categories] || item.nameKey;

            return (
              <div key={item.nameKey} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <span className="font-semibold text-gray-700">{categoryName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">
                    Rp {item.value.toLocaleString("id-ID")}
                  </span>
                  <span className="text-gray-400 w-8 text-right font-medium">{item.percentage}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Export dengan mematikan SSR secara total untuk komponen ini
export default dynamic(() => Promise.resolve(ExpenseChartContent), {
  ssr: false,
});