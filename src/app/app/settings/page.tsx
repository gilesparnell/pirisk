import { fetchProfile } from "./actions";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const profile = await fetchProfile();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure your business profile and preferences
        </p>
      </div>

      <SettingsForm profile={profile} />
    </div>
  );
}
