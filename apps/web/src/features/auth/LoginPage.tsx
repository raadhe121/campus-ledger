import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import { loginSchema, type LoginInput } from "@campus-ledger/validation-schemas";
import type { AppDispatch, RootState } from "../../app/store";
import { Icon } from "../../components/Icon";
import { credentialsReceived } from "./authSlice";
import { useLoginMutation } from "./authApi";

export function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [login, { isLoading }] = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  if (user) return <Navigate to="/" replace />;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const { data } = await login(values).unwrap();
      dispatch(credentialsReceived(data));
    } catch (err) {
      const message =
        err && typeof err === "object" && "data" in err
          ? ((err.data as { error?: { message?: string } })?.error?.message ?? "Something went wrong")
          : "Could not reach the server";
      setFormError(message);
    }
  });

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-paper overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />

      <main className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="flex items-center justify-center gap-2.5 text-4xl font-bold tracking-tight text-accent-strong">
            <Icon name="school" filled size={38} />
            SchoolHub
          </h1>
          <p className="text-sm text-muted mt-2">Every role, one platform — sign in with your school credentials.</p>
        </div>

        <div className="rounded-xl border border-line bg-surface/95 backdrop-blur p-8 card-shadow">
          <div className="mb-7">
            <h2 className="text-xl font-semibold text-ink mb-1.5">Welcome Back</h2>
            <p className="text-sm text-muted">Please enter your credentials to access the portal.</p>
          </div>

          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                Email address
              </label>
              <div className="relative">
                <Icon name="mail" className="absolute inset-y-0 left-3 flex items-center text-muted pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@school.edu"
                  {...register("email")}
                  className="block w-full pl-10 pr-3 py-2.5 border border-line rounded-lg text-sm bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
                />
              </div>
              {errors.email && <p className="text-xs text-rose-600 mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Icon name="lock" className="absolute inset-y-0 left-3 flex items-center text-muted pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="block w-full pl-10 pr-10 py-2.5 border border-line rounded-lg text-sm bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-ink transition-colors"
                >
                  <Icon name={showPassword ? "visibility_off" : "visibility"} />
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-600 mt-1.5">{errors.password.message}</p>}
            </div>

            {formError && (
              <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5 flex items-start gap-2">
                <Icon name="error" className="mt-0.5" size={16} />
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-accent-ink bg-accent hover:bg-accent-strong disabled:opacity-60 transition-colors shadow-sm"
            >
              {isLoading ? "Signing in…" : "Login"}
              {!isLoading && <Icon name="arrow_forward" size={18} />}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-muted flex items-center justify-center gap-3">
          <Link to="/status" className="font-medium text-accent hover:underline">
            System health
          </Link>
          <span className="text-line">·</span>
          <Link to="/designs" className="font-medium text-accent hover:underline">
            Browse designs
          </Link>
        </div>
      </main>
    </div>
  );
}
