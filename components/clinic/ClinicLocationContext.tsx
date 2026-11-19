"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_CLINIC_LOCATION,
  getClinicLocation,
  type ClinicLocationKey,
} from "@/lib/constants";

// The route picks the starting clinic (/ = London, /glasgow = Glasgow), and the
// client can switch it before the scan with the clinic chooser. Everything that
// reads useClinicLocation() — copy, calendar, lead routing — follows the choice.
interface ClinicLocationState {
  location: ClinicLocationKey;
  setLocation: (location: ClinicLocationKey) => void;
}

const ClinicLocationContext = createContext<ClinicLocationState>({
  location: DEFAULT_CLINIC_LOCATION,
  setLocation: () => {},
});

export function ClinicLocationProvider({
  location,
  children,
}: {
  location: ClinicLocationKey;
  children: ReactNode;
}) {
  const [current, setLocation] = useState<ClinicLocationKey>(location);
  return (
    <ClinicLocationContext.Provider value={{ location: current, setLocation }}>
      {children}
    </ClinicLocationContext.Provider>
  );
}

export function useClinicLocation() {
  return getClinicLocation(useContext(ClinicLocationContext).location);
}

export function useSetClinicLocation() {
  return useContext(ClinicLocationContext).setLocation;
}
