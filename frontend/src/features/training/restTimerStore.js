import { createContext, useContext } from "react";

export const RestTimerContext = createContext(null);

export function useRestTimer() {
  const context = useContext(RestTimerContext);
  if (!context) throw new Error("useRestTimer deve ser usado dentro de RestTimerProvider.");
  return context;
}
