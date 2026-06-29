import { useCallback, useEffect, useState } from "react";
import { defaultHeadcountData } from "@/modules/stakeholders/data/defaultHeadcountData";
import {
  loadStoredStakeholderRows,
  saveStakeholderRows,
  type StakeholderEmployeeRecord
} from "@/modules/stakeholders/utils/headcount";

const restoredEmployeeNames = new Set(["A Lokeswari", "Abhishek Kumar Pathak"]);

function restoreRequiredEmployees(records: StakeholderEmployeeRecord[]) {
  const existingNames = new Set(records.map((record) => record.employeeName));
  const missingDefaults = defaultHeadcountData.filter(
    (record) => restoredEmployeeNames.has(record.employeeName) && !existingNames.has(record.employeeName)
  );
  if (!missingDefaults.length) return records;
  return [...records, ...missingDefaults.map((record) => ({ ...record, employmentStatus: "Active" as const, isHidden: false }))];
}

export function useStakeholderHeadcount() {
  const [records, setRecords] = useState<StakeholderEmployeeRecord[]>([]);
  const [source, setSource] = useState("Summary sheet default");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecords = useCallback(() => {
    setIsLoading(true);
    setError("");
    try {
      const stored = loadStoredStakeholderRows();
      if (stored?.length) {
        const restored = restoreRequiredEmployees(stored);
        if (restored.length !== stored.length) {
          saveStakeholderRows(restored);
        }
        setRecords(restored);
        setSource("Uploaded workbook");
      } else {
        setRecords(defaultHeadcountData);
        setSource("Provided Summary sheet");
      }
    } catch {
      setRecords(defaultHeadcountData);
      setSource("Provided Summary sheet");
      setError("Stored stakeholder data could not be loaded. Showing the provided workbook data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return { records, source, isLoading, error, reload: loadRecords };
}
