import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState, type ChangeEvent, type SubmitEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ResetPasswordFormData } from "@/utils/interface/auth.interface";
import { validateResetPasswordForm } from "@/utils/validation/auth.validation";

function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetPasswordFormData, setResetPasswordFormData] = useState<ResetPasswordFormData>({
    newPassword: "",
    confirmPassword: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setResetPasswordFormData((currentFormData) => ({ ...currentFormData, [name]: value }));
    setValidationErrors((currentErrors) => ({ ...currentErrors, [name]: "" }));
  };

  const handleResetPasswordSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validateResetPasswordForm({ value: resetPasswordFormData });
    setValidationErrors(validation.errors);

    if (!validation.isValid) return;

    // Add the reset password API call here.
  };

  return (
    <section className="w-full max-w-xl rounded-lg border border-white/60 bg-white/95 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl lg:p-10 xl:p-12">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Create a new password to secure your account.</p>
      </div>

      <form className="space-y-6" onSubmit={handleResetPasswordSubmit} noValidate>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="new-password">
            New password
          </label>
          <div className="relative">
            <LockKeyhole
              aria-hidden="true"
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            />
            <Input
              autoComplete="new-password"
              className={`min-h-12 rounded-lg bg-white px-10 text-sm text-slate-950 focus:ring-slate-900/10 ${
                validationErrors.newPassword
                  ? "border-red-500 focus:border-red-500"
                  : "border-slate-300 focus:border-slate-900"
              }`}
              id="new-password"
              name="newPassword"
              onChange={handlePasswordChange}
              placeholder="Enter new password"
              type={showPassword ? "text" : "password"}
              value={resetPasswordFormData.newPassword}
            />
            <button
              aria-label={showPassword ? "Hide new password" : "Show new password"}
              className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-slate-400 transition hover:text-slate-700"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
          {validationErrors.newPassword && (
            <p className="text-sm font-light text-red-500">{validationErrors.newPassword}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="confirm-password">
            Confirm password
          </label>
          <div className="relative">
            <LockKeyhole
              aria-hidden="true"
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            />
            <Input
              autoComplete="new-password"
              className={`min-h-12 rounded-lg bg-white px-10 text-sm text-slate-950 focus:ring-slate-900/10 ${
                validationErrors.confirmPassword
                  ? "border-red-500 focus:border-red-500"
                  : "border-slate-300 focus:border-slate-900"
              }`}
              id="confirm-password"
              name="confirmPassword"
              onChange={handlePasswordChange}
              placeholder="Confirm new password"
              type={showConfirmPassword ? "text" : "password"}
              value={resetPasswordFormData.confirmPassword}
            />
            <button
              aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
              className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-slate-400 transition hover:text-slate-700"
              onClick={() => setShowConfirmPassword((visible) => !visible)}
              type="button"
            >
              {showConfirmPassword ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="text-sm font-light text-red-500">{validationErrors.confirmPassword}</p>
          )}
        </div>

        <Button className="h-12 w-full rounded-lg text-sm cursor-pointer" size="lg" type="submit">
          Reset password
        </Button>
      </form>
    </section>
  );
}

export default ResetPasswordPage;
