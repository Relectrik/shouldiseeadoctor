"use client";

import { useMemo, useState } from "react";

import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserProfile } from "@/lib/types";
import { toTitleCase } from "@/lib/format";

interface ProfileFormProps {
  initialProfile?: Partial<UserProfile>;
  submitLabel: string;
  onSubmit: (profile: UserProfile) => Promise<void>;
  onCancel?: () => void;
}

const employmentOptions: UserProfile["employmentStatus"][] = [
  "employed_full_time",
  "employed_part_time",
  "self_employed",
  "unemployed",
];

const incomeOptions: UserProfile["incomeBracket"][] = [
  "under_25k",
  "25k_50k",
  "50k_100k",
  "100k_plus",
];

const insuranceOptions: UserProfile["insuranceStatus"][] = ["insured", "uninsured", "unknown"];
const genderOptions: UserProfile["gender"][] = ["female", "male", "non_binary", "prefer_not_to_say"];

function formatOptionLabel(value: string) {
  return toTitleCase(value).replace("k", "K");
}

export function ProfileForm({ initialProfile, submitLabel, onSubmit, onCancel }: ProfileFormProps) {
  const [age, setAge] = useState(String(initialProfile?.age ?? 25));
  const [gender, setGender] = useState<UserProfile["gender"]>(initialProfile?.gender ?? "prefer_not_to_say");
  const [state, setState] = useState(initialProfile?.state ?? "CA");
  const [zipCode, setZipCode] = useState(initialProfile?.zipCode ?? "");
  const [employmentStatus, setEmploymentStatus] = useState<UserProfile["employmentStatus"]>(
    initialProfile?.employmentStatus ?? "employed_full_time",
  );
  const [incomeBracket, setIncomeBracket] = useState<UserProfile["incomeBracket"]>(
    initialProfile?.incomeBracket ?? "50k_100k",
  );
  const [studentStatus, setStudentStatus] = useState(initialProfile?.studentStatus ? "yes" : "no");
  const [insuranceStatus, setInsuranceStatus] = useState<UserProfile["insuranceStatus"]>(
    initialProfile?.insuranceStatus ?? "unknown",
  );
  const [familySize, setFamilySize] = useState(String(initialProfile?.familySize ?? 1));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => Boolean(age && state && zipCode && familySize) && !submitting,
    [age, familySize, state, submitting, zipCode],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsedAge = Number(age);
    const parsedFamilySize = Number(familySize);
    const normalizedState = state.trim().toUpperCase();
    const normalizedZip = zipCode.trim();

    if (
      Number.isNaN(parsedAge) ||
      parsedAge < 0 ||
      Number.isNaN(parsedFamilySize) ||
      parsedFamilySize <= 0 ||
      normalizedState.length !== 2 ||
      normalizedZip.length < 5
    ) {
      setError("Please enter valid profile information before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        age: parsedAge,
        gender,
        state: normalizedState,
        zipCode: normalizedZip,
        employmentStatus,
        incomeBracket,
        studentStatus: studentStatus === "yes",
        insuranceStatus,
        familySize: parsedFamilySize,
      });
    } catch {
      setError("Unable to save profile right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          type="number"
          min={0}
          max={120}
          value={age}
          onChange={(event) => setAge(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <select
          id="gender"
          className="h-10 w-full rounded-xl border border-input bg-background/60 px-3 text-sm text-foreground shadow-[0_2px_10px_rgba(43,36,31,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          value={gender}
          onChange={(event) => setGender(event.target.value as UserProfile["gender"])}
        >
          {genderOptions.map((option) => (
            <option key={option} value={option}>
              {formatOptionLabel(option)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="state">State (2-letter code)</Label>
        <Input
          id="state"
          maxLength={2}
          value={state}
          onChange={(event) => setState(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="zip">ZIP Code</Label>
        <Input id="zip" value={zipCode} onChange={(event) => setZipCode(event.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="employment">Employment Status</Label>
        <select
          id="employment"
          className="h-10 w-full rounded-xl border border-input bg-background/60 px-3 text-sm text-foreground shadow-[0_2px_10px_rgba(43,36,31,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          value={employmentStatus}
          onChange={(event) => setEmploymentStatus(event.target.value as UserProfile["employmentStatus"])}
        >
          {employmentOptions.map((option) => (
            <option key={option} value={option}>
              {formatOptionLabel(option)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="income">Income Bracket</Label>
        <select
          id="income"
          className="h-10 w-full rounded-xl border border-input bg-background/60 px-3 text-sm text-foreground shadow-[0_2px_10px_rgba(43,36,31,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          value={incomeBracket}
          onChange={(event) => setIncomeBracket(event.target.value as UserProfile["incomeBracket"])}
        >
          {incomeOptions.map((option) => (
            <option key={option} value={option}>
              {formatOptionLabel(option)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="student">Student Status</Label>
        <select
          id="student"
          className="h-10 w-full rounded-xl border border-input bg-background/60 px-3 text-sm text-foreground shadow-[0_2px_10px_rgba(43,36,31,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          value={studentStatus}
          onChange={(event) => setStudentStatus(event.target.value)}
        >
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="insurance">Insurance Status</Label>
        <select
          id="insurance"
          className="h-10 w-full rounded-xl border border-input bg-background/60 px-3 text-sm text-foreground shadow-[0_2px_10px_rgba(43,36,31,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          value={insuranceStatus}
          onChange={(event) => setInsuranceStatus(event.target.value as UserProfile["insuranceStatus"])}
        >
          {insuranceOptions.map((option) => (
            <option key={option} value={option}>
              {formatOptionLabel(option)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="family-size">Family Size</Label>
        <Input
          id="family-size"
          type="number"
          min={1}
          max={20}
          value={familySize}
          onChange={(event) => setFamilySize(event.target.value)}
          required
        />
      </div>

      <div className="md:col-span-2">
        {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <GradientButton type="submit" disabled={!canSubmit}>
            {submitting ? "Saving..." : submitLabel}
          </GradientButton>
          {onCancel ? (
            <GradientButton type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </GradientButton>
          ) : null}
        </div>
      </div>
    </form>
  );
}
