"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  HiOutlineCog6Tooth, 
  HiOutlineArrowRightOnRectangle,
  HiChevronUp
} from "react-icons/hi2";
import { useTranslation } from "@/src/hooks/useTranslation";

export default function UserProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t } = useTranslation();

  // Ambil data sesi dari NextAuth
  const { data: session, status } = useSession();

  // Menutup popover ketika diklik di luar area menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Loading State (tampilan skeleton saat mengecek sesi)
  if (status === "loading") {
    return (
      <div className="w-full h-13 bg-gray-100 animate-pulse rounded-xl" />
    );
  }

  // 2. Jika belum login (arahkan ke tombol login)
  if (!session || !session.user) {
    return (
      <Link
        href="/auth/login"
        className="w-full flex items-center justify-center p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold transition-colors"
      >
        {t?.signIn || "Sign In"}
      </Link>
    );
  }

  // 3. Ambil data dinamis dari sesi user
  const userName = session.user.name || "User";
  const userEmail = session.user.email || "";
  const userImage = session.user.image;

  const handleLogout = () => {
    // Menghapus localStorage jika ada sisa token manual
    localStorage.removeItem("token");
    sessionStorage.clear();
    
    // Logout NextAuth dan redirect ke Login
    signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <div className="relative w-full" ref={menuRef}>
      {/* Popover Trigger / Profile Card */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100 bg-white"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Avatar / Foto Profil */}
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 font-bold border border-gray-200">
            {userImage ? (
              <Image
                src={userImage}
                alt={userName}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-sm">{userName.charAt(0).toUpperCase()}</span>
            )}
          </div>

          {/* Nama & Email Dinamis */}
          <div className="text-left leading-tight truncate">
            <h4 className="font-bold text-xs text-gray-900 truncate">{userName}</h4>
            <span className="text-[11px] text-gray-400 block truncate">{userEmail}</span>
          </div>
        </div>
        
        <HiChevronUp className={`text-gray-400 text-sm flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Popover Menu Content */}
      {isOpen && (
        <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-gray-100 rounded-2xl shadow-lg p-1.5 z-50 space-y-1">
          <button
            onClick={() => {
              setIsOpen(false);
              router.push("/settings");
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-left cursor-pointer"
          >
            <HiOutlineCog6Tooth className="text-base text-gray-400" />
            {t?.settings || "Settings"}
          </button>

          <div className="h-px bg-gray-100 my-1" />

          {/* Tombol Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#F43F5E] hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer"
          >
            <HiOutlineArrowRightOnRectangle className="text-base text-[#F43F5E]" />
            {t?.logout || "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}