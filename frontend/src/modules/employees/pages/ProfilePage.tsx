import { Save } from "lucide-react";
import { useAppSelector } from "@/app/store/hooks";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { TextField } from "@/components/forms/TextField";
import { PageHeader } from "@/components/common/PageHeader";
 

export function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Employee profile"
        title="Profile and reporting setup"
        description="Maintain employee details, reporting managers, HR contacts, and team assignment requests."
      />
      <Card>
        <CardHeader
          title="Profile details"
          description="Editable personal details for the current user."
          action={
            <Button size="sm">
              <Save className="h-4 w-4" />
              Save changes
            </Button>
          }
        />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextField label="Full name" defaultValue={user?.name} />
          <TextField label="Email" defaultValue={user?.email} />
          <TextField label="Department" defaultValue={user?.department} />
          <TextField label="Designation" defaultValue={user?.designation} />
          <TextField label="Current password" type="password" placeholder="Enter current password" />
          <TextField label="New password" type="password" placeholder="Enter new password" />
        </CardContent>
      </Card>
    </div>
  );
}
