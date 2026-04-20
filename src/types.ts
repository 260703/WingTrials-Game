export interface PipeData {
  id: number;
  x: number;
  topHeight: number;
  passed: boolean;
}

export interface MapData {
  id: string;
  creator_id: string;
  name: string;
  visibility: 'local' | 'global';
  thumbnail_url?: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | 'insane';
  pipes_data: PipeData[];
  created_at?: string;
}
