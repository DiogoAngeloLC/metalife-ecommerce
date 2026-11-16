// Tipos derivados manualmente do schema em supabase/migrations/.
// Em fase posterior, regenerar via:
//   pnpm dlx supabase gen types typescript --project-id <ID> > lib/supabase/types.ts

export type ListingStatus = "draft" | "active" | "paused" | "sold" | "pending_review" | "rejected";
export type ListingCondition = "novo" | "seminovo" | "usado_bom" | "usado_regular";
export type LeadStatus = "pending" | "validated" | "sent" | "failed";
export type MessageType = "lead_contact" | "validation" | "marketing" | "lead_to_buyer" | "lead_to_seller" | "listing_approved" | "listing_rejected";
export type MessageStatus = "queued" | "sent" | "delivered" | "read" | "failed";
export type RecipientType = "buyer" | "vendor" | "seller";
export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "canceled"
  | "refunded";
export type PaymentMethod = "pix" | "credit_card" | "boleto";

export type ShippingAddress = {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string | null;
  neighborhood?: string;
  city?: string;
  state?: string;
};

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
          is_official: boolean;
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
          is_official?: boolean;
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
          is_official?: boolean;
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
      webhook_logs: {
        Row: {
          id: string;
          url: string;
          event_type: string;
          payload: unknown;
          status_code: number | null;
          response_body: string | null;
          error_message: string | null;
          duration_ms: number | null;
          lead_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          event_type?: string;
          payload: unknown;
          status_code?: number | null;
          response_body?: string | null;
          error_message?: string | null;
          duration_ms?: number | null;
          lead_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          event_type?: string;
          payload?: unknown;
          status_code?: number | null;
          response_body?: string | null;
          error_message?: string | null;
          duration_ms?: number | null;
          lead_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      listing_variants: {
        Row: {
          id: string;
          listing_id: string;
          sku: string | null;
          structure_color: string | null;
          upholstery_color: string | null;
          str_code: string | null;
          stf_code: string | null;
          protheus_code: string | null;
          price_cents: number;
          stock_qty: number;
          is_made_to_order: boolean;
          production_days: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          sku?: string | null;
          structure_color?: string | null;
          upholstery_color?: string | null;
          str_code?: string | null;
          stf_code?: string | null;
          protheus_code?: string | null;
          price_cents: number;
          stock_qty?: number;
          is_made_to_order?: boolean;
          production_days?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          sku?: string | null;
          structure_color?: string | null;
          upholstery_color?: string | null;
          str_code?: string | null;
          stf_code?: string | null;
          protheus_code?: string | null;
          price_cents?: number;
          stock_qty?: number;
          is_made_to_order?: boolean;
          production_days?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listing_variants_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      shipping_rules: {
        Row: {
          id: string;
          uf: string;
          name: string;
          price_cents: number;
          estimated_days: number | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          uf: string;
          name: string;
          price_cents: number;
          estimated_days?: number | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          uf?: string;
          name?: string;
          price_cents?: number;
          estimated_days?: number | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          buyer_id: string | null;
          vendor_id: string;
          buyer_name: string;
          buyer_email: string;
          buyer_phone: string;
          buyer_document: string;
          buyer_company_name: string | null;
          buyer_state_registration: string | null;
          shipping_address: ShippingAddress;
          subtotal_cents: number;
          shipping_cents: number;
          discount_cents: number;
          total_cents: number;
          status: OrderStatus;
          payment_method: PaymentMethod | null;
          payment_provider: string | null;
          external_payment_id: string | null;
          payment_payload: unknown | null;
          tracking_code: string | null;
          access_token: string;
          opt_in: boolean;
          accepted_terms_at: string;
          ip_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          buyer_id?: string | null;
          vendor_id: string;
          buyer_name: string;
          buyer_email: string;
          buyer_phone: string;
          buyer_document: string;
          buyer_company_name?: string | null;
          buyer_state_registration?: string | null;
          shipping_address?: ShippingAddress;
          subtotal_cents: number;
          shipping_cents?: number;
          discount_cents?: number;
          total_cents: number;
          status?: OrderStatus;
          payment_method?: PaymentMethod | null;
          payment_provider?: string | null;
          external_payment_id?: string | null;
          payment_payload?: unknown | null;
          tracking_code?: string | null;
          access_token?: string;
          opt_in: boolean;
          accepted_terms_at: string;
          ip_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          buyer_id?: string | null;
          vendor_id?: string;
          buyer_name?: string;
          buyer_email?: string;
          buyer_phone?: string;
          buyer_document?: string;
          buyer_company_name?: string | null;
          buyer_state_registration?: string | null;
          shipping_address?: ShippingAddress;
          subtotal_cents?: number;
          shipping_cents?: number;
          discount_cents?: number;
          total_cents?: number;
          status?: OrderStatus;
          payment_method?: PaymentMethod | null;
          payment_provider?: string | null;
          external_payment_id?: string | null;
          payment_payload?: unknown | null;
          tracking_code?: string | null;
          access_token?: string;
          opt_in?: boolean;
          accepted_terms_at?: string;
          ip_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          listing_id: string;
          variant_id: string | null;
          title_snapshot: string;
          variant_snapshot: unknown | null;
          protheus_code_snapshot: string | null;
          str_code_snapshot: string | null;
          stf_code_snapshot: string | null;
          unit_price_cents: number;
          quantity: number;
          total_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          listing_id: string;
          variant_id?: string | null;
          title_snapshot: string;
          variant_snapshot?: unknown | null;
          protheus_code_snapshot?: string | null;
          str_code_snapshot?: string | null;
          stf_code_snapshot?: string | null;
          unit_price_cents: number;
          quantity: number;
          total_cents: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          listing_id?: string;
          variant_id?: string | null;
          title_snapshot?: string;
          variant_snapshot?: unknown | null;
          protheus_code_snapshot?: string | null;
          str_code_snapshot?: string | null;
          stf_code_snapshot?: string | null;
          unit_price_cents?: number;
          quantity?: number;
          total_cents?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "listing_variants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: { user_id: string };
        Returns: boolean;
      };
      get_order_confirmation: {
        Args: { p_order_number: string; p_access_token?: string | null };
        Returns: unknown;
      };
      attach_order_payment: {
        Args: {
          p_order_id: string;
          p_status: string;
          p_external_payment_id?: string | null;
          p_payment_provider?: string | null;
          p_payment_payload?: unknown | null;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
