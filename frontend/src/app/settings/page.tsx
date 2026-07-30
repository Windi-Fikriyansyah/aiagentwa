import { getProfile } from "./actions";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const profile = await getProfile();
  
  return (
    <SettingsForm initialProfile={profile} />
  );
}
