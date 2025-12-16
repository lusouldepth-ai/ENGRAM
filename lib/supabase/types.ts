export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          tier: "free" | "pro"
          daily_generations: number
          last_reset_date: string | null
          created_at: string
          learning_goal: string | null
          target_score: string | null
          exam_date: string | null
          english_level: string | null
          accent_preference: string | null
          daily_goal: number | null
          ui_language: string | null
          plan_status: Json | null
          onboarding_completed: boolean
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          tier?: "free" | "pro"
          daily_generations?: number
          last_reset_date?: string | null
          created_at?: string
          learning_goal?: string | null
          target_score?: string | null
          exam_date?: string | null
          english_level?: string | null
          accent_preference?: string | null
          daily_goal?: number | null
          ui_language?: string | null
          plan_status?: Json | null
          onboarding_completed?: boolean
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          tier?: "free" | "pro"
          daily_generations?: number
          last_reset_date?: string | null
          created_at?: string
          learning_goal?: string | null
          target_score?: string | null
          exam_date?: string | null
          english_level?: string | null
          accent_preference?: string | null
          daily_goal?: number | null
          ui_language?: string | null
          plan_status?: Json | null
          onboarding_completed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      decks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          is_preset: boolean
          created_at: string
          view_mode: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          is_preset?: boolean
          created_at?: string
          view_mode?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          is_preset?: boolean
          created_at?: string
          view_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      cards: {
        Row: {
          id: string
          deck_id: string
          user_id: string
          front: string
          phonetic: string | null
          pos: string | null
          translation: string | null
          definition: string | null
          example: string | null
          short_usage: string | null
          shadow_sentence: string | null
          shadow_sentence_translation: string | null
          root_analysis: string | null
          is_mastered: boolean
          state: number
          due: string
          stability: number
          difficulty: number
          reps: number
          created_at: string
        }
        Insert: {
          id?: string
          deck_id: string
          user_id: string
          front: string
          phonetic?: string | null
          pos?: string | null
          translation?: string | null
          definition?: string | null
          example?: string | null
          short_usage?: string | null
          shadow_sentence?: string | null
          shadow_sentence_translation?: string | null
          root_analysis?: string | null
          is_mastered?: boolean
          state?: number
          due?: string
          stability?: number
          difficulty?: number
          reps?: number
          created_at?: string
        }
        Update: {
          id?: string
          deck_id?: string
          user_id?: string
          front?: string
          phonetic?: string | null
          pos?: string | null
          translation?: string | null
          definition?: string | null
          example?: string | null
          short_usage?: string | null
          shadow_sentence?: string | null
          shadow_sentence_translation?: string | null
          root_analysis?: string | null
          is_mastered?: boolean
          state?: number
          due?: string
          stability?: number
          difficulty?: number
          reps?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_deck_id_fkey"
            columns: ["deck_id"]
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      study_logs: {
        Row: {
          id: string
          user_id: string
          card_id: string
          grade: number | null
          reviewed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          grade?: number | null
          reviewed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          grade?: number | null
          reviewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_logs_card_id_fkey"
            columns: ["card_id"]
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      vocab_books: {
        Row: {
          id: string
          book_id: string
          title: string
          word_count: number
          cover_image: string | null
          cefr_level: string | null
          category: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          title: string
          word_count?: number
          cover_image?: string | null
          cefr_level?: string | null
          category?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          title?: string
          word_count?: number
          cover_image?: string | null
          cefr_level?: string | null
          category?: string | null
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      vocab_words: {
        Row: {
          id: string
          book_id: string
          word_rank: number
          head_word: string
          us_phonetic: string | null
          uk_phonetic: string | null
          translations: Json | null
          sentences: Json | null
          real_exam_sentences: Json | null
          synonyms: Json | null
          phrases: Json | null
          memory_method: string | null
          related_words: Json | null
          picture_url: string | null
          exams: Json | null
          raw_content: Json | null
        }
        Insert: {
          id?: string
          book_id: string
          word_rank: number
          head_word: string
          us_phonetic?: string | null
          uk_phonetic?: string | null
          translations?: Json | null
          sentences?: Json | null
          real_exam_sentences?: Json | null
          synonyms?: Json | null
          phrases?: Json | null
          memory_method?: string | null
          related_words?: Json | null
          picture_url?: string | null
          exams?: Json | null
          raw_content?: Json | null
        }
        Update: {
          id?: string
          book_id?: string
          word_rank?: number
          head_word?: string
          us_phonetic?: string | null
          uk_phonetic?: string | null
          translations?: Json | null
          sentences?: Json | null
          real_exam_sentences?: Json | null
          synonyms?: Json | null
          phrases?: Json | null
          memory_method?: string | null
          related_words?: Json | null
          picture_url?: string | null
          exams?: Json | null
          raw_content?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "vocab_words_book_id_fkey"
            columns: ["book_id"]
            referencedRelation: "vocab_books"
            referencedColumns: ["id"]
          }
        ]
      }
      user_vocab_progress: {
        Row: {
          id: string
          user_id: string
          book_id: string
          current_word_rank: number
          completed_count: number
          started_at: string
          last_studied_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          current_word_rank?: number
          completed_count?: number
          started_at?: string
          last_studied_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          current_word_rank?: number
          completed_count?: number
          started_at?: string
          last_studied_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_vocab_progress_book_id_fkey"
            columns: ["book_id"]
            referencedRelation: "vocab_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vocab_progress_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_daily_quota: {
        Args: {
          user_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
