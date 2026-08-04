import { CheckCircle2, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/variants/toast.manager";
import { useDebounce } from "@/hooks/useDebounce";
import { multipleFetchApi } from "@/utils/api/multiple.api";
import type { LoginFormData } from "@/utils/interface/auth.interface";
import { validateSignInForm } from "@/utils/validation/auth.validation";

function LogInPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [signature, setSignature] = useState("");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({ ...currentData, [name]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [name]: "" }));
  };

  const handleLoginApi = useDebounce(async (formData: LoginFormData) => {
    const response = await multipleFetchApi([
      {
        endPoint: "/auth/login",
        data: formData,
        method: "POST",
      },
    ]);

    const res = response[0];

    if (!res?.data?.success) {
      toast.add({ title: res?.data?.message, type: "error", description: "" });
    } else {
      setLoginSuccess(true);
      setSignature(res?.data?.data?.signature);
    }

    setLoading(false);
  }, 100);

  const handelOtpNavigation = () => {
    navigate(`/auth/verify-otp?signature=${signature}`);
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validateSignInForm({ value: formData });
    setErrors(validation.errors);

    if (!validation.isValid) return;
    setLoading(true);
    handleLoginApi(formData);
  };

  return (
    <section className="w-full max-w-xl rounded-lg border border-white/60 bg-white/95 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl lg:p-10 xl:p-12">
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-950">
          Sign in to continue
        </h1>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 block" htmlFor="email">
            Email address
          </label>
          <div className="relative">
            <Mail aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              autoComplete="email"
              className={`min-h-12 rounded-lg bg-white pl-10 pr-3 text-sm text-slate-950 focus:ring-0! focus:outline-0! ${
                errors.email ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-slate-900"
              }`}
              id="email"
              name="email"
              placeholder="you@example.com"
              onChange={handleChange}
              type="email"
              value={formData.email}
            />
          </div>
          {errors.email && <p className="text-sm text-red-500 font-light">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 block" htmlFor="password">
              Password
            </label>
            <button
              className="text-xs font-medium text-slate-600 transition hover:text-slate-950 cursor-pointer"
              type="button">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <LockKeyhole
              aria-hidden="true"
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            />
            <Input
              autoComplete="current-password"
              className={`min-h-12 rounded-lg bg-white px-10 text-sm text-slate-950 focus:ring-slate-900/10 ${
                errors.password ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-slate-900"
              }`}
              id="password"
              name="password"
              onChange={handleChange}
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-slate-400 transition hover:text-slate-700"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button">
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-500 font-light">{errors.password}</p>}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer selection:bg-transparent">
          <input className="size-4 rounded border-slate-300 accent-slate-900 cursor-pointer" type="checkbox" />
          Keep me signed in
        </label>

        <Button className="h-12 w-full rounded-lg text-sm cursor-pointer" size="lg" type="submit">
          {loading ? "loading" : "Sign in"}
        </Button>
      </form>

      <AlertDialog
        open={loginSuccess}
        onOpenChange={(open) => {
          if (open) setLoginSuccess(true);
        }}>
        <AlertDialogContent className="max-w-lg! gap-6 p-6 sm:p-8">
          <AlertDialogHeader>
            <AlertDialogMedia className="size-12 bg-emerald-100 text-emerald-700">
              <CheckCircle2 aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-lg">Verify your identity</AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-6">
              Your admin email and password have been verified. We sent a six-digit security code to the configured
              owner email address. Enter that code on the next page to complete verification and access the admin
              dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="-mx-6 -mb-6 p-6 sm:-mx-8 sm:-mb-8 sm:p-8">
            <AlertDialogAction className="h-14 w-full text-base" onClick={handelOtpNavigation}>
              Continue to verification
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default LogInPage;
