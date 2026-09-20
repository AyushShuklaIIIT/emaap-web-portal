export interface CurrentUser {
  userId: string;
  fullName: string | null;
  email: string;
  mobile: string | null;
  businessName: string | null;
  jurisdictionState: string;
  jurisdictionDistrict: string;
  role: "business" | "admin" | "gatc";
}

const STORAGE_KEY = "emaap_current_user";

export function getCurrentUser(): CurrentUser | null {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as CurrentUser;
  } catch {
    return null;
  }
}

export function storeCurrentUser(user: CurrentUser): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}
