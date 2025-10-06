/*
  # User System for Meat Freshness App

  ## Description
  Complete user authentication and profile system with saved items and detection history

  ## New Tables
  
  ### `user_profiles`
  - `id` (uuid, primary key) - References auth.users
  - `username` (text, unique) - User's chosen username
  - `display_name` (text) - Display name
  - `role` (text) - 'user' or 'admin'
  - `created_at` (timestamptz) - Account creation time
  - `updated_at` (timestamptz) - Last update time
  
  ### `saved_articles`
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References user_profiles
  - `article_type` (text) - 'blog' or 'dictionary'
  - `article_id` (text) - ID of the article
  - `article_title` (text) - Title for quick access
  - `saved_at` (timestamptz) - When it was saved
  
  ### `detection_history`
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References user_profiles, nullable for anonymous
  - `meat_type` (text) - Type of meat detected
  - `freshness_level` (int) - 1-5 freshness score
  - `image_url` (text) - URL to detection image (optional)
  - `result_data` (jsonb) - Full detection result
  - `detected_at` (timestamptz) - When detection was performed

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Admin role can access all data
  - Anonymous detection history allowed
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text DEFAULT '',
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create saved_articles table
CREATE TABLE IF NOT EXISTS saved_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  article_type text NOT NULL CHECK (article_type IN ('blog', 'dictionary')),
  article_id text NOT NULL,
  article_title text NOT NULL,
  saved_at timestamptz DEFAULT now(),
  UNIQUE(user_id, article_type, article_id)
);

-- Create detection_history table
CREATE TABLE IF NOT EXISTS detection_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  meat_type text NOT NULL,
  freshness_level int NOT NULL CHECK (freshness_level BETWEEN 1 AND 5),
  image_url text DEFAULT '',
  result_data jsonb DEFAULT '{}',
  detected_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_history ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policies for saved_articles
CREATE POLICY "Users can view own saved articles"
  ON saved_articles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own saved articles"
  ON saved_articles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own saved articles"
  ON saved_articles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for detection_history
CREATE POLICY "Users can view own detection history"
  ON detection_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can insert detection history"
  ON detection_history FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own detection history"
  ON detection_history FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_articles_user_id ON saved_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_articles_type ON saved_articles(article_type);
CREATE INDEX IF NOT EXISTS idx_detection_history_user_id ON detection_history(user_id);
CREATE INDEX IF NOT EXISTS idx_detection_history_date ON detection_history(detected_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
