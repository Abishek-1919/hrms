import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { TextField } from "@/components/forms/TextField";
import { setCredentials } from "@/modules/auth/authSlice";
import { useLoginMutation } from "@/services/authApi";

const loginSchema = z.object({
  email: z.string().email("Enter a valid work email"),
  password: z.string().min(4, "Password is required")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();
  const { accessToken } = useAppSelector((state) => state.auth);
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@methodhub.com",
      password: "password"
    }
  });

  if (accessToken) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const response = await login(values).unwrap();
      dispatch(setCredentials(response));
      toast.success(`Signed in as ${response.user.role}`);
      navigate(from, { replace: true });
    } catch {
      toast.error("Use one of the demo emails shown on this page.");
    }
  };

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <BrandLogo className="h-12 w-12 shrink-0" />
            <div>
              <p className="text-lg font-semibold">MethodHub HRMS</p>
              <p className="text-sm text-muted-foreground">Secure employee operations</p>
            </div>
          </div>

          <div className="panel p-6">
            <div>
              <h1 className="text-2xl font-semibold">Sign in</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Access timesheets, leave workflows, approvals, and admin operations.
              </p>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <TextField
                label="Work email"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register("email")}
              />
              <TextField
                label="Password"
                type="password"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register("password")}
              />
              <Button className="w-full" type="submit" disabled={isLoading}>
                <LockKeyhole className="h-4 w-4" />
                {isLoading ? "Signing in..." : "Sign in securely"}
              </Button>
            </form>
          </div>

          <div className="mt-4 grid gap-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            {["employee@methodhub.com", "manager@methodhub.com", "admin@methodhub.com"].map((email) => (
              <div key={email} className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>{email}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="hidden border-l border-border bg-card px-10 py-12 text-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Enterprise HRMS</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight">
            A calm workspace for people operations, approvals, and employee productivity.
          </h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Built for role-aware HR workflows with secure routing, responsive dashboards, reusable components, and
            deploy-ready frontend architecture.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            ["248", "Employees"],
            ["18", "Pending approvals"],
            ["86%", "Utilization"]
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl border border-panel bg-white p-5 shadow-soft dark:bg-muted">
              <p className="text-3xl font-semibold">{value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
