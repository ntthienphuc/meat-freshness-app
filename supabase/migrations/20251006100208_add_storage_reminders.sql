/*
  # Add Storage Reminders System

  ## Description
  Add storage reminders and improved search functionality

  ## New Tables

  ### `meat_storage_reminders`
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References user_profiles
  - `detection_id` (uuid) - References detection_history
  - `meat_type` (text) - Type of meat
  - `storage_date` (timestamptz) - When stored
  - `freshness_level` (int) - Initial freshness (1-5)
  - `storage_temp` (text) - Recommended temperature
  - `estimated_days` (int) - Days until should use
  - `reminder_sent` (boolean) - Has reminder been sent
  - `used_date` (timestamptz) - When marked as used
  - `notes` (text) - User notes
  - `created_at` (timestamptz)

  ### `search_queries`
  - `id` (uuid, primary key)
  - `user_id` (uuid, nullable) - User who searched
  - `query` (text) - Search query
  - `result_count` (int) - Number of results
  - `clicked_result` (text) - What they clicked
  - `searched_at` (timestamptz)

  ### `popular_questions`
  - `id` (uuid, primary key)
  - `question` (text) - Question text
  - `answer` (text) - Answer text
  - `tags` (text[]) - Array of tags
  - `view_count` (int) - How many views
  - `helpful_count` (int) - Helpful votes
  - `related_articles` (jsonb) - Related blog/dictionary links
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all new tables
  - Users can only access their own reminders
  - Search queries can be anonymous
  - Popular questions are public read
*/

-- Create meat_storage_reminders table
CREATE TABLE IF NOT EXISTS meat_storage_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  detection_id uuid REFERENCES detection_history(id) ON DELETE SET NULL,
  meat_type text NOT NULL,
  storage_date timestamptz DEFAULT now(),
  freshness_level int NOT NULL CHECK (freshness_level BETWEEN 1 AND 5),
  storage_temp text DEFAULT '2-4°C',
  estimated_days int DEFAULT 3,
  reminder_sent boolean DEFAULT false,
  used_date timestamptz,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create search_queries table
CREATE TABLE IF NOT EXISTS search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  query text NOT NULL,
  result_count int DEFAULT 0,
  clicked_result text DEFAULT '',
  searched_at timestamptz DEFAULT now()
);

-- Create popular_questions table
CREATE TABLE IF NOT EXISTS popular_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  tags text[] DEFAULT '{}',
  view_count int DEFAULT 0,
  helpful_count int DEFAULT 0,
  related_articles jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE meat_storage_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_questions ENABLE ROW LEVEL SECURITY;

-- Policies for meat_storage_reminders
CREATE POLICY "Users can view own storage reminders"
  ON meat_storage_reminders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own storage reminders"
  ON meat_storage_reminders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own storage reminders"
  ON meat_storage_reminders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own storage reminders"
  ON meat_storage_reminders FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for search_queries (allow anonymous)
CREATE POLICY "Anyone can insert search queries"
  ON search_queries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view own search queries"
  ON search_queries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Policies for popular_questions (public read)
CREATE POLICY "Anyone can view popular questions"
  ON popular_questions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert popular questions"
  ON popular_questions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update popular questions"
  ON popular_questions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_storage_reminders_user_id ON meat_storage_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_reminders_storage_date ON meat_storage_reminders(storage_date);
CREATE INDEX IF NOT EXISTS idx_storage_reminders_used_date ON meat_storage_reminders(used_date);
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_date ON search_queries(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_popular_questions_views ON popular_questions(view_count DESC);

-- Trigger for updated_at on popular_questions
CREATE TRIGGER update_popular_questions_updated_at
  BEFORE UPDATE ON popular_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some default popular questions
INSERT INTO popular_questions (question, answer, tags, related_articles) VALUES
  (
    'Làm sao biết thịt còn tươi?',
    'Thịt tươi có màu sắc tự nhiên (heo: hồng nhạt, bò: đỏ tươi, gà: hồng trắng), không có mùi hôi, bề mặt khô ráo không nhớt, khi ấn vào có độ đàn hồi tốt.',
    ARRAY['độ tươi', 'nhận biết', 'thịt tươi'],
    '[{"type": "blog", "id": "blog_1", "title": "5 cách nhận biết thịt tươi"}, {"type": "dictionary", "id": "pork", "title": "Từ điển thịt heo"}]'
  ),
  (
    'Thịt để tủ lạnh được bao lâu?',
    'Thịt tươi trong ngăn mát: 2-3 ngày. Thịt trong ngăn đá: 3-6 tháng (heo/bò), 1-3 tháng (gà). Nhiệt độ lý tưởng: 0-4°C (ngăn mát), -18°C (ngăn đá).',
    ARRAY['bảo quản', 'tủ lạnh', 'thời gian'],
    '[{"type": "blog", "id": "blog_3", "title": "Hướng dẫn bảo quản thịt"}]'
  ),
  (
    'Thịt đổi màu có ăn được không?',
    'Thịt chuyển xám xanh hoặc có mùi hôi: KHÔNG ăn. Thịt hơi sẫm màu nhưng không mùi: có thể dùng ngay. Khi nghi ngờ, hãy vứt bỏ để an toàn.',
    ARRAY['màu sắc', 'an toàn', 'đổi màu'],
    '[{"type": "blog", "id": "blog_2", "title": "Dấu hiệu thịt hỏng"}]'
  ),
  (
    'Rã đông thịt đúng cách?',
    'Tốt nhất: chuyển từ ngăn đá sang ngăn mát 1 đêm. Nhanh hơn: ngâm nước lạnh (đổi nước 30 phút/lần). KHÔNG rã đông ở nhiệt độ phòng!',
    ARRAY['rã đông', 'bảo quản', 'mẹo'],
    '[{"type": "blog", "id": "blog_5", "title": "Mẹo rã đông thịt"}]'
  ),
  (
    'App này hoạt động như thế nào?',
    'App sử dụng AI (Deep Learning) để phân tích hình ảnh thịt và đánh giá độ tươi. Độ chính xác: ~95%. Kết quả cho 5 cấp độ từ "Rất tươi" đến "Đã hỏng".',
    ARRAY['ai', 'cách hoạt động', 'độ chính xác'],
    '[{"type": "blog", "id": "blog_10", "title": "Công nghệ AI phát hiện thịt"}]'
  )
ON CONFLICT DO NOTHING;