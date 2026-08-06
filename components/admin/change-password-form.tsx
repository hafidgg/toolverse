"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/actions/admin/auth-actions";
import { useToast } from "@/hooks/use-toast";

export function ChangePasswordForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    startTransition(async () => {
      try {
        const result = await changePassword({ currentPassword, newPassword, confirmPassword });
        if (!result.success) {
          setError(result.error ?? "Something went wrong");
          return;
        }
        toast({ title: "Password changed successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (err) {
        setError(String(err));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Changing…" : "Change Password"}
      </Button>
    </form>
  );
}
