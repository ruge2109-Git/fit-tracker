-- Create AI Reports table for weekly summaries and plateau analysis
CREATE TYPE ai_report_type AS ENUM ('weekly_summary', 'plateau_alert', 'achievement');

CREATE TABLE ai_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type ai_report_type NOT NULL,
  content JSONB NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL, -- Optional: for plateau alerts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL
);

-- Enable RLS
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own reports" 
  ON ai_reports FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports (to mark as read)" 
  ON ai_reports FOR UPDATE 
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_ai_reports_user_id ON ai_reports(user_id);
CREATE INDEX idx_ai_reports_type ON ai_reports(type);
