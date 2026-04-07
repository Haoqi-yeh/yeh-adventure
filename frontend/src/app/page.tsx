"use client";
import { useGameStore } from "@/store/game-store";
import WorldSelector from "@/components/game/WorldSelector";
import NarrativeBox from "@/components/game/NarrativeBox";
import ChoicePanel from "@/components/game/ChoicePanel";
import StatusBar from "@/components/game/StatusBar";

export default function Home() {
  const { adventure } = useGameStore();

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        {!adventure ? (
          <WorldSelector />
        ) : (
          <>
            <StatusBar />
            <NarrativeBox />
            <ChoicePanel />
          </>
        )}
      </div>
    </main>
  );
}
