import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileSpreadsheet, RefreshCw, Upload } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppSelector } from "@/app/store/hooks";
import { defaultHeadcountData } from "@/modules/stakeholders/data/defaultHeadcountData";
import { useStakeholderHeadcount } from "@/modules/stakeholders/hooks/useStakeholderHeadcount";
import {
  countBy,
  downloadStakeholderTemplate,
  readStakeholderWorkbook
} from "@/modules/stakeholders/utils/headcount";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export function StakeholderDataPage() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { records, source, reload } = useStakeholderHeadcount();
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const countryCounts = useMemo(() => countBy(records, "country"), [records]);

  const replaceSupabaseRows = async (rows: typeof records) => {
    const response = await fetch(`${apiBaseUrl}/stakeholder/employees/bulk`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ records: rows })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Unable to save stakeholder rows to Supabase.");
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setIsImporting(true);
    setMessage("");
    setError("");
    try {
      const rows = await readStakeholderWorkbook(file);
      if (!rows.length) {
        throw new Error("Summary sheet did not contain active employee rows.");
      }
      await replaceSupabaseRows(rows);
      await reload();
      setMessage(`Imported ${rows.length} employees from ${file.name}. Dashboard and directory now use Supabase data.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to import workbook.");
    } finally {
      setIsImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const resetToDefault = async () => {
    try {
      await replaceSupabaseRows(defaultHeadcountData);
      await reload();
      setError("");
      setMessage(`Reset Supabase stakeholder_headcount to the provided workbook default with ${defaultHeadcountData.length} employees.`);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to reset Supabase data.");
    }
  };

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Stakeholder data"
        title="Headcount source"
        description="Upload a workbook, download the template, or reset to the provided Summary data. Dashboard and directory counts recalculate from the current rows."
        action={
          <Button onClick={() => navigate("/stakeholder")}>
            View Dashboard
          </Button>
        }
      />

      {(message || error) && (
        <div className={error ? "rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger" : "rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success"}>
          {error || message}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="Upload Summary workbook" description="Rows begin at row 3 and header row is row 2." />
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <FileSpreadsheet className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-3 text-sm font-medium text-foreground">Use the Summary sheet as active headcount</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Missing state/province values are grouped as Unknown / Not Available.
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(event) => handleUpload(event.target.files?.[0])}
              />
              <Button className="mt-5" onClick={() => inputRef.current?.click()} disabled={isImporting}>
                <Upload className="h-4 w-4" />
                {isImporting ? "Importing..." : "Upload Excel"}
              </Button>
            </div>

            <Button variant="secondary" onClick={resetToDefault}>
              <RefreshCw className="h-4 w-4" />
              Reset to Provided Workbook
            </Button>
            <Button variant="secondary" onClick={() => downloadStakeholderTemplate(records)}>
              <Download className="h-4 w-4" />
              Download Excel Template
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Current source summary" description={`Using ${source}.`} />
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Current rows</p>
                <p className="mt-2 text-3xl font-semibold">{records.length}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Default workbook rows</p>
                <p className="mt-2 text-3xl font-semibold">{defaultHeadcountData.length}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">Country coverage</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {countryCounts.map((item) => (
                  <Badge key={item.name} tone="info">
                    {`${item.name}: ${item.value}`}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Template columns include active and exit fields. Edit the template in Excel and upload it here, or use Employee Search to add, edit, exit, and remove rows directly.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
