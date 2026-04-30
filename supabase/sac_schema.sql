-- SAC tickets table
CREATE TABLE IF NOT EXISTS sac_tickets (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  name         text        NOT NULL,
  email        text        NOT NULL,
  subject      text        NOT NULL DEFAULT 'outro',
  message      text        NOT NULL,
  status       text        NOT NULL DEFAULT 'open'
                           CHECK (status IN ('open', 'in_progress', 'closed')),
  admin_note   text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE sac_tickets ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can open a ticket
CREATE POLICY "sac_insert_public" ON sac_tickets
  FOR INSERT WITH CHECK (true);

-- Logged-in users can see their own tickets
CREATE POLICY "sac_select_own" ON sac_tickets
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can see and update all tickets
CREATE POLICY "sac_admin_select" ON sac_tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "sac_admin_update" ON sac_tickets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE INDEX idx_sac_email   ON sac_tickets(email);
CREATE INDEX idx_sac_status  ON sac_tickets(status);
CREATE INDEX idx_sac_created ON sac_tickets(created_at DESC);
