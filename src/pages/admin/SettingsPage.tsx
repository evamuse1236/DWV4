import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useAuth, useSessionToken } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type CredentialUser = {
  _id: Id<"users">;
  displayName: string;
  username: string;
  role: "student" | "admin";
  batch?: string;
  createdAt: number;
  lastLoginAt?: number;
};

const BASE64_DATA_IMAGE_PATTERN = /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=_-]+$/;

function isValidAvatarUrl(value: string): boolean {
  if (BASE64_DATA_IMAGE_PATTERN.test(value)) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function AdminSettingsPage() {
  const { user } = useAuth();
  const token = useSessionToken();

  const credentialSummaries = useQuery(
    api.auth.getCredentialSummaries,
    token ? { adminToken: token } : "skip"
  ) as CredentialUser[] | undefined;

  const changeOwnUsername = useMutation(api.auth.changeOwnUsername);
  const changeOwnPassword = useMutation(api.auth.changeOwnPassword);
  const updateOwnProfile = useMutation(api.auth.updateOwnProfile);
  const adminUpdateUsername = useMutation(api.auth.adminUpdateUsername);
  const adminResetPassword = useMutation(api.auth.adminResetPassword);

  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState("");
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  const [newUsername, setNewUsername] = useState("");
  const [usernamePassword, setUsernamePassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");
  const [updatingUsername, setUpdatingUsername] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [editingUser, setEditingUser] = useState<CredentialUser | null>(null);
  const [editingUsername, setEditingUsername] = useState("");
  const [editingError, setEditingError] = useState("");
  const [editingLoading, setEditingLoading] = useState(false);

  const [resetUser, setResetUser] = useState<CredentialUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    setNewUsername(user?.username ?? "");
    setAvatarUrlInput(user?.avatarUrl ?? "");
  }, [user?.username, user?.avatarUrl]);

  const users = useMemo(() => credentialSummaries ?? [], [credentialSummaries]);

  const saveAvatarUrl = async (rawAvatarUrl: string) => {
    setAvatarError("");
    setAvatarSuccess("");

    if (!token) {
      setAvatarError("Session expired. Please sign in again.");
      return;
    }

    const normalizedAvatarUrl = rawAvatarUrl.trim();
    if (normalizedAvatarUrl && !isValidAvatarUrl(normalizedAvatarUrl)) {
      setAvatarError("Enter a valid image URL starting with http://, https://, or data:image/");
      return;
    }

    setUpdatingAvatar(true);
    try {
      const result = await updateOwnProfile({
        token,
        avatarUrl: normalizedAvatarUrl || undefined,
      });

      if (!result.success) {
        setAvatarError(result.error ?? "Failed to update profile photo.");
        return;
      }

      setAvatarUrlInput(result.avatarUrl ?? "");
      setAvatarSuccess(
        result.avatarUrl
          ? "Profile photo updated successfully."
          : "Profile photo removed."
      );
    } catch (error) {
      console.error("Avatar update failed:", error);
      setAvatarError("Failed to update profile photo.");
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleAvatarUpdate = async () => {
    await saveAvatarUrl(avatarUrlInput);
  };

  const handleAvatarClear = async () => {
    await saveAvatarUrl("");
  };

  const handleOwnUsernameUpdate = async () => {
    setUsernameError("");
    setUsernameSuccess("");

    if (!token) {
      setUsernameError("Session expired. Please sign in again.");
      return;
    }

    if (!newUsername.trim()) {
      setUsernameError("Username cannot be empty.");
      return;
    }

    if (!usernamePassword) {
      setUsernameError("Enter your current password to confirm.");
      return;
    }

    setUpdatingUsername(true);
    try {
      const result = await changeOwnUsername({
        token,
        currentPassword: usernamePassword,
        newUsername: newUsername.trim(),
      });

      if (!result.success) {
        setUsernameError(result.error ?? "Failed to update username.");
        return;
      }

      setUsernamePassword("");
      setUsernameSuccess("Username updated successfully.");
    } catch (error) {
      console.error("Own username update failed:", error);
      setUsernameError("Failed to update username.");
    } finally {
      setUpdatingUsername(false);
    }
  };

  const handleOwnPasswordUpdate = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!token) {
      setPasswordError("Session expired. Please sign in again.");
      return;
    }

    if (!currentPassword) {
      setPasswordError("Enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const result = await changeOwnPassword({
        token,
        currentPassword,
        newPassword,
      });

      if (!result.success) {
        setPasswordError(result.error ?? "Failed to update password.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password updated successfully.");
    } catch (error) {
      console.error("Own password update failed:", error);
      setPasswordError("Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const openEditUsernameDialog = (selectedUser: CredentialUser) => {
    setEditingUser(selectedUser);
    setEditingUsername(selectedUser.username);
    setEditingError("");
  };

  const handleAdminUsernameUpdate = async () => {
    setEditingError("");

    if (!token || !editingUser) {
      setEditingError("Session expired. Please sign in again.");
      return;
    }

    if (!editingUsername.trim()) {
      setEditingError("Username cannot be empty.");
      return;
    }

    setEditingLoading(true);
    try {
      const result = await adminUpdateUsername({
        adminToken: token,
        userId: editingUser._id,
        newUsername: editingUsername.trim(),
      });

      if (!result.success) {
        setEditingError(result.error ?? "Failed to update username.");
        return;
      }

      setEditingUser(null);
      setEditingUsername("");
    } catch (error) {
      console.error("Admin username update failed:", error);
      setEditingError("Failed to update username.");
    } finally {
      setEditingLoading(false);
    }
  };

  const openResetPasswordDialog = (selectedUser: CredentialUser) => {
    setResetUser(selectedUser);
    setResetPassword("");
    setResetConfirmPassword("");
    setResetError("");
    setResetSuccess("");
  };

  const handleAdminPasswordReset = async () => {
    setResetError("");
    setResetSuccess("");

    if (!token || !resetUser) {
      setResetError("Session expired. Please sign in again.");
      return;
    }

    if (resetPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);
    try {
      const result = await adminResetPassword({
        adminToken: token,
        userId: resetUser._id,
        newPassword: resetPassword,
      });

      if (!result.success) {
        setResetError(result.error ?? "Failed to reset password.");
        return;
      }

      setResetSuccess("Password reset successfully.");
      setResetPassword("");
      setResetConfirmPassword("");
    } catch (error) {
      console.error("Admin password reset failed:", error);
      setResetError("Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and credential administration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Account</CardTitle>
          <CardDescription>
            Update your profile photo, username, and password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3">
            <h3 className="text-sm font-medium">Profile Photo</h3>
            {avatarError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {avatarError}
              </div>
            )}
            {avatarSuccess && (
              <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
                {avatarSuccess}
              </div>
            )}
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={avatarUrlInput.trim() || user?.avatarUrl}
                  alt={user?.displayName}
                />
                <AvatarFallback>
                  {user?.displayName?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">
                Use a direct URL or <code>data:image/...;base64,...</code>.
              </p>
            </div>
            <Input
              value={avatarUrlInput}
              onChange={(event) => setAvatarUrlInput(event.target.value)}
              placeholder="https://example.com/profile.gif"
              disabled={updatingAvatar}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleAvatarClear}
                disabled={updatingAvatar || !token}
              >
                Clear Photo
              </Button>
              <Button
                onClick={handleAvatarUpdate}
                disabled={updatingAvatar || !token}
              >
                {updatingAvatar ? "Saving..." : "Save Photo"}
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            <h3 className="text-sm font-medium">Change Username</h3>
            {usernameError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {usernameError}
              </div>
            )}
            {usernameSuccess && (
              <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
                {usernameSuccess}
              </div>
            )}
            <Input
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              placeholder="New username"
              disabled={updatingUsername}
            />
            <Input
              type="password"
              value={usernamePassword}
              onChange={(event) => setUsernamePassword(event.target.value)}
              placeholder="Current password"
              disabled={updatingUsername}
            />
            <div className="flex justify-end">
              <Button onClick={handleOwnUsernameUpdate} disabled={updatingUsername || !token}>
                {updatingUsername ? "Updating..." : "Update Username"}
              </Button>
            </div>
          </div>

          <div className="border-t pt-6 grid gap-3">
            <h3 className="text-sm font-medium">Change Password</h3>
            {passwordError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
                {passwordSuccess}
              </div>
            )}
            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Current password"
              disabled={updatingPassword}
            />
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password"
              disabled={updatingPassword}
            />
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              disabled={updatingPassword}
            />
            <div className="flex justify-end">
              <Button onClick={handleOwnPasswordUpdate} disabled={updatingPassword || !token}>
                {updatingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Credentials</CardTitle>
          <CardDescription>
            View usernames and manage credentials. Passwords are never shown in plaintext.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Password</TableHead>
                <TableHead className="w-[220px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((account) => (
                <TableRow key={account._id}>
                  <TableCell className="font-medium">{account.displayName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {account.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{account.batch || "-"}</TableCell>
                  <TableCell>@{account.username}</TableCell>
                  <TableCell>Hidden</TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditUsernameDialog(account)}
                    >
                      Edit Username
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openResetPasswordDialog(account)}
                    >
                      Reset Password
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Username</DialogTitle>
            <DialogDescription>
              Update username for {editingUser?.displayName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {editingError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {editingError}
              </div>
            )}
            <Input
              value={editingUsername}
              onChange={(event) => setEditingUsername(event.target.value)}
              placeholder="New username"
              disabled={editingLoading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleAdminUsernameUpdate} disabled={editingLoading}>
              {editingLoading ? "Saving..." : "Save Username"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetUser} onOpenChange={(open) => !open && setResetUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {resetUser?.displayName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {resetError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {resetError}
              </div>
            )}
            {resetSuccess && (
              <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
                {resetSuccess}
              </div>
            )}
            <Input
              type="password"
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
              placeholder="New password"
              disabled={resetLoading}
            />
            <Input
              type="password"
              value={resetConfirmPassword}
              onChange={(event) => setResetConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              disabled={resetLoading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)}>
              Close
            </Button>
            <Button onClick={handleAdminPasswordReset} disabled={resetLoading}>
              {resetLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminSettingsPage;
