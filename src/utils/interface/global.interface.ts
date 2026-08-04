export interface AuthRoutersArrayInterface {
  label: string;
  path: string;
  module: React.ReactElement | null;
  subModule: AuthRoutersArrayInterface[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
