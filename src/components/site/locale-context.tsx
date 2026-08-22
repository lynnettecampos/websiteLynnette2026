"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export const LocaleProvider = LocaleContext.Provider;

export const useLocale = (): LocaleContextValue => {
  const value = useContext(LocaleContext);

  if (!value) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }

  return value;
};
