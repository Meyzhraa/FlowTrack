"use client";

import { useState, useEffect } from "react";
// Sesuaikan path ini dengan posisi folder lib kamu
import { dictionary, Language } from "@/src/lib/dictionary"; 

export function useTranslation() {
  const [lang, setLang] = useState<Language>("id");

  useEffect(() => {
    // Ambil bahasa awal dari localStorage
    const savedLang = localStorage.getItem("app_lang") as Language;
    if (savedLang && dictionary[savedLang]) {
      setLang(savedLang);
    }

    // Listener untuk perubahan bahasa
    const handleLangChange = () => {
      const updatedLang = localStorage.getItem("app_lang") as Language;
      if (updatedLang && dictionary[updatedLang]) {
        setLang(updatedLang);
      }
    };

    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, []);

  return {
    t: dictionary[lang],
    lang,
  };
}