import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { MureedInput } from "@/types";
import { calculateAge } from "@/utils/age";
import {
  normalizePhone,
  validateEmail,
  validateName,
  validatePhone,
  validateRequired,
} from "@/utils/validation";

const empty: MureedInput = {
  name: "",
  dateOfBirth: "",
  gender: "Male",
  address: "",
  phone: "",
  email: "",
  peerName: "",
  status: "Available",
};

type Errors = Partial<Record<keyof MureedInput, string>>;

export function MureedForm({
  initialValue,
  peerNames,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: {
  initialValue?: MureedInput;
  peerNames: string[];
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (value: MureedInput) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<MureedInput>(initialValue ?? empty);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (initialValue) setValue(initialValue);
  }, [initialValue]);

  const age = useMemo(() => calculateAge(value.dateOfBirth), [value.dateOfBirth]);

  const set = <K extends keyof MureedInput>(key: K, v: MureedInput[K]) =>
    setValue((prev) => ({ ...prev, [key]: v }));

  const runValidation = (v: MureedInput): Errors => {
    const next: Errors = {};
    const nameError = validateName(v.name);
    if (nameError) next.name = nameError;
    if (!v.dateOfBirth) next.dateOfBirth = "Date of Birth is required.";
    else if (calculateAge(v.dateOfBirth) === null) next.dateOfBirth = "Enter a valid Date of Birth.";
    if (!v.gender) next.gender = "Gender is required.";
    const addressError = validateRequired(v.address, "Address");
    if (addressError) next.address = addressError;
    const phoneError = validatePhone(v.phone);
    if (phoneError) next.phone = phoneError;
    const emailError = validateEmail(v.email);
    if (emailError) next.email = emailError;
    if (!v.peerName) next.peerName = "Peer Name is required.";
    return next;
  };

  /** Re-validate a single field on blur (and live once it has been touched). */
  const revalidate = (key: keyof MureedInput, v: MureedInput = value) => {
    const all = runValidation(v);
    setErrors((prev) => {
      const next = { ...prev };
      if (all[key]) next[key] = all[key];
      else delete next[key];
      return next;
    });
  };

  const validate = () => {
    const next = runValidation(value);
    setErrors(next);
    const firstInvalid = Object.keys(next)[0];
    if (firstInvalid) {
      const el = document.getElementById(
        firstInvalid === "dateOfBirth" ? "dob" : (firstInvalid as string),
      );
      el?.focus();
    }
    return Object.keys(next).length === 0;
  };

  return (
    <form
      className="surface-card p-5 sm:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        if (validate())
          onSubmit({
            ...value,
            name: value.name.trim().replace(/\s+/g, " "),
            email: value.email.trim(),
            phone: normalizePhone(value.phone),
            address: value.address.trim(),
          });
      }}
      noValidate
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* 1. Mureed Name */}
        <Field label="Mureed Name" htmlFor="name" error={errors.name} className="md:col-span-2">
          <Input
            id="name"
            value={value.name}
            onChange={(e) => {
              const v = e.target.value.replace(/[^A-Za-z\s'-]/g, "");
              set("name", v);
              if (errors.name) revalidate("name", { ...value, name: v });
            }}
            onBlur={() => revalidate("name")}
            placeholder="Enter full name"
          />
        </Field>

        {/* 2. Date of Birth */}
        <Field label="Date of Birth" htmlFor="dob" error={errors.dateOfBirth}>
          <Input
            id="dob"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={value.dateOfBirth}
            onChange={(e) => {
              set("dateOfBirth", e.target.value);
              revalidate("dateOfBirth", { ...value, dateOfBirth: e.target.value });
            }}
          />
        </Field>

        {/* 3. Age (auto) */}
        <Field label="Age" htmlFor="age" hint="Automatically calculated from Date of Birth">
          <Input
            id="age"
            readOnly
            tabIndex={-1}
            value={age === null ? "—" : `${age} years`}
            className="bg-muted text-muted-foreground"
          />
        </Field>

        {/* 4. Gender */}
        <Field label="Gender" error={errors.gender}>
          <RadioGroup
            value={value.gender}
            onValueChange={(v) => set("gender", v as MureedInput["gender"])}
            className="flex gap-6 pt-1.5"
          >
            {["Male", "Female"].map((g) => (
              <div key={g} className="flex items-center gap-2">
                <RadioGroupItem value={g} id={`gender-${g}`} />
                <Label htmlFor={`gender-${g}`} className="font-normal">
                  {g}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </Field>

        {/* 5. Address */}
        <Field label="Address" htmlFor="address" error={errors.address} className="md:col-span-2">
          <Textarea
            id="address"
            rows={3}
            value={value.address}
            onChange={(e) => {
              set("address", e.target.value);
              if (errors.address) revalidate("address", { ...value, address: e.target.value });
            }}
            onBlur={() => revalidate("address")}
            placeholder="House no., street, city"
          />
        </Field>

        {/* 6. Phone Number */}
        <Field label="Phone Number" htmlFor="phone" error={errors.phone}>
          <div className="flex">
            <span className="inline-flex select-none items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              +91
            </span>
            <Input
              id="phone"
              inputMode="numeric"
              maxLength={10}
              className="rounded-l-none"
              value={value.phone}
              onChange={(e) => {
                const v = normalizePhone(e.target.value);
                set("phone", v);
                if (errors.phone) revalidate("phone", { ...value, phone: v });
              }}
              onBlur={() => revalidate("phone")}
              placeholder="9876543210"
            />
          </div>
        </Field>

        {/* 7. Email */}
        <Field
          label="Email"
          htmlFor="email"
          error={errors.email}
          hint="Becomes the Mureed's registered login email (e.g. example123@gmail.com)"
        >
          <Input
            id="email"
            type="email"
            value={value.email}
            onChange={(e) => {
              set("email", e.target.value);
              if (errors.email) revalidate("email", { ...value, email: e.target.value });
            }}
            onBlur={() => revalidate("email")}
            placeholder="mureed@example.com"
          />
        </Field>

        {/* 8. Peer Name */}
        <Field label="Peer Name" error={errors.peerName}>
          <Select value={value.peerName} onValueChange={(v) => {
              set("peerName", v);
              revalidate("peerName", { ...value, peerName: v });
            }}>
            <SelectTrigger>
              <SelectValue placeholder="Select Peer" />
            </SelectTrigger>
            <SelectContent>
              {peerNames.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* 9. Mureed Status */}
        <Field label="Mureed Status">
          <Select
            value={value.status}
            onValueChange={(v) => set("status", v as MureedInput["status"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Passed Out">Passed Out</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="mt-7 flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  className?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-2 block">
        {label}
      </Label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
