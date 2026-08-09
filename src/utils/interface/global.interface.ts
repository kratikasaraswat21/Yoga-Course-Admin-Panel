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

export interface CloudflareImageUploadResponse {
  success: boolean;

  result?: {
    id: string;
    filename?: string;
    uploaded?: string;
    requireSignedURLs?: boolean;
    variants?: string[];
  };

  errors?: Array<{
    code: number;
    message: string;
  }>;
}
