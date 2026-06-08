import { Check, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { getHrName, getManagerName, getUserName, leaveRequests, teamAssignmentRequests, timesheets } from "@/services/mockData";

export function ApprovalsPage() {
  const pendingItems = [
    ...timesheets.filter((item) => item.status === "pending").map((item) => ({
      id: item.id,
      title: `${item.month} timesheet`,
      owner: item.employeeName,
      meta: `${item.totalHours} hours`,
      type: "Timesheet"
    })),
    ...leaveRequests.filter((item) => item.status === "pending").map((item) => ({
      id: item.id,
      title: `${item.type} leave`,
      owner: item.employeeName,
      meta: `${item.days} day(s), ${item.from} to ${item.to}`,
      type: "Leave"
    })),
    ...teamAssignmentRequests.filter((item) => item.status === "Pending").map((item) => ({
      id: item.id,
      title: "Team assignment request",
      owner: getUserName(item.employeeId),
      meta: `Send to ${item.managerIds.map(getManagerName).join(", ")}; notify ${item.hrIds.map(getHrName).join(", ")}`,
      type: "Team Assignment"
    }))
  ];

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Approvals"
        title="Manager approval queue"
        description="Approve or reject timesheets and leave requests with comments."
      />
      <Card>
        <CardHeader title="Pending approvals" description="Action items are ordered by submission priority." />
        <CardContent className="space-y-3">
          {pendingItems.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{item.title}</h2>
                  <Badge tone="warning">pending</Badge>
                  <Badge tone="info">{item.type}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.owner} - {item.meta}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm">
                  <MessageSquare className="h-4 w-4" />
                  Comment
                </Button>
                <Button variant="danger" size="sm" onClick={() => toast.error(`${item.type} rejected in demo mode`)}>
                  <X className="h-4 w-4" />
                  Reject
                </Button>
                <Button size="sm" onClick={() => toast.success(`${item.type} approved in demo mode`)}>
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
