"use client";

import { useState, useEffect } from "react";
import { 
  HiOutlineBanknotes, 
  HiOutlinePaperClip,
  HiOutlineTag, 
  HiOutlineWallet, 
  HiOutlineCalendar, 
  HiOutlineDocumentText,
  HiOutlineXCircle,
  HiOutlineBookmark
} from "react-icons/hi2";
import { uploadToCloudinary } from "../lib/uploadCloudinary";
import { useTranslation } from "@/src/hooks/useTranslation";

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

interface Wallet {
  id: string;
  name: string;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  transactionData?: any;
}

export default function AddTransactionModal({ 
  isOpen, 
  onClose,
  onSuccess,
  transactionData
}: AddTransactionModalProps) {
  const { t } = useTranslation();

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/api/categories", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching categories:", err));

    fetch("http://localhost:5000/api/wallets", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => setWallets(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching wallets:", err));
  }, [isOpen]);

  useEffect(() => {
    if (transactionData && isOpen) {
      setType(transactionData.type ? transactionData.type.toLowerCase() : "expense");
      setAmount(transactionData.amount ? transactionData.amount.toString() : "");
      setCategoryId(transactionData.categoryId || transactionData.category?.id || "");
      setWalletId(transactionData.walletId || transactionData.wallet?.id || "");
      
      if (transactionData.date) {
        const formattedDate = new Date(transactionData.date).toISOString().split("T")[0];
        setDate(formattedDate);
      } else {
        setDate("");
      }

      setNotes(transactionData.description || "");
      setFile(null);
    } else if (!transactionData && isOpen) {
      setType("expense");
      setAmount("");
      setCategoryId("");
      setWalletId("");
      setDate("");
      setNotes("");
      setFile(null);
    }
  }, [transactionData, isOpen]);

  const filteredCategories = categories.filter(
    (cat) => cat.type === type.toUpperCase()
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let receiptUrl = transactionData?.receiptUrl || null;

      if (file) {
        receiptUrl = await uploadToCloudinary(file);
      }

      const payload = {
        amount: parseFloat(amount),
        type: type.toUpperCase(),
        description: notes,
        categoryId,
        walletId,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        receiptUrl,
      };

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        return;
      }

      const isEditMode = Boolean(transactionData?.id);
      const endpoint = isEditMode
        ? `http://localhost:5000/api/transactions/${transactionData.id}`
        : "http://localhost:5000/api/transactions";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type");
      let responseData: any = null;

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const textError = await response.text();
        console.error("Non-JSON Server Error:", textError);
        throw new Error("Terjadi kesalahan pada server backend.");
      }

      if (!response.ok) {
        throw new Error(responseData?.message || t?.failedSubmitTransaction || "Gagal menyimpan transaksi");
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error submitting transaction:", error);
      alert(error.message || t?.failedSubmitTransaction || "Terjadi kesalahan saat menyimpan transaksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="bg-[#FEF08A]/90 border border-[#FDE047] w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-xl transform transition-all max-h-[90vh] overflow-y-auto">
        
        {/* Header Modal Disesuaikan */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {transactionData
              ? (t?.editTransactionTitle || "Edit Transaction")
              : (t?.addTransactionTitle || "Add New Transaction")}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {t?.addTransactionSub || "Record your income or expense to keep your cash flow healthy."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 mb-6">
            
            {/* Toggle Tipe Transaksi */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-full mb-4">
              <button
                type="button"
                onClick={() => {
                  setType("expense");
                  setCategoryId("");
                }}
                className={`py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  type === "expense" 
                    ? "bg-[#FF9898] text-gray-900 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t?.expenseType || "Expense"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("income");
                  setCategoryId("");
                }}
                className={`py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  type === "income" 
                    ? "bg-[#6EE7B7] text-gray-900 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t?.incomeType || "Income"}
              </button>
            </div>

            {/* Nominal */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {t?.amountLabel || "Amount"}
              </label>
              <div className="relative">
                <HiOutlineBanknotes className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none" />
                <input
                  type="number"
                  placeholder={t?.amountPlaceholder || "e.g. 50000"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {t?.categoryLabel || "Category"}
              </label>
              <div className="relative">
                <HiOutlineTag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none z-10" />
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none cursor-pointer transition-all"
                  required
                >
                  <option value="" disabled>{t?.selectCategoryPlaceholder || "Select Category"}</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dompet */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {t?.walletLabel || "Wallet"}
              </label>
              <div className="relative">
                <HiOutlineWallet className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none z-10" />
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none cursor-pointer transition-all"
                  required
                >
                  <option value="" disabled>{t?.selectWalletPlaceholder || "Select Wallet"}</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tanggal */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {t?.dateLabel || "Date"}
              </label>
              <div className="relative">
                <HiOutlineCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none z-10" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                  required
                />
              </div>
            </div>

            {/* Catatan */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {t?.notesLabel || "Notes"}
              </label>
              <div className="relative">
                <HiOutlineDocumentText className="absolute left-3.5 top-3 text-gray-500 text-base pointer-events-none" />
                <textarea
                  rows={2}
                  placeholder={t?.notesPlaceholder || "Add a note (e.g. Lunch with team)..."}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Bukti Transaksi */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {t?.receiptLabel || "Proof / Receipt (Optional)"}
              </label>
              <div className="relative flex items-center">
                <HiOutlinePaperClip className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none z-10" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-xs sm:text-sm text-gray-700 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-yellow-100 file:text-gray-700 hover:file:bg-yellow-200 cursor-pointer focus:outline-none transition-all"
                />
              </div>
            </div>

          </div>

          {/* Action Buttons dengan Terjemahan */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-[#FF9898] hover:bg-[#FF8080] text-gray-900 font-semibold py-3 px-4 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <HiOutlineXCircle className="text-base" />
              {t?.cancel || "Cancel"}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-[#6EE7B7] hover:bg-[#34D399] text-gray-900 font-semibold py-3 px-4 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <HiOutlineBookmark className="text-base" />
              {loading 
                ? (t?.savingTransaction || "Saving...") 
                : transactionData 
                  ? (t?.updateTransaction || "Update Transaction") 
                  : (t?.saveTransaction || "Save Transaction")}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}