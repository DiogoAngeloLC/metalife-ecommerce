// Tipos derivados manualmente do schema em supabase/migrations/0001_initial.sql.
// Em fase posterior, regenerar via:
//   pnpm dlx supabase gen types typescript --project-id <ID> > lib/supabase/types.ts

export type ListingStatus = "draft" | "active" | "paused" | "sold";
export type ListingCondition = "novo" | "seminovo" | "usado_bom" | "usado_regular";
export type LeadStatus = "pending" | "validated" | "sent" | "failed";

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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
