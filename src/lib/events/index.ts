import { registerEventHandlers } from "./handlers";

// Register handlers on first import — safe to call multiple times
registerEventHandlers();

export { emitEvent, on } from "./emitter";
export type { EventType, EventPayloads, EventEnvelope } from "./emitter";
