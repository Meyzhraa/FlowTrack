"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { 
  HiOutlineHome, 
  HiOutlineBanknotes, 
  HiOutlineChartPie, 
  HiOutlineWallet,
  HiOutlinePlusCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash
} from "react-icons/hi2";
import AddTransactionModal from "@/src/components/AddTransactionModal";
import AddWalletModal from "@/src/components/AddWalletModal";
import DeleteConfirmModal from "@/src/components/DeleteConfirmModal";
import UserProfileMenu from "@/src/components/UserProfileMenu";
import { useTranslation } from "@/src/hooks/useTranslation";

export default function WalletsPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();

  // State Management
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState<boolean>(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState<boolean>(false);

  // State untuk Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [walletToDelete, setWalletToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // 1. Fetch Data Wallet dari Database Backend Express
  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      const token = (session as any)?.accessToken || localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!token) return;

      const res = await fetch("http://localhost:5000/api/wallets", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setWallets(data);
      }
    } catch (error) {
      console.error("Gagal mengambil data wallet:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  // 2a. Kalkulasi Total Net Balance (Hanya Dompet Aktif)
  const totalNetBalance = wallets.reduce((acc, curr) => {
    return curr.isIncludedInTotal ? acc + (Number(curr.balance) || 0) : acc;
  }, 0);

  // 2b. Kalkulasi Total Keseluruhan Saldo (Dompet Aktif + Non-Aktif / Excluded)
  const totalGrossBalance = wallets.reduce((acc, curr) => {
    return acc + (Number(curr.balance) || 0);
  }, 0);

  // 3a. Buka Modal Konfirmasi Hapus
  const handleOpenDeleteModal = (id: string, name: string) => {
    setWalletToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  // 3b. Eksekusi Hapus Wallet
  const handleConfirmDelete = async () => {
    if (!walletToDelete) return;

    try {
      setIsDeleting(true);
      const token = (session as any)?.accessToken || localStorage.getItem("token") || localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:5000/api/wallets/${walletToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setIsDeleteModalOpen(false);
        setWalletToDelete(null);
        fetchWallets(); // Refresh daftar wallet setelah berhasil dihapus
      } else {
        alert(t?.failedDeleteWallet || "Gagal menghapus wallet.");
      }
    } catch (error) {
      console.error("Error deleting wallet:", error);
      alert(t?.errorDeleteWallet || "Terjadi kesalahan saat menghapus wallet.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-[#F9F9F8] text-gray-800 font-sans overflow-hidden">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-between p-5 sm:p-6 flex-shrink-0 h-auto md:h-full">
        <div>
          {/* Logo FlowTrack */}
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="w-10 h-10 bg-[#5046E5] rounded-xl flex items-center justify-center text-white shadow-sm">
              <HiOutlineWallet className="text-xl" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base leading-none">FlowTrack</h2>
              <span className="text-[11px] text-gray-400 font-normal">
                {t?.personalCompanion || "Personal Companion"}
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 space-y-0 md:space-y-1.5">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 font-medium text-sm transition-colors whitespace-nowrap"
            >
              <HiOutlineHome className="text-lg" />
              {t?.dashboard || "Dashboard"}
            </Link>
            <Link
              href="/transactions"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 font-medium text-sm transition-colors whitespace-nowrap"
            >
              <HiOutlineBanknotes className="text-lg" />
              {t?.transactions || "Transactions"}
            </Link>
            <Link
              href="/budgeting"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 font-medium text-sm transition-colors whitespace-nowrap"
            >
              <HiOutlineChartPie className="text-lg" />
              {t?.budgets || "Budgets"}
            </Link>
            <Link
              href="/wallets"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#EBE9FE] text-[#5046E5] font-semibold text-sm transition-colors whitespace-nowrap"
            >
              <HiOutlineWallet className="text-lg" />
              {t?.wallets || "Wallets"}
            </Link>
          </nav>
        </div>

        {/* User Profile Menu */}
        <div className="hidden md:block pt-4">
          <UserProfileMenu />
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 p-6 sm:p-8 md:p-10 h-full overflow-y-auto w-full">
        
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t?.myWalletsTitle || "My Wallets & Accounts"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t?.myWalletsSub || "Manage your money stored across different platforms."}
          </p>
        </div>

        {/* Action Buttons Section */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => {
              setSelectedWallet(null);
              setIsAddWalletOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-[#5046E5] hover:bg-[#4338CA] text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <HiOutlinePlusCircle className="text-base" />
            {t?.addNewWallet || "Add New Wallet"}
          </button>

          <button
            type="button"
            onClick={() => setIsAddTransactionOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <HiOutlinePlusCircle className="text-base" />
            {t?.addTransaction || "Add Transaction"}
          </button>
        </div>

        {/* Summary Balance Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
          
          {/* Card 1: Total Saldo Bersih (Net Balance) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {t?.totalNetBalance || "Total Saldo Bersih"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 mb-3">
                {t?.netBalanceSubCard || "Hanya menghitung dompet yang diaktifkan dalam total."}
              </p>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#5046E5]">
              Rp {totalNetBalance.toLocaleString("id-ID")}
            </p>
          </div>

          {/* Card 2: Total Keseluruhan Saldo (Aktif + Excluded) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {t?.totalGrossBalance || "Total Keseluruhan Saldo"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 mb-3">
                {t?.totalGrossBalanceSub || "Gabungan dari semua dompet (termasuk yang di-excluded)."}
              </p>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Rp {totalGrossBalance.toLocaleString("id-ID")}
            </p>
          </div>

        </div>

        {/* Wallets Grid List */}
        {loading ? (
          <div className="text-center py-12 text-sm text-gray-400">
            {t?.loadingWallets || "Loading wallets..."}
          </div>
        ) : wallets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm text-gray-500">
              {t?.noWalletsFound || "Belum ada wallet tersimpan di database."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm flex items-center justify-between min-h-[100px]"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 font-medium block">
                      {wallet.name}
                    </span>
                    {!wallet.isIncludedInTotal && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                        {t?.excludedBadge || "Excluded"}
                      </span>
                    )}
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-[#10B981]">
                    Rp {Number(wallet.balance).toLocaleString("id-ID")}
                  </p>
                </div>

                {/* Tombol Aksi Edit & Delete */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    title={t?.editWalletTooltip || "Edit Wallet"}
                    onClick={() => {
                      setSelectedWallet(wallet);
                      setIsAddWalletOpen(true);
                    }}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <HiOutlinePencilSquare className="text-lg" />
                  </button>
                  <button
                    type="button"
                    title={t?.deleteWalletTooltip || "Delete Wallet"}
                    onClick={() => handleOpenDeleteModal(wallet.id, wallet.name)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <HiOutlineTrash className="text-lg" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Modal Add & Edit Wallet */}
      <AddWalletModal
        isOpen={isAddWalletOpen}
        onClose={() => {
          setIsAddWalletOpen(false);
          setSelectedWallet(null);
        }}
        onSuccess={fetchWallets}
        selectedWallet={selectedWallet}
      />

      {/* Modal Add Transaction */}
      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
      />

      {/* Modal Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setWalletToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t?.deleteWalletTitle || "Hapus Dompet"}
        description={
          t?.deleteWalletDesc?.replace("{name}", walletToDelete?.name || "") ||
          `Apakah Anda yakin ingin menghapus dompet "${walletToDelete?.name || ""}"? Semua riwayat transaksi di dompet ini mungkin akan terpengaruh.`
        }
        isLoading={isDeleting}
      />

    </div>
  );
}