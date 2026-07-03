import type { CharacterId, DialogueArea, LinePack } from "../types";
import { luffyPlanner } from "./luffy.planner";
import { luffyLibrary } from "./luffy.library";
import { stevePlanner } from "./steve.planner";
import { steveLibrary } from "./steve.library";
import { percyPlanner } from "./percy.planner";
import { percyLibrary } from "./percy.library";

const REGISTRY: Record<CharacterId, Record<DialogueArea, LinePack>> = {
  luffy: { planner: luffyPlanner, library: luffyLibrary },
  steve: { planner: stevePlanner, library: steveLibrary },
  percy: { planner: percyPlanner, library: percyLibrary },
};

export function getLinePack(character: CharacterId, area: DialogueArea): LinePack {
  return REGISTRY[character][area];
}
