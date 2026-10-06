// SHARED TYPES FOR THE ROOM SCENE
// Types describe the "shape" of data so TypeScript can warn us about mistakes.
// The project rules ask us to keep types in this ./app/types folder.

// A position or size in 3D space: [x, y, z]
export type Vec3 = [number, number, number];

// A finish (surface material) an architect might choose for a floor or wall
export type Finish = {
  name: string;      // Human-readable name shown on screen, e.g. "Oak"
  color: string;     // Hex color code, e.g. "#c8a27a"
  roughness: number; // 0 = mirror-shiny, 1 = completely matte
};

// Props shared by every clickable object in the room.
// onHover lets the object tell the page what the mouse is pointing at,
// so the page can show a hint like "Door — click to open".
export type HoverProps = {
  onHover: (label: string | null) => void;
};

// Props for the whole Room component
export type RoomProps = HoverProps & {
  isNight: boolean; // true = night lighting, false = daytime sun
};
