"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

export function LanguageToggle() {
  const [language, setLanguage] = React.useState<'en' | 'cn'>('en')
  const supabase = createClient()

  // Fetch initial preference
  React.useEffect(() => {
    async function fetchPreference() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('ui_language')
          .eq('id', user.id)
          .single()
        if (data?.ui_language) {
          setLanguage(data.ui_language as 'en' | 'cn')
        }
      }
    }
    fetchPreference()
  }, [supabase])

  const toggleLanguage = async () => {
    const newLang = language === 'en' ? 'cn' : 'en'
    setLanguage(newLang)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ ui_language: newLang })
        .eq('id', user.id)
    }
  }

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        language === 'en' ? "bg-[#EA580C]" : "bg-[#E5E5E5]"
      )}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
          language === 'en' ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  )
}

