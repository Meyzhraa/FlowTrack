"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/src/hooks/useTranslation";

interface Wallet {
  id?: string;
  name: string;
  balance: number;
  isIncludedInTotal: boolean;
}

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedWallet?: Wallet | null; // Null untuk Tambah, Object untuk Edit
}

export default function AddWalletModal({
  isOpen,
  onClose,
  onSuccess,
  selectedWallet,
}: AddWalletModalProps) {
  const { data: session } = useSession();
  const { t } = useTranslation();

  const [walletName, setWalletName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [includeInTotal, setIncludeInTotal] = useState(true);
  const [loading, setLoading] = useState(false);

  // Synchronize form state when modal opens or selectedWallet changes
  useEffect(() => {
    if (selectedWallet) {
      setWalletName(selectedWallet.name);
      setInitialBalance(selectedWallet.balance.toString());
      setIncludeInTotal(selectedWallet.isIncludedInTotal ?? true);
    } else {
      setWalletName("");
      setInitialBalance("");
      setIncludeInTotal(true);
    }
  }, [selectedWallet, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token =
        (session as any)?.accessToken || localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!token) {
        alert(t?.loginSessionNotFound || "Sesi login tidak ditemukan. Silakan login kembali.");
        return;
      }

      const isEdit = !!selectedWallet?.id;
      const url = isEdit
        ? `http://localhost:5000/api/wallets/${selectedWallet.id}`
        : "http://localhost:5000/api/wallets";

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: walletName,
          balance: parseFloat(initialBalance) || 0,
          isIncludedInTotal: includeInTotal,
        }),
      });

      if (!response.ok) throw new Error(t?.failedSaveWallet || "Gagal menyimpan data wallet.");

      if (onSuccess) onSuccess(); // Trigger re-fetch di halaman utama
      onClose();
    } catch (error: any) {
      alert(error.message || t?.generalError || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="bg-[#FEF08A]/90 border border-[#FDE047] w-full max-w-xl rounded-3xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {selectedWallet 
            ? (t?.editWallet || "Edit Wallet") 
            : (t?.addNewWallet || "Add New Wallet")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t?.walletNameLabel || "Wallet Name"}
              </label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder={t?.walletNamePlaceholder || "e.g. Bank BCA, Cash"}
                className="w-full px-4 py-2 border rounded-full text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t?.balanceLabel || "Balance"}
              </label>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2 border rounded-full text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
            </div>

            {/* Toggle Switch untuk Include in Total */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-xs font-semibold text-gray-700">
                  {t?.includeInTotalLabel || "Include in Total Balance"}
                </p>
                <p className="text-[11px] text-gray-400">
                  {t?.includeInTotalSub || "Wallet balance will be included in Total Net Balance"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIncludeInTotal(!includeInTotal)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                  includeInTotal ? "bg-[#5046E5]" : "bg-gray-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    includeInTotal ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#FF9898] hover:bg-[#FF8080] py-2 rounded-xl text-sm font-bold text-gray-800 transition-colors cursor-pointer"
            >
              {t?.cancel || "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#6EE7B7] hover:bg-[#34D399] py-2 rounded-xl text-sm font-bold text-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading 
                ? (t?.saving || "Saving...") 
                : (t?.saveWallet || "Save Wallet")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}