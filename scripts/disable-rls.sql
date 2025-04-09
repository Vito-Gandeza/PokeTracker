-- Disable Row Level Security for the cards table
ALTER TABLE cards DISABLE ROW LEVEL SECURITY;

-- Grant all privileges on the cards table to the anon role
GRANT ALL PRIVILEGES ON TABLE cards TO anon;
GRANT ALL PRIVILEGES ON TABLE cards TO authenticated;
GRANT ALL PRIVILEGES ON TABLE cards TO service_role;

-- Grant usage on the id sequence to anon role
GRANT USAGE, SELECT ON SEQUENCE cards_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE cards_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE cards_id_seq TO service_role;
