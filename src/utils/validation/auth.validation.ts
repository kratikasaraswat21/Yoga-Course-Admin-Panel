import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import type {
  LoginFormData,
  OtpVerificationFormData,
  ResetPasswordFormData,
} from "@/utils/interface/auth.interface";
import type { ValidationResult } from "@/utils/interface/global.interface";
import validator from "validator";

const PASSWORD_REGEX = /^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/;

export const validateSignInForm = ({ value }: { value: LoginFormData }): ValidationResult => {
  const errors: Record<string, string> = {};

  let isValid = true;

  const email = value?.email?.trim() ?? "";
  const password = value?.password?.trim() ?? "";

  if (!email) {
    errors.email = ERROR_MESSAGES.PLEASE_ENTER_VALID_EMAIL;
    isValid = false;
  }

  if (email && !validator.isEmail(email)) {
    errors.email = ERROR_MESSAGES.PLEASE_ENTER_VALID_EMAIL;
    isValid = false;
  }

  if (!password) {
    errors.password = ERROR_MESSAGES.PLEASE_ENTER_A_LONG_PASSWORD;
    isValid = false;
  }

  if (password && password.length < 8) {
    errors.password = ERROR_MESSAGES.PLEASE_ENTER_A_LONG_PASSWORD;
    isValid = false;
  }

  if (password && !PASSWORD_REGEX.test(password)) {
    errors.password = ERROR_MESSAGES.PLEASE_ENTER_VALID_PASSWORD;
    isValid = false;
  }

  return { isValid, errors };
};

export const validateOtpVerificationForm = ({ value }: { value: OtpVerificationFormData }): ValidationResult => {
  const verificationCode = value.verificationCode.trim();
  const isValid = /^\d{6}$/.test(verificationCode);

  return {
    isValid,
    errors: isValid
      ? {}
      : { verificationCode: ERROR_MESSAGES.PLEASE_ENTER_SIX_DIGIT_VERIFICATION_CODE },
  };
};

export const validateResetPasswordForm = ({ value }: { value: ResetPasswordFormData }): ValidationResult => {
  const errors: Record<string, string> = {};
  const newPassword = value.newPassword.trim();
  const confirmPassword = value.confirmPassword.trim();

  if (!newPassword || newPassword.length < 8) {
    errors.newPassword = ERROR_MESSAGES.PLEASE_ENTER_A_LONG_PASSWORD;
  } else if (!PASSWORD_REGEX.test(newPassword)) {
    errors.newPassword = ERROR_MESSAGES.PLEASE_ENTER_VALID_PASSWORD;
  }

  if (!confirmPassword) {
    errors.confirmPassword = ERROR_MESSAGES.PLEASE_CONFIRM_PASSWORD;
  } else if (confirmPassword !== newPassword) {
    errors.confirmPassword = ERROR_MESSAGES.PASSWORDS_DO_NOT_MATCH;
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};
