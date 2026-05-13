// Tipos derivados manualmente do schema em supabase/migrations/.
// Em fase posterior, regenerar via:
//   pnpm dlx supabase gen types typescript --project-id <ID> > lib/supabase/types.ts

export type ListingStatus = "draft" | "active" | "paused" | "sold" | "pending_review" | "rejected";
export type ListingCondition = "novo" | "seminovo" | "usado_bom" | "usado_regular";
export type LeadStatus = "pending" | "validated" | "sent" | "failed";
export type MessageType = "lead_contact" | "validation" | "marketing" | "lead_to_buyer" | "lead_to_seller" | "listing_approved" | "listing_rejected";
export type MessageStatus = "queued" | "sent" | "delivered" | "read" | "failed";
export type RecipientType = "buyer" | "vendor" | "seller";

export type Database = {
  public: {
    Tables: {
      vendors: {
        Row: {
          id: string;
          name: string | null;
          whatsapp: string | null;
          city: string | null;
          state: string | null;
          onboarding_completed: boolean;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          whatsapp?: string | null;
          city?: string | null;
          state?: string | null;
          onboarding_completed?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          whatsapp?: string | null;
          city?: string | null;
          state?: string | null;
          onboarding_completed?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          vendor_id: string;
          slug: string;
          title: string;
          description: string | null;
          equipment_type: string;
          brand: string | null;
          year: number | null;
          condition: ListingCondition;
          has_fixed_price: boolean;
          price: number | null;
          is_negotiable: boolean;
          city: string;
          state: string;
          status: ListingStatus;
          created_at: string;
          updated_at: string;
          published_at: string | null;
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          is_featured: boolean;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          slug: string;
          title: string;
          description?: string | null;
          equipment_type: string;
          brand?: string | null;
          year?: number | null;
          condition: ListingCondition;
          has_fixed_price?: boolean;
          price?: number | null;
          is_negotiable?: boolean;
          city: string;
          state: string;
          status?: ListingStatus;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          is_featured?: boolean;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          equipment_type?: string;
          brand?: string | null;
          year?: number | null;
          condition?: ListingCondition;
          has_fixed_price?: boolean;
          price?: number | null;
          is_negotiable?: boolean;
          city?: string;
          state?: string;
          status?: ListingStatus;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          is_featured?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "listings_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          },
        ];
      };
      listing_images: {
        Row: {
          id: string;
          listing_id: string;
          storage_path: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          storage_path: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          storage_path?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          id: string;
          listing_id: string;
          name: string;
          whatsapp: string;
          email: string;
          status: LeadStatus;
          whatsapp_sent_at: string | null;
          ip_address: string | null;
          user_agent: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          name: string;
          whatsapp: string;
          email: string;
          status?: LeadStatus;
          whatsapp_sent_at?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          name?: string;
          whatsapp?: string;
          email?: string;
          status?: LeadStatus;
          whatsapp_sent_at?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      app_admins: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      whatsapp_messages_log: {
        Row: {
          id: string;
          lead_id: string | null;
          listing_id: string | null;
          vendor_id: string | null;
          recipient_type: RecipientType;
          recipient_phone: string;
          message_type: MessageType;
          status: MessageStatus;
          payload: unknown | null;
          external_id: string | null;
          evolution_message_id: string | null;
          error_message: string | null;
          sent_at: string | null;
          delivered_at: string | null;
          read_at: string | null;
          failed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          listing_id?: string | null;
          vendor_id?: string | null;
          recipient_type: RecipientType;
          recipient_phone: string;
          message_type?: MessageType;
          status?: MessageStatus;
          payload?: unknown | null;
          external_id?: string | null;
          evolution_message_id?: string | null;
          error_message?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
          failed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string | null;
          listing_id?: string | null;
          vendor_id?: string | null;
          recipient_type?: RecipientType;
          recipient_phone?: string;
          message_type?: MessageType;
          status?: MessageStatus;
          payload?: unknown | null;
          external_id?: string | null;
          evolution_message_id?: string | null;
          error_message?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
          failed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_log_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_validation_cache: {
        Row: {
          id: string;
          phone: string;
          is_valid: boolean;
          checked_at: string;
          raw_response: unknown | null;
        };
        Insert: {
          id?: string;
          phone: string;
          is_valid: boolean;
          checked_at?: string;
          raw_response?: unknown | null;
        };
        Update: {
          id?: string;
          phone?: string;
          is_valid?: boolean;
          checked_at?: string;
          raw_response?: unknown | null;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          key: string;
          value: unknown;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value?: unknown;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          key?: string;
          value?: unknown;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      legal_pages: {
        Row: {
          slug: string;
          title: string;
          content_md: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          slug: string;
          title: string;
          content_md?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          slug?: string;
          title?: string;
          content_md?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      ad_banners: {
        Row: {
          id: string;
          slot_key: string;
          image_url: string;
          link_url: string | null;
          alt_text: string;
          active: boolean;
          sort_order: number;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          slot_key: string;
          image_url: string;
          link_url?: string | null;
          alt_text?: string;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          slot_key?: string;
          image_url?: string;
          link_url?: string | null;
          alt_text?: string;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: { user_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
