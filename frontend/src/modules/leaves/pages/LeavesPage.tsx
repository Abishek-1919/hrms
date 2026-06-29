import { useMemo, useState } from "react";
import { CalendarPlus, Send, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/app/store/hooks";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import {
  calculateLeaveDays,
  getManagedLeaveRequests,
  submitLeaveRequest,
  type LeaveRequestType
} from "@/modules/leaves/utils/leaveRequestStorage";
import { getEmployeeName } from "@/modules/operations/workflowData";

const leaveTypeOptions: { value: LeaveRequestType; label: string }[] = [
  { value: "annual", label: "Annual leave" },
  { value: "sick", label: "Sick leave" },
  { value: "casual", label: "Casual leave" },
  { value: "comp_off", label: "Comp off" },
  { value: "unpaid", label: "Unpaid leave" }
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function LeavesPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { employees } = useAppSelector((state) => state.employees);
  const [requests, setRequests] = useState(() => getManagedLeaveRequests());
  const [type, setType] = useState<LeaveRequestType>("annual");
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [reason, setReason] = useState("");

  const currentEmployee = employees.find((employee) => employee.employee_id === user?.id);
  const assignedManager = employees.find((employee) => employee.employee_id === currentEmployee?.manager_id);
  const isManagerOrHr = user?.role === "manager" || user?.role === "hr" || user?.role === "admin";
  const visibleRequests = useMemo(() => {
    if (!user) return [];
    if (user.role === "manager") return requests.filter((request) => request.managerId === user.id || request.employeeId === user.id);
    if (user.role === "hr" || user.role === "admin") return requests;
    return requests.filter((request) => request.employeeId === user.id);
  }, [requests, user]);

  const pendingCount = visibleRequests.filter((request) => request.status === "pending").length;
  const approvedThisMonth = visibleRequests
    .filter((request) => request.status === "approved" && request.from.startsWith(today().slice(0, 7)))
    .reduce((sum, request) => sum + request.days, 0);
  const compOffPending = visibleRequests.filter((request) => request.type === "comp_off" && request.status === "pending").length;

  const refresh = () => setRequests(getManagedLeaveRequests());

  function submitRequest() {
    if (!currentEmployee) {
      toast.error("Employee profile is required before submitting leave.");
      return;
    }
    if (!from || !to || !reason.trim()) {
      toast.error("From date, to date, and reason are required.");
      return;
    }
    if (from > to) {
      toast.error("To date must be after from date.");
      return;
    }
    if (!assignedManager) {
      toast.error("Assigned manager is required before leave can be routed.");
      return;
    }

    submitLeaveRequest({ employee: currentEmployee, manager: assignedManager, type, from, to, reason });
    refresh();
    setReason("");
    toast.success(`Leave request sent to ${getEmployeeName(assignedManager)}.`);
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Leave management"
        title="Leave balances and requests"
        description="Submit leave to the assigned manager and track approval status from one workspace."
        action={
          <Button onClick={submitRequest}>
            <Send className="h-4 w-4" />
            Submit Request
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending requests" value={String(pendingCount)} delta="Awaiting manager review" icon={CalendarPlus} tone="warning" />
        <StatCard label="Approved this month" value={String(approvedThisMonth)} delta="Leave days reflected in attendance" icon={WalletCards} tone="success" />
        <StatCard label="Pending comp off" value={String(compOffPending)} delta="Comp off requests awaiting approval" icon={WalletCards} tone="info" />
      </section>

      {currentEmployee && !isManagerOrHr ? (
        <Card>
          <CardHeader title="Request leave" description={`This request will go to ${assignedManager ? getEmployeeName(assignedManager) : "the assigned manager"}.`} />
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_2fr_auto] xl:items-end">
            <label className="text-sm font-medium">
              Leave type
              <select className="form-control mt-2" value={type} onChange={(event) => setType(event.target.value as LeaveRequestType)}>
                {leaveTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">
              From
              <input className="form-control mt-2" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </label>
            <label className="text-sm font-medium">
              To
              <input className="form-control mt-2" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </label>
            <label className="text-sm font-medium">
              Reason
              <input className="form-control mt-2" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for leave" />
            </label>
            <Button onClick={submitRequest}>
              <CalendarPlus className="h-4 w-4" />
              Request
            </Button>
            <p className="text-sm text-muted-foreground md:col-span-2 xl:col-span-5">
              Duration: {calculateLeaveDays(from, to)} day(s). Manager approval will add leave records to HR attendance.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Leave history" description="Requests are routed to the assigned manager before they affect attendance." />
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[hsl(var(--bg-elevated))]">
              <tr>
                {["Employee", "Type", "Dates", "Days", "Reason", "Manager", "Status"].map((header) => (
                  <th key={header} className="px-4 py-3 text-left font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRequests.map((request) => (
                <tr key={request.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{request.employeeName}</td>
                  <td className="px-4 py-3 capitalize">{request.type.replace("_", " ")}</td>
                  <td className="px-4 py-3">{request.from} to {request.to}</td>
                  <td className="px-4 py-3">{request.days}</td>
                  <td className="px-4 py-3">{request.reason}</td>
                  <td className="px-4 py-3">{request.managerName}</td>
                  <td className="px-4 py-3">
                    <Badge tone={request.status === "approved" ? "success" : request.status === "rejected" ? "danger" : "warning"}>{request.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
