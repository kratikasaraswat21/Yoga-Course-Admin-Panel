import { CircleCheck, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

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
import { multipleApiHandler } from "@/utils/api/multiple.api";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import type { ResetPasswordFormData } from "@/utils/interface/auth.interface";
import { validateResetPasswordForm } from "@/utils/validation/auth.validation";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParam] = useSearchParams();
  const resetToken = searchParam.get("token");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetPasswordFormData, setResetPasswordFormData] = useState<ResetPasswordFormData>({
    newPassword: "",
    confirmPassword: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showPasswordResetSuccessDialog, setShowPasswordResetSuccessDialog] = useState(false);

  const handlePasswordResetRequest = useDebounce(async () => {
    if (!resetToken) {
      setIsResettingPassword(false);
      return;
    }

    const response = await multipleApiHandler([
      {
        endPoint: `/auth/reset-password`,
        method: "POST",
        data: {
          token: resetToken,
          password: resetPasswordFormData.newPassword,
        },
      },
    ]);

    const res = response[0];

    if (!res?.data?.success) {
      toast.add({ title: res?.data?.message ?? ERROR_MESSAGES.PASSWORD_RESET_FAILED, type: "error", description: "" });
    } else {
      setShowPasswordResetSuccessDialog(true);
    }

    setIsResettingPassword(false);
  }, 100);

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

    setIsResettingPassword(true);
    handlePasswordResetRequest();
  };

  if (!resetToken) {
    return (
      <Navigate
        replace
        to="/auth/login"
        state={{
          toastNotification: {
            title: ERROR_MESSAGES.INVALID_PASSWORD_RESET_TITLE,
            type: "error",
            description: ERROR_MESSAGES.INVALID_PASSWORD_RESET_DESCRIPTION,
          },
        }}
      />
    );
  } else {
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
                type="button">
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
                type="button">
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

          <Button
            className="h-12 w-full gap-2 rounded-lg text-sm cursor-pointer"
            disabled={isResettingPassword}
            size="lg"
            type="submit">
            {isResettingPassword && <LoaderCircle aria-hidden="true" className="animate-spin" />}
            {isResettingPassword ? "Resetting password..." : "Reset password"}
          </Button>
        </form>

        <AlertDialog open={showPasswordResetSuccessDialog} onOpenChange={setShowPasswordResetSuccessDialog}>
          <AlertDialogContent className="max-w-lg! gap-6 p-6 sm:p-8">
            <AlertDialogHeader>
              <AlertDialogMedia className="size-12 bg-emerald-100 text-emerald-700">
                <CircleCheck aria-hidden="true" />
              </AlertDialogMedia>
              <AlertDialogTitle className="text-lg">Password reset successful</AlertDialogTitle>
              <AlertDialogDescription className="text-base leading-6">
                Your admin password has been updated successfully. You can now sign in using your new password.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="-mx-6 -mb-6 p-6 sm:-mx-8 sm:-mb-8 sm:p-8">
              <AlertDialogAction className="h-12 w-full" onClick={() => navigate("/auth/login", { replace: true })}>
                Continue to sign in
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    );
  }
}

export default ResetPasswordPage;
