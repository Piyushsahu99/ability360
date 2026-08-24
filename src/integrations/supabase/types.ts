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
      accessibility_preferences: {
        Row: {
          accessible_venue: boolean
          captions: boolean
          created_at: string
          flexible_schedule: boolean
          high_contrast: boolean
          id: string
          keyboard_navigation: boolean
          other_accommodation: string | null
          reduced_motion: boolean
          remote_participation: boolean
          screen_reader: boolean
          updated_at: string
        }
        Insert: {
          accessible_venue?: boolean
          captions?: boolean
          created_at?: string
          flexible_schedule?: boolean
          high_contrast?: boolean
          id: string
          keyboard_navigation?: boolean
          other_accommodation?: string | null
          reduced_motion?: boolean
          remote_participation?: boolean
          screen_reader?: boolean
          updated_at?: string
        }
        Update: {
          accessible_venue?: boolean
          captions?: boolean
          created_at?: string
          flexible_schedule?: boolean
          high_contrast?: boolean
          id?: string
          keyboard_navigation?: boolean
          other_accommodation?: string | null
          reduced_motion?: boolean
          remote_participation?: boolean
          screen_reader?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accessibility_preferences_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_attempts: {
        Row: {
          category: Database["public"]["Enums"]["skill_category"]
          correct_count: number
          created_at: string
          id: string
          level: number
          score: number
          student_id: string
          total_questions: number
        }
        Insert: {
          category: Database["public"]["Enums"]["skill_category"]
          correct_count: number
          created_at?: string
          id?: string
          level?: number
          score: number
          student_id: string
          total_questions: number
        }
        Update: {
          category?: Database["public"]["Enums"]["skill_category"]
          correct_count?: number
          created_at?: string
          id?: string
          level?: number
          score?: number
          student_id?: string
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          category: Database["public"]["Enums"]["skill_category"]
          correct_index: number
          created_at: string
          id: string
          is_active: boolean
          options: string[]
          prompt: string
          topic: string
        }
        Insert: {
          category: Database["public"]["Enums"]["skill_category"]
          correct_index: number
          created_at?: string
          id?: string
          is_active?: boolean
          options: string[]
          prompt: string
          topic?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["skill_category"]
          correct_index?: number
          created_at?: string
          id?: string
          is_active?: boolean
          options?: string[]
          prompt?: string
          topic?: string
        }
        Relationships: []
      }
      career_roles: {
        Row: {
          branch: string
          category: string
          certifications: string[]
          course: string
          created_at: string
          demand: string
          experienced_label: string
          experienced_max_lpa: number
          experienced_min_lpa: number
          fresher_max_lpa: number
          fresher_min_lpa: number
          growth_path: string
          id: string
          is_active: boolean
          responsibilities: string[]
          skills: string[]
          slug: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          branch: string
          category?: string
          certifications?: string[]
          course: string
          created_at?: string
          demand?: string
          experienced_label?: string
          experienced_max_lpa?: number
          experienced_min_lpa?: number
          fresher_max_lpa?: number
          fresher_min_lpa?: number
          growth_path?: string
          id?: string
          is_active?: boolean
          responsibilities?: string[]
          skills?: string[]
          slug: string
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          branch?: string
          category?: string
          certifications?: string[]
          course?: string
          created_at?: string
          demand?: string
          experienced_label?: string
          experienced_max_lpa?: number
          experienced_min_lpa?: number
          fresher_max_lpa?: number
          fresher_min_lpa?: number
          growth_path?: string
          id?: string
          is_active?: boolean
          responsibilities?: string[]
          skills?: string[]
          slug?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      institutions: {
        Row: {
          city: string | null
          code: string | null
          created_at: string
          created_by: string | null
          id: string
          is_verified: boolean
          name: string
          state: string | null
          type: Database["public"]["Enums"]["institution_type"]
          updated_at: string
          website: string | null
        }
        Insert: {
          city?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_verified?: boolean
          name: string
          state?: string | null
          type?: Database["public"]["Enums"]["institution_type"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_verified?: boolean
          name?: string
          state?: string | null
          type?: Database["public"]["Enums"]["institution_type"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          created_at: string
          deadline: string | null
          description: string
          id: string
          is_published: boolean
          location: string
          mode: Database["public"]["Enums"]["work_mode"]
          organisation: string
          posted_by: string | null
          stipend: string | null
          tags: string[]
          title: string
          type: Database["public"]["Enums"]["opportunity_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          description?: string
          id?: string
          is_published?: boolean
          location?: string
          mode?: Database["public"]["Enums"]["work_mode"]
          organisation: string
          posted_by?: string | null
          stipend?: string | null
          tags?: string[]
          title: string
          type?: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          description?: string
          id?: string
          is_published?: boolean
          location?: string
          mode?: Database["public"]["Enums"]["work_mode"]
          organisation?: string
          posted_by?: string | null
          stipend?: string | null
          tags?: string[]
          title?: string
          type?: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          full_name: string
          headline: string | null
          id: string
          institution_id: string | null
          phone: string | null
          updated_at: string
          year_of_study: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string
          headline?: string | null
          id: string
          institution_id?: string | null
          phone?: string | null
          updated_at?: string
          year_of_study?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string
          headline?: string | null
          id?: string
          institution_id?: string | null
          phone?: string | null
          updated_at?: string
          year_of_study?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: Database["public"]["Enums"]["skill_category"]
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["skill_category"]
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["skill_category"]
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      student_achievements: {
        Row: {
          achieved_on: string | null
          category: string
          created_at: string
          description: string
          id: string
          issuer: string | null
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          achieved_on?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          issuer?: string | null
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          achieved_on?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          issuer?: string | null
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_experiences: {
        Row: {
          created_at: string
          description: string
          end_date: string | null
          id: string
          kind: string
          organisation: string
          role: string
          start_date: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          kind?: string
          organisation: string
          role: string
          start_date?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          kind?: string
          organisation?: string
          role?: string
          start_date?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_experiences_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_interests: {
        Row: {
          created_at: string
          id: string
          interest: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interest: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interest?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_interests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          academic_score: number | null
          academic_score_type: string
          career_goal: string | null
          created_at: string
          degree: string | null
          id: string
          institution_other: string | null
          onboarding_completed_at: string | null
          onboarding_step: number
          preferred_industries: string[]
          preferred_location: string | null
          preferred_work_mode: Database["public"]["Enums"]["work_mode"] | null
          semester: number | null
          target_role_id: string | null
          target_role_selected_at: string | null
          updated_at: string
        }
        Insert: {
          academic_score?: number | null
          academic_score_type?: string
          career_goal?: string | null
          created_at?: string
          degree?: string | null
          id: string
          institution_other?: string | null
          onboarding_completed_at?: string | null
          onboarding_step?: number
          preferred_industries?: string[]
          preferred_location?: string | null
          preferred_work_mode?: Database["public"]["Enums"]["work_mode"] | null
          semester?: number | null
          target_role_id?: string | null
          target_role_selected_at?: string | null
          updated_at?: string
        }
        Update: {
          academic_score?: number | null
          academic_score_type?: string
          career_goal?: string | null
          created_at?: string
          degree?: string | null
          id?: string
          institution_other?: string | null
          onboarding_completed_at?: string | null
          onboarding_step?: number
          preferred_industries?: string[]
          preferred_location?: string | null
          preferred_work_mode?: Database["public"]["Enums"]["work_mode"] | null
          semester?: number | null
          target_role_id?: string | null
          target_role_selected_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_target_role_id_fkey"
            columns: ["target_role_id"]
            isOneToOne: false
            referencedRelation: "career_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_projects: {
        Row: {
          completed_on: string | null
          created_at: string
          description: string
          id: string
          link: string | null
          role: string | null
          started_on: string | null
          student_id: string
          technologies: string[]
          title: string
          updated_at: string
        }
        Insert: {
          completed_on?: string | null
          created_at?: string
          description?: string
          id?: string
          link?: string | null
          role?: string | null
          started_on?: string | null
          student_id: string
          technologies?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          completed_on?: string | null
          created_at?: string
          description?: string
          id?: string
          link?: string | null
          role?: string | null
          started_on?: string | null
          student_id?: string
          technologies?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_projects_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_skills: {
        Row: {
          created_at: string
          id: string
          level: number
          skill_id: string
          student_id: string
          updated_at: string
          verification_status: Database["public"]["Enums"]["skill_verification"]
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          skill_id: string
          student_id: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["skill_verification"]
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          skill_id?: string
          student_id?: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["skill_verification"]
        }
        Relationships: [
          {
            foreignKeyName: "student_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_skills_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_institution: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role:
        | "student"
        | "industry"
        | "institution"
        | "admin"
        | "faculty"
        | "gov_admin"
        | "mentor"
        | "organizer"
      institution_type: "college" | "university" | "polytechnic" | "other"
      opportunity_type: "internship" | "job" | "project" | "training"
      skill_category: "technical" | "soft" | "aptitude" | "domain"
      skill_verification:
        | "self_declared"
        | "assessment_verified"
        | "faculty_verified"
        | "industry_verified"
      work_mode: "onsite" | "remote" | "hybrid"
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
      app_role: [
        "student",
        "industry",
        "institution",
        "admin",
        "faculty",
        "gov_admin",
        "mentor",
        "organizer",
      ],
      institution_type: ["college", "university", "polytechnic", "other"],
      opportunity_type: ["internship", "job", "project", "training"],
      skill_category: ["technical", "soft", "aptitude", "domain"],
      skill_verification: [
        "self_declared",
        "assessment_verified",
        "faculty_verified",
        "industry_verified",
      ],
      work_mode: ["onsite", "remote", "hybrid"],
    },
  },
} as const
