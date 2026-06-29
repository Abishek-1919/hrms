import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/app/store/hooks";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { TextField } from "@/components/forms/TextField";
import { PageHeader } from "@/components/common/PageHeader";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export function ProfilePage() {
  const { user, accessToken } = useAppSelector((state) => state.auth);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Enter your current password and new password.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    try {
      setIsSaving(true);
      const response = await fetch(`${apiBaseUrl}/profile/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to change password.");
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to change password.");
    } finally {
      setIsSaving(false);
    }
  };

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
            <Button size="sm" onClick={handleSavePassword} disabled={isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          }
        />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextField label="Full name" defaultValue={user?.name} />
          <TextField label="Email" defaultValue={user?.email} />
          <TextField label="Department" defaultValue={user?.department} />
          <TextField label="Designation" defaultValue={user?.designation} />
          <TextField
            label="Current password"
            type="password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <TextField
            label="New password"
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
