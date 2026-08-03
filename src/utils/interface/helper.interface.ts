export interface CookieConfigInterface {
  domain?: string | undefined;
  secure: boolean;
  sameSite: "strict" | "Strict" | "lax" | "Lax" | "none" | "None";
  path: string;
  expires: number;
}
