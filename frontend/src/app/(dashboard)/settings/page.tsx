import { getProfile } from "./actions";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const profile = await getProfile();
  const safeProfile = profile ? {
    ...profile,
    name: profile.name || "",
    email: profile.email || "",
    phone: profile.phone || "",
    timezone: profile.timezone || "Asia/Jakarta",
  } : {
    id: "",
    name: "",
    email: "",
    phone: "",
    timezone: "Asia/Jakarta",
    language: "id",
    emailNotifications: true,
    waNotifications: true,
    pushNotifications: false,
    twoFactor: false
  };
  
  return (
    <SettingsForm initialProfile={safeProfile} />
  );
}
