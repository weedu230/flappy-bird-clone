/*
  # Create high scores table

  1. New Tables
    - `high_scores`
      - `id` (uuid, primary key)
      - `player_name` (text, player's name)
      - `score` (integer, player's score)
      - `created_at` (timestamp, when score was achieved)

  2. Security
    - Enable RLS on `high_scores` table
    - Add policy for anyone to read scores (public leaderboard)
    - Add policy for anyone to insert scores (allow score submission)
*/

CREATE TABLE IF NOT EXISTS high_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read high scores (public leaderboard)
CREATE POLICY "Anyone can read high scores"
  ON high_scores
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to insert high scores
CREATE POLICY "Anyone can insert high scores"
  ON high_scores
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create index for faster score queries
CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_created_at ON high_scores(created_at DESC);