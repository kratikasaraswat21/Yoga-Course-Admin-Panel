import { REGEXP_ONLY_DIGITS } from "input-otp";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState, type SubmitEvent } from "react";

import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/variants/toast.manager";
import { useDebounce } from "@/hooks/useDebounce";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import { SUCCESS_MESSAGES } from "@/utils/constants/success.constants";
import { formatCountDownTime, getRemainingCountDownSeconds, storeDataInSecureCookie } from "@/utils/helper/helper";
import type { OtpVerificationFormData } from "@/utils/interface/auth.interface";
import { validateOtpVerificationForm } from "@/utils/validation/auth.validation";
import { useNavigate, useSearchParams } from "react-router-dom";

const RESEND_CODE_COUNTDOWN_SECONDS = 3 * 60;
const RESEND_CODE_AVAILABLE_AT_KEY = "otpResendCodeAvailableAt";

function OTPVerificationPage() {
  const navigate = useNavigate();

  const [searchParam] = useSearchParams();
  const [otpFormData, setOtpFormData] = useState<OtpVerificationFormData>({ verificationCode: "" });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [resendCodeAvailableAt, setResendCodeAvailableAt] = useState(
    () => Number(localStorage.getItem(RESEND_CODE_AVAILABLE_AT_KEY)) || 0,
  );
  const [resendCountDownSeconds, setResendCountDownSeconds] = useState(() =>
    getRemainingCountDownSeconds(Number(localStorage.getItem(RESEND_CODE_AVAILABLE_AT_KEY)) || 0),
  );

  const handelOtpVerification = useDebounce(async (otpData: OtpVerificationFormData) => {
    const response = await multipleApiHandler([
      {
        endPoint: "/auth/verify-otp",
        data: { otp: otpData.verificationCode },
        method: "POST",
      },
    ]);

    const res = response[0];
    if (!res?.data?.success) {
      toast.add({
        title: res?.data?.message ?? ERROR_MESSAGES.OTP_VERIFICATION_FAILED,
        type: "error",
        description: "",
      });
    } else {
      storeDataInSecureCookie(res?.data?.data?.auth_token, "yoga_platform_auth_token", true);
      sessionStorage.removeItem("yoga_platform_auth_verification_failed");
      navigate("/dashboard");
      toast.promise(
        new Promise<{ name: string }>((resolve) => {
          window.setTimeout(() => resolve({ name: "Event" }), 2000);
        }),

        {
          loading: SUCCESS_MESSAGES.LOGIN_SUCCESSFULLY,
          success: SUCCESS_MESSAGES.LOGIN_SUCCESSFULLY,
          error: SUCCESS_MESSAGES.REDIRECTING_TO_DASHBOARD,
        },
      );
    }
  }, 100);

  const handelResendOtpVerificationCode = useDebounce(async () => {
    const signature = searchParam.get("signature");

    if (!signature) {
      toast.add({ title: ERROR_MESSAGES.BROKEN_URL, type: "error", description: "" });
    }

    const response = await multipleApiHandler([
      {
        endPoint: `/auth/resend-otp?signature=${signature}`,
        method: "POST",
      },
    ]);

    const res = response[0];

    toast.add({
      title:
        res?.data?.message ??
        (res?.data?.success ? SUCCESS_MESSAGES.LOGIN_SUCCESSFULLY : ERROR_MESSAGES.OTP_RESEND_FAILED),
      type: res?.data?.success ? "success" : "error",
      description: "",
    });
  }, 100);

  useEffect(() => {
    const updateRemainingCountDown = () => {
      const remainingSeconds = getRemainingCountDownSeconds(resendCodeAvailableAt);
      setResendCountDownSeconds(remainingSeconds);

      if (remainingSeconds === 0) {
        localStorage.removeItem(RESEND_CODE_AVAILABLE_AT_KEY);
      }
    };

    updateRemainingCountDown();

    if (resendCodeAvailableAt <= Date.now()) return;

    const countdownInterval = window.setInterval(updateRemainingCountDown, 1000);
    return () => window.clearInterval(countdownInterval);
  }, [resendCodeAvailableAt]);

  const handleVerificationCodeChange = (verificationCode: string) => {
    setOtpFormData({ verificationCode });
    setValidationErrors((currentErrors) =>
      currentErrors.verificationCode && verificationCode.length < 6 ? currentErrors : {},
    );
  };

  const handleOtpVerificationSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validateOtpVerificationForm({ value: otpFormData });
    setValidationErrors(validation.errors);

    if (!validation.isValid) return;

    // Add the OTP verification API call here.
    handelOtpVerification(otpFormData);
  };

  const handleResendVerificationCode = () => {
    handelResendOtpVerificationCode();
    const availableAt = Date.now() + RESEND_CODE_COUNTDOWN_SECONDS * 1000;
    localStorage.setItem(RESEND_CODE_AVAILABLE_AT_KEY, String(availableAt));
    setResendCodeAvailableAt(availableAt);
    setResendCountDownSeconds(RESEND_CODE_COUNTDOWN_SECONDS);
  };

  return (
    <section className="w-full max-w-xl rounded-lg border border-white/60 bg-white/95 p-6 text-center shadow-2xl shadow-slate-950/20 backdrop-blur-xl lg:p-10 xl:p-12">
      <div className="mx-auto mb-7 flex size-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
        <ShieldCheck aria-hidden="true" className="size-7" />
      </div>

      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Enter verification code</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          Enter the six-digit security code sent to the configured owner email address.
        </p>
      </div>

      <form className="space-y-8" onSubmit={handleOtpVerificationSubmit} noValidate>
        <div className="space-y-2">
          <InputOTP
            aria-invalid={Boolean(validationErrors.verificationCode)}
            aria-label="Verification code"
            maxLength={6}
            onChange={handleVerificationCodeChange}
            pattern={REGEXP_ONLY_DIGITS}
            value={otpFormData.verificationCode}>
            <InputOTPGroup className="mx-auto gap-2">
              {Array.from({ length: 6 }, (_, index) => {
                const isInvalidSlot =
                  Boolean(validationErrors.verificationCode) && index === otpFormData.verificationCode.length;

                return (
                  <InputOTPSlot
                    aria-invalid={isInvalidSlot}
                    className={`size-12 rounded-lg border text-base text-slate-950 shadow-none first:rounded-lg last:rounded-lg data-[active=true]:ring-0 ${
                      isInvalidSlot
                        ? "border-red-500 data-[active=true]:border-red-500"
                        : "border-slate-300 data-[active=true]:border-slate-900"
                    }`}
                    index={index}
                    key={index}
                  />
                );
              })}
            </InputOTPGroup>
          </InputOTP>
          {validationErrors.verificationCode && (
            <p className="text-sm font-light text-red-500">{validationErrors.verificationCode}</p>
          )}
          <div className="flex items-center justify-center gap-1 text-sm text-slate-500 pt-3">
            <span>Didn&apos;t receive the code?</span>
            <Button
              className="h-auto px-1 py-0 text-sm font-semibold"
              disabled={resendCountDownSeconds > 0}
              onClick={handleResendVerificationCode}
              type="button"
              variant="link">
              {resendCountDownSeconds > 0 ? `Resend in ${formatCountDownTime(resendCountDownSeconds)}` : "Resend code"}
            </Button>
          </div>
        </div>

        <Button className="h-12 w-full rounded-lg text-sm cursor-pointer" size="lg" type="submit">
          Verify code
        </Button>
      </form>
    </section>
  );
}

export default OTPVerificationPage;
