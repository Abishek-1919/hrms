import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { TextField } from "@/components/forms/TextField";
import { clearMustChangePassword } from "../authSlice";
import { useChangePasswordMutation } from "@/services/authApi";

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ForcePasswordChangePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, accessToken } = useAppSelector((state) => state.auth);
  const [changePassword] = useChangePasswordMutation();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  const onSubmit = async (values: PasswordFormValues) => {
    try {
      if (!accessToken) throw new Error("Missing access token.");
      await changePassword({ accessToken, newPassword: values.password }).unwrap();
      dispatch(clearMustChangePassword());

      toast.success("Password updated successfully. Access granted.");
      navigate("/dashboard", { replace: true });
    } catch {
      toast.error("Failed to update password.");
    }
  };

  return (
    <main className="flex min-h-screen bg-background items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3 justify-center">
          <BrandLogo className="h-10 w-24 shrink-0" />
          <div>
            <p className="text-lg font-semibold">MethodHub HRMS</p>
            <p className="text-sm text-muted-foreground">Security Configuration</p>
          </div>
        </div>

        <div className="panel p-6 shadow-md border border-border bg-card rounded-xl">
          <div>
            <h1 className="text-2xl font-semibold text-center text-foreground">Change Password</h1>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              This is your first login. To secure your account, you are required to change your temporary password.
            </p>
          </div>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              label="New Password"
              type={isPasswordVisible ? "text" : "password"}
              autoComplete="new-password"
              error={errors.password?.message}
              rightElement={
                <button
                  type="button"
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  title={isPasswordVisible ? "Hide password" : "Show password"}
                  className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  onClick={() => setIsPasswordVisible((current) => !current)}
                >
                  {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register("password")}
            />
            <TextField
              label="Confirm New Password"
              type={isConfirmPasswordVisible ? "text" : "password"}
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              rightElement={
                <button
                  type="button"
                  aria-label={isConfirmPasswordVisible ? "Hide password" : "Show password"}
                  title={isConfirmPasswordVisible ? "Hide password" : "Show password"}
                  className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  onClick={() => setIsConfirmPasswordVisible((current) => !current)}
                >
                  {isConfirmPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register("confirmPassword")}
            />
            <Button className="w-full justify-center" type="submit" disabled={isSubmitting}>
              <LockKeyhole className="h-4 w-4 mr-2" />
              {isSubmitting ? "Updating Password..." : "Update Password & Continue"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
export default ForcePasswordChangePage;
