import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useState } from "react";
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { accessToken, user } = useAppSelector((state) => state.auth);
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";
  const signedInHome = user?.role === "hr" ? "/hr" : user?.role === "stakeholder" ? "/stakeholder" : "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  if (accessToken) {
    return <Navigate to={signedInHome} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const response = await login(values).unwrap();
      dispatch(setCredentials(response));
      toast.success(`Signed in as ${response.user.role}`);
      const roleHome = response.user.role === "hr" ? "/hr" : response.user.role === "stakeholder" ? "/stakeholder" : "/dashboard";
      navigate(from === "/dashboard" ? roleHome : from, { replace: true });
    } catch {
      toast.error("Invalid username or password.");
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8faf7]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(216,170,99,0.24),transparent_30%),radial-gradient(circle_at_84%_12%,rgba(47,111,219,0.18),transparent_28%),linear-gradient(135deg,#fffaf0_0%,#f4f8ff_46%,#eef7f2_100%)]" />
      <div className="absolute left-0 top-0 h-full w-full opacity-[0.08] [background-image:linear-gradient(rgba(31,38,49,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(31,38,49,0.45)_1px,transparent_1px)] [background-size:42px_42px]" />

      <section className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-5 py-8 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <div className="mb-7 inline-flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-[0_18px_42px_rgba(31,38,49,0.10)] backdrop-blur">
            <BrandLogo className="h-10 w-24 shrink-0" />
            <div>
              <p className="text-base font-semibold text-[#172033]">MethodHub HRMS</p>
              <p className="text-sm text-[#5b6b82]">Secure employee operations</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/86 p-6 shadow-[0_28px_70px_rgba(31,38,49,0.18)] backdrop-blur-xl sm:p-7">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d8aa63]/30 bg-[#fff7e8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#8b6429]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Enterprise access
              </div>
              <h1 className="text-3xl font-semibold tracking-normal text-[#172033]">Sign in to your workspace</h1>
              <p className="mt-3 text-sm leading-6 text-[#60708a]">
                Continue to the HRMS portal with role-aware dashboards, approvals, employee records, and workforce insights.
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
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                error={errors.password?.message}
                rightElement={
                  <button
                    type="button"
                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                    title={isPasswordVisible ? "Hide password" : "Show password"}
                    className="rounded-full p-1 text-[#60708a] transition hover:bg-[#eef4ff] hover:text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#d8aa63]/35"
                    onClick={() => setIsPasswordVisible((current) => !current)}
                  >
                    {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                {...register("password")}
              />
              <Button className="w-full" type="submit" disabled={isLoading}>
                <LockKeyhole className="h-4 w-4" />
                {isLoading ? "Signing in..." : "Sign in securely"}
                {!isLoading ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            </form>
          </div>

        </div>

        <div className="hidden lg:block">
          <div className="relative overflow-hidden rounded-[36px] border border-white/20 bg-[#18202b] p-8 shadow-[0_34px_90px_rgba(24,32,43,0.34)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(216,170,99,0.34),transparent_30%),radial-gradient(circle_at_80%_14%,rgba(75,141,255,0.30),transparent_31%),linear-gradient(145deg,#18202b_0%,#263244_58%,#121820_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/30 to-transparent" />

            <div className="relative z-10">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#d8aa63]">Enterprise HRMS</p>
              <h2 className="mt-5 max-w-2xl text-5xl font-semibold leading-tight tracking-normal text-white">
                People operations that feel organized from the first click.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#c6d1e2]">
                A secure role-based workspace for employees, managers, HR, admins, and stakeholders.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  ["248", "Employees"],
                  ["18", "Approvals"],
                  ["86%", "Utilization"]
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-white/12 bg-white/10 p-4 shadow-[0_20px_48px_rgba(0,0,0,0.16)] backdrop-blur">
                    <p className="text-3xl font-semibold text-white">{value}</p>
                    <p className="mt-1 text-sm text-[#c6d1e2]">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 rounded-[28px] border border-white/14 bg-white/12 p-5 shadow-[0_24px_64px_rgba(0,0,0,0.18)] backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Today's workspace</p>
                    <p className="text-xs text-[#c6d1e2]">Live operational snapshot</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Active
                  </div>
                </div>

                <div className="grid gap-3">
                  {[
                    ["Leave approval", "Priya Rao", "Manager queue", "72%"],
                    ["Recruitment funnel", "Stakeholder view", "Open roles", "58%"],
                    ["Employee records", "HR operations", "Profile updates", "84%"]
                  ].map(([title, owner, detail, width]) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-[#111925]/72 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-[#d8aa63]/18 p-2 text-[#f1c77f]">
                            {title === "Employee records" ? <Users className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{title}</p>
                            <p className="text-xs text-[#9fb0c9]">{owner} - {detail}</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#d8aa63]">{width}</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/10">
                        <div className="h-2 rounded-full bg-[#d8aa63]" style={{ width }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
