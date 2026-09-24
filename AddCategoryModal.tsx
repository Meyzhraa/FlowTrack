"use client";

import { useState, useEffect } from "react";
import { 
  HiOutlineChartPie, 
  HiOutlineXCircle, 
  HiOutlineBookmark,
  HiOutlineCurrencyDollar,
  HiOutlinePaintBrush
} from "react-icons/hi2";
import { useTranslation } from "@/src/hooks/useTranslation";

export interface CategoryData {
  id?: string;
  name: string;
  type: "EXPENSE" | "INCOME";
  color: string;
  budgetLimit: number;
}

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CategoryData) => Promise<void> | void;
  selectedCategory?: CategoryData | null; // Isi jika mode Edit Kategori
}

// Preset Bar Warna Visual untuk Pilihan Badge Kategori
const COLOR_PRESETS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#64748B", // Slate
];

export default function AddCategoryModal({
  isOpen,
  onClose,
  onSave,
  selectedCategory,
}: AddCategoryModalProps) {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [color, setColor] = useState("#3B82F6");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync state dengan selectedCategory ketika modal dibuka / diedit
  useEffect(() => {
    if (selectedCategory) {
      setName(selectedCategory.name);
      setType(selectedCategory.type || "EXPENSE");
      setColor(selectedCategory.color || "#3B82F6");
      setBudgetLimit(selectedCategory.budgetLimit ? selectedCategory.budgetLimit.toString() : "");
    } else {
      setName("");
      setType("EXPENSE");
      setColor("#3B82F6");
      setBudgetLimit("");
    }
  }, [selectedCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave({
        id: selectedCategory?.id,
        name,
        type,
        color,
        budgetLimit: parseFloat(budgetLimit) || 0,
      });
      onClose();
    } catch (error) {
      console.error("Gagal menyimpan kategori budget:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="bg-[#FEF08A]/90 border border-[#FDE047] w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-xl transition-all">
        
        {/* Header Modal */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {selectedCategory 
              ? (t?.editCategoryTitle || "Edit Budget Category") 
              : (t?.addCategoryTitle || "Add Budget Category")}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {t?.addCategorySub || "Tambahkan kategori belanja/pemasukan baru beserta batas budget bulanan Anda."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            
            {/* 1. Tipe Kategori (Expense vs Income) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {t?.categoryTypeLabel || "Tipe Kategori"}
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType("EXPENSE")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    type === "EXPENSE"
                      ? "bg-red-500 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Pengeluaran (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => setType("INCOME")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    type === "INCOME"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Pemasukan (Income)
                </button>
              </div>
            </div>

            {/* 2. Nama Kategori */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {t?.categoryNameLabel || "Nama Kategori"}
              </label>
              <div className="relative">
                <HiOutlineChartPie className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t?.categoryNamePlaceholder || "misal: Makanan, Belanja, Skincare, Gaji..."}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-full text-xs sm:text-sm text-gray-700 outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>
            </div>

            {/* 3. Budget Limit (Batas Budget Bulanan) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {t?.categoryBudgetLabel || "Batas Budget (Limit)"}
              </label>
              <div className="relative">
                <HiOutlineCurrencyDollar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none" />
                <input
                  type="number"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-full text-xs sm:text-sm text-gray-700 outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>
            </div>

            {/* 4. Color Palette (Bar Pilihan Warna Otomatis) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-gray-700">
                  {t?.colorBadgeLabel || "Pilih Warna Badge"}
                </label>
                <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">
                  {color}
                </span>
              </div>

              {/* Bar Pilihan Warna Bulat */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                      color === c ? "scale-125 ring-2 ring-offset-2 ring-gray-800" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}

                {/* Custom Color Circle Switcher */}
                <label className="relative w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-500 overflow-hidden">
                  <HiOutlinePaintBrush className="text-xs text-gray-500 pointer-events-none" />
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-[#FF9898] hover:bg-[#FF8080] text-gray-900 font-semibold py-3 px-4 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shadow-sm"
            >
              <HiOutlineXCircle className="text-base" />
              {t?.cancel || "Batal"}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-[#6EE7B7] hover:bg-[#34D399] text-gray-900 font-semibold py-3 px-4 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <HiOutlineBookmark className="text-base" />
              {loading ? "Menyimpan..." : (t?.saveCategory || "Simpan Category")}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}