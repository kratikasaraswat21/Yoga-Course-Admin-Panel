import LogInPage from "@/modules/auth/logIn";
import OTPVerificationPage from "@/modules/auth/otpVerification";
import ResetPasswordPage from "@/modules/auth/resetPassword";
import type { AuthRoutersArrayInterface } from "@/utils/interface/global.interface";

export const APP_AUTH_ROUTES_MODULE_ARRAY: AuthRoutersArrayInterface[] = [
  {
    label: "LogIn",
    path: "/login",
    module: <LogInPage />,
    subModule: [],
  },
  {
    label: "Verify Otp",
    path: "/verify-otp",
    module: <OTPVerificationPage />,
    subModule: [],
  },
  {
    label: "Verify Otp",
    path: "/reset-password",
    module: <ResetPasswordPage />,
    subModule: [],
  },
];
