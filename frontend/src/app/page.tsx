"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowUp, Dices, RotateCcw, Sparkles } from "lucide-react";
import { createInitialAdventure } from "@/lib/adventure/engine";
import type { AdventureResponse, AdventureState, Destiny, Gender, Origin } from "@/lib/adventure/types";

const GENDERS: { id: Gender; title: string; subtitle: string }[] = [
  { id: "male", title: "男修", subtitle: "名入江湖，劍氣未成" },
  { id: "female", title: "女修", subtitle: "袖藏鋒芒，心有乾坤" },
  { id: "unspecified", title: "不拘", subtitle: "此身由故事定義" },
];

const ORIGINS: { id: Origin; title: string; subtitle: string }[] = [
  { id: "wandering", title: "江湖散修", subtitle: "無門無派，自尋仙路" },
  { id: "fallen_clan", title: "沒落世家", subtitle: "祖上有名，今日無人" },
  { id: "outer_disciple", title: "宗門外門", subtitle: "低處起步，藏經三年" },
  { id: "hidden_bloodline", title: "隱脈遺孤", subtitle: "血脈未醒，追殺已至" },
];

const DESTINIES: { id: Destiny; title: string; subtitle: string }[] = [
  { id: "sword", title: "劍修", subtitle: "一劍破局，快意恩仇" },
  { id: "alchemy", title: "丹道", subtitle: "草木入爐，命可重煉" },
  { id: "formation", title: "陣法", subtitle: "借天地勢，困敵護身" },
  { id: "beast_taming", title: "御獸", subtitle: "山海異獸，同行同命" },
];

const RANDOM_NAMES = [
  "葉青玄",
  "沈照夜",
  "柳扶風",
  "秦問舟",
  "顧雲歸",
  "謝聽雪",
  "林照微",
  "陸懷真",
];

