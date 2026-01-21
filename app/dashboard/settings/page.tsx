import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { getProfile } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { AccountInfo } from "@/components/settings/account-info";
import { PrivacySection } from "@/components/settings/privacy-section";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";

export default async function SettingsPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="max-w-2xl space-y-6">
        <AccountInfo profile={profile} />
        <PrivacySection />
        <ThemeSelector />
        <DeleteAccountDialog />
      </div>
    </div>
  );
}
