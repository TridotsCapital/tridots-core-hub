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
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_master: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      analysis_status:
        | "pendente"
        | "em_analise"
        | "aprovada"
        | "reprovada"
        | "cancelada"
      app_role: "master" | "analyst"
      commission_status: "pendente" | "paga" | "cancelada" | "estornada"
      commission_type: "setup" | "recorrente"
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
      ],
      app_role: ["master", "analyst"],
      commission_status: ["pendente", "paga", "cancelada", "estornada"],
      commission_type: ["setup", "recorrente"],
    },
  },
} as const
