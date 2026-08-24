/**
 * Calculates age in whole years from a date of birth, taking into account
 * whether the birthday has already occurred in the current year.
 */
export function calculateAge(dateOfBirth: string | Date, today: Date = new Date()): number | null {
  if (!dateOfBirth) return null;
  const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  if (Number.isNaN(dob.getTime())) return null;

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age < 0 ? null : age;
}

export function formatAge(dateOfBirth: string | Date): string {
  const age = calculateAge(dateOfBirth);
  return age === null ? "—" : `${age} years`;
}

export function formatDate(value: string | Date): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}
