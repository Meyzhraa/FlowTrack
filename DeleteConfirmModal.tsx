"use client";

import { HiOutlineTrash } from "react-icons/hi2";
import { useTranslation } from "@/src/hooks/useTranslation";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading = false,
}: DeleteConfirmModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      {/* Box Container Pop-up / Modal Hapus */}
      <div className="bg-[#FEF08A]/80 border border-[#FDE047] w-full max-w-sm rounded-2xl p-6 text-center shadow-lg transform transition-all">
        
        {/* Header Judul Modal & Ikon */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <h2 className="text-xl font-extrabold text-[#DC2626] tracking-tight">
            {title || t?.deleteTitle || "Hapus Transaksi"}
          </h2>
          <HiOutlineTrash className="text-2xl text-[#DC2626] stroke-[2.5]" />
        </div>

        {/* Deskripsi Peringatan Hapus */}
        <p className="text-xs font-semibold text-gray-500 leading-relaxed px-2 mb-6">
          {description ||
            t?.deleteDesc ||
            "Apakah Anda yakin ingin menghapus transaksi ini? Saldo dompet Anda akan disesuaikan secara otomatis."}
        </p>

        {/* Tombol Aksi (Cancel & Delete) */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-[#6EE7B7] hover:bg-[#34D399] text-gray-800 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          >
            {t?.cancel || "Batal"}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? "Menghapus..." : t?.deleteAction || "Hapus"}
          </button>
        </div>

      </div>
    </div>
  );
}