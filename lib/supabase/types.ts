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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
