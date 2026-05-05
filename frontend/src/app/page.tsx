"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowUp, RotateCcw, Sparkles } from "lucide-react";
import { createInitialAdventure } from "@/lib/adventure/engine";
import type { AdventureResponse, AdventureState, WorldPreset } from "@/lib/adventure/types";

const WORLDS: { id: WorldPreset; title: string; subtitle: string }[] = [
  { id: "urban_fantasy", title: "台北異聞", subtitle: "日常邊緣冒出一點不合理" },
  { id: "xianxia", title: "現代修真", subtitle: "靈氣、代價、城市裡的修行者" },
  { id: "school_mystery", title: "校園怪談", subtitle: "鐘聲、規則、沒離開的人" },
  { id: "custom", title: "自訂世界", subtitle: "先用一句話把世界推開" },
];

export default function Home() {
  const [name, setName] = useState("");
  const [premise, setPremise] = useState("");
  const [world, setWorld] = useState<WorldPreset>("urban_fantasy");
  const [state, setState] = useState<AdventureState | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestStory = useMemo(() => state?.entries.slice(-8) ?? [], [state]);

  function startAdventure(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setState(createInitialAdventure({ name, premise, world }));
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
        <section className="setup-panel">
          <div className="brand-row">
            <Sparkles size={18} />
            <span>Yeh Adventure</span>
          </div>

          <div className="setup-copy">
            <p className="eyebrow">Clean rebuild</p>
            <h1>先從一個能長大的故事核心開始。</h1>
            <p>
              這個版本會先保留最重要的循環：建立角色、進入世界、輸入行動、得到下一段故事。
              之後再把記憶、NPC、擲骰、存檔和 AI 串接逐步接回來。
            </p>
          </div>

          <form className="setup-form" onSubmit={startAdventure}>
            <label>
              角色名字
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：葉河" />
            </label>

            <label>
              角色起點
              <textarea
                value={premise}
                onChange={(event) => setPremise(event.target.value)}
                placeholder="用一句話描述你想扮演的人，或你想遇到的開場。"
                rows={4}
              />
            </label>

            <div className="world-grid" role="radiogroup" aria-label="選擇世界">
              {WORLDS.map((item) => (
                <button
                  className={item.id === world ? "world-card selected" : "world-card"}
                  key={item.id}
                  onClick={() => setWorld(item.id)}
                  type="button"
                >
                  <strong>{item.title}</strong>
                  <span>{item.subtitle}</span>
                </button>
              ))}
            </div>

            <button className="primary-action" type="submit">
              開始冒險
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
