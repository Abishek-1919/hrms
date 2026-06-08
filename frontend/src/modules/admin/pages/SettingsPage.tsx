import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/common/Badge";

const permissions = [
  ["Employee", "Timesheet self-service", "Leave self-service", "Profile update"],
  ["Manager", "Team visibility", "Approval decisions", "Team calendar"],
  ["Admin", "User management", "Policy configuration", "Audit access"]
];

export function SettingsPage() {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Security"
        title="Role permissions"
        description="RBAC preview for employee, manager, and admin capabilities."
      />
      <Card>
        <CardHeader title="Permission matrix" description="These frontend permissions mirror the backend RBAC design." />
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {permissions.map(([role, ...items]) => (
            <div key={role} className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">{role}</h2>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {items.map((item) => (
                  <Badge key={item} tone="info">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
