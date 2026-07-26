export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_ref: string
          analysis_upload_id: string | null
          created_at: string
          flags: string[]
          id: string
          risk_score: number
          user_id: string
        }
        Insert: {
          account_ref: string
          analysis_upload_id?: string | null
          created_at?: string
          flags?: string[]
          id?: string
          risk_score?: number
          user_id: string
        }
        Update: {
          account_ref?: string
          analysis_upload_id?: string | null
          created_at?: string
          flags?: string[]
          id?: string
          risk_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_analysis_upload_id_fkey"
            columns: ["analysis_upload_id"]
            isOneToOne: false
            referencedRelation: "analysis_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_uploads: {
        Row: {
          account_count: number
          created_at: string
          file_name: string | null
          file_sha256: string | null
          fraud_ring_count: number
          id: string
          processing_time_ms: number | null
          suspicious_count: number
          transaction_count: number
          user_id: string
        }
        Insert: {
          account_count?: number
          created_at?: string
          file_name?: string | null
          file_sha256?: string | null
          fraud_ring_count?: number
          id?: string
          processing_time_ms?: number | null
          suspicious_count?: number
          transaction_count?: number
          user_id: string
        }
        Update: {
          account_count?: number
          created_at?: string
          file_name?: string | null
          file_sha256?: string | null
          fraud_ring_count?: number
          id?: string
          processing_time_ms?: number | null
          suspicious_count?: number
          transaction_count?: number
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          analysis_upload_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          analysis_upload_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          analysis_upload_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_analysis_upload_id_fkey"
            columns: ["analysis_upload_id"]
            isOneToOne: false
            referencedRelation: "analysis_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      detection_config: {
        Row: {
          cycle_depth: number
          fan_in_threshold: number
          id: string
          shell_chain_length: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cycle_depth?: number
          fan_in_threshold?: number
          id?: string
          shell_chain_length?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cycle_depth?: number
          fan_in_threshold?: number
          id?: string
          shell_chain_length?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      fraud_rings: {
        Row: {
          account_refs: string[]
          analysis_upload_id: string | null
          created_at: string
          id: string
          pattern_type: string
          ring_ref: string
          risk_score: number
          user_id: string
        }
        Insert: {
          account_refs?: string[]
          analysis_upload_id?: string | null
          created_at?: string
          id?: string
          pattern_type: string
          ring_ref: string
          risk_score?: number
          user_id: string
        }
        Update: {
          account_refs?: string[]
          analysis_upload_id?: string | null
          created_at?: string
          id?: string
          pattern_type?: string
          ring_ref?: string
          risk_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_rings_analysis_upload_id_fkey"
            columns: ["analysis_upload_id"]
            isOneToOne: false
            referencedRelation: "analysis_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      investigation_notes: {
        Row: {
          account_id: string
          analysis_upload_id: string | null
          created_at: string
          id: string
          notes: string
          status: Database["public"]["Enums"]["investigation_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          analysis_upload_id?: string | null
          created_at?: string
          id?: string
          notes?: string
          status?: Database["public"]["Enums"]["investigation_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          analysis_upload_id?: string | null
          created_at?: string
          id?: string
          notes?: string
          status?: Database["public"]["Enums"]["investigation_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          analysis_upload_id: string | null
          created_at: string
          id: string
          occurred_at: string
          receiver_account_ref: string
          sender_account_ref: string
          transaction_ref: string
          user_id: string
        }
        Insert: {
          amount: number
          analysis_upload_id?: string | null
          created_at?: string
          id?: string
          occurred_at: string
          receiver_account_ref: string
          sender_account_ref: string
          transaction_ref: string
          user_id: string
        }
        Update: {
          amount?: number
          analysis_upload_id?: string | null
          created_at?: string
          id?: string
          occurred_at?: string
          receiver_account_ref?: string
          sender_account_ref?: string
          transaction_ref?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_analysis_upload_id_fkey"
            columns: ["analysis_upload_id"]
            isOneToOne: false
            referencedRelation: "analysis_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_accounts: {
        Row: {
          account_ref: string
          created_at: string
          created_by: string | null
          id: string
          reason: string
        }
        Insert: {
          account_ref: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string
        }
        Update: {
          account_ref?: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          account_id: string
          created_at: string
          id: string
          note: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          note?: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          note?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "investigator"
      investigation_status: "none" | "verified" | "under_review"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "investigator"],
      investigation_status: ["none", "verified", "under_review"],
    },
  },
} as const
