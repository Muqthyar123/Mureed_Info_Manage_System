/**
 * Centralized validation rules reused across every form in the application.
 * Keeping them here means the same rule applies wherever a field appears.
 */

export const NAME_PATTERN = /^[A-Za-z][A-Za-z\s'-]*[A-Za-z.]?$/;
export const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

/** Indian mobile numbers: exactly 10 digits, starting 6-9. */
export const PHONE_DIGITS = 10;

export function validateName(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Mureed Name is required.";
  if (/\d/.test(v)) return "Mureed Name cannot contain numbers.";
  if (!NAME_PATTERN.test(v))
    return "Name may only contain letters, spaces, hyphens and apostrophes.";
  if (v.length < 2) return "Please enter a valid name.";
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Email is required.";
  if (!EMAIL_PATTERN.test(v)) return "Please enter a valid email address.";
  return undefined;
}

/** Strips everything except digits and removes a leading 91 country code. */
export function normalizePhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length > PHONE_DIGITS && digits.startsWith("91")) digits = digits.slice(2);
  return digits.slice(0, PHONE_DIGITS);
}

export function validatePhone(value: string): string | undefined {
  const digits = normalizePhone(value);
  if (!digits) return "Phone Number is required.";
  if (digits.length !== PHONE_DIGITS) return "Please enter a valid 10-digit phone number.";
  if (!/^[6-9]/.test(digits)) return "Indian mobile numbers must start with 6, 7, 8 or 9.";
  return undefined;
}

/** Display format confirmed with the client: +91 9876543210 */
export function formatPhone(value: string): string {
  const digits = normalizePhone(value);
  return digits ? `+91 ${digits}` : "";
}

export interface PasswordRule {
  id: string;
  label: string;
  test: (v: string) => boolean;
  message: string;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "8–12 characters",
    test: (v) => v.length >= 8 && v.length <= 12,
    message: "Password must be between 8 and 12 characters.",
  },
  {
    id: "upper",
    label: "Uppercase letter",
    test: (v) => /[A-Z]/.test(v),
    message: "Password must contain at least one uppercase letter.",
  },
  {
    id: "lower",
    label: "Lowercase letter",
    test: (v) => /[a-z]/.test(v),
    message: "Password must contain at least one lowercase letter.",
  },
  {
    id: "number",
    label: "Number",
    test: (v) => /[0-9]/.test(v),
    message: "Password must contain at least one number.",
  },
  {
    id: "special",
    label: "Special character",
    test: (v) => /[^A-Za-z0-9]/.test(v),
    message: "Password must contain at least one special character.",
  },
];

export function validatePassword(value: string): string | undefined {
  if (!value) return "Password is required.";
  const failed = PASSWORD_RULES.find((r) => !r.test(value));
  return failed?.message;
}

export function validateRequired(value: string, label: string): string | undefined {
  return value.trim() ? undefined : `${label} is required.`;
}
