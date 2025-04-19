export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_settings: {
        Row: {
          description: string | null
          id: string
          setting_name: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_name: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_name?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string
          published: boolean | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_checks: {
        Row: {
          compliance_status: string
          created_at: string
          document_name: string
          document_type: string
          id: string
          issues_details: Json | null
          issues_detected: number | null
          suggestions: Json | null
          updated_at: string
        }
        Insert: {
          compliance_status: string
          created_at?: string
          document_name: string
          document_type: string
          id?: string
          issues_details?: Json | null
          issues_detected?: number | null
          suggestions?: Json | null
          updated_at?: string
        }
        Update: {
          compliance_status?: string
          created_at?: string
          document_name?: string
          document_type?: string
          id?: string
          issues_details?: Json | null
          issues_detected?: number | null
          suggestions?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      cover_letters: {
        Row: {
          company: string | null
          content: string
          created_at: string | null
          id: string
          job_title: string | null
          language: Database["public"]["Enums"]["resume_language"] | null
          recipient_name: string | null
          title: string
          tone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          content: string
          created_at?: string | null
          id?: string
          job_title?: string | null
          language?: Database["public"]["Enums"]["resume_language"] | null
          recipient_name?: string | null
          title: string
          tone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          content?: string
          created_at?: string | null
          id?: string
          job_title?: string | null
          language?: Database["public"]["Enums"]["resume_language"] | null
          recipient_name?: string | null
          title?: string
          tone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fraud_detection: {
        Row: {
          application_id: string | null
          created_at: string
          device_info: string | null
          flags: Json | null
          fraud_risk: string | null
          fraud_score: number | null
          id: string
          ip_address: string | null
          is_fraudulent: boolean | null
          login_frequency: number | null
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          device_info?: string | null
          flags?: Json | null
          fraud_risk?: string | null
          fraud_score?: number | null
          id?: string
          ip_address?: string | null
          is_fraudulent?: boolean | null
          login_frequency?: number | null
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          device_info?: string | null
          flags?: Json | null
          fraud_risk?: string | null
          fraud_score?: number | null
          id?: string
          ip_address?: string | null
          is_fraudulent?: boolean | null
          login_frequency?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_detection_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      job_listings: {
        Row: {
          company: string
          description: string | null
          id: string
          job_id: string | null
          job_title: string
          location: string | null
          salary_max: number | null
          salary_min: number | null
          saved_at: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          company: string
          description?: string | null
          id?: string
          job_id?: string | null
          job_title: string
          location?: string | null
          salary_max?: number | null
          salary_min?: number | null
          saved_at?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          company?: string
          description?: string | null
          id?: string
          job_id?: string | null
          job_title?: string
          location?: string | null
          salary_max?: number | null
          salary_min?: number | null
          saved_at?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      loan_applications: {
        Row: {
          age: number
          applicant_name: string
          created_at: string
          credit_score: number | null
          employment_status: string | null
          id: string
          income: number
          loan_amount: number
          loan_purpose: string | null
          risk_category: string | null
          risk_score: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          age: number
          applicant_name: string
          created_at?: string
          credit_score?: number | null
          employment_status?: string | null
          id?: string
          income: number
          loan_amount: number
          loan_purpose?: string | null
          risk_category?: string | null
          risk_score?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          age?: number
          applicant_name?: string
          created_at?: string
          credit_score?: number | null
          employment_status?: string | null
          id?: string
          income?: number
          loan_amount?: number
          loan_purpose?: string | null
          risk_category?: string | null
          risk_score?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          credits: number
          email: string | null
          experience_years: number | null
          full_name: string | null
          github: string | null
          id: string
          industry: string | null
          linkedin: string | null
          location: string | null
          occupation: string | null
          phone: string | null
          resumes_created: number | null
          role: Database["public"]["Enums"]["user_role"]
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          subscription_tier: string | null
          twitter: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          credits?: number
          email?: string | null
          experience_years?: number | null
          full_name?: string | null
          github?: string | null
          id: string
          industry?: string | null
          linkedin?: string | null
          location?: string | null
          occupation?: string | null
          phone?: string | null
          resumes_created?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          twitter?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          credits?: number
          email?: string | null
          experience_years?: number | null
          full_name?: string | null
          github?: string | null
          id?: string
          industry?: string | null
          linkedin?: string | null
          location?: string | null
          occupation?: string | null
          phone?: string | null
          resumes_created?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          twitter?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      regulatory_reports: {
        Row: {
          created_at: string
          id: string
          report_data: Json
          report_date: string
          report_type: string
          submission_status: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          report_data: Json
          report_date: string
          report_type: string
          submission_status?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          report_data?: Json
          report_date?: string
          report_type?: string
          submission_status?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          ats_score: number | null
          content: string
          created_at: string
          id: string
          language: string | null
          title: string
          tone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ats_score?: number | null
          content: string
          created_at?: string
          id?: string
          language?: string | null
          title: string
          tone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ats_score?: number | null
          content?: string
          created_at?: string
          id?: string
          language?: string | null
          title?: string
          tone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string | null
          css_style: string
          description: string | null
          html_structure: string
          id: string
          industry: string | null
          is_premium: boolean | null
          name: string
          preview_image: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          css_style: string
          description?: string | null
          html_structure: string
          id?: string
          industry?: string | null
          is_premium?: boolean | null
          name: string
          preview_image?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          css_style?: string
          description?: string | null
          html_structure?: string
          id?: string
          industry?: string | null
          is_premium?: boolean | null
          name?: string
          preview_image?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      resume_language: "english" | "spanish" | "french" | "german" | "hindi"
      subscription_tier_type: "free" | "pro" | "premium"
      user_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      resume_language: ["english", "spanish", "french", "german", "hindi"],
      subscription_tier_type: ["free", "pro", "premium"],
      user_role: ["user", "admin"],
    },
  },
} as const
