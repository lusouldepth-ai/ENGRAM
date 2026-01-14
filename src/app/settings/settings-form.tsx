"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { updateProfile } from "@/app/actions/onboarding-actions"
import { updateSelectedVocabBook } from "@/app/actions/daily-vocab-injection"
import { getVocabBooks } from "@/app/actions/vocab-actions"
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
import { useLanguage } from "@/lib/contexts/LanguageContext"

interface VocabBook {
  id: string
  book_id: string
  title: string
  word_count: number
  cefr_level: string | null
}

interface SettingsFormProps {
  profile: any
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [vocabBooks, setVocabBooks] = useState<VocabBook[]>([])
  const [selectedBookId, setSelectedBookId] = useState<string>(
    profile?.selected_vocab_book_id || ""
  )

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || "",
    learning_goal: profile?.learning_goal || "General",
    english_level: profile?.english_level || "Intermediate",
    accent_preference: profile?.accent_preference || "US",
    daily_new_words_goal: profile?.daily_new_words_goal || 10,
  })

  // Fetch vocab books on mount
  useEffect(() => {
    async function fetchBooks() {
      const result = await getVocabBooks()
      if (result.success && result.books) {
        setVocabBooks(result.books)
      }
    }
    fetchBooks()
  }, [])

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleBookChange = async (bookId: string) => {
    setSelectedBookId(bookId)
    // Save immediately
    await updateSelectedVocabBook(bookId)
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
        daily_new_words_goal: formData.daily_new_words_goal,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      router.refresh()
      // Redirect to dashboard after successful save
      router.push('/dashboard')
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
        <h1 className="text-2xl font-bold text-[#1A1A1A]">{t('settings.title')}</h1>
        <p className="text-gray-500 mt-2">{t('settings.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="display-name">{t('settings.displayName')}</Label>
          <Input
            id="display-name"
            placeholder={t('settings.displayNamePlaceholder')}
            value={formData.display_name}
            onChange={(e) => handleChange("display_name", e.target.value)}
            className="bg-white border-stone-200"
          />
        </div>

        {/* Vocab Book Selector */}
        <div className="space-y-2">
          <Label htmlFor="vocab-book">{t('settings.vocabBook')}</Label>
          <Select
            value={selectedBookId}
            onValueChange={handleBookChange}
          >
            <SelectTrigger id="vocab-book" className="bg-white border-stone-200">
              <SelectValue placeholder={t('settings.vocabBookPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {vocabBooks.map((book) => (
                <SelectItem key={book.id} value={book.id}>
                  {book.title} ({book.word_count} {t('settings.words')})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400">
            {t('settings.vocabBookHint')}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="learning-goal">{t('settings.learningGoal')}</Label>
          <Select
            value={formData.learning_goal}
            onValueChange={(value) => handleChange("learning_goal", value)}
          >
            <SelectTrigger id="learning-goal" className="bg-white border-stone-200">
              <SelectValue placeholder={t('settings.learningGoalPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="General">{t('settings.goal.general')}</SelectItem>
              <SelectItem value="Business">{t('settings.goal.business')}</SelectItem>
              <SelectItem value="IELTS">{t('settings.goal.ielts')}</SelectItem>
              <SelectItem value="TOEFL">{t('settings.goal.toefl')}</SelectItem>
              <SelectItem value="Academic">{t('settings.goal.academic')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="english-level">{t('settings.englishLevel')}</Label>
          <Select
            value={formData.english_level}
            onValueChange={(value) => handleChange("english_level", value)}
          >
            <SelectTrigger id="english-level" className="bg-white border-stone-200">
              <SelectValue placeholder={t('settings.levelPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Beginner">{t('settings.level.beginner')}</SelectItem>
              <SelectItem value="Intermediate">{t('settings.level.intermediate')}</SelectItem>
              <SelectItem value="Advanced">{t('settings.level.advanced')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accent-preference">{t('settings.accent')}</Label>
          <Select
            value={formData.accent_preference}
            onValueChange={(value) => handleChange("accent_preference", value)}
          >
            <SelectTrigger id="accent-preference" className="bg-white border-stone-200">
              <SelectValue placeholder={t('settings.accentPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">{t('settings.accent.us')}</SelectItem>
              <SelectItem value="UK">{t('settings.accent.uk')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label htmlFor="daily-words">{t('settings.dailyGoal')}</Label>
            <span className="text-lg font-semibold text-braun-accent">
              {formData.daily_new_words_goal} {t('settings.dailyGoalUnit')}
            </span>
          </div>
          <input
            type="range"
            id="daily-words"
            min="5"
            max="50"
            step="5"
            value={formData.daily_new_words_goal}
            onChange={(e) => handleChange("daily_new_words_goal", parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-braun-accent"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>5</span>
            <span>{t('settings.dailyGoal.easy')}</span>
            <span>{t('settings.dailyGoal.medium')}</span>
            <span>{t('settings.dailyGoal.hard')}</span>
            <span>50</span>
          </div>
          <p className="text-xs text-gray-400">
            {t('settings.reviewLimit')}: {formData.daily_new_words_goal * 10} {t('settings.words')}
          </p>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full bg-[#1A1A1A] text-white hover:bg-black rounded-md h-10 font-medium"
            disabled={loading}
          >
            {loading ? t('settings.saving') : t('settings.save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
