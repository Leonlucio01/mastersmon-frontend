import { useMastersmon } from "./useMastersmon";

export function useMastersmonDemo() {
  const mastersmon = useMastersmon();

  return {
    ...mastersmon,
    captureLatest: mastersmon.captureCurrent,
  };
}
