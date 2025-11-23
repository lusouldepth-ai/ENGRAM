'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function upgradeToPro() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
        .from('profiles')
        .update({ tier: 'pro' })
        .eq('id', user.id);

    if (error) {
        return { success: false, error: error.message };
    }

    // Revalidate all relevant paths to ensure fresh data
    revalidatePath('/dashboard');
    revalidatePath('/profile');
    revalidatePath('/pricing');
    revalidatePath('/', 'layout'); // Revalidate everything just in case

    return { success: true };
}
