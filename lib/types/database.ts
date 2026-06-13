export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit: {
        Row: {
          action: string
          admin_email: string | null
          created_at: string
          id: string
          meta: Json | null
          target_candidate_id: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target_candidate_id?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target_candidate_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_target_candidate_id_fkey"
            columns: ["target_candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          ai_summary: string | null
          ai_tags: Json
          blurb: string
          confirmed_at: string | null
          created_at: string
          deletion_requested_at: string | null
          email: string
          embedding: string | null
          enriched_at: string | null
          enrichment: Json | null
          exceptional_rationale: string | null
          exceptional_score: number | null
          full_name: string
          id: string
          ingest_error: string | null
          ingest_status: string
          linkedin_url: string | null
          resume_path: string | null
          resume_text: string | null
          signup_ip: unknown
          signup_user_agent: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          ai_tags?: Json
          blurb: string
          confirmed_at?: string | null
          created_at?: string
          deletion_requested_at?: string | null
          email: string
          embedding?: string | null
          enriched_at?: string | null
          enrichment?: Json | null
          exceptional_rationale?: string | null
          exceptional_score?: number | null
          full_name: string
          id?: string
          ingest_error?: string | null
          ingest_status?: string
          linkedin_url?: string | null
          resume_path?: string | null
          resume_text?: string | null
          signup_ip?: unknown
          signup_user_agent?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          ai_tags?: Json
          blurb?: string
          confirmed_at?: string | null
          created_at?: string
          deletion_requested_at?: string | null
          email?: string
          embedding?: string | null
          enriched_at?: string | null
          enrichment?: Json | null
          exceptional_rationale?: string | null
          exceptional_score?: number | null
          full_name?: string
          id?: string
          ingest_error?: string | null
          ingest_status?: string
          linkedin_url?: string | null
          resume_path?: string | null
          resume_text?: string | null
          signup_ip?: unknown
          signup_user_agent?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      confirmation_tokens: {
        Row: {
          candidate_id: string
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "confirmation_tokens_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          candidate_id: string | null
          created_at: string
          id: string
          kind: string
          meta: Json | null
          resend_id: string | null
          status: string | null
          subject: string | null
          to_email: string | null
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string
          id?: string
          kind: string
          meta?: Json | null
          resend_id?: string | null
          status?: string | null
          subject?: string | null
          to_email?: string | null
        }
        Update: {
          candidate_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          meta?: Json | null
          resend_id?: string | null
          status?: string | null
          subject?: string | null
          to_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: { bucket: string; count: number; window_start: string }
        Insert: { bucket: string; count?: number; window_start: string }
        Update: { bucket?: string; count?: number; window_start?: string }
        Relationships: []
      }
      saved_roles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          embedding: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          embedding?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          embedding?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      bump_rate_limit: {
        Args: { p_bucket: string; p_window_seconds: number }
        Returns: number
      }
      match_candidates: {
        Args: { match_count?: number; query_embedding: string }
        Returns: { id: string; similarity: number }[]
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type CandidateRow = Database["public"]["Tables"]["candidates"]["Row"]
export type CandidateInsert = Database["public"]["Tables"]["candidates"]["Insert"]
export type CandidateUpdate = Database["public"]["Tables"]["candidates"]["Update"]
