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
      application_documents: {
        Row: {
          application_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["application_document_kind"]
          link: string | null
          name: string
          storage_path: string | null
          student_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["application_document_kind"]
          link?: string | null
          name: string
          storage_path?: string | null
          student_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["application_document_kind"]
          link?: string | null
          name?: string
          storage_path?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "opportunity_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_events: {
        Row: {
          application_id: string
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["application_status"] | null
          id: string
          note: string
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          note?: string
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          note?: string
          to_status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "opportunity_applications"
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
      company_profiles: {
        Row: {
          about: string
          accessibility_commitment: string | null
          company_name: string
          company_size: string | null
          created_at: string
          headquarters: string | null
          hiring_contact_email: string | null
          id: string
          industry: string | null
          is_inclusive_employer: boolean
          logo_url: string | null
          updated_at: string
          verification_note: string | null
          verification_requested_at: string | null
          verification_status: string
          verified_at: string | null
          website: string | null
        }
        Insert: {
          about?: string
          accessibility_commitment?: string | null
          company_name: string
          company_size?: string | null
          created_at?: string
          headquarters?: string | null
          hiring_contact_email?: string | null
          id: string
          industry?: string | null
          is_inclusive_employer?: boolean
          logo_url?: string | null
          updated_at?: string
          verification_note?: string | null
          verification_requested_at?: string | null
          verification_status?: string
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          about?: string
          accessibility_commitment?: string | null
          company_name?: string
          company_size?: string | null
          created_at?: string
          headquarters?: string | null
          hiring_contact_email?: string | null
          id?: string
          industry?: string | null
          is_inclusive_employer?: boolean
          logo_url?: string | null
          updated_at?: string
          verification_note?: string | null
          verification_requested_at?: string | null
          verification_status?: string
          verified_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_awards: {
        Row: {
          award_label: string
          certificate_code: string
          competition_id: string
          created_at: string
          id: string
          issued_at: string
          issued_by: string | null
          rank_position: number
          score: number | null
          student_id: string
          team_id: string | null
        }
        Insert: {
          award_label?: string
          certificate_code?: string
          competition_id: string
          created_at?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          rank_position?: number
          score?: number | null
          student_id: string
          team_id?: string | null
        }
        Update: {
          award_label?: string
          certificate_code?: string
          competition_id?: string
          created_at?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          rank_position?: number
          score?: number | null
          student_id?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_awards_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_awards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_awards_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "competition_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_judges: {
        Row: {
          competition_id: string
          created_at: string
          id: string
          invited_by: string | null
          judge_id: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          judge_id: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          judge_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_judges_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_judges_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_registrations: {
        Row: {
          accommodation_note: string | null
          competition_id: string
          created_at: string
          id: string
          motivation: string
          status: Database["public"]["Enums"]["competition_registration_status"]
          student_id: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          accommodation_note?: string | null
          competition_id: string
          created_at?: string
          id?: string
          motivation?: string
          status?: Database["public"]["Enums"]["competition_registration_status"]
          student_id: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          accommodation_note?: string | null
          competition_id?: string
          created_at?: string
          id?: string
          motivation?: string
          status?: Database["public"]["Enums"]["competition_registration_status"]
          student_id?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_registrations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "competition_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_scores: {
        Row: {
          competition_id: string
          created_at: string
          id: string
          impact: number
          innovation: number
          judge_id: string
          note: string
          presentation: number
          submission_id: string
          technical: number
          updated_at: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          id?: string
          impact?: number
          innovation?: number
          judge_id: string
          note?: string
          presentation?: number
          submission_id: string
          technical?: number
          updated_at?: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          id?: string
          impact?: number
          innovation?: number
          judge_id?: string
          note?: string
          presentation?: number
          submission_id?: string
          technical?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_scores_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_scores_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_scores_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "competition_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_submissions: {
        Row: {
          competition_id: string
          created_at: string
          demo_link: string | null
          id: string
          notes: string
          repo_link: string | null
          student_id: string
          submitted_at: string
          summary: string
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          demo_link?: string | null
          id?: string
          notes?: string
          repo_link?: string | null
          student_id: string
          submitted_at?: string
          summary?: string
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          demo_link?: string | null
          id?: string
          notes?: string
          repo_link?: string | null
          student_id?: string
          submitted_at?: string
          summary?: string
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_submissions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_submissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "competition_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_team_members: {
        Row: {
          created_at: string
          id: string
          role_label: string
          student_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_label?: string
          student_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_label?: string
          student_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_team_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "competition_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_teams: {
        Row: {
          competition_id: string
          created_at: string
          id: string
          invite_code: string
          leader_id: string
          looking_for_members: boolean
          name: string
          pitch: string
          updated_at: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          id?: string
          invite_code?: string
          leader_id: string
          looking_for_members?: boolean
          name: string
          pitch?: string
          updated_at?: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          id?: string
          invite_code?: string
          leader_id?: string
          looking_for_members?: boolean
          name?: string
          pitch?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_teams_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_teams_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          accessibility_note: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string
          ends_on: string | null
          id: string
          is_inclusive: boolean
          is_published: boolean
          location: string
          mode: Database["public"]["Enums"]["work_mode"]
          organisation: string
          prize_details: string
          registration_deadline: string | null
          rules: string
          skills: string[]
          starts_on: string | null
          status: Database["public"]["Enums"]["competition_status"]
          submission_deadline: string | null
          summary: string
          team_max: number
          team_min: number
          title: string
          updated_at: string
        }
        Insert: {
          accessibility_note?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          ends_on?: string | null
          id?: string
          is_inclusive?: boolean
          is_published?: boolean
          location?: string
          mode?: Database["public"]["Enums"]["work_mode"]
          organisation: string
          prize_details?: string
          registration_deadline?: string | null
          rules?: string
          skills?: string[]
          starts_on?: string | null
          status?: Database["public"]["Enums"]["competition_status"]
          submission_deadline?: string | null
          summary?: string
          team_max?: number
          team_min?: number
          title: string
          updated_at?: string
        }
        Update: {
          accessibility_note?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          ends_on?: string | null
          id?: string
          is_inclusive?: boolean
          is_published?: boolean
          location?: string
          mode?: Database["public"]["Enums"]["work_mode"]
          organisation?: string
          prize_details?: string
          registration_deadline?: string | null
          rules?: string
          skills?: string[]
          starts_on?: string | null
          status?: Database["public"]["Enums"]["competition_status"]
          submission_deadline?: string | null
          summary?: string
          team_max?: number
          team_min?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      faculty_assignments: {
        Row: {
          cohort_label: string | null
          created_at: string
          created_by: string | null
          faculty_id: string
          id: string
          student_id: string
        }
        Insert: {
          cohort_label?: string | null
          created_at?: string
          created_by?: string | null
          faculty_id: string
          id?: string
          student_id: string
        }
        Update: {
          cohort_label?: string | null
          created_at?: string
          created_by?: string | null
          faculty_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_assignments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_feedback: {
        Row: {
          body: string
          created_at: string
          faculty_id: string
          id: string
          student_id: string
          subject_kind: string
          subject_label: string | null
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          faculty_id: string
          id?: string
          student_id: string
          subject_kind?: string
          subject_label?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          faculty_id?: string
          id?: string
          student_id?: string
          subject_kind?: string
          subject_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_feedback_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_feedback_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_recommendations: {
        Row: {
          created_at: string
          faculty_id: string
          id: string
          note: string
          opportunity_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          faculty_id: string
          id?: string
          note?: string
          opportunity_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          faculty_id?: string
          id?: string
          note?: string
          opportunity_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_recommendations_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_recommendations_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_recommendations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      mentor_profiles: {
        Row: {
          accepts_requests: boolean
          availability: string
          bio: string
          created_at: string
          designation: string | null
          expertise: string[]
          headline: string
          id: string
          industries: string[]
          is_verified: boolean
          languages: string[]
          max_active_mentees: number
          organisation: string | null
          session_mode: Database["public"]["Enums"]["work_mode"]
          supports_accessibility: boolean
          updated_at: string
          years_experience: number
        }
        Insert: {
          accepts_requests?: boolean
          availability?: string
          bio?: string
          created_at?: string
          designation?: string | null
          expertise?: string[]
          headline?: string
          id: string
          industries?: string[]
          is_verified?: boolean
          languages?: string[]
          max_active_mentees?: number
          organisation?: string | null
          session_mode?: Database["public"]["Enums"]["work_mode"]
          supports_accessibility?: boolean
          updated_at?: string
          years_experience?: number
        }
        Update: {
          accepts_requests?: boolean
          availability?: string
          bio?: string
          created_at?: string
          designation?: string | null
          expertise?: string[]
          headline?: string
          id?: string
          industries?: string[]
          is_verified?: boolean
          languages?: string[]
          max_active_mentees?: number
          organisation?: string | null
          session_mode?: Database["public"]["Enums"]["work_mode"]
          supports_accessibility?: boolean
          updated_at?: string
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "mentor_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_feedback: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          rating: number
          session_id: string
        }
        Insert: {
          author_id: string
          body?: string
          created_at?: string
          id?: string
          rating?: number
          session_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          rating?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_feedback_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mentorship_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_requests: {
        Row: {
          created_at: string
          focus_skills: string[]
          goal: string
          id: string
          mentor_id: string
          message: string
          response_note: string
          status: Database["public"]["Enums"]["mentorship_request_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          focus_skills?: string[]
          goal?: string
          id?: string
          mentor_id: string
          message?: string
          response_note?: string
          status?: Database["public"]["Enums"]["mentorship_request_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          focus_skills?: string[]
          goal?: string
          id?: string
          mentor_id?: string
          message?: string
          response_note?: string
          status?: Database["public"]["Enums"]["mentorship_request_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_requests_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_sessions: {
        Row: {
          agenda: string
          created_at: string
          duration_minutes: number
          id: string
          meeting_link: string | null
          mentor_id: string
          mode: Database["public"]["Enums"]["work_mode"]
          request_id: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["mentorship_session_status"]
          student_id: string
          summary: string
          topic: string
          updated_at: string
        }
        Insert: {
          agenda?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          meeting_link?: string | null
          mentor_id: string
          mode?: Database["public"]["Enums"]["work_mode"]
          request_id?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["mentorship_session_status"]
          student_id: string
          summary?: string
          topic?: string
          updated_at?: string
        }
        Update: {
          agenda?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          meeting_link?: string | null
          mentor_id?: string
          mode?: Database["public"]["Enums"]["work_mode"]
          request_id?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["mentorship_session_status"]
          student_id?: string
          summary?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_sessions_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_sessions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "mentorship_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          accessibility_features: string[]
          accessibility_note: string | null
          created_at: string
          deadline: string | null
          description: string
          id: string
          is_inclusive_employer: boolean
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
          accessibility_features?: string[]
          accessibility_note?: string | null
          created_at?: string
          deadline?: string | null
          description?: string
          id?: string
          is_inclusive_employer?: boolean
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
          accessibility_features?: string[]
          accessibility_note?: string | null
          created_at?: string
          deadline?: string | null
          description?: string
          id?: string
          is_inclusive_employer?: boolean
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
      opportunity_applications: {
        Row: {
          applied_at: string | null
          created_at: string
          deadline: string | null
          employer_feedback: string | null
          employer_rating: number | null
          id: string
          interview_at: string | null
          note: string
          opportunity_id: string
          status: Database["public"]["Enums"]["application_status"]
          status_changed_at: string
          student_id: string
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          deadline?: string | null
          employer_feedback?: string | null
          employer_rating?: number | null
          id?: string
          interview_at?: string | null
          note?: string
          opportunity_id: string
          status?: Database["public"]["Enums"]["application_status"]
          status_changed_at?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          deadline?: string | null
          employer_feedback?: string | null
          employer_rating?: number | null
          id?: string
          interview_at?: string | null
          note?: string
          opportunity_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          status_changed_at?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_skills: {
        Row: {
          created_at: string
          id: string
          opportunity_id: string
          skill_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          opportunity_id: string
          skill_id: string
        }
        Update: {
          created_at?: string
          id?: string
          opportunity_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_skills_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
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
      roadmap_progress: {
        Row: {
          completed_at: string
          id: string
          role_id: string | null
          student_id: string
          task_key: string
        }
        Insert: {
          completed_at?: string
          id?: string
          role_id?: string | null
          student_id: string
          task_key: string
        }
        Update: {
          completed_at?: string
          id?: string
          role_id?: string | null
          student_id?: string
          task_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_progress_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "career_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          certificate_code: string | null
          competition_id: string | null
          created_at: string
          description: string
          id: string
          issuer: string | null
          student_id: string
          title: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          achieved_on?: string | null
          category?: string
          certificate_code?: string | null
          competition_id?: string | null
          created_at?: string
          description?: string
          id?: string
          issuer?: string | null
          student_id: string
          title: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          achieved_on?: string | null
          category?: string
          certificate_code?: string | null
          competition_id?: string | null
          created_at?: string
          description?: string
          id?: string
          issuer?: string | null
          student_id?: string
          title?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_achievements_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_achievements_verified_by_fkey"
            columns: ["verified_by"]
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
          verified_at: string | null
          verified_by: string | null
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
          verified_at?: string | null
          verified_by?: string | null
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
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_projects_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_projects_verified_by_fkey"
            columns: ["verified_by"]
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
      competition_leaderboard: {
        Args: { _competition: string }
        Returns: {
          avg_score: number
          judge_count: number
          rank_position: number
          student_id: string
          student_name: string
          submission_id: string
          team_id: string
          team_name: string
          title: string
        }[]
      }
      faculty_directory: {
        Args: never
        Returns: {
          academic_score: number
          applications_active: number
          applications_total: number
          assigned: boolean
          career_goal: string
          cohort_label: string
          degree: string
          department: string
          full_name: string
          internships: number
          interviews: number
          onboarding_completed: boolean
          placements: number
          readiness: number
          roadmap_completed: number
          semester: number
          skills_total: number
          skills_verified: number
          student_id: string
          target_role_branch: string
          target_role_course: string
          target_role_title: string
          year_of_study: number
        }[]
      }
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
      institution_directory: {
        Args: never
        Returns: {
          academic_score: number
          applications_active: number
          applications_total: number
          career_goal: string
          degree: string
          department: string
          full_name: string
          internships: number
          interviews: number
          onboarding_completed: boolean
          placements: number
          readiness: number
          roadmap_completed: number
          semester: number
          skills_total: number
          skills_verified: number
          student_id: string
          target_role_branch: string
          target_role_course: string
          target_role_title: string
          year_of_study: number
        }[]
      }
      institution_partnerships: {
        Args: never
        Returns: {
          applications: number
          inclusive: boolean
          interviews: number
          offers: number
          opportunity_count: number
          organisation: string
          shortlisted: number
        }[]
      }
      is_applicant_of: {
        Args: { _poster: string; _student: string }
        Returns: boolean
      }
      is_competition_judge: {
        Args: { _competition: string; _user: string }
        Returns: boolean
      }
      is_competition_owner: {
        Args: { _competition: string; _user: string }
        Returns: boolean
      }
      is_faculty_of: {
        Args: { _faculty: string; _student: string }
        Returns: boolean
      }
      is_session_participant: {
        Args: { _session: string; _user: string }
        Returns: boolean
      }
      is_team_leader: {
        Args: { _team: string; _user: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team: string; _user: string }
        Returns: boolean
      }
      role_demand_overview: {
        Args: never
        Returns: {
          demand_count: number
          employer_count: number
          inclusive_share: number
          opportunity_type: Database["public"]["Enums"]["opportunity_type"]
          remote_share: number
          role_title: string
        }[]
      }
      skill_demand_overview: {
        Args: never
        Returns: {
          category: Database["public"]["Enums"]["skill_category"]
          demand_count: number
          prior_count: number
          recent_count: number
          skill_id: string
          skill_name: string
          student_supply: number
        }[]
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
      application_document_kind:
        | "resume"
        | "cover_letter"
        | "certificate"
        | "portfolio"
        | "transcript"
        | "other"
      application_status:
        | "saved"
        | "preparing"
        | "applied"
        | "shortlisted"
        | "interview"
        | "selected"
        | "rejected"
        | "completed"
      competition_registration_status: "registered" | "submitted" | "withdrawn"
      competition_status: "draft" | "open" | "judging" | "completed"
      institution_type: "college" | "university" | "polytechnic" | "other"
      mentorship_request_status:
        | "pending"
        | "accepted"
        | "declined"
        | "completed"
      mentorship_session_status: "scheduled" | "completed" | "cancelled"
      opportunity_type:
        | "internship"
        | "job"
        | "project"
        | "training"
        | "apprenticeship"
        | "challenge"
        | "mentorship"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      application_document_kind: [
        "resume",
        "cover_letter",
        "certificate",
        "portfolio",
        "transcript",
        "other",
      ],
      application_status: [
        "saved",
        "preparing",
        "applied",
        "shortlisted",
        "interview",
        "selected",
        "rejected",
        "completed",
      ],
      competition_registration_status: ["registered", "submitted", "withdrawn"],
      competition_status: ["draft", "open", "judging", "completed"],
      institution_type: ["college", "university", "polytechnic", "other"],
      mentorship_request_status: [
        "pending",
        "accepted",
        "declined",
        "completed",
      ],
      mentorship_session_status: ["scheduled", "completed", "cancelled"],
      opportunity_type: [
        "internship",
        "job",
        "project",
        "training",
        "apprenticeship",
        "challenge",
        "mentorship",
      ],
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
