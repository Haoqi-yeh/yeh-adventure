-- PADNE Schema - 貼到 Supabase SQL Editor 執行
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE world_type      AS ENUM ('xian_xia','campus','apocalypse','adult','custom');
CREATE TYPE weather_type    AS ENUM ('clear','rain','fog','thunder');
CREATE TYPE time_of_day     AS ENUM ('dawn','morning','noon','dusk','night');
CREATE TYPE npc_relation    AS ENUM ('neutral','friendly','romantic','hostile','vendetta');
CREATE TYPE adventure_status AS ENUM ('active','completed','dead');

CREATE TABLE players (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username   VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE adventures (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id           UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    world_type          world_type NOT NULL DEFAULT 'campus',
    status              adventure_status NOT NULL DEFAULT 'active',
    generation          INTEGER DEFAULT 1,
    hp                  INTEGER DEFAULT 100,
    hp_max              INTEGER DEFAULT 100,
    mp                  INTEGER DEFAULT 100,
    mp_max              INTEGER DEFAULT 100,
    stamina             INTEGER DEFAULT 100,
    stress              INTEGER DEFAULT 0,
    charisma            INTEGER DEFAULT 10,
    world_attributes    JSONB DEFAULT '{}',
    skills              JSONB DEFAULT '[]',
    personality_tags    JSONB DEFAULT '[]',
    tick                INTEGER DEFAULT 0,
    time_of_day         time_of_day DEFAULT 'morning',
    weather             weather_type DEFAULT 'clear',
    location            VARCHAR(128) DEFAULT '起始之地',
    narrative_summary   TEXT DEFAULT '',
    legacy_modifiers    JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE npc_cache (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id            UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    name                 VARCHAR(64) NOT NULL,
    archetype            VARCHAR(64) DEFAULT '',
    last_affection       INTEGER DEFAULT 0,
    last_relation        npc_relation DEFAULT 'neutral',
    cumulative_memory    JSONB DEFAULT '[]',
    appearance_count     INTEGER DEFAULT 0,
    last_seen_generation INTEGER DEFAULT 1,
    personality          JSONB DEFAULT '{}',
    CONSTRAINT uq_npc_cache_player_name UNIQUE (player_id, name)
);

CREATE TABLE npc_states (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
    npc_cache_id UUID REFERENCES npc_cache(id) ON DELETE SET NULL,
    name         VARCHAR(64) NOT NULL,
    archetype    VARCHAR(64) DEFAULT '',
    affection    INTEGER DEFAULT 0 CHECK (affection BETWEEN -100 AND 100),
    relation     npc_relation DEFAULT 'neutral',
    is_alive     BOOLEAN DEFAULT TRUE,
    memory_log   JSONB DEFAULT '[]',
    personality  JSONB DEFAULT '{}'
);

CREATE TABLE legacy_pool (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id           UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    source_adventure_id UUID NOT NULL REFERENCES adventures(id),
    generation          INTEGER NOT NULL,
    world_type          world_type NOT NULL,
    personality_tags    JSONB DEFAULT '[]',
    inherited_skills    JSONB DEFAULT '[]',
    affection_modifiers JSONB DEFAULT '{}',
    special_abilities   JSONB DEFAULT '[]',
    death_cause         VARCHAR(256) DEFAULT '',
    final_narrative     TEXT DEFAULT '',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_logs (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adventure_id      UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
    tick              INTEGER NOT NULL,
    event_type        VARCHAR(64) NOT NULL,
    player_input      TEXT DEFAULT '',
    choices_presented JSONB DEFAULT '[]',
    choice_made       INTEGER,
    dice_result       JSONB,
    narrative_output  TEXT DEFAULT '',
    state_snapshot    JSONB DEFAULT '{}',
    created_at        TIMESTAMPTZ DEFAULT NOW()
);
