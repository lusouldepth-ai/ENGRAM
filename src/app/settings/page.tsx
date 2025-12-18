import { Navbar } from "@/components/landing/Navbar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <main className="min-h-screen bg-braun-bg flex flex-col">
      <Navbar user={user} />
      <div className="flex-1 flex flex-col items-center justify-start pt-12 p-4 w-full">
        <div className="w-full max-w-2xl">
            <SettingsForm profile={profile} />
        </div>
      </div>
    </main>
  );
}