export default function Home() {
  const [name, setName] = useState("");
  const [premise, setPremise] = useState("");
  const [gender, setGender] = useState<Gender>("unspecified");
  const [origin, setOrigin] = useState<Origin>("wandering");
  const [destiny, setDestiny] = useState<Destiny>("sword");
  const [state, setState] = useState<AdventureState | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestStory = useMemo(() => state?.entries.slice(-8) ?? [], [state]);

  function startAdventure(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setState(createInitialAdventure({ name, premise, gender, origin, destiny }));
  }

  function rollName() {
    const currentIndex = RANDOM_NAMES.indexOf(name);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % RANDOM_NAMES.length : Math.floor(Math.random() * RANDOM_NAMES.length);
    setName(RANDOM_NAMES[nextIndex]);
  }

  async function sendAction(action: string) {
    if (!state || !action.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/adventure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, action }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "行動失敗" }));
        throw new Error(payload.error ?? "行動失敗");
      }

      const payload = (await response.json()) as AdventureResponse;
      setState(payload.state);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "行動失敗");
    } finally {
      setIsLoading(false);
    }
  }

  if (!state) {
    return (
      <main className="shell setup-shell">
        <section className="cover-panel">
          <div className="cover-art" aria-hidden="true">
            <div className="moon" />
            <div className="mountain mountain-back" />
            <div className="mountain mountain-front" />
            <div className="sword-mark" />
          </div>

          <div className="brand-row">
            <Sparkles size={18} />
            <span>Yeh Adventure 修仙篇</span>
          </div>

          <div className="setup-copy">
            <p className="eyebrow">Wuxia cultivation</p>
            <h1>你的仙路，從山門前一念開始。</h1>
            <p>
              先建立一位能進入故事的修行者。世界觀會在冒險中慢慢揭露，封面只保留足以開局的角色資訊。
            </p>
          </div>

          <form className="setup-form" onSubmit={startAdventure}>
            <label>
              姓名
              <div className="name-row">
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：葉青玄" />
                <button aria-label="隨機姓名" onClick={rollName} type="button">
                  <Dices size={18} />
                </button>
              </div>
            </label>

            <FieldGroup label="性別">
              <SegmentGrid>
                {GENDERS.map((item) => (
                  <OptionButton
                    isSelected={item.id === gender}
                    key={item.id}
                    onClick={() => setGender(item.id)}
                    subtitle={item.subtitle}
                    title={item.title}
                  />
                ))}
              </SegmentGrid>
            </FieldGroup>

            <label>
              角色補充資訊
              <textarea
                value={premise}
                onChange={(event) => setPremise(event.target.value)}
                placeholder="例如：表面是藥鋪學徒，其實能聽見劍靈說話。也可以寫性格、弱點、仇家、想追求的道。"
                rows={5}
              />
            </label>

            <FieldGroup label="開局出身">
              <CardGrid>
                {ORIGINS.map((item) => (
                  <OptionButton
                    isSelected={item.id === origin}
                    key={item.id}
                    onClick={() => setOrigin(item.id)}
                    subtitle={item.subtitle}
                    title={item.title}
                  />
                ))}
              </CardGrid>
            </FieldGroup>

            <FieldGroup label="修行傾向">
              <CardGrid>
                {DESTINIES.map((item) => (
                  <OptionButton
                    isSelected={item.id === destiny}
                    key={item.id}
                    onClick={() => setDestiny(item.id)}
                    subtitle={item.subtitle}
                    title={item.title}
                  />
                ))}
              </CardGrid>
            </FieldGroup>

            <button className="primary-action" type="submit">
              踏入山門
              <ArrowUp size={16} />
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="shell game-shell">
      <aside className="status-rail">
        <div>
          <p className="eyebrow">Turn {state.turn}</p>
          <h2>{state.profile.name}</h2>
          <span>{state.location}</span>
        </div>

        <div className="stat-list">
          <Stat label="專注" value={state.stats.focus} />
          <Stat label="膽識" value={state.stats.nerve} />
          <Stat label="運氣" value={state.stats.luck} />
        </div>

        <div className="memory-box">
          <p className="eyebrow">Memory</p>
          {state.memory.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>

        <button className="quiet-action" onClick={() => setState(null)} type="button">
          <RotateCcw size={15} />
          重新開始
        </button>
      </aside>

      <section className="story-stage">
        <div className="story-header">
          <p className="eyebrow">{state.mood}</p>
          <h1>故事正在回應你</h1>
        </div>

        <div className="story-log">
          {latestStory.map((entry) => (
            <article className={`story-entry ${entry.speaker}`} key={entry.id}>
              <span>{entry.speaker === "player" ? "你" : entry.speaker === "system" ? "系統" : "敘事"}</span>
              <p>{entry.text}</p>
            </article>
          ))}
        </div>

        <div className="choice-row">
          {state.choices.map((choice) => (
            <button key={choice.id} onClick={() => sendAction(choice.intent)} type="button">
              {choice.label}
            </button>
          ))}
        </div>

        <form
          className="action-form"
          onSubmit={(event) => {
            event.preventDefault();
            void sendAction(input);
          }}
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="直接輸入你想做的事。"
            rows={3}
          />
          <button disabled={isLoading || !input.trim()} type="submit">
            {isLoading ? "生成中" : "送出"}
          </button>
        </form>

        {error ? <p className="error-text">{error}</p> : null}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="stat-track">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function FieldGroup({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="field-group">
      <span>{label}</span>
      {children}
    </div>
  );
}

function SegmentGrid({ children }: { children: React.ReactNode }) {
  return <div className="segment-grid">{children}</div>;
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="card-grid">{children}</div>;
}

function OptionButton({
  isSelected,
  onClick,
  subtitle,
  title,
}: {
  isSelected: boolean;
  onClick: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <button className={isSelected ? "choice-card selected" : "choice-card"} onClick={onClick} type="button">
      <strong>{title}</strong>
      <span>{subtitle}</span>
    </button>
  );
}
