import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "@/app/store/hooks";
import { defaultHeadcountData } from "@/modules/stakeholders/data/defaultHeadcountData";
import type { StakeholderEmployeeRecord } from "@/modules/stakeholders/utils/headcount";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export function useStakeholderHeadcount() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [records, setRecords] = useState<StakeholderEmployeeRecord[]>([]);
  const [source, setSource] = useState("Supabase stakeholder_headcount");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      if (!accessToken) {
        throw new Error("Stakeholder authentication is required.");
      }
      const response = await fetch(`${apiBaseUrl}/stakeholder/employees`, {
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load stakeholder data.");
      }
      setRecords(data.employees ?? []);
      setSource("Supabase stakeholder_headcount");
    } catch (loadError) {
      setRecords(defaultHeadcountData);
      setSource("Provided Summary sheet");
      setError(loadError instanceof Error ? loadError.message : "Stakeholder data could not be loaded from Supabase.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  return { records, source, isLoading, error, reload: loadRecords };
}
