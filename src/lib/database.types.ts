// Generisano iz Supabase šeme (generate_typescript_types). Ne mijenjati ručno –
// nakon promjene šeme ponovo generisati.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];


export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      appointments: {
        Row: {
          blocked_until: string;
          cancelled_by: string | null;
          client_id: string;
          created_at: string;
          ends_at: string;
          id: string;
          manage_token: string;
          notes: string | null;
          price: number | null;
          service_id: string;
          source: string;
          staff_id: string;
          starts_at: string;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          blocked_until: string;
          cancelled_by?: string | null;
          client_id: string;
          created_at?: string;
          ends_at: string;
          id?: string;
          manage_token?: string;
          notes?: string | null;
          price?: number | null;
          service_id: string;
          source?: string;
          staff_id: string;
          starts_at: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "appointments_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "clients"; referencedColumns: ["id"] },
          { foreignKeyName: "appointments_service_id_fkey"; columns: ["service_id"]; isOneToOne: false; referencedRelation: "services"; referencedColumns: ["id"] },
          { foreignKeyName: "appointments_staff_id_fkey"; columns: ["staff_id"]; isOneToOne: false; referencedRelation: "staff"; referencedColumns: ["id"] },
          { foreignKeyName: "appointments_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "tenants"; referencedColumns: ["id"] },
        ];
      };
      clients: {
        Row: {
          blocked: boolean;
          created_at: string;
          email: string | null;
          id: string;
          messaging_consent: boolean;
          name: string;
          no_show_count: number;
          notes: string | null;
          phone: string;
          source: string;
          tenant_id: string;
        };
        Insert: {
          blocked?: boolean;
          created_at?: string;
          email?: string | null;
          id?: string;
          messaging_consent?: boolean;
          name: string;
          no_show_count?: number;
          notes?: string | null;
          phone: string;
          source?: string;
          tenant_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "clients_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "tenants"; referencedColumns: ["id"] },
        ];
      };
      message_log: {
        Row: {
          appointment_id: string | null;
          body: string | null;
          channel: string;
          client_id: string | null;
          created_at: string;
          direction: string;
          error: string | null;
          fallback_sent: boolean;
          id: string;
          job_id: string | null;
          phone: string;
          provider_message_id: string | null;
          status: string;
          template: string | null;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          appointment_id?: string | null;
          body?: string | null;
          channel: string;
          client_id?: string | null;
          created_at?: string;
          direction?: string;
          error?: string | null;
          fallback_sent?: boolean;
          id?: string;
          job_id?: string | null;
          phone: string;
          provider_message_id?: string | null;
          status?: string;
          template?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["message_log"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "message_log_appointment_id_fkey"; columns: ["appointment_id"]; isOneToOne: false; referencedRelation: "appointments"; referencedColumns: ["id"] },
          { foreignKeyName: "message_log_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "clients"; referencedColumns: ["id"] },
          { foreignKeyName: "message_log_job_id_fkey"; columns: ["job_id"]; isOneToOne: false; referencedRelation: "reminder_jobs"; referencedColumns: ["id"] },
          { foreignKeyName: "message_log_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "tenants"; referencedColumns: ["id"] },
        ];
      };
      reminder_jobs: {
        Row: {
          appointment_id: string;
          attempts: number;
          channel_used: string | null;
          created_at: string;
          id: string;
          kind: string;
          last_error: string | null;
          offset_min: number;
          send_at: string;
          sent_at: string | null;
          status: string;
          tenant_id: string;
        };
        Insert: {
          appointment_id: string;
          attempts?: number;
          channel_used?: string | null;
          created_at?: string;
          id?: string;
          kind: string;
          last_error?: string | null;
          offset_min?: number;
          send_at: string;
          sent_at?: string | null;
          status?: string;
          tenant_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["reminder_jobs"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "reminder_jobs_appointment_id_fkey"; columns: ["appointment_id"]; isOneToOne: false; referencedRelation: "appointments"; referencedColumns: ["id"] },
          { foreignKeyName: "reminder_jobs_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "tenants"; referencedColumns: ["id"] },
        ];
      };
      services: {
        Row: {
          active: boolean;
          buffer_min: number;
          created_at: string;
          currency: string;
          description: string | null;
          duration_min: number;
          id: string;
          name: string;
          price: number | null;
          sort: number;
          tenant_id: string;
        };
        Insert: {
          active?: boolean;
          buffer_min?: number;
          created_at?: string;
          currency?: string;
          description?: string | null;
          duration_min: number;
          id?: string;
          name: string;
          price?: number | null;
          sort?: number;
          tenant_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "services_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "tenants"; referencedColumns: ["id"] },
        ];
      };
      staff: {
        Row: {
          active: boolean;
          color: string;
          created_at: string;
          id: string;
          name: string;
          sort: number;
          tenant_id: string;
          title: string | null;
        };
        Insert: {
          active?: boolean;
          color?: string;
          created_at?: string;
          id?: string;
          name: string;
          sort?: number;
          tenant_id: string;
          title?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["staff"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "staff_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "tenants"; referencedColumns: ["id"] },
        ];
      };
      staff_services: {
        Row: { service_id: string; staff_id: string; tenant_id: string };
        Insert: { service_id: string; staff_id: string; tenant_id: string };
        Update: { service_id?: string; staff_id?: string; tenant_id?: string };
        Relationships: [
          { foreignKeyName: "staff_services_service_id_fkey"; columns: ["service_id"]; isOneToOne: false; referencedRelation: "services"; referencedColumns: ["id"] },
          { foreignKeyName: "staff_services_staff_id_fkey"; columns: ["staff_id"]; isOneToOne: false; referencedRelation: "staff"; referencedColumns: ["id"] },
          { foreignKeyName: "staff_services_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "tenants"; referencedColumns: ["id"] },
        ];
      };
      tenant_members: {
        Row: { created_at: string; role: string; tenant_id: string; user_id: string };
        Insert: { created_at?: string; role?: string; tenant_id: string; user_id: string };
        Update: { created_at?: string; role?: string; tenant_id?: string; user_id?: string };
        Relationships: [
          { foreignKeyName: "tenant_members_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "tenants"; referencedColumns: ["id"] },
        ];
      };
      tenants: {
        Row: {
          address: string | null;
          brand_color: string;
          cancel_until_hours: number;
          city: string | null;
          created_at: string;
          description: string | null;
          email: string | null;
          horizon_days: number;
          id: string;
          kind: string;
          logo_url: string | null;
          min_notice_minutes: number;
          name: string;
          online_booking_enabled: boolean;
          phone: string | null;
          quiet_end: string;
          quiet_start: string;
          reminder_channel: string;
          reminder_offsets: number[];
          send_confirmation: boolean;
          slot_step_minutes: number;
          slug: string;
          timezone: string;
        };
        Insert: {
          address?: string | null;
          brand_color?: string;
          cancel_until_hours?: number;
          city?: string | null;
          created_at?: string;
          description?: string | null;
          email?: string | null;
          horizon_days?: number;
          id?: string;
          kind?: string;
          logo_url?: string | null;
          min_notice_minutes?: number;
          name: string;
          online_booking_enabled?: boolean;
          phone?: string | null;
          quiet_end?: string;
          quiet_start?: string;
          reminder_channel?: string;
          reminder_offsets?: number[];
          send_confirmation?: boolean;
          slot_step_minutes?: number;
          slug: string;
          timezone?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
        Relationships: [];
      };
      time_off: {
        Row: {
          ends_at: string;
          id: string;
          reason: string | null;
          staff_id: string | null;
          starts_at: string;
          tenant_id: string;
        };
        Insert: {
          ends_at: string;
          id?: string;
          reason?: string | null;
          staff_id?: string | null;
          starts_at: string;
          tenant_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["time_off"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "time_off_staff_id_fkey"; columns: ["staff_id"]; isOneToOne: false; referencedRelation: "staff"; referencedColumns: ["id"] },
          { foreignKeyName: "time_off_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "tenants"; referencedColumns: ["id"] },
        ];
      };
      working_hours: {
        Row: {
          end_time: string;
          id: string;
          staff_id: string;
          start_time: string;
          tenant_id: string;
          weekday: number;
        };
        Insert: {
          end_time: string;
          id?: string;
          staff_id: string;
          start_time: string;
          tenant_id: string;
          weekday: number;
        };
        Update: Partial<Database["public"]["Tables"]["working_hours"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "working_hours_staff_id_fkey"; columns: ["staff_id"]; isOneToOne: false; referencedRelation: "staff"; referencedColumns: ["id"] },
          { foreignKeyName: "working_hours_tenant_id_fkey"; columns: ["tenant_id"]; isOneToOne: false; referencedRelation: "tenants"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      claim_reminder_jobs: {
        Args: { p_limit?: number };
        Returns: Database["public"]["Tables"]["reminder_jobs"]["Row"][];
        SetofOptions: { from: "*"; to: "reminder_jobs"; isOneToOne: false; isSetofReturn: true };
      };
      create_tenant: {
        Args: { p_kind: string; p_name: string; p_owner_name: string; p_slug: string };
        Returns: string;
      };
      is_admin: { Args: { t: string }; Returns: boolean };
      is_member: { Args: { t: string }; Returns: boolean };
      requeue_stuck_jobs: { Args: never; Returns: number };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

