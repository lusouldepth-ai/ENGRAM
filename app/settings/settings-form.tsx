"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { updateProfile } from "@/app/actions/onboarding-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"

interface SettingsFormProps {
  profile: any
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || "",
    learning_goal: profile?.learning_goal || "General",
    english_level: profile?.english_level || "Intermediate",
    accent_preference: profile?.accent_preference || "US",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateProfile({
        display_name: formData.display_name,
        learning_goal: formData.learning_goal,
        english_level: formData.english_level,
        accent_preference: formData.accent_preference,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      router.refresh()
      alert("Profile updated successfully!")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow-sm border border-stone-200 rounded-xl p-8 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Profile Settings</h1>
        <p className="text-gray-500 mt-2">Manage your personal preferences and learning goals.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="display-name">Display Name</Label>
          <Input
            id="display-name"
            placeholder="Your name"
            value={formData.display_name}
            onChange={(e) => handleChange("display_name", e.target.value)}
            className="bg-white border-stone-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="learning-goal">Learning Goal</Label>
          <Select
            value={formData.learning_goal}
            onValueChange={(value) => handleChange("learning_goal", value)}
          >
            <SelectTrigger id="learning-goal" className="bg-white border-stone-200">
              <SelectValue placeholder="Select a goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="General">General Fluency</SelectItem>
              <SelectItem value="Business">Business English</SelectItem>
              <SelectItem value="IELTS">IELTS Preparation</SelectItem>
              <SelectItem value="TOEFL">TOEFL Preparation</SelectItem>
              <SelectItem value="Academic">Academic English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="english-level">English Level</Label>
          <Select
            value={formData.english_level}
            onValueChange={(value) => handleChange("english_level", value)}
          >
            <SelectTrigger id="english-level" className="bg-white border-stone-200">
              <SelectValue placeholder="Select your level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Beginner">Beginner (A1-A2)</SelectItem>
              <SelectItem value="Intermediate">Intermediate (B1-B2)</SelectItem>
              <SelectItem value="Advanced">Advanced (C1-C2)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accent-preference">Accent Preference</Label>
          <Select
            value={formData.accent_preference}
            onValueChange={(value) => handleChange("accent_preference", value)}
          >
            <SelectTrigger id="accent-preference" className="bg-white border-stone-200">
              <SelectValue placeholder="Select accent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">American (US)</SelectItem>
              <SelectItem value="UK">British (UK)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full bg-[#1A1A1A] text-white hover:bg-black rounded-md h-10 font-medium"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}

