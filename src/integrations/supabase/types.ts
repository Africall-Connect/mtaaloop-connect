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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_profiles: {
        Row: {
          created_at: string
          email: string | null
          estate_id: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          estate_id?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          estate_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_profiles_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string | null
          criteria: Json | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
          points_value: number | null
          rarity: string | null
        }
        Insert: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          points_value?: number | null
          rarity?: string | null
        }
        Update: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          points_value?: number | null
          rarity?: string | null
        }
        Relationships: []
      }
      big_supermarket_items: {
        Row: {
          branch: string | null
          category: string | null
          clean_name: string | null
          created_at: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          last_scraped: string | null
          markup_price: number | null
          price: number | null
          product_name: string
          source_shop: string | null
        }
        Insert: {
          branch?: string | null
          category?: string | null
          clean_name?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          last_scraped?: string | null
          markup_price?: number | null
          price?: number | null
          product_name: string
          source_shop?: string | null
        }
        Update: {
          branch?: string | null
          category?: string | null
          clean_name?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          last_scraped?: string | null
          markup_price?: number | null
          price?: number | null
          product_name?: string
          source_shop?: string | null
        }
        Relationships: []
      }
      booking_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_availability_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_reservations: {
        Row: {
          amount: number
          booking_date: string
          booking_time: string
          created_at: string | null
          customer_id: string
          customer_notes: string | null
          id: string
          payment_status: string | null
          service_type_id: string
          slot_id: string | null
          status: string | null
          updated_at: string | null
          vendor_id: string
          vendor_notes: string | null
        }
        Insert: {
          amount: number
          booking_date: string
          booking_time: string
          created_at?: string | null
          customer_id: string
          customer_notes?: string | null
          id?: string
          payment_status?: string | null
          service_type_id: string
          slot_id?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_id: string
          vendor_notes?: string | null
        }
        Update: {
          amount?: number
          booking_date?: string
          booking_time?: string
          created_at?: string | null
          customer_id?: string
          customer_notes?: string | null
          id?: string
          payment_status?: string | null
          service_type_id?: string
          slot_id?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_id?: string
          vendor_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_reservations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_reservations_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "booking_service_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_reservations_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "booking_time_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_reservations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_service_types: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          requires_address: boolean | null
          subcategory: string | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          requires_address?: boolean | null
          subcategory?: string | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          requires_address?: boolean | null
          subcategory?: string | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_service_types_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_slots: {
        Row: {
          created_at: string | null
          id: string
          is_available: boolean | null
          product_id: string
          slot_end: string
          slot_start: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          product_id: string
          slot_end: string
          slot_start: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          product_id?: string
          slot_end?: string
          slot_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_slots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_time_slots: {
        Row: {
          created_at: string | null
          id: string
          is_available: boolean | null
          is_blocked: boolean | null
          service_type_id: string | null
          slot_date: string
          slot_end: string
          slot_start: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          is_blocked?: boolean | null
          service_type_id?: string | null
          slot_date: string
          slot_end: string
          slot_start: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          is_blocked?: boolean | null
          service_type_id?: string | null
          slot_date?: string
          slot_end?: string
          slot_start?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_time_slots_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "booking_service_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_time_slots_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          start_time: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          start_time: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_availability_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_bookings: {
        Row: {
          amount: number
          booking_date: string
          booking_time: string
          consultation_type_id: string
          created_at: string
          customer_id: string
          customer_notes: string | null
          id: string
          payment_status: string
          pharmacist_notes: string | null
          slot_id: string | null
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount?: number
          booking_date: string
          booking_time: string
          consultation_type_id: string
          created_at?: string
          customer_id: string
          customer_notes?: string | null
          id?: string
          payment_status?: string
          pharmacist_notes?: string | null
          slot_id?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          booking_date?: string
          booking_time?: string
          consultation_type_id?: string
          created_at?: string
          customer_id?: string
          customer_notes?: string | null
          id?: string
          payment_status?: string
          pharmacist_notes?: string | null
          slot_id?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_bookings_consultation_type_id_fkey"
            columns: ["consultation_type_id"]
            isOneToOne: false
            referencedRelation: "consultation_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "consultation_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_bookings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_pre_info: {
        Row: {
          additional_notes: string | null
          age_group: string
          allergies_details: string | null
          booking_id: string
          chronic_conditions: string[] | null
          created_at: string
          current_medications: string | null
          has_allergies: boolean
          has_chronic_conditions: boolean
          id: string
          is_breastfeeding: boolean
          is_pregnant: boolean
          symptom_duration: string
          symptoms: string
        }
        Insert: {
          additional_notes?: string | null
          age_group: string
          allergies_details?: string | null
          booking_id: string
          chronic_conditions?: string[] | null
          created_at?: string
          current_medications?: string | null
          has_allergies?: boolean
          has_chronic_conditions?: boolean
          id?: string
          is_breastfeeding?: boolean
          is_pregnant?: boolean
          symptom_duration: string
          symptoms: string
        }
        Update: {
          additional_notes?: string | null
          age_group?: string
          allergies_details?: string | null
          booking_id?: string
          chronic_conditions?: string[] | null
          created_at?: string
          current_medications?: string | null
          has_allergies?: boolean
          has_chronic_conditions?: boolean
          id?: string
          is_breastfeeding?: boolean
          is_pregnant?: boolean
          symptom_duration?: string
          symptoms?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_pre_info_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "consultation_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_slots: {
        Row: {
          consultation_type_id: string | null
          created_at: string
          id: string
          is_available: boolean
          is_blocked: boolean
          slot_date: string
          slot_end: string
          slot_start: string
          vendor_id: string
        }
        Insert: {
          consultation_type_id?: string | null
          created_at?: string
          id?: string
          is_available?: boolean
          is_blocked?: boolean
          slot_date: string
          slot_end: string
          slot_start: string
          vendor_id: string
        }
        Update: {
          consultation_type_id?: string | null
          created_at?: string
          id?: string
          is_available?: boolean
          is_blocked?: boolean
          slot_date?: string
          slot_end?: string
          slot_start?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_slots_consultation_type_id_fkey"
            columns: ["consultation_type_id"]
            isOneToOne: false
            referencedRelation: "consultation_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_slots_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_types: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
          requires_prescription: boolean
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          requires_prescription?: boolean
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          requires_prescription?: boolean
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_types_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      csr_campaign_sends: {
        Row: {
          campaign_id: string
          customer_id: string
          id: string
          notification_id: string | null
          sent_at: string | null
        }
        Insert: {
          campaign_id: string
          customer_id: string
          id?: string
          notification_id?: string | null
          sent_at?: string | null
        }
        Update: {
          campaign_id?: string
          customer_id?: string
          id?: string
          notification_id?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "csr_campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "csr_outbound_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csr_campaign_sends_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      csr_canned_responses: {
        Row: {
          body: string
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          shortcut: string | null
          title: string
          use_count: number | null
        }
        Insert: {
          body: string
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          shortcut?: string | null
          title: string
          use_count?: number | null
        }
        Update: {
          body?: string
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          shortcut?: string | null
          title?: string
          use_count?: number | null
        }
        Relationships: []
      }
      csr_outbound_campaigns: {
        Row: {
          audience_filter: Json | null
          campaign_type: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          last_sent_at: string | null
          message: string
          name: string
          title: string
          total_sent: number | null
        }
        Insert: {
          audience_filter?: Json | null
          campaign_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          message: string
          name: string
          title: string
          total_sent?: number | null
        }
        Update: {
          audience_filter?: Json | null
          campaign_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          message?: string
          name?: string
          title?: string
          total_sent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "csr_outbound_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          allergens: string[] | null
          avatar_url: string | null
          average_rating: number | null
          created_at: string
          date_of_birth: string | null
          dietary_preferences: string[] | null
          email_verified: boolean | null
          full_name: string
          gender: string | null
          id: string
          loyalty_points: number | null
          phone: string | null
          phone_verified: boolean | null
          preferred_language: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergens?: string[] | null
          avatar_url?: string | null
          average_rating?: number | null
          created_at?: string
          date_of_birth?: string | null
          dietary_preferences?: string[] | null
          email_verified?: boolean | null
          full_name: string
          gender?: string | null
          id?: string
          loyalty_points?: number | null
          phone?: string | null
          phone_verified?: boolean | null
          preferred_language?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergens?: string[] | null
          avatar_url?: string | null
          average_rating?: number | null
          created_at?: string
          date_of_birth?: string | null
          dietary_preferences?: string[] | null
          email_verified?: boolean | null
          full_name?: string
          gender?: string | null
          id?: string
          loyalty_points?: number | null
          phone?: string | null
          phone_verified?: boolean | null
          preferred_language?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_wallet: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_wallet_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_wallet_tx: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          reference: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          reference?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          reference?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_wallet_tx_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_wallet_tx_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          delivery_fee: number | null
          delivery_time: string | null
          estate_id: string | null
          full_name: string | null
          id: string
          order_id: string
          pickup_time: string | null
          rider_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_fee?: number | null
          delivery_time?: string | null
          estate_id?: string | null
          full_name?: string | null
          id?: string
          order_id: string
          pickup_time?: string | null
          rider_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_fee?: number | null
          delivery_time?: string | null
          estate_id?: string | null
          full_name?: string | null
          id?: string
          order_id?: string
          pickup_time?: string | null
          rider_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "rider_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_addresses: {
        Row: {
          additional_directions: string | null
          address_type: string
          building_name: string | null
          created_at: string
          estate_id: string | null
          floor_number: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          label: string
          latitude: number | null
          longitude: number | null
          unit_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_directions?: string | null
          address_type: string
          building_name?: string | null
          created_at?: string
          estate_id?: string | null
          floor_number?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label: string
          latitude?: number | null
          longitude?: number | null
          unit_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_directions?: string | null
          address_type?: string
          building_name?: string | null
          created_at?: string
          estate_id?: string | null
          floor_number?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label?: string
          latitude?: number | null
          longitude?: number | null
          unit_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_events: {
        Row: {
          created_at: string | null
          delivery_id: string | null
          event_payload: Json | null
          event_type: string
          id: string
          rider_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_id?: string | null
          event_payload?: Json | null
          event_type: string
          id?: string
          rider_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_id?: string | null
          event_payload?: Json | null
          event_type?: string
          id?: string
          rider_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_events_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_events_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_offer: {
        Row: {
          created_at: string | null
          delivery_id: string | null
          dropoff_address: string | null
          earnings: number | null
          expires_at: string | null
          id: string
          pickup_address: string | null
          zone: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_id?: string | null
          dropoff_address?: string | null
          earnings?: number | null
          expires_at?: string | null
          id?: string
          pickup_address?: string | null
          zone?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_id?: string | null
          dropoff_address?: string | null
          earnings?: number | null
          expires_at?: string | null
          id?: string
          pickup_address?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_offer_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_order"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_order: {
        Row: {
          accepted_at: string | null
          canceled_at: string | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          delivered_at: string | null
          delivery_code: string | null
          distance_km: number | null
          dropoff_address: string | null
          dropoff_lat: number | null
          dropoff_lng: number | null
          id: string
          issue_reason: string | null
          order_value: number | null
          payment_status: string | null
          picked_at: string | null
          pickup_address: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          public_id: string | null
          rider_id: string | null
          status: string
          vendor_name: string | null
          vendor_phone: string | null
        }
        Insert: {
          accepted_at?: string | null
          canceled_at?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_code?: string | null
          distance_km?: number | null
          dropoff_address?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          id?: string
          issue_reason?: string | null
          order_value?: number | null
          payment_status?: string | null
          picked_at?: string | null
          pickup_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          public_id?: string | null
          rider_id?: string | null
          status?: string
          vendor_name?: string | null
          vendor_phone?: string | null
        }
        Update: {
          accepted_at?: string | null
          canceled_at?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_code?: string | null
          distance_km?: number | null
          dropoff_address?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          id?: string
          issue_reason?: string | null
          order_value?: number | null
          payment_status?: string | null
          picked_at?: string | null
          pickup_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          public_id?: string | null
          rider_id?: string | null
          status?: string
          vendor_name?: string | null
          vendor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_order_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      estate_analytics: {
        Row: {
          active_residents: number | null
          active_vendors: number | null
          average_delivery_time: number | null
          created_at: string | null
          date: string
          estate_id: string
          id: string
          new_residents: number | null
          total_orders: number | null
          total_revenue: number | null
        }
        Insert: {
          active_residents?: number | null
          active_vendors?: number | null
          average_delivery_time?: number | null
          created_at?: string | null
          date: string
          estate_id: string
          id?: string
          new_residents?: number | null
          total_orders?: number | null
          total_revenue?: number | null
        }
        Update: {
          active_residents?: number | null
          active_vendors?: number | null
          average_delivery_time?: number | null
          created_at?: string | null
          date?: string
          estate_id?: string
          id?: string
          new_residents?: number | null
          total_orders?: number | null
          total_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estate_analytics_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
        ]
      }
      estates: {
        Row: {
          address: string
          amenities: Json | null
          approved_at: string | null
          approved_by: string | null
          contact_email: string | null
          contact_phone: string | null
          coordinates: Json | null
          county: string | null
          created_at: string | null
          description: string | null
          estate_photos: string[] | null
          estate_type: string | null
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          location: string
          name: string
          occupied_units: number | null
          postal_code: string | null
          registration_status: string | null
          rejected_at: string | null
          rejection_reason: string | null
          slug: string | null
          submitted_at: string | null
          total_units: number | null
          updated_at: string | null
        }
        Insert: {
          address: string
          amenities?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          coordinates?: Json | null
          county?: string | null
          created_at?: string | null
          description?: string | null
          estate_photos?: string[] | null
          estate_type?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          location: string
          name: string
          occupied_units?: number | null
          postal_code?: string | null
          registration_status?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          slug?: string | null
          submitted_at?: string | null
          total_units?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          amenities?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          coordinates?: Json | null
          county?: string | null
          created_at?: string | null
          description?: string | null
          estate_photos?: string[] | null
          estate_type?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          location?: string
          name?: string
          occupied_units?: number | null
          postal_code?: string | null
          registration_status?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          slug?: string | null
          submitted_at?: string | null
          total_units?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      event_attendees: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          matched_with: string | null
          rsvp_status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          matched_with?: string | null
          rsvp_status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          matched_with?: string | null
          rsvp_status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_matched_with_fkey"
            columns: ["matched_with"]
            isOneToOne: false
            referencedRelation: "estate_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_matched_with_fkey"
            columns: ["matched_with"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_matched_with_fkey"
            columns: ["matched_with"]
            isOneToOne: false
            referencedRelation: "where_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "estate_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "where_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      event_tags: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          tag_name: string
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          tag_name: string
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          current_attendees: number | null
          description: string | null
          end_time: string
          estate_id: string | null
          event_type: string | null
          id: string
          is_public: boolean | null
          is_recurring: boolean | null
          location: string | null
          max_attendees: number | null
          organizer_id: string | null
          recurrence_pattern: string | null
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          end_time: string
          estate_id?: string | null
          event_type?: string | null
          id?: string
          is_public?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          max_attendees?: number | null
          organizer_id?: string | null
          recurrence_pattern?: string | null
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          end_time?: string
          estate_id?: string | null
          event_type?: string | null
          id?: string
          is_public?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          max_attendees?: number | null
          organizer_id?: string | null
          recurrence_pattern?: string | null
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "estate_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "where_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      group_room_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          message_type: string | null
          room_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          message_type?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          message_type?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "group_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_room_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "estate_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_room_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_room_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "where_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      group_room_participants: {
        Row: {
          id: string
          is_admin: boolean | null
          is_muted: boolean | null
          is_video_off: boolean | null
          joined_at: string | null
          last_seen_at: string | null
          participant_status: string | null
          room_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          is_admin?: boolean | null
          is_muted?: boolean | null
          is_video_off?: boolean | null
          joined_at?: string | null
          last_seen_at?: string | null
          participant_status?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          is_admin?: boolean | null
          is_muted?: boolean | null
          is_video_off?: boolean | null
          joined_at?: string | null
          last_seen_at?: string | null
          participant_status?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "group_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_room_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "estate_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_room_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_room_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "where_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      group_rooms: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          current_participants: number | null
          description: string | null
          estate_id: string | null
          id: string
          is_active: boolean
          is_private: boolean | null
          max_participants: number | null
          name: string
          password_hash: string | null
          pending_join_requests: Json | null
          room_type: string | null
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          estate_id?: string | null
          id?: string
          is_active?: boolean
          is_private?: boolean | null
          max_participants?: number | null
          name: string
          password_hash?: string | null
          pending_join_requests?: Json | null
          room_type?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          estate_id?: string | null
          id?: string
          is_active?: boolean
          is_private?: boolean | null
          max_participants?: number | null
          name?: string
          password_hash?: string | null
          pending_join_requests?: Json | null
          room_type?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_rooms_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          click_rate: number
          created_at: string
          created_by_csr: string | null
          id: string
          message: string
          name: string
          open_rate: number
          scheduled_date: string | null
          sent_count: number
          status: string
          target_segment: string | null
          type: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          click_rate?: number
          created_at?: string
          created_by_csr?: string | null
          id?: string
          message: string
          name: string
          open_rate?: number
          scheduled_date?: string | null
          sent_count?: number
          status?: string
          target_segment?: string | null
          type?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          click_rate?: number
          created_at?: string
          created_by_csr?: string | null
          id?: string
          message?: string
          name?: string
          open_rate?: number
          scheduled_date?: string | null
          sent_count?: number
          status?: string
          target_segment?: string | null
          type?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_created_by_csr_fkey"
            columns: ["created_by_csr"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_vendor_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string | null
          estate_id: string | null
          ice_candidates: Json | null
          id: string
          initiator_user_id: string
          match_id: string
          metadata: Json | null
          peer_user_id: string | null
          sdp_answer: Json | null
          sdp_offer: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estate_id?: string | null
          ice_candidates?: Json | null
          id?: string
          initiator_user_id: string
          match_id: string
          metadata?: Json | null
          peer_user_id?: string | null
          sdp_answer?: Json | null
          sdp_offer?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estate_id?: string | null
          ice_candidates?: Json | null
          id?: string
          initiator_user_id?: string
          match_id?: string
          metadata?: Json | null
          peer_user_id?: string | null
          sdp_answer?: Json | null
          sdp_offer?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
        ]
      }
      mtaaloop_call_sessions: {
        Row: {
          answer: Json | null
          callee_id: string | null
          caller_id: string
          created_at: string
          ended_at: string | null
          ice_candidates: Json | null
          id: string
          offer: Json | null
          started_at: string | null
          status: string
        }
        Insert: {
          answer?: Json | null
          callee_id?: string | null
          caller_id: string
          created_at?: string
          ended_at?: string | null
          ice_candidates?: Json | null
          id?: string
          offer?: Json | null
          started_at?: string | null
          status?: string
        }
        Update: {
          answer?: Json | null
          callee_id?: string | null
          caller_id?: string
          created_at?: string
          ended_at?: string | null
          ice_candidates?: Json | null
          id?: string
          offer?: Json | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mtaaloop_call_sessions_callee_id_fkey"
            columns: ["callee_id"]
            isOneToOne: false
            referencedRelation: "where_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtaaloop_call_sessions_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "where_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mtaaloop_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mtaaloop_chat_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "where_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtaaloop_chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "where_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mtaaloop_friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mtaaloop_friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "where_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtaaloop_friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "where_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mtaaloop_friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mtaaloop_friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "where_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtaaloop_friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "where_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_disputes: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          order_id: string
          raised_by: string
          reason: string
          role: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          order_id: string
          raised_by: string
          reason: string
          role: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          order_id?: string
          raised_by?: string
          reason?: string
          role?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_disputes_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          product_service_id: string | null
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          product_name: string
          product_service_id?: string | null
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          product_service_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_service_id_fkey"
            columns: ["product_service_id"]
            isOneToOne: false
            referencedRelation: "products_services"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          order_id: string
          read_at: string | null
          type: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          order_id: string
          read_at?: string | null
          type: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          order_id?: string
          read_at?: string | null
          type?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_notifications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          customer_id: string
          delivery_rating: number
          food_rating: number
          id: string
          order_id: string
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          customer_id: string
          delivery_rating: number
          food_rating: number
          id?: string
          order_id: string
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string
          delivery_rating?: number
          food_rating?: number
          id?: string
          order_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          business_type_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          category: string | null
          created_at: string | null
          csr_notes: string | null
          customer_id: string | null
          customer_notes: string | null
          customer_signature: string | null
          delivered_at: string | null
          delivery_address: string
          estate_id: string | null
          flagged_at: string | null
          flagged_by: string | null
          flagged_reason: string | null
          full_name: string | null
          house: string | null
          id: string
          is_flagged: boolean | null
          is_mtaaloop_managed: boolean | null
          mtaaloop_delivery_type: string | null
          order_number: string | null
          paid_at: string | null
          payment_attempts: number | null
          payment_channel: string | null
          payment_method: string | null
          payment_provider: string | null
          payment_reference: string | null
          payment_status: string | null
          rated: boolean
          status: string | null
          total_amount: number
          updated_at: string | null
          user_email: string | null
          vendor_id: string | null
          vendor_payout_amount: number | null
        }
        Insert: {
          business_type_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          category?: string | null
          created_at?: string | null
          csr_notes?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          customer_signature?: string | null
          delivered_at?: string | null
          delivery_address: string
          estate_id?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          flagged_reason?: string | null
          full_name?: string | null
          house?: string | null
          id?: string
          is_flagged?: boolean | null
          is_mtaaloop_managed?: boolean | null
          mtaaloop_delivery_type?: string | null
          order_number?: string | null
          paid_at?: string | null
          payment_attempts?: number | null
          payment_channel?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          rated?: boolean
          status?: string | null
          total_amount: number
          updated_at?: string | null
          user_email?: string | null
          vendor_id?: string | null
          vendor_payout_amount?: number | null
        }
        Update: {
          business_type_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          category?: string | null
          created_at?: string | null
          csr_notes?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          customer_signature?: string | null
          delivered_at?: string | null
          delivery_address?: string
          estate_id?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          flagged_reason?: string | null
          full_name?: string | null
          house?: string | null
          id?: string
          is_flagged?: boolean | null
          is_mtaaloop_managed?: boolean | null
          mtaaloop_delivery_type?: string | null
          order_number?: string | null
          paid_at?: string | null
          payment_attempts?: number | null
          payment_channel?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          rated?: boolean
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_email?: string | null
          vendor_id?: string | null
          vendor_payout_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_logs: {
        Row: {
          amount: number | null
          created_at: string
          event_type: string
          external_reference: string | null
          id: string
          order_id: string
          provider: string
          raw_payload: Json | null
          reference: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          event_type: string
          external_reference?: string | null
          id?: string
          order_id: string
          provider?: string
          raw_payload?: Json | null
          reference?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          event_type?: string
          external_reference?: string | null
          id?: string
          order_id?: string
          provider?: string
          raw_payload?: Json | null
          reference?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          order_id: string
          provider: string
          provider_reference: string | null
          raw_payload: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          order_id: string
          provider: string
          provider_reference?: string | null
          raw_payload?: Json | null
          status: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          order_id?: string
          provider?: string
          provider_reference?: string | null
          raw_payload?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payments_paystack: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string | null
          id: string
          order_id: string
          raw_init: Json | null
          raw_verify: Json | null
          reference: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          order_id: string
          raw_init?: Json | null
          raw_verify?: Json | null
          reference: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          order_id?: string
          raw_init?: Json | null
          raw_verify?: Json | null
          reference?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_paystack_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sales: {
        Row: {
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          discount: number
          id: string
          items: Json
          notes: string | null
          payment_method: string
          sale_number: string
          subtotal: number
          total: number
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string
          sale_number: string
          subtotal?: number
          total?: number
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string
          sale_number?: string
          subtotal?: number
          total?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_sales_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_deliveries: {
        Row: {
          carrefour_arrival: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_fee: number | null
          delivery_time: string | null
          estate_id: string | null
          full_name: string | null
          id: string
          pickup_time: string | null
          premium_order_id: string
          purchase_time: string | null
          receipt_photo: string | null
          rider_id: string | null
          rider_reimbursement: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          carrefour_arrival?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_fee?: number | null
          delivery_time?: string | null
          estate_id?: string | null
          full_name?: string | null
          id?: string
          pickup_time?: string | null
          premium_order_id: string
          purchase_time?: string | null
          receipt_photo?: string | null
          rider_id?: string | null
          rider_reimbursement: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          carrefour_arrival?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_fee?: number | null
          delivery_time?: string | null
          estate_id?: string | null
          full_name?: string | null
          id?: string
          pickup_time?: string | null
          premium_order_id?: string
          purchase_time?: string | null
          receipt_photo?: string | null
          rider_id?: string | null
          rider_reimbursement?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "premium_deliveries_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_deliveries_order_id_fkey"
            columns: ["premium_order_id"]
            isOneToOne: false
            referencedRelation: "premium_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_deliveries_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "rider_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_order_items: {
        Row: {
          base_price: number
          clean_name: string | null
          id: string
          image_url: string | null
          markup_price: number
          premium_order_id: string
          price: number | null
          product_id: string
          product_name: string
          productid: string | null
          quantity: number
        }
        Insert: {
          base_price: number
          clean_name?: string | null
          id?: string
          image_url?: string | null
          markup_price: number
          premium_order_id: string
          price?: number | null
          product_id: string
          product_name: string
          productid?: string | null
          quantity?: number
        }
        Update: {
          base_price?: number
          clean_name?: string | null
          id?: string
          image_url?: string | null
          markup_price?: number
          premium_order_id?: string
          price?: number | null
          product_id?: string
          product_name?: string
          productid?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "premium_order_items_order_id_fkey"
            columns: ["premium_order_id"]
            isOneToOne: false
            referencedRelation: "premium_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_order_items_productid_fkey"
            columns: ["productid"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_orders: {
        Row: {
          base_amount: number
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          customer_id: string | null
          customer_notes: string | null
          customer_signature: string | null
          delivered_at: string | null
          delivery_address: string
          estate_id: string | null
          full_name: string | null
          house: string | null
          id: string
          order_number: string | null
          payment_method: string | null
          payment_status: string | null
          profit_amount: number | null
          rated: boolean
          status: string | null
          total_amount: number
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          base_amount: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          customer_signature?: string | null
          delivered_at?: string | null
          delivery_address: string
          estate_id?: string | null
          full_name?: string | null
          house?: string | null
          id?: string
          order_number?: string | null
          payment_method?: string | null
          payment_status?: string | null
          profit_amount?: number | null
          rated?: boolean
          status?: string | null
          total_amount: number
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          base_amount?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          customer_signature?: string | null
          delivered_at?: string | null
          delivery_address?: string
          estate_id?: string | null
          full_name?: string | null
          house?: string | null
          id?: string
          order_number?: string | null
          payment_method?: string | null
          payment_status?: string | null
          profit_amount?: number | null
          rated?: boolean
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "premium_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_orders_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      private_chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
          sender_role: string | null
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
          sender_role?: string | null
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "private_chats"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "private_chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      private_chats: {
        Row: {
          chat_id: string
          closed_at: string | null
          created_at: string | null
          id: string
          initiator_id: string
          initiator_role: string
          is_closed: boolean | null
          recipient_id: string | null
          recipient_role: string | null
        }
        Insert: {
          chat_id?: string
          closed_at?: string | null
          created_at?: string | null
          id?: string
          initiator_id: string
          initiator_role: string
          is_closed?: boolean | null
          recipient_id?: string | null
          recipient_role?: string | null
        }
        Update: {
          chat_id?: string
          closed_at?: string | null
          created_at?: string | null
          id?: string
          initiator_id?: string
          initiator_role?: string
          is_closed?: boolean | null
          recipient_id?: string | null
          recipient_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_chats_initiator_id_fkey"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_chats_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attributes: {
        Row: {
          attribute_name: string
          attribute_value: string
          created_at: string | null
          id: string
          product_service_id: string | null
        }
        Insert: {
          attribute_name: string
          attribute_value: string
          created_at?: string | null
          id?: string
          product_service_id?: string | null
        }
        Update: {
          attribute_name?: string
          attribute_value?: string
          created_at?: string | null
          id?: string
          product_service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_attributes_product_service_id_fkey"
            columns: ["product_service_id"]
            isOneToOne: false
            referencedRelation: "products_services"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          business_type_id: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          business_type_id?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          business_type_id?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          price_modifier: number | null
          product_service_id: string | null
          sku: string | null
          stock_quantity: number | null
          variant_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_modifier?: number | null
          product_service_id?: string | null
          sku?: string | null
          stock_quantity?: number | null
          variant_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_modifier?: number | null
          product_service_id?: string | null
          sku?: string | null
          stock_quantity?: number | null
          variant_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_service_id_fkey"
            columns: ["product_service_id"]
            isOneToOne: false
            referencedRelation: "products_services"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          customizations: Json | null
          description: string | null
          dosage_form: string | null
          fulfillment_mode: string | null
          id: string
          image_storage_path: string | null
          image_url: string | null
          is_available: boolean | null
          is_new: boolean | null
          is_popular: boolean | null
          item_type: string | null
          low_stock_threshold: number | null
          name: string
          orders_this_week: number | null
          price: number
          requires_address: boolean | null
          requires_prescription: boolean
          requires_schedule: boolean | null
          stock_quantity: number | null
          subcategory: string | null
          symptom_category: string | null
          unit_type: string | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          customizations?: Json | null
          description?: string | null
          dosage_form?: string | null
          fulfillment_mode?: string | null
          id?: string
          image_storage_path?: string | null
          image_url?: string | null
          is_available?: boolean | null
          is_new?: boolean | null
          is_popular?: boolean | null
          item_type?: string | null
          low_stock_threshold?: number | null
          name: string
          orders_this_week?: number | null
          price: number
          requires_address?: boolean | null
          requires_prescription?: boolean
          requires_schedule?: boolean | null
          stock_quantity?: number | null
          subcategory?: string | null
          symptom_category?: string | null
          unit_type?: string | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          customizations?: Json | null
          description?: string | null
          dosage_form?: string | null
          fulfillment_mode?: string | null
          id?: string
          image_storage_path?: string | null
          image_url?: string | null
          is_available?: boolean | null
          is_new?: boolean | null
          is_popular?: boolean | null
          item_type?: string | null
          low_stock_threshold?: number | null
          name?: string
          orders_this_week?: number | null
          price?: number
          requires_address?: boolean | null
          requires_prescription?: boolean
          requires_schedule?: boolean | null
          stock_quantity?: number | null
          subcategory?: string | null
          symptom_category?: string | null
          unit_type?: string | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products_services: {
        Row: {
          availability_status: string | null
          average_rating: number | null
          base_price: number
          business_type_id: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          is_featured: boolean | null
          item_type: string
          low_stock_threshold: number | null
          max_capacity: number | null
          name: string
          requires_booking: boolean | null
          review_count: number | null
          sale_price: number | null
          stock_quantity: number | null
          total_orders: number | null
          total_revenue: number | null
          track_inventory: boolean | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          availability_status?: string | null
          average_rating?: number | null
          base_price: number
          business_type_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          item_type?: string
          low_stock_threshold?: number | null
          max_capacity?: number | null
          name: string
          requires_booking?: boolean | null
          review_count?: number | null
          sale_price?: number | null
          stock_quantity?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          track_inventory?: boolean | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          availability_status?: string | null
          average_rating?: number | null
          base_price?: number
          business_type_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          item_type?: string
          low_stock_threshold?: number | null
          max_capacity?: number | null
          name?: string
          requires_booking?: boolean | null
          review_count?: number | null
          sale_price?: number | null
          stock_quantity?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          track_inventory?: boolean | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          id: string
          key: string
          request_count: number
          window_start: string
        }
        Insert: {
          id?: string
          key: string
          request_count?: number
          window_start?: string
        }
        Update: {
          id?: string
          key?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      review_prompts: {
        Row: {
          customer_id: string
          id: string
          order_id: string
          prompt_type: string | null
          responded_at: string | null
          sent_at: string | null
          sent_by: string | null
        }
        Insert: {
          customer_id: string
          id?: string
          order_id: string
          prompt_type?: string | null
          responded_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
        }
        Update: {
          customer_id?: string
          id?: string
          order_id?: string
          prompt_type?: string | null
          responded_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_prompts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_prompts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_prompts_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_profiles: {
        Row: {
          created_at: string
          email: string | null
          estate_id: string | null
          full_name: string
          id: string
          id_number: string
          is_active: boolean | null
          is_approved: boolean | null
          license_number: string | null
          phone: string
          rating: number | null
          rejection_reason: string | null
          total_deliveries: number | null
          updated_at: string
          user_id: string
          vehicle_registration: string | null
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          estate_id?: string | null
          full_name: string
          id?: string
          id_number: string
          is_active?: boolean | null
          is_approved?: boolean | null
          license_number?: string | null
          phone: string
          rating?: number | null
          rejection_reason?: string | null
          total_deliveries?: number | null
          updated_at?: string
          user_id: string
          vehicle_registration?: string | null
          vehicle_type: string
        }
        Update: {
          created_at?: string
          email?: string | null
          estate_id?: string | null
          full_name?: string
          id?: string
          id_number?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          license_number?: string | null
          phone?: string
          rating?: number | null
          rejection_reason?: string | null
          total_deliveries?: number | null
          updated_at?: string
          user_id?: string
          vehicle_registration?: string | null
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_profiles_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_status: {
        Row: {
          last_online_at: string | null
          online: boolean
          rider_id: string
          updated_at: string | null
        }
        Insert: {
          last_online_at?: string | null
          online?: boolean
          rider_id: string
          updated_at?: string | null
        }
        Update: {
          last_online_at?: string | null
          online?: boolean
          rider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rider_status_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_wallet: {
        Row: {
          balance: number
          rider_id: string
          updated_at: string | null
        }
        Insert: {
          balance?: number
          rider_id: string
          updated_at?: string | null
        }
        Update: {
          balance?: number
          rider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rider_wallet_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_wallet_tx: {
        Row: {
          amount: number
          created_at: string | null
          delivery_id: string | null
          description: string | null
          id: string
          rider_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          delivery_id?: string | null
          description?: string | null
          id?: string
          rider_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          delivery_id?: string | null
          description?: string | null
          id?: string
          rider_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_wallet_tx_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_wallet_tx_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      security_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_definitions: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          min_callout_fee: number | null
          pricing_model: string | null
          product_id: string
          service_radius_km: number | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          min_callout_fee?: number | null
          pricing_model?: string | null
          product_id: string
          service_radius_km?: number | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          min_callout_fee?: number | null
          pricing_model?: string | null
          product_id?: string
          service_radius_km?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_definitions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          agent_name: string | null
          agent_notes: string | null
          agent_phone: string | null
          amount: number
          assigned_at: string | null
          assigned_to: string | null
          channel_preference: string | null
          completed_at: string | null
          contact_number: string | null
          created_at: string | null
          customer_id: string
          customer_notes: string | null
          description: string | null
          errand_type: string | null
          estate_id: string | null
          house_number: string
          id: string
          is_subscription_usage: boolean | null
          location_scope: string | null
          payment_status: string | null
          scheduled_for: string | null
          service_id: string
          service_name: string
          service_type: string | null
          status: string | null
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          agent_name?: string | null
          agent_notes?: string | null
          agent_phone?: string | null
          amount?: number
          assigned_at?: string | null
          assigned_to?: string | null
          channel_preference?: string | null
          completed_at?: string | null
          contact_number?: string | null
          created_at?: string | null
          customer_id: string
          customer_notes?: string | null
          description?: string | null
          errand_type?: string | null
          estate_id?: string | null
          house_number: string
          id?: string
          is_subscription_usage?: boolean | null
          location_scope?: string | null
          payment_status?: string | null
          scheduled_for?: string | null
          service_id: string
          service_name?: string
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          agent_name?: string | null
          agent_notes?: string | null
          agent_phone?: string | null
          amount?: number
          assigned_at?: string | null
          assigned_to?: string | null
          channel_preference?: string | null
          completed_at?: string | null
          contact_number?: string | null
          created_at?: string | null
          customer_id?: string
          customer_notes?: string | null
          description?: string | null
          errand_type?: string | null
          estate_id?: string | null
          house_number?: string
          id?: string
          is_subscription_usage?: boolean | null
          location_scope?: string | null
          payment_status?: string | null
          scheduled_for?: string | null
          service_id?: string
          service_name?: string
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_period: string | null
          cashback_percent: number | null
          cleaning_quota: number | null
          created_at: string | null
          delivery_quota: number | null
          description: string | null
          display_order: number | null
          errands_quota: number | null
          features: Json | null
          id: string
          is_active: boolean | null
          laundry_quota: number | null
          meal_prep_quota: number | null
          name: string
          osha_viombo_quota: number | null
          package_collection_quota: number | null
          price: number
          slug: string
          trash_collection_quota: number | null
        }
        Insert: {
          billing_period?: string | null
          cashback_percent?: number | null
          cleaning_quota?: number | null
          created_at?: string | null
          delivery_quota?: number | null
          description?: string | null
          display_order?: number | null
          errands_quota?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          laundry_quota?: number | null
          meal_prep_quota?: number | null
          name: string
          osha_viombo_quota?: number | null
          package_collection_quota?: number | null
          price: number
          slug: string
          trash_collection_quota?: number | null
        }
        Update: {
          billing_period?: string | null
          cashback_percent?: number | null
          cleaning_quota?: number | null
          created_at?: string | null
          delivery_quota?: number | null
          description?: string | null
          display_order?: number | null
          errands_quota?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          laundry_quota?: number | null
          meal_prep_quota?: number | null
          name?: string
          osha_viombo_quota?: number | null
          package_collection_quota?: number | null
          price?: number
          slug?: string
          trash_collection_quota?: number | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          chat_id: string | null
          created_at: string | null
          id: string
          message: string
          seen_by: string[] | null
          user_id: string
          user_role: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          seen_by?: string[] | null
          user_id: string
          user_role: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          seen_by?: string[] | null
          user_id?: string
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "private_chats"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "support_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string | null
          id: string
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string | null
          id?: string
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string | null
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          category: string
          created_at: string | null
          customer_id: string
          description: string
          escalated_to_admin: boolean | null
          escalation_reason: string | null
          id: string
          order_id: string | null
          resolved_at: string | null
          severity: string
          status: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          category: string
          created_at?: string | null
          customer_id: string
          description: string
          escalated_to_admin?: boolean | null
          escalation_reason?: string | null
          id?: string
          order_id?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          category?: string
          created_at?: string | null
          customer_id?: string
          description?: string
          escalated_to_admin?: boolean | null
          escalation_reason?: string | null
          id?: string
          order_id?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      trash_collection: {
        Row: {
          amount: number
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          customer_id: string | null
          customer_notes: string | null
          estate_id: string | null
          full_name: string
          house: string
          id: string
          payment_status: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          estate_id?: string | null
          full_name: string
          house: string
          id?: string
          payment_status?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          estate_id?: string | null
          full_name?: string
          house?: string
          id?: string
          payment_status?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trash_collection_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trash_collection_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
        ]
      }
      trash_deliveries: {
        Row: {
          completion_time: string | null
          created_at: string | null
          estate_id: string
          id: string
          pickup_time: string | null
          rider_id: string | null
          status: string | null
          trash_collection_id: string
          updated_at: string | null
        }
        Insert: {
          completion_time?: string | null
          created_at?: string | null
          estate_id: string
          id?: string
          pickup_time?: string | null
          rider_id?: string | null
          status?: string | null
          trash_collection_id: string
          updated_at?: string | null
        }
        Update: {
          completion_time?: string | null
          created_at?: string | null
          estate_id?: string
          id?: string
          pickup_time?: string | null
          rider_id?: string | null
          status?: string | null
          trash_collection_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trash_deliveries_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trash_deliveries_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "rider_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trash_deliveries_trash_collection_id_fkey"
            columns: ["trash_collection_id"]
            isOneToOne: false
            referencedRelation: "trash_collection"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          points_earned: number | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points_earned?: number | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points_earned?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "estate_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "where_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string | null
          earned_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          badge_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          badge_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "estate_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "where_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_connections: {
        Row: {
          connected_user_id: string
          created_at: string | null
          id: string
          match_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connected_user_id: string
          created_at?: string | null
          id?: string
          match_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connected_user_id?: string
          created_at?: string | null
          id?: string
          match_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_connections_connected_user_id_fkey"
            columns: ["connected_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          created_at: string | null
          id: string
          level: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string | null
          xp_points: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string | null
          xp_points?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string | null
          xp_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_gamification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "estate_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_gamification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_gamification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "where_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          apartment_name: string | null
          created_at: string
          estate_id: string | null
          extra_directions: string | null
          house_name: string | null
          id: string
          is_primary: boolean | null
          mpesa_number: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apartment_name?: string | null
          created_at?: string
          estate_id?: string | null
          extra_directions?: string | null
          house_name?: string | null
          id?: string
          is_primary?: boolean | null
          mpesa_number?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apartment_name?: string | null
          created_at?: string
          estate_id?: string | null
          extra_directions?: string | null
          house_name?: string | null
          id?: string
          is_primary?: boolean | null
          mpesa_number?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          details: string | null
          id: string
          match_id: string | null
          reason: string
          reported_id: string
          reporter_id: string
          reviewed_at: string | null
          room_id: string | null
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          match_id?: string | null
          reason: string
          reported_id: string
          reporter_id: string
          reviewed_at?: string | null
          room_id?: string | null
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          match_id?: string | null
          reason?: string
          reported_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          room_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "app_users"
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          cleaning_used: number | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          delivery_used: number | null
          errands_used: number | null
          id: string
          laundry_used: number | null
          meal_prep_used: number | null
          osha_viombo_used: number | null
          package_collection_used: number | null
          payment_reference: string | null
          plan_id: string
          status: string
          trash_collection_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cleaning_used?: number | null
          created_at?: string | null
          current_period_end: string
          current_period_start?: string
          delivery_used?: number | null
          errands_used?: number | null
          id?: string
          laundry_used?: number | null
          meal_prep_used?: number | null
          osha_viombo_used?: number | null
          package_collection_used?: number | null
          payment_reference?: string | null
          plan_id: string
          status?: string
          trash_collection_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cleaning_used?: number | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          delivery_used?: number | null
          errands_used?: number | null
          id?: string
          laundry_used?: number | null
          meal_prep_used?: number | null
          osha_viombo_used?: number | null
          package_collection_used?: number | null
          payment_reference?: string | null
          plan_id?: string
          status?: string
          trash_collection_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_categories_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payouts: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          order_id: string
          paid_at: string | null
          paid_by: string | null
          paid_reference: string | null
          platform_fee: number
          status: string
          vendor_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          order_id: string
          paid_at?: string | null
          paid_by?: string | null
          paid_reference?: string | null
          platform_fee?: number
          status?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          order_id?: string
          paid_at?: string | null
          paid_by?: string | null
          paid_reference?: string | null
          platform_fee?: number
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payouts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_profiles: {
        Row: {
          account_name: string | null
          additional_documents: string | null
          additional_information: string | null
          alternate_phone: string | null
          application_date: string | null
          average_preparation_time: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_code: string | null
          bank_name: string | null
          banner_url: string | null
          brand_accent: string | null
          brand_primary: string | null
          brand_surface: string | null
          business_address: string
          business_description: string | null
          business_email: string | null
          business_name: string
          business_phone: string
          business_type: string
          can_handle_bulk: boolean | null
          certifications: Json | null
          cover_image_url: string | null
          created_at: string
          delivery_fee: number | null
          delivery_preferences: string[] | null
          delivery_time: string | null
          document_support: string[] | null
          estate_id: string | null
          estate_or_building_name: string | null
          facebook_page: string | null
          font_display: string | null
          has_fixed_menu: boolean | null
          has_packaging: boolean | null
          hero_style: string | null
          id: string
          instagram_handle: string | null
          is_active: boolean | null
          is_approved: boolean | null
          is_open: boolean | null
          logo_url: string | null
          max_delivery_distance: string | null
          min_order_amount: number | null
          mpesa_number: string | null
          nearest_landmark: string | null
          open_hours: string | null
          operational_category: string | null
          owner_id_number: string | null
          paybill_number: string | null
          payout_method: string | null
          paystack_recipient_code: string | null
          product_count: number
          products_and_services: string | null
          rating: number | null
          rejection_reason: string | null
          review_count: number | null
          slug: string
          story: string | null
          tagline: string | null
          total_orders: number | null
          updated_at: string
          user_id: string | null
          vendor_signature: string | null
          website: string | null
          whatsapp_business: string | null
          years_in_business: number | null
        }
        Insert: {
          account_name?: string | null
          additional_documents?: string | null
          additional_information?: string | null
          alternate_phone?: string | null
          application_date?: string | null
          average_preparation_time?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_code?: string | null
          bank_name?: string | null
          banner_url?: string | null
          brand_accent?: string | null
          brand_primary?: string | null
          brand_surface?: string | null
          business_address: string
          business_description?: string | null
          business_email?: string | null
          business_name: string
          business_phone: string
          business_type: string
          can_handle_bulk?: boolean | null
          certifications?: Json | null
          cover_image_url?: string | null
          created_at?: string
          delivery_fee?: number | null
          delivery_preferences?: string[] | null
          delivery_time?: string | null
          document_support?: string[] | null
          estate_id?: string | null
          estate_or_building_name?: string | null
          facebook_page?: string | null
          font_display?: string | null
          has_fixed_menu?: boolean | null
          has_packaging?: boolean | null
          hero_style?: string | null
          id?: string
          instagram_handle?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_open?: boolean | null
          logo_url?: string | null
          max_delivery_distance?: string | null
          min_order_amount?: number | null
          mpesa_number?: string | null
          nearest_landmark?: string | null
          open_hours?: string | null
          operational_category?: string | null
          owner_id_number?: string | null
          paybill_number?: string | null
          payout_method?: string | null
          paystack_recipient_code?: string | null
          product_count?: number
          products_and_services?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          slug: string
          story?: string | null
          tagline?: string | null
          total_orders?: number | null
          updated_at?: string
          user_id?: string | null
          vendor_signature?: string | null
          website?: string | null
          whatsapp_business?: string | null
          years_in_business?: number | null
        }
        Update: {
          account_name?: string | null
          additional_documents?: string | null
          additional_information?: string | null
          alternate_phone?: string | null
          application_date?: string | null
          average_preparation_time?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_code?: string | null
          bank_name?: string | null
          banner_url?: string | null
          brand_accent?: string | null
          brand_primary?: string | null
          brand_surface?: string | null
          business_address?: string
          business_description?: string | null
          business_email?: string | null
          business_name?: string
          business_phone?: string
          business_type?: string
          can_handle_bulk?: boolean | null
          certifications?: Json | null
          cover_image_url?: string | null
          created_at?: string
          delivery_fee?: number | null
          delivery_preferences?: string[] | null
          delivery_time?: string | null
          document_support?: string[] | null
          estate_id?: string | null
          estate_or_building_name?: string | null
          facebook_page?: string | null
          font_display?: string | null
          has_fixed_menu?: boolean | null
          has_packaging?: boolean | null
          hero_style?: string | null
          id?: string
          instagram_handle?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_open?: boolean | null
          logo_url?: string | null
          max_delivery_distance?: string | null
          min_order_amount?: number | null
          mpesa_number?: string | null
          nearest_landmark?: string | null
          open_hours?: string | null
          operational_category?: string | null
          owner_id_number?: string | null
          paybill_number?: string | null
          payout_method?: string | null
          paystack_recipient_code?: string | null
          product_count?: number
          products_and_services?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          slug?: string
          story?: string | null
          tagline?: string | null
          total_orders?: number | null
          updated_at?: string
          user_id?: string | null
          vendor_signature?: string | null
          website?: string | null
          whatsapp_business?: string | null
          years_in_business?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_profiles_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_staff: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          staff_email: string | null
          staff_name: string | null
          vendor_id: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          staff_email?: string | null
          staff_name?: string | null
          vendor_id: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          staff_email?: string | null
          staff_name?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_staff_auth_user_id_fkey"
            columns: ["auth_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_staff_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_staff_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          created_by: string
          email: string | null
          expires_at: string
          id: string
          status: string
          token: string
          vendor_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          expires_at?: string
          id?: string
          status?: string
          token: string
          vendor_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          expires_at?: string
          id?: string
          status?: string
          token?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_staff_invites_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vendor_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_subcategories_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_user_map: {
        Row: {
          created_at: string
          role: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_user_map_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      where_profiles: {
        Row: {
          age: number | null
          age_range: string | null
          apartment_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          estate: string | null
          estate_id: string | null
          full_name: string
          gender: string | null
          id: string
          interests: string[] | null
          is_online: boolean | null
          karma_score: number | null
          last_online_at: string | null
          name: string | null
          neighborhood: string | null
          phone: string | null
          profile_completed: boolean | null
          profile_photo_url: string | null
          text_only: boolean | null
          unit_number: string | null
          updated_at: string | null
          user_id: string
          video_enabled: boolean | null
        }
        Insert: {
          age?: number | null
          age_range?: string | null
          apartment_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          estate?: string | null
          estate_id?: string | null
          full_name: string
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_online?: boolean | null
          karma_score?: number | null
          last_online_at?: string | null
          name?: string | null
          neighborhood?: string | null
          phone?: string | null
          profile_completed?: boolean | null
          profile_photo_url?: string | null
          text_only?: boolean | null
          unit_number?: string | null
          updated_at?: string | null
          user_id: string
          video_enabled?: boolean | null
        }
        Update: {
          age?: number | null
          age_range?: string | null
          apartment_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          estate?: string | null
          estate_id?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_online?: boolean | null
          karma_score?: number | null
          last_online_at?: string | null
          name?: string | null
          neighborhood?: string | null
          phone?: string | null
          profile_completed?: boolean | null
          profile_photo_url?: string | null
          text_only?: boolean | null
          unit_number?: string | null
          updated_at?: string | null
          user_id?: string
          video_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "mtaaloop_profiles_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtaaloop_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      app_users: {
        Row: {
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          phone: string | null
        }
        Insert: {
          email?: string | null
          first_name?: never
          id?: string | null
          last_name?: never
          phone?: never
        }
        Update: {
          email?: string | null
          first_name?: never
          id?: string | null
          last_name?: never
          phone?: never
        }
        Relationships: []
      }
      estate_leaderboard: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          estate_id: string | null
          estate_rank: number | null
          id: string | null
          level: number | null
          total_points: number | null
          xp_points: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mtaaloop_profiles_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtaaloop_profiles_user_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          estate_id: string | null
          estate_rank: number | null
          global_rank: number | null
          id: string | null
          level: number | null
          total_points: number | null
          xp_points: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mtaaloop_profiles_estate_id_fkey"
            columns: ["estate_id"]
            isOneToOne: false
            referencedRelation: "estates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtaaloop_profiles_user_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_friend_request: {
        Args: { request_id: string }
        Returns: undefined
      }
      approve_estate: { Args: { estate_id: string }; Returns: undefined }
      approve_rider: { Args: { rider_profile_id: string }; Returns: undefined }
      approve_vendor: {
        Args: { vendor_profile_id: string }
        Returns: undefined
      }
      award_points: {
        Args: {
          activity_metadata?: Json
          activity_type: string
          points_to_add: number
          user_uuid: string
        }
        Returns: undefined
      }
      calculate_level_from_xp: { Args: { xp: number }; Returns: number }
      can_vendor_create_delivery: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      check_badge_awards: { Args: { user_uuid: string }; Returns: undefined }
      check_rate_limit: {
        Args: {
          p_key: string
          p_max_requests: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      cleanup_empty_rooms: { Args: never; Returns: undefined }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      cleanup_security_logs: { Args: never; Returns: undefined }
      cleanup_stale_participants: { Args: never; Returns: undefined }
      credit_customer_wallet: {
        Args: {
          p_amount: number
          p_description?: string
          p_order_id?: string
          p_reference?: string
          p_user_id: string
        }
        Returns: boolean
      }
      current_vendor_id: { Args: never; Returns: string }
      debit_customer_wallet: {
        Args: {
          p_amount: number
          p_description?: string
          p_order_id?: string
          p_user_id: string
        }
        Returns: boolean
      }
      decrement_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      estates_search: {
        Args: {
          limit_count?: number
          name_query: string
          offset_count?: number
        }
        Returns: {
          address: string
          amenities: Json | null
          approved_at: string | null
          approved_by: string | null
          contact_email: string | null
          contact_phone: string | null
          coordinates: Json | null
          county: string | null
          created_at: string | null
          description: string | null
          estate_photos: string[] | null
          estate_type: string | null
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          location: string
          name: string
          occupied_units: number | null
          postal_code: string | null
          registration_status: string | null
          rejected_at: string | null
          rejection_reason: string | null
          slug: string | null
          submitted_at: string | null
          total_units: number | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "estates"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_blocked_user_ids: { Args: { for_user_id: string }; Returns: string[] }
      get_consultation_booking_vendor_id: {
        Args: { _booking_id: string }
        Returns: string
      }
      get_room_participant_count: {
        Args: { room_uuid: string }
        Returns: number
      }
      get_top_premium_products_for_vendor: {
        Args: { time_range: string; vendor_uuid: string }
        Returns: {
          id: string
          image_url: string
          name: string
          price: number
          stock_quantity: number
          total_quantity: number
        }[]
      }
      get_top_products_for_vendor: {
        Args: { time_range: string; vendor_uuid: string }
        Returns: {
          image_url: string
          name: string
          price: number
          product_id: string
          stock_quantity: number
          total_quantity: number
        }[]
      }
      get_user_details_by_id: {
        Args: { user_ids: string[] }
        Returns: {
          created_at: string
          email: string
          id: string
          raw_user_meta_data: Json
        }[]
      }
      get_user_name: { Args: { user_id: string }; Returns: string }
      get_vendor_average_ratings: {
        Args: { vendor_user_id: string }
        Returns: {
          avg_delivery_rating: number
          avg_food_rating: number
          total_reviews: number
        }[]
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { r: string; uid: string }; Returns: boolean }
      heartbeat_room: { Args: { p_room_id: string }; Returns: undefined }
      is_consultation_vendor: {
        Args: { _user_id: string; _vendor_id: string }
        Returns: boolean
      }
      is_csr: { Args: { uid: string }; Returns: boolean }
      is_room_member: { Args: { p_room_id: string }; Returns: boolean }
      is_user_blocked: {
        Args: { check_by_user_id: string; check_user_id: string }
        Returns: boolean
      }
      reject_estate: {
        Args: { estate_id: string; reason: string }
        Returns: undefined
      }
      reject_rider: {
        Args: { reason: string; rider_profile_id: string }
        Returns: undefined
      }
      reject_vendor: {
        Args: { reason: string; vendor_profile_id: string }
        Returns: undefined
      }
      rider_profiles_search: {
        Args: {
          limit_count?: number
          name_query?: string
          offset_count?: number
        }
        Returns: {
          created_at: string
          email: string | null
          estate_id: string | null
          full_name: string
          id: string
          id_number: string
          is_active: boolean | null
          is_approved: boolean | null
          license_number: string | null
          phone: string
          rating: number | null
          rejection_reason: string | null
          total_deliveries: number | null
          updated_at: string
          user_id: string
          vehicle_registration: string | null
          vehicle_type: string
        }[]
        SetofOptions: {
          from: "*"
          to: "rider_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      vendor_profiles_search: {
        Args: {
          business_name_query?: string
          limit_count?: number
          offset_count?: number
          slug_query?: string
        }
        Returns: {
          account_name: string | null
          additional_documents: string | null
          additional_information: string | null
          alternate_phone: string | null
          application_date: string | null
          average_preparation_time: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_code: string | null
          bank_name: string | null
          banner_url: string | null
          brand_accent: string | null
          brand_primary: string | null
          brand_surface: string | null
          business_address: string
          business_description: string | null
          business_email: string | null
          business_name: string
          business_phone: string
          business_type: string
          can_handle_bulk: boolean | null
          certifications: Json | null
          cover_image_url: string | null
          created_at: string
          delivery_fee: number | null
          delivery_preferences: string[] | null
          delivery_time: string | null
          document_support: string[] | null
          estate_id: string | null
          estate_or_building_name: string | null
          facebook_page: string | null
          font_display: string | null
          has_fixed_menu: boolean | null
          has_packaging: boolean | null
          hero_style: string | null
          id: string
          instagram_handle: string | null
          is_active: boolean | null
          is_approved: boolean | null
          is_open: boolean | null
          logo_url: string | null
          max_delivery_distance: string | null
          min_order_amount: number | null
          mpesa_number: string | null
          nearest_landmark: string | null
          open_hours: string | null
          operational_category: string | null
          owner_id_number: string | null
          paybill_number: string | null
          payout_method: string | null
          paystack_recipient_code: string | null
          product_count: number
          products_and_services: string | null
          rating: number | null
          rejection_reason: string | null
          review_count: number | null
          slug: string
          story: string | null
          tagline: string | null
          total_orders: number | null
          updated_at: string
          user_id: string | null
          vendor_signature: string | null
          website: string | null
          whatsapp_business: string | null
          years_in_business: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "vendor_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      app_role:
        | "customer"
        | "vendor"
        | "estate_manager"
        | "rider"
        | "admin"
        | "compliance"
        | "customer_care"
        | "agent"
        | "customer_rep"
      estate_registration_status: "pending" | "approved" | "rejected"
      estate_type:
        | "apartment_complex"
        | "gated_community"
        | "residential_estate"
        | "mixed_use_development"
        | "townhouse_complex"
        | "condominiums"
      vendor_approval_type: "auto_approve" | "manual_approve" | "hybrid"
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
        "customer",
        "vendor",
        "estate_manager",
        "rider",
        "admin",
        "compliance",
        "customer_care",
        "agent",
        "customer_rep",
      ],
      estate_registration_status: ["pending", "approved", "rejected"],
      estate_type: [
        "apartment_complex",
        "gated_community",
        "residential_estate",
        "mixed_use_development",
        "townhouse_complex",
        "condominiums",
      ],
      vendor_approval_type: ["auto_approve", "manual_approve", "hybrid"],
    },
  },
} as const
