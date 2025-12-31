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
          cep: string | null
          cidade: string | null
          cnpj: string
          created_at: string
          email: string
          endereco: string | null
          estado: string | null
          id: string
          nome_fantasia: string | null
          percentual_comissao_recorrente: number
          razao_social: string
          responsavel_email: string | null
          responsavel_nome: string
          responsavel_telefone: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj: string
          created_at?: string
          email: string
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_fantasia?: string | null
          percentual_comissao_recorrente?: number
          razao_social: string
          responsavel_email?: string | null
          responsavel_nome: string
          responsavel_telefone?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj?: string
          created_at?: string
          email?: string
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_fantasia?: string | null
          percentual_comissao_recorrente?: number
          razao_social?: string
          responsavel_email?: string | null
          responsavel_nome?: string
          responsavel_telefone?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
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
          id: string
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
          observacoes: string | null
          rejected_at: string | null
          setup_fee: number
          status: Database["public"]["Enums"]["analysis_status"]
          taxa_garantia_percentual: number
          updated_at: string
          valor_aluguel: number
          valor_condominio: number | null
          valor_iptu: number | null
          valor_outros_encargos: number | null
          valor_total: number | null
        }
        Insert: {
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
          id?: string
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
          observacoes?: string | null
          rejected_at?: string | null
          setup_fee?: number
          status?: Database["public"]["Enums"]["analysis_status"]
          taxa_garantia_percentual?: number
          updated_at?: string
          valor_aluguel: number
          valor_condominio?: number | null
          valor_iptu?: number | null
          valor_outros_encargos?: number | null
          valor_total?: number | null
        }
        Update: {
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
          id?: string
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
          observacoes?: string | null
          rejected_at?: string | null
          setup_fee?: number
          status?: Database["public"]["Enums"]["analysis_status"]
          taxa_garantia_percentual?: number
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
      commissions: {
        Row: {
          agency_id: string
          analysis_id: string
          ano_referencia: number | null
          created_at: string
          data_estorno: string | null
          data_pagamento: string | null
          id: string
          mes_referencia: number | null
          observacoes: string | null
          status: Database["public"]["Enums"]["commission_status"]
          type: Database["public"]["Enums"]["commission_type"]
          updated_at: string
          valor: number
        }
        Insert: {
          agency_id: string
          analysis_id: string
          ano_referencia?: number | null
          created_at?: string
          data_estorno?: string | null
          data_pagamento?: string | null
          id?: string
          mes_referencia?: number | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          type: Database["public"]["Enums"]["commission_type"]
          updated_at?: string
          valor: number
        }
        Update: {
          agency_id?: string
          analysis_id?: string
          ano_referencia?: number | null
          created_at?: string
          data_estorno?: string | null
          data_pagamento?: string | null
          id?: string
          mes_referencia?: number | null
          observacoes?: string | null
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
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
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
        }
        Relationships: []
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
          assigned_to: string | null
          category: Database["public"]["Enums"]["ticket_category"]
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
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
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
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
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
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      cleanup_stale_typing_indicators: { Args: never; Returns: undefined }
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
    }
    Enums: {
      analysis_status:
        | "pendente"
        | "em_analise"
        | "aprovada"
        | "reprovada"
        | "cancelada"
        | "aguardando_pagamento"
        | "ativo"
      app_role: "master" | "analyst" | "agency_user"
      commission_status: "pendente" | "paga" | "cancelada" | "estornada"
      commission_type: "setup" | "recorrente"
      notification_type:
        | "new_message"
        | "status_change"
        | "ticket_escalated"
        | "ticket_assigned"
      ticket_category: "financeiro" | "tecnico" | "comercial" | "urgente"
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
      commission_status: ["pendente", "paga", "cancelada", "estornada"],
      commission_type: ["setup", "recorrente"],
      notification_type: [
        "new_message",
        "status_change",
        "ticket_escalated",
        "ticket_assigned",
      ],
      ticket_category: ["financeiro", "tecnico", "comercial", "urgente"],
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
