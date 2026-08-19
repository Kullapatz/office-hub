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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      announcement_reads: {
        Row: {
          announcement_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          title: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          title: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          id: string
          ip: string | null
          status: string
          user_id: string
          work_date: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          id?: string
          ip?: string | null
          status?: string
          user_id: string
          work_date?: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          id?: string
          ip?: string | null
          status?: string
          user_id?: string
          work_date?: string
        }
        Relationships: []
      }
      holidays: {
        Row: {
          holiday_date: string
          id: string
          kind: string
          name: string
        }
        Insert: {
          holiday_date: string
          id?: string
          kind?: string
          name: string
        }
        Update: {
          holiday_date?: string
          id?: string
          kind?: string
          name?: string
        }
        Relationships: []
      }
      leave_balances: {
        Row: {
          id: string
          quota: number
          type: Database["public"]["Enums"]["leave_type"]
          used: number
          user_id: string
        }
        Insert: {
          id?: string
          quota?: number
          type: Database["public"]["Enums"]["leave_type"]
          used?: number
          user_id: string
        }
        Update: {
          id?: string
          quota?: number
          type?: Database["public"]["Enums"]["leave_type"]
          used?: number
          user_id?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          attachment_path: string | null
          comment: string | null
          created_at: string
          days: number
          end_date: string
          id: string
          reason: string
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          type: Database["public"]["Enums"]["leave_type"]
          user_id: string
        }
        Insert: {
          attachment_path?: string | null
          comment?: string | null
          created_at?: string
          days?: number
          end_date: string
          id?: string
          reason?: string
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          type: Database["public"]["Enums"]["leave_type"]
          user_id: string
        }
        Update: {
          attachment_path?: string | null
          comment?: string | null
          created_at?: string
          days?: number
          end_date?: string
          id?: string
          reason?: string
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          type?: Database["public"]["Enums"]["leave_type"]
          user_id?: string
        }
        Relationships: []
      }
      office_networks: {
        Row: {
          cidr: unknown
          created_at: string
          id: string
          label: string
        }
        Insert: {
          cidr: unknown
          created_at?: string
          id?: string
          label?: string
        }
        Update: {
          cidr?: unknown
          created_at?: string
          id?: string
          label?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          department: string
          email: string
          id: string
          linked: boolean
          name: string
          position: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          department?: string
          email: string
          id?: string
          linked?: boolean
          name?: string
          position?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          department?: string
          email?: string
          id?: string
          linked?: boolean
          name?: string
          position?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      approved_team_leave: {
        Row: {
          days: number | null
          end_date: string | null
          id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["leave_status"] | null
          type: Database["public"]["Enums"]["leave_type"] | null
          user_id: string | null
        }
        Insert: {
          days?: number | null
          end_date?: string | null
          id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["leave_status"] | null
          type?: Database["public"]["Enums"]["leave_type"] | null
          user_id?: string | null
        }
        Update: {
          days?: number | null
          end_date?: string | null
          id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["leave_status"] | null
          type?: Database["public"]["Enums"]["leave_type"] | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bootstrap_current_user: { Args: { _name?: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      ip_allowed: { Args: { _ip: string }; Returns: boolean }
      is_hr: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "hr" | "employee"
      leave_status: "Pending" | "Approved" | "Rejected"
      leave_type: "Sick" | "Personal" | "Annual"
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
      app_role: ["hr", "employee"],
      leave_status: ["Pending", "Approved", "Rejected"],
      leave_type: ["Sick", "Personal", "Annual"],
    },
  },
} as const
