export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      games: {
        Row: {
          away_score: number | null
          away_team_id: string
          created_at: string
          date: string
          game_type: Database["public"]["Enums"]["game_type"]
          home_score: number | null
          home_team_id: string
          id: string
          overtime_periods: number
          season_id: string
          status: Database["public"]["Enums"]["game_status"]
          updated_at: string
        }
        Insert: {
          away_score?: number | null
          away_team_id: string
          created_at?: string
          date: string
          game_type?: Database["public"]["Enums"]["game_type"]
          home_score?: number | null
          home_team_id: string
          id: string
          overtime_periods?: number
          season_id: string
          status?: Database["public"]["Enums"]["game_status"]
          updated_at?: string
        }
        Update: {
          away_score?: number | null
          away_team_id?: string
          created_at?: string
          date?: string
          game_type?: Database["public"]["Enums"]["game_type"]
          home_score?: number | null
          home_team_id?: string
          id?: string
          overtime_periods?: number
          season_id?: string
          status?: Database["public"]["Enums"]["game_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      injury_reports: {
        Row: {
          confirmed: boolean
          created_at: string
          description: string | null
          expected_return: string | null
          id: string
          player_id: string
          reported_at: string
          source: string
          status: Database["public"]["Enums"]["injury_status"]
          updated_at: string
        }
        Insert: {
          confirmed?: boolean
          created_at?: string
          description?: string | null
          expected_return?: string | null
          id: string
          player_id: string
          reported_at: string
          source: string
          status: Database["public"]["Enums"]["injury_status"]
          updated_at?: string
        }
        Update: {
          confirmed?: boolean
          created_at?: string
          description?: string | null
          expected_return?: string | null
          id?: string
          player_id?: string
          reported_at?: string
          source?: string
          status?: Database["public"]["Enums"]["injury_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "injury_reports_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      lineup_reports: {
        Row: {
          confirmation: Database["public"]["Enums"]["lineup_confirmation"]
          created_at: string
          id: string
          player_id: string
          reported_at: string
          role: Database["public"]["Enums"]["lineup_role"]
          source: string
          updated_at: string
        }
        Insert: {
          confirmation: Database["public"]["Enums"]["lineup_confirmation"]
          created_at?: string
          id: string
          player_id: string
          reported_at: string
          role: Database["public"]["Enums"]["lineup_role"]
          source: string
          updated_at?: string
        }
        Update: {
          confirmation?: Database["public"]["Enums"]["lineup_confirmation"]
          created_at?: string
          id?: string
          player_id?: string
          reported_at?: string
          role?: Database["public"]["Enums"]["lineup_role"]
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lineup_reports_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_game_stats: {
        Row: {
          assists: number
          blocks: number
          created_at: string
          fga: number
          fgm: number
          fouls: number
          fta: number
          ftm: number
          game_id: string
          id: string
          minutes: number
          player_id: string
          plus_minus: number
          points: number
          rebounds: number
          starter: boolean
          steals: number
          three_pa: number
          three_pm: number
          turnovers: number
          updated_at: string
        }
        Insert: {
          assists: number
          blocks: number
          created_at?: string
          fga: number
          fgm: number
          fouls: number
          fta: number
          ftm: number
          game_id: string
          id: string
          minutes: number
          player_id: string
          plus_minus: number
          points: number
          rebounds: number
          starter?: boolean
          steals: number
          three_pa: number
          three_pm: number
          turnovers: number
          updated_at?: string
        }
        Update: {
          assists?: number
          blocks?: number
          created_at?: string
          fga?: number
          fgm?: number
          fouls?: number
          fta?: number
          ftm?: number
          game_id?: string
          id?: string
          minutes?: number
          player_id?: string
          plus_minus?: number
          points?: number
          rebounds?: number
          starter?: boolean
          steals?: number
          three_pa?: number
          three_pm?: number
          turnovers?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_game_stats_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_game_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          active: boolean
          created_at: string
          full_name: string
          height: number
          id: string
          position: Database["public"]["Enums"]["player_position"]
          team_id: string
          updated_at: string
          weight: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          full_name: string
          height: number
          id: string
          position: Database["public"]["Enums"]["player_position"]
          team_id: string
          updated_at?: string
          weight: number
        }
        Update: {
          active?: boolean
          created_at?: string
          full_name?: string
          height?: number
          id?: string
          position?: Database["public"]["Enums"]["player_position"]
          team_id?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      prop_lines: {
        Row: {
          created_at: string
          id: string
          line: number
          over_odds: number
          player_id: string
          projection: number
          stat_type: Database["public"]["Enums"]["stat_type"]
          under_odds: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          line: number
          over_odds: number
          player_id: string
          projection: number
          stat_type: Database["public"]["Enums"]["stat_type"]
          under_odds: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          line?: number
          over_odds?: number
          player_id?: string
          projection?: number
          stat_type?: Database["public"]["Enums"]["stat_type"]
          under_odds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prop_lines_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          end_date: string
          id: string
          label: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id: string
          label: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          label?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          abbreviation: string
          conference: Database["public"]["Enums"]["conference"]
          created_at: string
          division: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          abbreviation: string
          conference: Database["public"]["Enums"]["conference"]
          created_at?: string
          division: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          abbreviation?: string
          conference?: Database["public"]["Enums"]["conference"]
          created_at?: string
          division?: string
          id?: string
          name?: string
          updated_at?: string
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
      conference: "EASTERN" | "WESTERN"
      game_status: "SCHEDULED" | "FINAL" | "POSTPONED"
      game_type: "REGULAR_SEASON" | "PLAYOFFS"
      injury_status: "OUT" | "DOUBTFUL" | "QUESTIONABLE" | "PROBABLE" | "ACTIVE"
      lineup_confirmation: "EXPECTED" | "CONFIRMED"
      lineup_role: "STARTER" | "BENCH" | "OUT"
      player_position: "PG" | "SG" | "SF" | "PF" | "C"
      stat_type:
        | "POINTS"
        | "REBOUNDS"
        | "ASSISTS"
        | "THREES_MADE"
        | "STEALS"
        | "BLOCKS"
        | "TURNOVERS"
        | "PTS_REB"
        | "PTS_AST"
        | "REB_AST"
        | "PTS_REB_AST"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      conference: ["EASTERN", "WESTERN"],
      game_status: ["SCHEDULED", "FINAL", "POSTPONED"],
      game_type: ["REGULAR_SEASON", "PLAYOFFS"],
      injury_status: ["OUT", "DOUBTFUL", "QUESTIONABLE", "PROBABLE", "ACTIVE"],
      lineup_confirmation: ["EXPECTED", "CONFIRMED"],
      lineup_role: ["STARTER", "BENCH", "OUT"],
      player_position: ["PG", "SG", "SF", "PF", "C"],
      stat_type: [
        "POINTS",
        "REBOUNDS",
        "ASSISTS",
        "THREES_MADE",
        "STEALS",
        "BLOCKS",
        "TURNOVERS",
        "PTS_REB",
        "PTS_AST",
        "REB_AST",
        "PTS_REB_AST",
      ],
    },
  },
} as const

