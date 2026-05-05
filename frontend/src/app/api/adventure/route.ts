import { NextResponse } from "next/server";
import { advanceAdventure } from "@/lib/adventure/engine";
import type { AdventureRequest } from "@/lib/adventure/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AdventureRequest;

    if (!body.state || typeof body.action !== "string") {
      return NextResponse.json({ error: "Invalid adventure payload" }, { status: 400 });
    }

    return NextResponse.json({ state: advanceAdventure(body) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
