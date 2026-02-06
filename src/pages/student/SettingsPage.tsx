import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth, useSessionToken } from "../../hooks/useAuth";
import { Button, Card, CardContent, CardHeader, Input } from "../../components/paper";

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function SettingsPage() {
  const { user } = useAuth();
  const token = useSessionToken();
  const changeOwnUsername = useMutation(api.auth.changeOwnUsername);
  const changeOwnPassword = useMutation(api.auth.changeOwnPassword);
  const updateOwnProfile = useMutation(api.auth.updateOwnProfile);

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

  useEffect(() => {
    setNewUsername(user?.username ?? "");
    setAvatarUrlInput(user?.avatarUrl ?? "");
  }, [user?.username, user?.avatarUrl]);

  const saveAvatarUrl = async (rawAvatarUrl: string) => {
    setAvatarError("");
    setAvatarSuccess("");

    if (!token) {
      setAvatarError("Session expired. Please sign in again.");
      return;
    }

    const normalizedAvatarUrl = rawAvatarUrl.trim();
    if (normalizedAvatarUrl && !isValidHttpUrl(normalizedAvatarUrl)) {
      setAvatarError("Enter a valid image URL starting with http:// or https://");
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

  const handleUsernameUpdate = async () => {
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
      console.error("Username update failed:", error);
      setUsernameError("Failed to update username.");
    } finally {
      setUpdatingUsername(false);
    }
  };

  const handlePasswordUpdate = async () => {
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
      console.error("Password update failed:", error);
      setPasswordError("Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your account credentials and profile photo.
        </p>
      </div>

      <Card variant="outlined" padding="lg">
        <CardHeader
          title="Profile Photo"
          subtitle="Paste an image URL. GIF URLs are supported."
        />
        <CardContent className="space-y-4">
          {avatarError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {avatarError}
            </div>
          )}
          {avatarSuccess && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              {avatarSuccess}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full border border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center text-lg font-semibold text-gray-600">
              {avatarUrlInput.trim() ? (
                <img
                  src={avatarUrlInput.trim()}
                  alt={`${user?.displayName ?? "User"} avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                (user?.displayName?.charAt(0).toUpperCase() ?? "?")
              )}
            </div>
            <p className="text-sm text-gray-600">
              Use a direct image URL like <code>https://.../profile.gif</code>.
            </p>
          </div>

          <Input
            label="Avatar URL"
            value={avatarUrlInput}
            onChange={(event) => setAvatarUrlInput(event.target.value)}
            placeholder="https://example.com/profile.gif"
            disabled={updatingAvatar}
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={handleAvatarClear}
              isLoading={updatingAvatar}
              disabled={!token}
            >
              Clear Photo
            </Button>
            <Button
              onClick={handleAvatarUpdate}
              isLoading={updatingAvatar}
              disabled={!token}
            >
              Save Photo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card variant="outlined" padding="lg">
        <CardHeader
          title="Change Username"
          subtitle={`Current username: @${user?.username ?? ""}`}
        />
        <CardContent className="space-y-4">
          {usernameError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {usernameError}
            </div>
          )}
          {usernameSuccess && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              {usernameSuccess}
            </div>
          )}
          <Input
            label="New Username"
            value={newUsername}
            onChange={(event) => setNewUsername(event.target.value)}
            placeholder="Enter new username"
            disabled={updatingUsername}
          />
          <Input
            label="Current Password"
            type="password"
            value={usernamePassword}
            onChange={(event) => setUsernamePassword(event.target.value)}
            placeholder="Enter current password to confirm"
            disabled={updatingUsername}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleUsernameUpdate}
              isLoading={updatingUsername}
              disabled={!token}
            >
              Update Username
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card variant="outlined" padding="lg">
        <CardHeader title="Change Password" />
        <CardContent className="space-y-4">
          {passwordError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              {passwordSuccess}
            </div>
          )}
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Enter current password"
            disabled={updatingPassword}
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Minimum 6 characters"
            disabled={updatingPassword}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter new password"
            disabled={updatingPassword}
          />
          <div className="flex justify-end">
            <Button
              onClick={handlePasswordUpdate}
              isLoading={updatingPassword}
              disabled={!token}
            >
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;
