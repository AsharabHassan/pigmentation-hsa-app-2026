"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DEFAULT_CLINIC_LOCATION,
  getClinicLocation,
  type ClinicLocationKey,
} from "@/lib/constants";

const ClinicLocationContext = createContext<ClinicLocationKey>(
  DEFAULT_CLINIC_LOCATION,
);

export function ClinicLocationProvider({
  location,
  children,
}: {
  location: ClinicLocationKey;
  children: ReactNode;
}) {
  return (
    <ClinicLocationContext.Provider value={location}>
      {children}
    </ClinicLocationContext.Provider>
  );
}

export function useClinicLocation() {
  return getClinicLocation(useContext(ClinicLocationContext));
}
