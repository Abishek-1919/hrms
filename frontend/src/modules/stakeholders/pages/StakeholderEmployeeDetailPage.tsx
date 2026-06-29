import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BriefcaseBusiness, Building2, Globe2, UserRound } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { useStakeholderHeadcount } from "@/modules/stakeholders/hooks/useStakeholderHeadcount";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function StakeholderEmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { records, source, isLoading } = useStakeholderHeadcount();
  const employee = useMemo(() => records.find((record) => record.id === employeeId), [employeeId, records]);

  if (isLoading) {
    return (
      <div className="page-shell">
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading employee details...</CardContent>
        </Card>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="page-shell">
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <UserRound className="h-12 w-12 text-muted-foreground" />
            <h1 className="mt-4 text-xl font-semibold">Employee record not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">The selected row is not available in the current stakeholder data source.</p>
            <Button className="mt-5" onClick={() => navigate("/stakeholder/employees")}>
              <ArrowLeft className="h-4 w-4" />
              Back to search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <button
        type="button"
        onClick={() => navigate("/stakeholder/employees")}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to employee search
      </button>

      <PageHeader
        eyebrow="Stakeholder employee view"
        title={employee.employeeName}
        description={`Workbook detail from ${source}. Salary and HR-sensitive fields are not included.`}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <Globe2 className="h-5 w-5 text-primary" />
            <Field label="Country" value={employee.country} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <Field label="Company" value={employee.company} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <BriefcaseBusiness className="h-5 w-5 text-primary" />
            <Field label="Mode" value={employee.mode} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-primary" />
            <Field label="Employee Status" value={employee.employmentStatus ?? "Active"} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader title="Workbook row details" description="Fields imported from the Summary sheet." />
        <CardContent className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Employee name" value={employee.employeeName} />
          <Field label="Country" value={employee.country} />
          <Field label="State / province" value={employee.state} />
          <Field label="Company / entity" value={employee.company} />
          <Field label="MIS company" value={employee.misCompany} />
          <Field label="Client / customer" value={employee.client} />
          <Field label="Mode" value={employee.mode} />
          <Field label="Cost / expense" value={employee.costExpense} />
          <Field label="Billable status" value={employee.billableStatus} />
          <Field label="Employment status" value={employee.employmentStatus ?? "Active"} />
          <Field label="Exit date" value={employee.exitDate || "N/A"} />
          <Field label="Exit reason" value={employee.exitReason || "N/A"} />
          <Field label="Month" value={employee.month} />
          <Field label="Source serial number" value={employee.serialNumber} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Access guardrail" description="Stakeholder changes update the analytics data source only and do not expose salary fields." />
        <CardContent className="flex flex-wrap gap-3">
          <Badge tone="info">No salary fields</Badge>
          <Badge tone="success">Dashboard synced</Badge>
          <Badge tone="default">Managed in Employee Search</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
