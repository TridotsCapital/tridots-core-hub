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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          active: boolean
          billing_blocked_at: string | null
          billing_due_day: number | null
          billing_status: Database["public"]["Enums"]["billing_status"] | null
          cep: string | null
          cidade: string | null
          cnpj: string
          created_at: string
          creci_numero: string | null
          desconto_pix_percentual: number | null
          email: string
          endereco: string | null
          estado: string | null
          garantias_utilizadas: string[] | null
          id: string
          internal_observations: string | null
          logo_url: string | null
          nome_fantasia: string | null
          onboarding_completed: boolean | null
          percentual_comissao_setup: number
          razao_social: string
          responsavel_email: string | null
          responsavel_nome: string
          responsavel_telefone: string | null
          telefone: string | null
          terms_accepted_at: string | null
          ticket_medio_aluguel: number | null
          total_locacoes_ativas: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          billing_blocked_at?: string | null
          billing_due_day?: number | null
          billing_status?: Database["public"]["Enums"]["billing_status"] | null
          cep?: string | null
          cidade?: string | null
          cnpj: string
          created_at?: string
          creci_numero?: string | null
          desconto_pix_percentual?: number | null
          email: string
          endereco?: string | null
          estado?: string | null
          garantias_utilizadas?: string[] | null
          id?: string
          internal_observations?: string | null
          logo_url?: string | null
          nome_fantasia?: string | null
          onboarding_completed?: boolean | null
          percentual_comissao_setup?: number
          razao_social: string
          responsavel_email?: string | null
          responsavel_nome: string
          responsavel_telefone?: string | null
          telefone?: string | null
          terms_accepted_at?: string | null
          ticket_medio_aluguel?: number | null
          total_locacoes_ativas?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          billing_blocked_at?: string | null
          billing_due_day?: number | null
          billing_status?: Database["public"]["Enums"]["billing_status"] | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string
          created_at?: string
          creci_numero?: string | null
          desconto_pix_percentual?: number | null
          email?: string
          endereco?: string | null
          estado?: string | null
          garantias_utilizadas?: string[] | null
          id?: string
          internal_observations?: string | null
          logo_url?: string | null
          nome_fantasia?: string | null
          onboarding_completed?: boolean | null
          percentual_comissao_setup?: number
          razao_social?: string
          responsavel_email?: string | null
          responsavel_nome?: string
          responsavel_telefone?: string | null
          telefone?: string | null
          terms_accepted_at?: string | null
          ticket_medio_aluguel?: number | null
          total_locacoes_ativas?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      agency_documents: {
        Row: {
          agency_id: string
          created_at: string
          document_type: Database["public"]["Enums"]["agency_document_type"]
          feedback: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["agency_document_status"]
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          agency_id: string
          created_at?: string
          document_type: Database["public"]["Enums"]["agency_document_type"]
          feedback?: string | null
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["agency_document_status"]
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string
          document_type?: Database["public"]["Enums"]["agency_document_type"]
          feedback?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["agency_document_status"]
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_documents_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_invoices: {
        Row: {
          adjusted_value: number | null
          agency_id: string
          boleto_barcode: string | null
          boleto_observations: string | null
          boleto_url: string | null
          canceled_at: string | null
          canceled_by: string | null
          created_at: string
          created_by: string | null
          due_date: string
          id: string
          paid_at: string | null
          paid_by: string | null
          paid_value: number | null
          payment_notes: string | null
          payment_proof_url: string | null
          reference_month: number
          reference_year: number
          replacement_invoice_id: string | null
          sent_at: string | null
          sent_by: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          total_value: number
          updated_at: string
        }
        Insert: {
          adjusted_value?: number | null
          agency_id: string
          boleto_barcode?: string | null
          boleto_observations?: string | null
          boleto_url?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          created_at?: string
          created_by?: string | null
          due_date: string
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          paid_value?: number | null
          payment_notes?: string | null
          payment_proof_url?: string | null
          reference_month: number
          reference_year: number
          replacement_invoice_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          total_value?: number
          updated_at?: string
        }
        Update: {
          adjusted_value?: number | null
          agency_id?: string
          boleto_barcode?: string | null
          boleto_observations?: string | null
          boleto_url?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          paid_value?: number | null
          payment_notes?: string | null
          payment_proof_url?: string | null
          reference_month?: number
          reference_year?: number
          replacement_invoice_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_invoices_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_invoices_replacement_invoice_id_fkey"
            columns: ["replacement_invoice_id"]
            isOneToOne: false
            referencedRelation: "agency_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_user_positions: {
        Row: {
          agency_user_id: string
          created_at: string
          id: string
          position: Database["public"]["Enums"]["agency_position"]
          updated_at: string
        }
        Insert: {
          agency_user_id: string
          created_at?: string
          id?: string
          position?: Database["public"]["Enums"]["agency_position"]
          updated_at?: string
        }
        Update: {
          agency_user_id?: string
          created_at?: string
          id?: string
          position?: Database["public"]["Enums"]["agency_position"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_user_positions_agency_user_id_fkey"
            columns: ["agency_user_id"]
            isOneToOne: true
            referencedRelation: "agency_users"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_users: {
        Row: {
          agency_id: string
          created_at: string
          id: string
          is_primary_contact: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          id?: string
          is_primary_contact?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          id?: string
          is_primary_contact?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_users_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      analyses: {
        Row: {
          acceptance_token: string | null
          acceptance_token_expires_at: string | null
          acceptance_token_used_at: string | null
          agency_id: string
          analyst_id: string | null
          approved_at: string | null
          canceled_at: string | null
          conjuge_cpf: string | null
          conjuge_data_nascimento: string | null
          conjuge_empresa: string | null
          conjuge_nome: string | null
          conjuge_profissao: string | null
          conjuge_renda_mensal: number | null
          conjuge_rg: string | null
          created_at: string
          forma_pagamento_preferida: string | null
          garantia_anual: number | null
          guarantee_payment_confirmed_at: string | null
          guarantee_payment_date: string | null
          guarantee_payment_link: string | null
          guarantee_payment_receipt_path: string | null
          id: string
          identity_photo_path: string | null
          imovel_bairro: string | null
          imovel_cep: string | null
          imovel_cidade: string
          imovel_complemento: string | null
          imovel_endereco: string
          imovel_estado: string
          imovel_numero: string | null
          imovel_proprietario_cpf_cnpj: string | null
          imovel_proprietario_nome: string | null
          imovel_tipo: string | null
          inquilino_cpf: string
          inquilino_data_nascimento: string | null
          inquilino_email: string | null
          inquilino_empresa: string | null
          inquilino_nome: string
          inquilino_profissao: string | null
          inquilino_renda_mensal: number | null
          inquilino_rg: string | null
          inquilino_telefone: string | null
          inquilino_telefone_secundario: string | null
          observacoes: string | null
          original_taxa_garantia_percentual: number | null
          payer_address: string | null
          payer_cep: string | null
          payer_city: string | null
          payer_complement: string | null
          payer_cpf: string | null
          payer_email: string | null
          payer_is_tenant: boolean | null
          payer_name: string | null
          payer_neighborhood: string | null
          payer_number: string | null
          payer_phone: string | null
          payer_state: string | null
          payment_confirmed_at: string | null
          payment_failed_at: string | null
          payment_retry_count: number | null
          payments_rejected_at: string | null
          payments_rejection_reason: string | null
          payments_validated_at: string | null
          payments_validated_by: string | null
          plano_garantia: string | null
          rate_adjusted_by_tridots: boolean | null
          rejected_at: string | null
          rejection_reason: string | null
          setup_fee: number
          setup_fee_exempt: boolean | null
          setup_payment_confirmed_at: string | null
          setup_payment_date: string | null
          setup_payment_link: string | null
          setup_payment_receipt_path: string | null
          status: Database["public"]["Enums"]["analysis_status"]
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          taxa_garantia_percentual: number
          terms_accepted_at: string | null
          updated_at: string
          valor_aluguel: number
          valor_condominio: number | null
          valor_iptu: number | null
          valor_outros_encargos: number | null
          valor_total: number | null
        }
        Insert: {
          acceptance_token?: string | null
          acceptance_token_expires_at?: string | null
          acceptance_token_used_at?: string | null
          agency_id: string
          analyst_id?: string | null
          approved_at?: string | null
          canceled_at?: string | null
          conjuge_cpf?: string | null
          conjuge_data_nascimento?: string | null
          conjuge_empresa?: string | null
          conjuge_nome?: string | null
          conjuge_profissao?: string | null
          conjuge_renda_mensal?: number | null
          conjuge_rg?: string | null
          created_at?: string
          forma_pagamento_preferida?: string | null
          garantia_anual?: number | null
          guarantee_payment_confirmed_at?: string | null
          guarantee_payment_date?: string | null
          guarantee_payment_link?: string | null
          guarantee_payment_receipt_path?: string | null
          id?: string
          identity_photo_path?: string | null
          imovel_bairro?: string | null
          imovel_cep?: string | null
          imovel_cidade: string
          imovel_complemento?: string | null
          imovel_endereco: string
          imovel_estado: string
          imovel_numero?: string | null
          imovel_proprietario_cpf_cnpj?: string | null
          imovel_proprietario_nome?: string | null
          imovel_tipo?: string | null
          inquilino_cpf: string
          inquilino_data_nascimento?: string | null
          inquilino_email?: string | null
          inquilino_empresa?: string | null
          inquilino_nome: string
          inquilino_profissao?: string | null
          inquilino_renda_mensal?: number | null
          inquilino_rg?: string | null
          inquilino_telefone?: string | null
          inquilino_telefone_secundario?: string | null
          observacoes?: string | null
          original_taxa_garantia_percentual?: number | null
          payer_address?: string | null
          payer_cep?: string | null
          payer_city?: string | null
          payer_complement?: string | null
          payer_cpf?: string | null
          payer_email?: string | null
          payer_is_tenant?: boolean | null
          payer_name?: string | null
          payer_neighborhood?: string | null
          payer_number?: string | null
          payer_phone?: string | null
          payer_state?: string | null
          payment_confirmed_at?: string | null
          payment_failed_at?: string | null
          payment_retry_count?: number | null
          payments_rejected_at?: string | null
          payments_rejection_reason?: string | null
          payments_validated_at?: string | null
          payments_validated_by?: string | null
          plano_garantia?: string | null
          rate_adjusted_by_tridots?: boolean | null
          rejected_at?: string | null
          rejection_reason?: string | null
          setup_fee?: number
          setup_fee_exempt?: boolean | null
          setup_payment_confirmed_at?: string | null
          setup_payment_date?: string | null
          setup_payment_link?: string | null
          setup_payment_receipt_path?: string | null
          status?: Database["public"]["Enums"]["analysis_status"]
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          taxa_garantia_percentual?: number
          terms_accepted_at?: string | null
          updated_at?: string
          valor_aluguel: number
          valor_condominio?: number | null
          valor_iptu?: number | null
          valor_outros_encargos?: number | null
          valor_total?: number | null
        }
        Update: {
          acceptance_token?: string | null
          acceptance_token_expires_at?: string | null
          acceptance_token_used_at?: string | null
          agency_id?: string
          analyst_id?: string | null
          approved_at?: string | null
          canceled_at?: string | null
          conjuge_cpf?: string | null
          conjuge_data_nascimento?: string | null
          conjuge_empresa?: string | null
          conjuge_nome?: string | null
          conjuge_profissao?: string | null
          conjuge_renda_mensal?: number | null
          conjuge_rg?: string | null
          created_at?: string
          forma_pagamento_preferida?: string | null
          garantia_anual?: number | null
          guarantee_payment_confirmed_at?: string | null
          guarantee_payment_date?: string | null
          guarantee_payment_link?: string | null
          guarantee_payment_receipt_path?: string | null
          id?: string
          identity_photo_path?: string | null
          imovel_bairro?: string | null
          imovel_cep?: string | null
          imovel_cidade?: string
          imovel_complemento?: string | null
          imovel_endereco?: string
          imovel_estado?: string
          imovel_numero?: string | null
          imovel_proprietario_cpf_cnpj?: string | null
          imovel_proprietario_nome?: string | null
          imovel_tipo?: string | null
          inquilino_cpf?: string
          inquilino_data_nascimento?: string | null
          inquilino_email?: string | null
          inquilino_empresa?: string | null
          inquilino_nome?: string
          inquilino_profissao?: string | null
          inquilino_renda_mensal?: number | null
          inquilino_rg?: string | null
          inquilino_telefone?: string | null
          inquilino_telefone_secundario?: string | null
          observacoes?: string | null
          original_taxa_garantia_percentual?: number | null
          payer_address?: string | null
          payer_cep?: string | null
          payer_city?: string | null
          payer_complement?: string | null
          payer_cpf?: string | null
          payer_email?: string | null
          payer_is_tenant?: boolean | null
          payer_name?: string | null
          payer_neighborhood?: string | null
          payer_number?: string | null
          payer_phone?: string | null
          payer_state?: string | null
          payment_confirmed_at?: string | null
          payment_failed_at?: string | null
          payment_retry_count?: number | null
          payments_rejected_at?: string | null
          payments_rejection_reason?: string | null
          payments_validated_at?: string | null
          payments_validated_by?: string | null
          plano_garantia?: string | null
          rate_adjusted_by_tridots?: boolean | null
          rejected_at?: string | null
          rejection_reason?: string | null
          setup_fee?: number
          setup_fee_exempt?: boolean | null
          setup_payment_confirmed_at?: string | null
          setup_payment_date?: string | null
          setup_payment_link?: string | null
          setup_payment_receipt_path?: string | null
          status?: Database["public"]["Enums"]["analysis_status"]
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          taxa_garantia_percentual?: number
          terms_accepted_at?: string | null
          updated_at?: string
          valor_aluguel?: number
          valor_condominio?: number | null
          valor_iptu?: number | null
          valor_outros_encargos?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analyses_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_payments_validated_by_fkey"
            columns: ["payments_validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_documents: {
        Row: {
          analysis_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string | null
          id: string
          uploaded_by: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type?: string | null
          id?: string
          uploaded_by: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string | null
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_documents_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_timeline: {
        Row: {
          analysis_id: string
          created_at: string
          created_by: string | null
          description: string
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          analysis_id: string
          created_at?: string
          created_by?: string | null
          description: string
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          analysis_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_timeline_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_timeline_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      claim_files: {
        Row: {
          claim_id: string
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: Database["public"]["Enums"]["claim_file_type"]
          id: string
          uploaded_by: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type?: Database["public"]["Enums"]["claim_file_type"]
          id?: string
          uploaded_by: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: Database["public"]["Enums"]["claim_file_type"]
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_files_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_items: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["claim_item_category"]
          claim_id: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          reference_period: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["claim_item_category"]
          claim_id: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          reference_period: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["claim_item_category"]
          claim_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          reference_period?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_items_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_notes: {
        Row: {
          claim_id: string
          content: string
          created_at: string
          created_by: string
          id: string
          note_type: string
        }
        Insert: {
          claim_id: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          note_type?: string
        }
        Update: {
          claim_id?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          note_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_notes_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_status_history: {
        Row: {
          changed_by: string
          claim_id: string
          created_at: string
          id: string
          new_status: string
          observations: string | null
          old_status: string | null
          status_type: string
        }
        Insert: {
          changed_by: string
          claim_id: string
          created_at?: string
          id?: string
          new_status: string
          observations?: string | null
          old_status?: string | null
          status_type: string
        }
        Update: {
          changed_by?: string
          claim_id?: string
          created_at?: string
          id?: string
          new_status?: string
          observations?: string | null
          old_status?: string | null
          status_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_status_history_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_timeline: {
        Row: {
          claim_id: string
          created_at: string | null
          created_by: string | null
          description: string
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          claim_id: string
          created_at?: string | null
          created_by?: string | null
          description: string
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          claim_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_timeline_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_timeline_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          agency_id: string
          assigned_to: string | null
          canceled_at: string | null
          canceled_by: string | null
          claim_deadline_alerts_sent: Json | null
          contract_id: string
          created_at: string
          created_by: string
          docs_checklist: Json | null
          id: string
          internal_status: Database["public"]["Enums"]["claim_internal_status"]
          last_internal_status_change_at: string | null
          observations: string | null
          public_status: Database["public"]["Enums"]["claim_public_status"]
          total_claimed_value: number
          updated_at: string
        }
        Insert: {
          agency_id: string
          assigned_to?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          claim_deadline_alerts_sent?: Json | null
          contract_id: string
          created_at?: string
          created_by: string
          docs_checklist?: Json | null
          id?: string
          internal_status?: Database["public"]["Enums"]["claim_internal_status"]
          last_internal_status_change_at?: string | null
          observations?: string | null
          public_status?: Database["public"]["Enums"]["claim_public_status"]
          total_claimed_value?: number
          updated_at?: string
        }
        Update: {
          agency_id?: string
          assigned_to?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          claim_deadline_alerts_sent?: Json | null
          contract_id?: string
          created_at?: string
          created_by?: string
          docs_checklist?: Json | null
          id?: string
          internal_status?: Database["public"]["Enums"]["claim_internal_status"]
          last_internal_status_change_at?: string | null
          observations?: string | null
          public_status?: Database["public"]["Enums"]["claim_public_status"]
          total_claimed_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_canceled_by_fkey"
            columns: ["canceled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          agency_id: string
          analysis_id: string
          ano_referencia: number | null
          base_calculo: number | null
          created_at: string
          data_estorno: string | null
          data_pagamento: string | null
          due_date: string | null
          id: string
          mes_referencia: number | null
          observacoes: string | null
          percentual_comissao: number | null
          report_sent_at: string | null
          status: Database["public"]["Enums"]["commission_status"]
          type: Database["public"]["Enums"]["commission_type"]
          updated_at: string
          valor: number
        }
        Insert: {
          agency_id: string
          analysis_id: string
          ano_referencia?: number | null
          base_calculo?: number | null
          created_at?: string
          data_estorno?: string | null
          data_pagamento?: string | null
          due_date?: string | null
          id?: string
          mes_referencia?: number | null
          observacoes?: string | null
          percentual_comissao?: number | null
          report_sent_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          type: Database["public"]["Enums"]["commission_type"]
          updated_at?: string
          valor: number
        }
        Update: {
          agency_id?: string
          analysis_id?: string
          ano_referencia?: number | null
          base_calculo?: number | null
          created_at?: string
          data_estorno?: string | null
          data_pagamento?: string | null
          due_date?: string | null
          id?: string
          mes_referencia?: number | null
          observacoes?: string | null
          percentual_comissao?: number | null
          report_sent_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          type?: Database["public"]["Enums"]["commission_type"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "commissions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_renewals: {
        Row: {
          acceptance_token: string | null
          acceptance_token_expires_at: string | null
          acceptance_token_used_at: string | null
          contract_id: string
          created_at: string
          guarantee_payment_validated_at: string | null
          guarantee_payment_validated_by: string | null
          id: string
          new_data_fim_contrato: string | null
          new_taxa_garantia_percentual: number | null
          new_valor_aluguel: number
          new_valor_condominio: number | null
          new_valor_iptu: number | null
          new_valor_outros_encargos: number | null
          old_data_fim_contrato: string | null
          old_taxa_garantia_percentual: number | null
          old_valor_aluguel: number
          old_valor_condominio: number | null
          old_valor_iptu: number | null
          old_valor_outros_encargos: number | null
          rejection_reason: string | null
          renewal_duration_months: number | null
          request_source: string
          requested_at: string
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          acceptance_token?: string | null
          acceptance_token_expires_at?: string | null
          acceptance_token_used_at?: string | null
          contract_id: string
          created_at?: string
          guarantee_payment_validated_at?: string | null
          guarantee_payment_validated_by?: string | null
          id?: string
          new_data_fim_contrato?: string | null
          new_taxa_garantia_percentual?: number | null
          new_valor_aluguel: number
          new_valor_condominio?: number | null
          new_valor_iptu?: number | null
          new_valor_outros_encargos?: number | null
          old_data_fim_contrato?: string | null
          old_taxa_garantia_percentual?: number | null
          old_valor_aluguel: number
          old_valor_condominio?: number | null
          old_valor_iptu?: number | null
          old_valor_outros_encargos?: number | null
          rejection_reason?: string | null
          renewal_duration_months?: number | null
          request_source: string
          requested_at?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          acceptance_token?: string | null
          acceptance_token_expires_at?: string | null
          acceptance_token_used_at?: string | null
          contract_id?: string
          created_at?: string
          guarantee_payment_validated_at?: string | null
          guarantee_payment_validated_by?: string | null
          id?: string
          new_data_fim_contrato?: string | null
          new_taxa_garantia_percentual?: number | null
          new_valor_aluguel?: number
          new_valor_condominio?: number | null
          new_valor_iptu?: number | null
          new_valor_outros_encargos?: number | null
          old_data_fim_contrato?: string | null
          old_taxa_garantia_percentual?: number | null
          old_valor_aluguel?: number
          old_valor_condominio?: number | null
          old_valor_iptu?: number | null
          old_valor_outros_encargos?: number | null
          rejection_reason?: string | null
          renewal_duration_months?: number | null
          request_source?: string
          requested_at?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_renewals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          activation_pending: boolean | null
          activation_pending_since: string | null
          agency_id: string
          analysis_id: string
          canceled_at: string | null
          canceled_by: string | null
          cancellation_reason: string | null
          created_at: string
          data_fim_contrato: string | null
          doc_contrato_administrativo_feedback: string | null
          doc_contrato_administrativo_name: string | null
          doc_contrato_administrativo_path: string | null
          doc_contrato_administrativo_status: string | null
          doc_contrato_administrativo_uploaded_at: string | null
          doc_contrato_locacao_feedback: string | null
          doc_contrato_locacao_name: string | null
          doc_contrato_locacao_path: string | null
          doc_contrato_locacao_status: string | null
          doc_contrato_locacao_uploaded_at: string | null
          doc_seguro_incendio_feedback: string | null
          doc_seguro_incendio_name: string | null
          doc_seguro_incendio_path: string | null
          doc_seguro_incendio_status: string | null
          doc_seguro_incendio_uploaded_at: string | null
          doc_vistoria_inicial_feedback: string | null
          doc_vistoria_inicial_name: string | null
          doc_vistoria_inicial_path: string | null
          doc_vistoria_inicial_status: string | null
          doc_vistoria_inicial_uploaded_at: string | null
          id: string
          is_migrated: boolean
          last_renewal_id: string | null
          payer_address: string | null
          payer_cep: string | null
          payer_city: string | null
          payer_complement: string | null
          payer_cpf: string | null
          payer_email: string | null
          payer_is_tenant: boolean | null
          payer_name: string | null
          payer_neighborhood: string | null
          payer_number: string | null
          payer_phone: string | null
          payer_state: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          renewal_count: number | null
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          activation_pending?: boolean | null
          activation_pending_since?: string | null
          agency_id: string
          analysis_id: string
          canceled_at?: string | null
          canceled_by?: string | null
          cancellation_reason?: string | null
          created_at?: string
          data_fim_contrato?: string | null
          doc_contrato_administrativo_feedback?: string | null
          doc_contrato_administrativo_name?: string | null
          doc_contrato_administrativo_path?: string | null
          doc_contrato_administrativo_status?: string | null
          doc_contrato_administrativo_uploaded_at?: string | null
          doc_contrato_locacao_feedback?: string | null
          doc_contrato_locacao_name?: string | null
          doc_contrato_locacao_path?: string | null
          doc_contrato_locacao_status?: string | null
          doc_contrato_locacao_uploaded_at?: string | null
          doc_seguro_incendio_feedback?: string | null
          doc_seguro_incendio_name?: string | null
          doc_seguro_incendio_path?: string | null
          doc_seguro_incendio_status?: string | null
          doc_seguro_incendio_uploaded_at?: string | null
          doc_vistoria_inicial_feedback?: string | null
          doc_vistoria_inicial_name?: string | null
          doc_vistoria_inicial_path?: string | null
          doc_vistoria_inicial_status?: string | null
          doc_vistoria_inicial_uploaded_at?: string | null
          id?: string
          is_migrated?: boolean
          last_renewal_id?: string | null
          payer_address?: string | null
          payer_cep?: string | null
          payer_city?: string | null
          payer_complement?: string | null
          payer_cpf?: string | null
          payer_email?: string | null
          payer_is_tenant?: boolean | null
          payer_name?: string | null
          payer_neighborhood?: string | null
          payer_number?: string | null
          payer_phone?: string | null
          payer_state?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          renewal_count?: number | null
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          activation_pending?: boolean | null
          activation_pending_since?: string | null
          agency_id?: string
          analysis_id?: string
          canceled_at?: string | null
          canceled_by?: string | null
          cancellation_reason?: string | null
          created_at?: string
          data_fim_contrato?: string | null
          doc_contrato_administrativo_feedback?: string | null
          doc_contrato_administrativo_name?: string | null
          doc_contrato_administrativo_path?: string | null
          doc_contrato_administrativo_status?: string | null
          doc_contrato_administrativo_uploaded_at?: string | null
          doc_contrato_locacao_feedback?: string | null
          doc_contrato_locacao_name?: string | null
          doc_contrato_locacao_path?: string | null
          doc_contrato_locacao_status?: string | null
          doc_contrato_locacao_uploaded_at?: string | null
          doc_seguro_incendio_feedback?: string | null
          doc_seguro_incendio_name?: string | null
          doc_seguro_incendio_path?: string | null
          doc_seguro_incendio_status?: string | null
          doc_seguro_incendio_uploaded_at?: string | null
          doc_vistoria_inicial_feedback?: string | null
          doc_vistoria_inicial_name?: string | null
          doc_vistoria_inicial_path?: string | null
          doc_vistoria_inicial_status?: string | null
          doc_vistoria_inicial_uploaded_at?: string | null
          id?: string
          is_migrated?: boolean
          last_renewal_id?: string | null
          payer_address?: string | null
          payer_cep?: string | null
          payer_city?: string | null
          payer_complement?: string | null
          payer_cpf?: string | null
          payer_email?: string | null
          payer_is_tenant?: boolean | null
          payer_name?: string | null
          payer_neighborhood?: string | null
          payer_number?: string | null
          payer_phone?: string | null
          payer_state?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          renewal_count?: number | null
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: true
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_canceled_by_fkey"
            columns: ["canceled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_acceptances: {
        Row: {
          accepted_at: string
          accepted_by_cpf: string
          accepted_by_email: string | null
          accepted_by_name: string
          analysis_id: string
          created_at: string
          document_hash: string
          geolocation_city: string | null
          geolocation_country: string | null
          geolocation_state: string | null
          id: string
          ip_address: unknown
          term_template_id: string
          user_agent: string
        }
        Insert: {
          accepted_at?: string
          accepted_by_cpf: string
          accepted_by_email?: string | null
          accepted_by_name: string
          analysis_id: string
          created_at?: string
          document_hash: string
          geolocation_city?: string | null
          geolocation_country?: string | null
          geolocation_state?: string | null
          id?: string
          ip_address: unknown
          term_template_id: string
          user_agent: string
        }
        Update: {
          accepted_at?: string
          accepted_by_cpf?: string
          accepted_by_email?: string | null
          accepted_by_name?: string
          analysis_id?: string
          created_at?: string
          document_hash?: string
          geolocation_city?: string | null
          geolocation_country?: string | null
          geolocation_state?: string | null
          id?: string
          ip_address?: unknown
          term_template_id?: string
          user_agent?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_acceptances_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_acceptances_term_template_id_fkey"
            columns: ["term_template_id"]
            isOneToOne: false
            referencedRelation: "term_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          recipient_original: string | null
          sent_at: string | null
          status: string
          subject: string
          template_type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          recipient_original?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          recipient_original?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_type?: string
        }
        Relationships: []
      }
      function_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_details: Json | null
          function_name: string
          id: string
          level: string
          message: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          function_name: string
          id?: string
          level: string
          message: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          function_name?: string
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      guarantee_installments: {
        Row: {
          agency_id: string
          contract_id: string
          created_at: string
          due_date: string
          id: string
          installment_number: number
          invoice_item_id: string | null
          paid_at: string | null
          reference_month: number
          reference_year: number
          status: Database["public"]["Enums"]["installment_status"]
          value: number
        }
        Insert: {
          agency_id: string
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          invoice_item_id?: string | null
          paid_at?: string | null
          reference_month: number
          reference_year: number
          status?: Database["public"]["Enums"]["installment_status"]
          value: number
        }
        Update: {
          agency_id?: string
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          invoice_item_id?: string | null
          paid_at?: string | null
          reference_month?: number
          reference_year?: number
          status?: Database["public"]["Enums"]["installment_status"]
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "guarantee_installments_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guarantee_installments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guarantee_installments_invoice_item_id_fkey"
            columns: ["invoice_item_id"]
            isOneToOne: false
            referencedRelation: "invoice_items"
            referencedColumns: ["id"]
          },
        ]
      }
      help_chapters: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_new: boolean
          order_index: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          is_new?: boolean
          order_index: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_new?: boolean
          order_index?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      help_faqs: {
        Row: {
          answer: string
          chapter_id: string
          created_at: string
          id: string
          order_index: number
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          chapter_id: string
          created_at?: string
          id?: string
          order_index?: number
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          chapter_id?: string
          created_at?: string
          id?: string
          order_index?: number
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_faqs_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "help_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      help_feedback: {
        Row: {
          created_at: string
          id: string
          is_helpful: boolean
          section_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_helpful: boolean
          section_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_helpful?: boolean
          section_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_feedback_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "help_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      help_glossary: {
        Row: {
          created_at: string
          definition: string
          id: string
          term: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          definition: string
          id?: string
          term: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          definition?: string
          id?: string
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      help_media: {
        Row: {
          caption: string | null
          created_at: string
          file_path: string | null
          id: string
          media_type: string
          order_index: number
          placeholder_id: string
          section_id: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          media_type: string
          order_index?: number
          placeholder_id: string
          section_id: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          media_type?: string
          order_index?: number
          placeholder_id?: string
          section_id?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_media_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "help_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      help_sections: {
        Row: {
          chapter_id: string
          content: string
          created_at: string
          id: string
          order_index: number
          portal_links: Json | null
          see_also: Json | null
          slug: string
          tips: Json | null
          title: string
          updated_at: string
          warnings: Json | null
        }
        Insert: {
          chapter_id: string
          content?: string
          created_at?: string
          id?: string
          order_index: number
          portal_links?: Json | null
          see_also?: Json | null
          slug: string
          tips?: Json | null
          title: string
          updated_at?: string
          warnings?: Json | null
        }
        Update: {
          chapter_id?: string
          content?: string
          created_at?: string
          id?: string
          order_index?: number
          portal_links?: Json | null
          see_also?: Json | null
          slug?: string
          tips?: Json | null
          title?: string
          updated_at?: string
          warnings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "help_sections_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "help_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_chat: {
        Row: {
          analysis_id: string
          attachment_name: string | null
          attachment_size: number | null
          attachment_url: string | null
          created_at: string
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          analysis_id: string
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          message: string
          sender_id: string
        }
        Update: {
          analysis_id?: string
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_chat_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_notes: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          reference_id: string
          reference_type: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          reference_id: string
          reference_type: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          reference_id?: string
          reference_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          installment_id: string | null
          installment_number: number
          invoice_id: string
          property_address: string
          tenant_name: string
          value: number
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          installment_id?: string | null
          installment_number: number
          invoice_id: string
          property_address: string
          tenant_name: string
          value: number
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          installment_id?: string | null
          installment_number?: number
          invoice_id?: string
          property_address?: string
          tenant_name?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "guarantee_installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "agency_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_timeline: {
        Row: {
          attachment_url: string | null
          created_at: string
          description: string
          event_type: Database["public"]["Enums"]["invoice_event_type"]
          id: string
          invoice_id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          description: string
          event_type: Database["public"]["Enums"]["invoice_event_type"]
          id?: string
          invoice_id: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          description?: string
          event_type?: Database["public"]["Enums"]["invoice_event_type"]
          id?: string
          invoice_id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_timeline_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "agency_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          read_at: string | null
          reference_id: string | null
          source: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          reference_id?: string | null
          source: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          reference_id?: string | null
          source?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_option_interest_clicks: {
        Row: {
          agency_id: string | null
          created_at: string | null
          id: string
          option_key: string
          user_id: string | null
        }
        Insert: {
          agency_id?: string | null
          created_at?: string | null
          id?: string
          option_key?: string
          user_id?: string | null
        }
        Update: {
          agency_id?: string | null
          created_at?: string | null
          id?: string
          option_key?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_option_interest_clicks_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      renewal_notifications: {
        Row: {
          channel: string
          contract_id: string
          created_at: string | null
          id: string
          message_preview: string | null
          metadata: Json | null
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          renewal_id: string | null
          sent_at: string | null
          sent_by: string
          status: string | null
        }
        Insert: {
          channel: string
          contract_id: string
          created_at?: string | null
          id?: string
          message_preview?: string | null
          metadata?: Json | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          renewal_id?: string | null
          sent_at?: string | null
          sent_by: string
          status?: string | null
        }
        Update: {
          channel?: string
          contract_id?: string
          created_at?: string | null
          id?: string
          message_preview?: string | null
          metadata?: Json | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          renewal_id?: string | null
          sent_at?: string | null
          sent_by?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "renewal_notifications_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewal_notifications_renewal_id_fkey"
            columns: ["renewal_id"]
            isOneToOne: false
            referencedRelation: "contract_renewals"
            referencedColumns: ["id"]
          },
        ]
      }
      satisfaction_surveys: {
        Row: {
          agency_id: string
          analyst_id: string | null
          comment: string | null
          created_at: string
          created_by: string | null
          id: string
          rating: number | null
          ticket_id: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          analyst_id?: string | null
          comment?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          rating?: number | null
          ticket_id: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          analyst_id?: string | null
          comment?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          rating?: number | null
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "satisfaction_surveys_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satisfaction_surveys_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satisfaction_surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satisfaction_surveys_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          key: string
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          value?: string
        }
        Relationships: []
      }
      term_templates: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          uploaded_by: string
          version: number
          visible_in_agency_drive: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          uploaded_by: string
          version?: number
          visible_in_agency_drive?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          uploaded_by?: string
          version?: number
          visible_in_agency_drive?: boolean
        }
        Relationships: []
      }
      ticket_analyst_history: {
        Row: {
          analyst_id: string
          assigned_at: string
          created_at: string
          id: string
          removed_at: string | null
          ticket_id: string
        }
        Insert: {
          analyst_id: string
          assigned_at?: string
          created_at?: string
          id?: string
          removed_at?: string | null
          ticket_id: string
        }
        Update: {
          analyst_id?: string
          assigned_at?: string
          created_at?: string
          id?: string
          removed_at?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_analyst_history_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_analyst_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          attachments_url: string[] | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachments_url?: string[] | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachments_url?: string[] | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          read_at: string | null
          ticket_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          read_at?: string | null
          ticket_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          read_at?: string | null
          ticket_id?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_quick_replies: {
        Row: {
          category: Database["public"]["Enums"]["ticket_category"] | null
          content: string
          created_at: string
          created_by: string
          id: string
          title: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["ticket_category"] | null
          content: string
          created_at?: string
          created_by: string
          id?: string
          title: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["ticket_category"] | null
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          title?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_quick_replies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_typing_indicators: {
        Row: {
          id: string
          started_at: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          id?: string
          started_at?: string
          ticket_id: string
          user_id: string
        }
        Update: {
          id?: string
          started_at?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_typing_indicators_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_typing_indicators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          agency_id: string
          analysis_id: string | null
          assigned_to: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          claim_id: string | null
          closed_by: string | null
          closed_by_type: string | null
          contract_id: string | null
          created_at: string
          created_by: string
          description: string | null
          escalated_at: string | null
          first_response_at: string | null
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          satisfaction_comment: string | null
          satisfaction_rating: number | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          analysis_id?: string | null
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          claim_id?: string | null
          closed_by?: string | null
          closed_by_type?: string | null
          contract_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          escalated_at?: string | null
          first_response_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          satisfaction_comment?: string | null
          satisfaction_rating?: number | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          analysis_id?: string | null
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          claim_id?: string | null
          closed_by?: string | null
          closed_by_type?: string | null
          contract_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          escalated_at?: string | null
          first_response_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          satisfaction_comment?: string | null
          satisfaction_rating?: number | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
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
      calculate_first_installment_date: {
        Args: { activation_date: string; billing_due_day: number }
        Returns: string
      }
      calculate_next_business_day: {
        Args: { target_date: string }
        Returns: string
      }
      check_claim_deadline_alerts: { Args: never; Returns: undefined }
      cleanup_stale_typing_indicators: { Args: never; Returns: undefined }
      create_contract_from_analysis: {
        Args: { _analysis_id: string }
        Returns: string
      }
      create_email_sent_notification: {
        Args: {
          p_recipient_email: string
          p_recipient_name: string
          p_reference_id?: string
          p_success?: boolean
          p_template_type: string
        }
        Returns: undefined
      }
      get_agency_approval_rate: {
        Args: { _agency_id: string }
        Returns: {
          approved: number
          rate: number
          total: number
        }[]
      }
      get_agency_projection: {
        Args: { _agency_id: string }
        Returns: {
          contracts_count: number
          monthly_projection: number
        }[]
      }
      get_agency_ranking: {
        Args: { _agency_id: string }
        Returns: {
          ranking_position: number
          total_agencies: number
          total_commissions: number
        }[]
      }
      get_financial_summary: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          mes: string
          quantidade: number
          status: string
          tipo: string
          total_valor: number
        }[]
      }
      get_suggested_analyst: { Args: never; Returns: string }
      get_user_agency_id: { Args: { user_uuid: string }; Returns: string }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_agency_user: { Args: { _user_id: string }; Returns: boolean }
      is_master: { Args: { _user_id: string }; Returns: boolean }
      log_analysis_timeline_event: {
        Args: {
          _analysis_id: string
          _created_by?: string
          _description: string
          _event_type: string
          _metadata?: Json
        }
        Returns: string
      }
    }
    Enums: {
      agency_document_status: "pendente" | "enviado" | "aprovado" | "rejeitado"
      agency_document_type:
        | "cartao_cnpj"
        | "certidao_creci"
        | "documento_socio"
        | "contrato_social"
        | "termo_aceite_assinado"
      agency_position: "dono" | "gerente" | "auxiliar"
      analysis_status:
        | "pendente"
        | "em_analise"
        | "aprovada"
        | "reprovada"
        | "cancelada"
        | "aguardando_pagamento"
        | "ativo"
      app_role: "master" | "analyst" | "agency_user"
      billing_status: "em_dia" | "atrasada" | "bloqueada"
      claim_file_type:
        | "boleto"
        | "contrato"
        | "vistoria"
        | "notificacao"
        | "acordo"
        | "comprovante"
        | "outros"
      claim_internal_status:
        | "aguardando_analise"
        | "cobranca_amigavel"
        | "notificacao_extrajudicial"
        | "acordo_realizado"
        | "juridico_acionado"
        | "encerrado"
        | "exoneracao_despejo_interno"
      claim_item_category:
        | "aluguel"
        | "condominio"
        | "iptu"
        | "luz"
        | "agua"
        | "gas"
        | "danos"
        | "limpeza"
        | "pintura"
        | "multa_contratual"
        | "outros"
      claim_public_status:
        | "solicitado"
        | "em_analise_tecnica"
        | "pagamento_programado"
        | "finalizado"
        | "exoneracao_despejo"
      commission_status:
        | "pendente"
        | "paga"
        | "cancelada"
        | "estornada"
        | "a_pagar"
      commission_type: "setup" | "recorrente"
      contract_status:
        | "documentacao_pendente"
        | "ativo"
        | "cancelado"
        | "encerrado"
        | "vencido"
      installment_status: "pendente" | "faturada" | "paga" | "cancelada"
      invoice_event_type:
        | "created"
        | "edited"
        | "sent"
        | "payment_registered"
        | "canceled"
        | "note_added"
      invoice_status:
        | "rascunho"
        | "gerada"
        | "enviada"
        | "atrasada"
        | "paga"
        | "cancelada"
      notification_type:
        | "new_message"
        | "status_change"
        | "ticket_escalated"
        | "ticket_assigned"
      payment_method: "pix" | "card" | "boleto_imobiliaria"
      ticket_category:
        | "financeiro"
        | "tecnico"
        | "comercial"
        | "urgente"
        | "solicitacao_link"
      ticket_priority: "baixa" | "media" | "alta"
      ticket_status:
        | "aberto"
        | "em_atendimento"
        | "aguardando_cliente"
        | "resolvido"
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
      agency_document_status: ["pendente", "enviado", "aprovado", "rejeitado"],
      agency_document_type: [
        "cartao_cnpj",
        "certidao_creci",
        "documento_socio",
        "contrato_social",
        "termo_aceite_assinado",
      ],
      agency_position: ["dono", "gerente", "auxiliar"],
      analysis_status: [
        "pendente",
        "em_analise",
        "aprovada",
        "reprovada",
        "cancelada",
        "aguardando_pagamento",
        "ativo",
      ],
      app_role: ["master", "analyst", "agency_user"],
      billing_status: ["em_dia", "atrasada", "bloqueada"],
      claim_file_type: [
        "boleto",
        "contrato",
        "vistoria",
        "notificacao",
        "acordo",
        "comprovante",
        "outros",
      ],
      claim_internal_status: [
        "aguardando_analise",
        "cobranca_amigavel",
        "notificacao_extrajudicial",
        "acordo_realizado",
        "juridico_acionado",
        "encerrado",
        "exoneracao_despejo_interno",
      ],
      claim_item_category: [
        "aluguel",
        "condominio",
        "iptu",
        "luz",
        "agua",
        "gas",
        "danos",
        "limpeza",
        "pintura",
        "multa_contratual",
        "outros",
      ],
      claim_public_status: [
        "solicitado",
        "em_analise_tecnica",
        "pagamento_programado",
        "finalizado",
        "exoneracao_despejo",
      ],
      commission_status: [
        "pendente",
        "paga",
        "cancelada",
        "estornada",
        "a_pagar",
      ],
      commission_type: ["setup", "recorrente"],
      contract_status: [
        "documentacao_pendente",
        "ativo",
        "cancelado",
        "encerrado",
        "vencido",
      ],
      installment_status: ["pendente", "faturada", "paga", "cancelada"],
      invoice_event_type: [
        "created",
        "edited",
        "sent",
        "payment_registered",
        "canceled",
        "note_added",
      ],
      invoice_status: [
        "rascunho",
        "gerada",
        "enviada",
        "atrasada",
        "paga",
        "cancelada",
      ],
      notification_type: [
        "new_message",
        "status_change",
        "ticket_escalated",
        "ticket_assigned",
      ],
      payment_method: ["pix", "card", "boleto_imobiliaria"],
      ticket_category: [
        "financeiro",
        "tecnico",
        "comercial",
        "urgente",
        "solicitacao_link",
      ],
      ticket_priority: ["baixa", "media", "alta"],
      ticket_status: [
        "aberto",
        "em_atendimento",
        "aguardando_cliente",
        "resolvido",
      ],
    },
  },
} as const
