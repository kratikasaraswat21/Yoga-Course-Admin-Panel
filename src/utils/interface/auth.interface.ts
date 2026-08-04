export interface LoginFormData {
  email: string;
  password: string;
}

export interface OtpVerificationFormData {
  verificationCode: string;
}

export interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}
