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
      ai_settings: {
        Row: {
          ai_daily_count: number | null
          ai_daily_date: string | null
          analysis_depth: string | null
          created_at: string
          created_date: string
          daily_message_limit: number | null
          deep_enabled: boolean | null
          direct_enabled: boolean | null
          fast_enabled: boolean | null
          fast_max_words: number | null
          id: string
          total_usage: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_daily_count?: number | null
          ai_daily_date?: string | null
          analysis_depth?: string | null
          created_at?: string
          created_date?: string
          daily_message_limit?: number | null
          deep_enabled?: boolean | null
          direct_enabled?: boolean | null
          fast_enabled?: boolean | null
          fast_max_words?: number | null
          id?: string
          total_usage?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_daily_count?: number | null
          ai_daily_date?: string | null
          analysis_depth?: string | null
          created_at?: string
          created_date?: string
          daily_message_limit?: number | null
          deep_enabled?: boolean | null
          direct_enabled?: boolean | null
          fast_enabled?: boolean | null
          fast_max_words?: number | null
          id?: string
          total_usage?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      call_rooms: {
        Row: {
          call_type: string | null
          created_at: string
          created_date: string
          ended_at: string | null
          host_id: string
          host_name: string | null
          id: string
          name: string | null
          participant_cameras: Json | null
          participant_ids: string[]
          participant_mics: Json | null
          participant_names: string[] | null
          room_code: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          call_type?: string | null
          created_at?: string
          created_date?: string
          ended_at?: string | null
          host_id: string
          host_name?: string | null
          id?: string
          name?: string | null
          participant_cameras?: Json | null
          participant_ids?: string[]
          participant_mics?: Json | null
          participant_names?: string[] | null
          room_code: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          call_type?: string | null
          created_at?: string
          created_date?: string
          ended_at?: string | null
          host_id?: string
          host_name?: string | null
          id?: string
          name?: string | null
          participant_cameras?: Json | null
          participant_ids?: string[]
          participant_mics?: Json | null
          participant_names?: string[] | null
          room_code?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          admin_id: string | null
          avatar_url: string | null
          created_at: string
          created_by: string | null
          created_date: string
          deleted_by: string[] | null
          id: string
          last_message: string | null
          last_message_sender: string | null
          last_message_time: string | null
          muted_by: string[] | null
          name: string | null
          nicknames: Json
          participant_ids: string[]
          participant_names: string[] | null
          read_by: Json | null
          theme: string | null
          type: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          created_date?: string
          deleted_by?: string[] | null
          id?: string
          last_message?: string | null
          last_message_sender?: string | null
          last_message_time?: string | null
          muted_by?: string[] | null
          name?: string | null
          nicknames?: Json
          participant_ids?: string[]
          participant_names?: string[] | null
          read_by?: Json | null
          theme?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          created_date?: string
          deleted_by?: string[] | null
          id?: string
          last_message?: string | null
          last_message_sender?: string | null
          last_message_time?: string | null
          muted_by?: string[] | null
          name?: string | null
          nicknames?: Json
          participant_ids?: string[]
          participant_names?: string[] | null
          read_by?: Json | null
          theme?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          created_date: string
          from_user_avatar: string | null
          from_user_id: string
          from_user_name: string | null
          id: string
          status: string
          to_user_avatar: string | null
          to_user_id: string
          to_user_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_date?: string
          from_user_avatar?: string | null
          from_user_id: string
          from_user_name?: string | null
          id?: string
          status?: string
          to_user_avatar?: string | null
          to_user_id: string
          to_user_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_date?: string
          from_user_avatar?: string | null
          from_user_id?: string
          from_user_name?: string | null
          id?: string
          status?: string
          to_user_avatar?: string | null
          to_user_id?: string
          to_user_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          created_date: string
          deleted_by: string[] | null
          file_name: string | null
          file_url: string | null
          id: string
          is_recalled: boolean | null
          reactions: Json
          read_by: string[] | null
          recalled_at: string | null
          sender_avatar: string | null
          sender_id: string
          sender_name: string | null
          type: string | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          created_date?: string
          deleted_by?: string[] | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_recalled?: boolean | null
          reactions?: Json
          read_by?: string[] | null
          recalled_at?: string | null
          sender_avatar?: string | null
          sender_id: string
          sender_name?: string | null
          type?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          created_date?: string
          deleted_by?: string[] | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_recalled?: boolean | null
          reactions?: Json
          read_by?: string[] | null
          recalled_at?: string | null
          sender_avatar?: string | null
          sender_id?: string
          sender_name?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string
          created_date: string
          from_user_avatar: string | null
          from_user_id: string | null
          from_user_name: string | null
          id: string
          is_read: boolean | null
          related_id: string | null
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_date?: string
          from_user_avatar?: string | null
          from_user_id?: string | null
          from_user_name?: string | null
          id?: string
          is_read?: boolean | null
          related_id?: string | null
          title?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_date?: string
          from_user_avatar?: string | null
          from_user_id?: string | null
          from_user_name?: string | null
          id?: string
          is_read?: boolean | null
          related_id?: string | null
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_avatar: string | null
          author_id: string
          author_name: string | null
          content: string
          created_at: string
          created_date: string
          id: string
          image_url: string | null
          liked_by: string[] | null
          likes_count: number
        }
        Insert: {
          author_avatar?: string | null
          author_id: string
          author_name?: string | null
          content: string
          created_at?: string
          created_date?: string
          id?: string
          image_url?: string | null
          liked_by?: string[] | null
          likes_count?: number
        }
        Update: {
          author_avatar?: string | null
          author_id?: string
          author_name?: string | null
          content?: string
          created_at?: string
          created_date?: string
          id?: string
          image_url?: string | null
          liked_by?: string[] | null
          likes_count?: number
        }
        Relationships: []
      }
      reports: {
        Row: {
          action_taken: string | null
          created_at: string
          created_date: string
          details: string | null
          id: string
          reason: string | null
          reported_user_id: string | null
          reported_user_name: string | null
          reporter_id: string
          reporter_name: string | null
          status: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          created_date?: string
          details?: string | null
          id?: string
          reason?: string | null
          reported_user_id?: string | null
          reported_user_name?: string | null
          reporter_id: string
          reporter_name?: string | null
          status?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          created_date?: string
          details?: string | null
          id?: string
          reason?: string | null
          reported_user_id?: string | null
          reported_user_name?: string | null
          reporter_id?: string
          reporter_name?: string | null
          status?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          ban_type: string | null
          ban_until: string | null
          bio: string | null
          chat_disabled: boolean | null
          created_at: string
          created_date: string
          display_name: string | null
          email: string | null
          id: string
          is_banned: boolean | null
          is_online: boolean | null
          last_active: string | null
          status: string | null
          updated_at: string
          user_id: string
          warnings: number | null
        }
        Insert: {
          avatar_url?: string | null
          ban_type?: string | null
          ban_until?: string | null
          bio?: string | null
          chat_disabled?: boolean | null
          created_at?: string
          created_date?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_banned?: boolean | null
          is_online?: boolean | null
          last_active?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          warnings?: number | null
        }
        Update: {
          avatar_url?: string | null
          ban_type?: string | null
          ban_until?: string | null
          bio?: string | null
          chat_disabled?: boolean | null
          created_at?: string
          created_date?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_banned?: boolean | null
          is_online?: boolean | null
          last_active?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          warnings?: number | null
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
      is_conversation_participant: {
        Args: { _conv: string; _user: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
