"use client";

import Link from "next/link";
import { useState } from "react";
import { Chrome } from "lucide-react";

import { Card } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthErrorMessage } from "@/lib/auth-errors";

interface AuthCardProps {
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  footerPrompt: string;
  footerLinkLabel: string;
  footerHref: string;
  onGoogleSubmit?: () => Promise<void>;
  googleSubmitLabel?: string;
}

export function AuthCard({
  title,
  description,
  submitLabel,
  onSubmit,
  footerPrompt,
  footerLinkLabel,
  footerHref,
  onGoogleSubmit,
  googleSubmitLabel = "Continue with Google",
}: AuthCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(email, password);
    } catch (error: unknown) {
      setError(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSubmit = async () => {
    if (!onGoogleSubmit) {
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onGoogleSubmit();
    } catch (error: unknown) {
      setError(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md p-6">
      <h1 className="text-2xl font-semibold text-card-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <GradientButton className="w-full" type="submit" disabled={submitting}>
          {submitting ? "Please wait..." : submitLabel}
        </GradientButton>
      </form>

      {onGoogleSubmit ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <GradientButton
            className="w-full"
            type="button"
            variant="secondary"
            disabled={submitting}
            onClick={handleGoogleSubmit}
          >
            <Chrome className="mr-2 h-4 w-4" />
            {googleSubmitLabel}
          </GradientButton>
        </div>
      ) : null}

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {footerPrompt}{" "}
        <Link href={footerHref} className="font-medium text-primary hover:text-primary/85">
          {footerLinkLabel}
        </Link>
      </p>
    </Card>
  );
}
