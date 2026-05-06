export type GeneratedBy = "generate2dmap" | "generate2dsprite" | "manual";

export type BackgroundAsset = {
  id: string;
  src: string;
  generatedBy: GeneratedBy;
  style: "topdown_route" | "world_scene";
  notes: string;
};

export type SpritePreset = {
  id: string;
  label: string;
  generatedBy: GeneratedBy;
  assetType:
    | "player"
    | "npc"
    | "creature"
    | "prop"
    | "fx";
  view: "topdown" | "side" | "3/4";
  bundle: "single_asset" | "unit_bundle" | "hero_action_bundle";
  sheet: "2x2" | "2x3" | "4x4";
  anchor: "center" | "feet";
  outputDir: string;
  notes: string;
};

export const LOGIN_BACKGROUND: BackgroundAsset = {
  id: "login-route-topdown-v1",
  src: "/assets/maps/login-route-topdown-v1.svg",
  generatedBy: "generate2dmap",
  style: "topdown_route",
  notes:
    "Temporary route-map background for the login screen. Replace with future generated map exports instead of editing layout code.",
};

export const SPRITE_PRESETS: SpritePreset[] = [
  {
    id: "player-topdown-core",
    label: "Player Topdown Core",
    generatedBy: "generate2dsprite",
    assetType: "player",
    view: "topdown",
    bundle: "hero_action_bundle",
    sheet: "4x4",
    anchor: "feet",
    outputDir: "/assets/sprites/player",
    notes:
      "Primary controllable hero set. Start with 4-direction walk, then extend with idle, hurt, and interact sheets.",
  },
  {
    id: "npc-topdown-core",
    label: "NPC Topdown Core",
    generatedBy: "generate2dsprite",
    assetType: "npc",
    view: "topdown",
    bundle: "unit_bundle",
    sheet: "2x2",
    anchor: "feet",
    outputDir: "/assets/sprites/npc",
    notes:
      "Conversation NPCs and recurring characters. Keep silhouettes simple and readable against route-map backgrounds.",
  },
  {
    id: "portrait-topdown-dialog",
    label: "Dialog Portrait",
    generatedBy: "generate2dsprite",
    assetType: "player",
    view: "3/4",
    bundle: "single_asset",
    sheet: "2x2",
    anchor: "center",
    outputDir: "/assets/sprites/portraits",
    notes:
      "Optional portrait or bust sheet for dialogue UI. Use only after core overworld sprites are stable.",
  },
  {
    id: "route-props-topdown",
    label: "Route Props",
    generatedBy: "generate2dsprite",
    assetType: "prop",
    view: "topdown",
    bundle: "single_asset",
    sheet: "2x2",
    anchor: "feet",
    outputDir: "/assets/sprites/props",
    notes:
      "Reusable signs, rocks, flowers, fences, and interactable route objects that should match the generated maps.",
  },
];
