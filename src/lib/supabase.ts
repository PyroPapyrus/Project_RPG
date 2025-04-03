import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos do banco de dados
export type Database = {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string;
          name: string;
          description: string;
          system: string;
          created_at: string;
          max_players: number;
          status: 'em_andamento' | 'hiato' | 'concluido';
          master_id: string;
          world_story: string | null;
          invite_code: string;
        };
        Insert: Omit<Campaign, 'id' | 'created_at'>;
        Update: Partial<Campaign>;
      };
      campaign_players: {
        Row: {
          id: string;
          campaign_id: string;
          user_id: string;
          role: 'master' | 'player';
          joined_at: string;
        };
        Insert: Omit<CampaignPlayer, 'id' | 'joined_at'>;
        Update: Partial<CampaignPlayer>;
      };
      sessions: {
        Row: {
          id: string;
          campaign_id: string;
          name: string;
          description: string;
          session_date: string;
          report: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Session, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Session>;
      };
      session_images: {
        Row: {
          id: string;
          session_id: string;
          image_url: string;
          created_at: string;
        };
        Insert: Omit<SessionImage, 'id' | 'created_at'>;
        Update: Partial<SessionImage>;
      };
      notes: {
        Row: {
          id: string;
          title: string;
          content: string;
          is_private: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
          campaign_id: string | null;
          session_id: string | null;
        };
        Insert: Omit<Note, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Note>;
      };
    };
  };
};

// Interfaces para uso no frontend
export interface Campaign {
  id: string;
  name: string;
  description: string;
  system: string;
  created_at: string;
  max_players: number;
  status: 'em_andamento' | 'hiato' | 'concluido';
  master_id: string;
  world_story: string | null;
  invite_code: string;
}

export interface CampaignPlayer {
  id: string;
  campaign_id: string;
  user_id: string;
  role: 'master' | 'player';
  joined_at: string;
}

export interface Session {
  id: string;
  campaign_id: string;
  name: string;
  description: string;
  session_date: string;
  report: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionImage {
  id: string;
  session_id: string;
  image_url: string;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  campaign_id: string | null;
  session_id: string | null;
} 