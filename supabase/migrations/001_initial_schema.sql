-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS session_images;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS campaign_players;
DROP TABLE IF EXISTS campaigns;

-- Drop existing types if they exist
DROP TYPE IF EXISTS campaign_status;
DROP TYPE IF EXISTS player_role;

-- Create enum types
CREATE TYPE campaign_status AS ENUM ('em_andamento', 'hiato', 'concluido');
CREATE TYPE player_role AS ENUM ('master', 'player');

-- Create campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    system TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    max_players INTEGER NOT NULL,
    status campaign_status DEFAULT 'em_andamento' NOT NULL,
    master_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    world_story TEXT,
    invite_code TEXT UNIQUE NOT NULL
);

-- Create campaign_players table
CREATE TABLE campaign_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role player_role NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(campaign_id, user_id)
);

-- Create sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    session_date TIMESTAMP WITH TIME ZONE NOT NULL,
    report TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create session_images table
CREATE TABLE session_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies for campaigns
CREATE POLICY "Anyone can view campaigns" ON campaigns
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Master can manage campaigns" ON campaigns
    FOR ALL USING (master_id = auth.uid());

-- Create policies for campaign_players
CREATE POLICY "Players can view their campaigns" ON campaign_players
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Master can manage players" ON campaign_players
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM campaigns 
            WHERE campaigns.id = campaign_players.campaign_id 
            AND campaigns.master_id = auth.uid()
        )
    );

-- Create policies for sessions
CREATE POLICY "Players can view sessions" ON sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaign_players 
            WHERE campaign_players.campaign_id = sessions.campaign_id 
            AND campaign_players.user_id = auth.uid()
        )
    );

CREATE POLICY "Master can manage sessions" ON sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM campaigns 
            WHERE campaigns.id = sessions.campaign_id 
            AND campaigns.master_id = auth.uid()
        )
    );

-- Create policies for session_images
CREATE POLICY "Players can view images" ON session_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions 
            JOIN campaign_players ON campaign_players.campaign_id = sessions.campaign_id 
            WHERE sessions.id = session_images.session_id 
            AND campaign_players.user_id = auth.uid()
        )
    );

CREATE POLICY "Master can manage images" ON session_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sessions 
            JOIN campaigns ON campaigns.id = sessions.campaign_id 
            WHERE sessions.id = session_images.session_id 
            AND campaigns.master_id = auth.uid()
        )
    );

-- Create policies for notes
CREATE POLICY "Users can view own private notes" ON notes
    FOR SELECT USING (
        user_id = auth.uid() AND is_private = true
    );

CREATE POLICY "Users can view public notes" ON notes
    FOR SELECT USING (
        is_private = false AND (
            EXISTS (
                SELECT 1 FROM campaign_players 
                WHERE campaign_players.campaign_id = notes.campaign_id 
                AND campaign_players.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage own notes" ON notes
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Master can delete public notes" ON notes
    FOR DELETE USING (
        is_private = false AND 
        EXISTS (
            SELECT 1 FROM campaigns 
            WHERE campaigns.id = notes.campaign_id 
            AND campaigns.master_id = auth.uid()
        )
    );

-- Create function to generate invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TRIGGER AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    NEW.invite_code := result;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate invite code
DROP TRIGGER IF EXISTS set_invite_code ON campaigns;
CREATE TRIGGER set_invite_code
    BEFORE INSERT ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION generate_invite_code(); 