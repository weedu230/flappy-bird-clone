import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database functions for high scores
export async function saveHighScore(playerName, score) {
  try {
    const { data, error } = await supabase
      .from('high_scores')
      .insert([
        { player_name: playerName, score: score }
      ]);
    
    if (error) {
      console.error('Error saving high score:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving high score:', error);
    return false;
  }
}

export async function getHighScores(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('high_scores')
      .select('*')
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching high scores:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching high scores:', error);
    return [];
  }
}