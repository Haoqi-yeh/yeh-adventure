-- PADNE Initial Schema
-- 執行於 Supabase SQL Editor 或 psql

-- 啟用 UUID 擴充
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enum Types ───────────────────────────────────────────────────────────────

CREATE TYPE world_type AS ENUM ('xian_xia', 'campus', 'apocalypse', 'adult', 'custom');
CREATE TYPE weather_type AS ENUM ('clear', 'rain', 'fog', 'thunder');
CREATE TYPE time_of_day AS ENUM ('dawn', 'morning', 'noon', 'dusk', 'night');
CREATE TYPE npc_relation AS ENUM ('neutral', 'friendly', 'romantic', 'hostile', 'vendetta');
CREATE TYPE adventure_status AS ENUM ('active', 'completed', 'dead');

-- ─── Players ──────────────────────────────────────────────────────────────────

CREATE TABLE players (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username    VARCHAR(64) UNIQUE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Adventures ───────────────────────────────────────────────────────────────

CREATE TABLE adventures (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id           UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    world_type          world_type NOT NULL DEFAULT 'campus',
    status              adventure_status NOT NULL DEFAULT 'active',
    generation          INTEGER DEFAULT 1,

    -- 通用屬性
    hp                  INTEGER DEFAULT 100,
    hp_max              INTEGER DEFAULT 100,
    mp                  INTEGER DEFAULT 100,
    mp_max              INTEGER DEFAULT 100,
    stamina             INTEGER DEFAULT 100,
    stress              INTEGER DEFAULT 0,
    charisma            INTEGER DEFAULT 10,

    -- 動態世界觀屬性
    world_attributes    JSONB DEFAULT '{}',

    -- 技能與標籤
    skills              JSONB DEFAULT '[]',
    personality_tags    JSONB DEFAULT '[]',

    -- 時間與環境
    tick                INTEGER DEFAULT 0,
    time_of_day         time_of_day DEFAULT 'morning',
    weather             weather_type DEFAULT 'clear',
    location            VARCHAR(128) DEFAULT '起始之地',

    -- 敘事記憶
    narrative_summary   TEXT DEFAULT '',

    -- 傳承修正
    legacy_modifiers    JSONB DEFAULT '{}',

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ix_adventures_player_id ON adventures(player_id);

-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_adventures_updated_at
    BEFORE UPDATE ON adventures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── NPC Cache ────────────────────────────────────────────────────────────────

CREATE TABLE npc_cache (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id               UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    name                    VARCHAR(64) NOT NULL,
    archetype               VARCHAR(64) DEFAULT '',
    last_affection          INTEGER DEFAULT 0,
    last_relation           npc_relation DEFAULT 'neutral',
    cumulative_memory       JSONB DEFAULT '[]',
    appearance_count        INTEGER DEFAULT 0,
    last_seen_generation    INTEGER DEFAULT 1,
    personality             JSONB DEFAULT '{}',
    CONSTRAINT uq_npc_cache_player_name UNIQUE (player_id, name)
);

-- ─── NPC States ───────────────────────────────────────────────────────────────

CREATE TABLE npc_states (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adventure_id    UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
    npc_cache_id    UUID REFERENCES npc_cache(id) ON DELETE SET NULL,
    name            VARCHAR(64) NOT NULL,
    archetype       VARCHAR(64) DEFAULT '',
    affection       INTEGER DEFAULT 0 CHECK (affection BETWEEN -100 AND 100),
    relation        npc_relation DEFAULT 'neutral',
    is_alive        BOOLEAN DEFAULT TRUE,
    memory_log      JSONB DEFAULT '[]',
    personality     JSONB DEFAULT '{}'
);

CREATE INDEX ix_npc_states_adventure_name ON npc_states(adventure_id, name);

-- ─── Legacy Pool ──────────────────────────────────────────────────────────────

CREATE TABLE legacy_pool (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id               UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    source_adventure_id     UUID NOT NULL REFERENCES adventures(id),
    generation              INTEGER NOT NULL,
    world_type              world_type NOT NULL,
    personality_tags        JSONB DEFAULT '[]',
    inherited_skills        JSONB DEFAULT '[]',
    affection_modifiers     JSONB DEFAULT '{}',
    special_abilities       JSONB DEFAULT '[]',
    death_cause             VARCHAR(256) DEFAULT '',
    final_narrative         TEXT DEFAULT '',
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ix_legacy_pool_player_id ON legacy_pool(player_id);

-- ─── Event Logs ───────────────────────────────────────────────────────────────

CREATE TABLE event_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adventure_id        UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
    tick                INTEGER NOT NULL,
    event_type          VARCHAR(64) NOT NULL,
    player_input        TEXT DEFAULT '',
    choices_presented   JSONB DEFAULT '[]',
    choice_made         INTEGER,
    dice_result         JSONB,
    narrative_output    TEXT DEFAULT '',
    state_snapshot      JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ix_event_logs_adventure_tick ON event_logs(adventure_id, tick);

-- ─── Row Level Security (Supabase) ────────────────────────────────────────────

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;
