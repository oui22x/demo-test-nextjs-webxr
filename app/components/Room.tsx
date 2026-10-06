// ROOM COMPONENT
// A small interactive room, built like an architectural "section model":
// the front and right walls are cut away so we can look inside.
//
// Things you can click:
//   - Door        -> swings open / closed
//   - Window      -> roller blind goes up / down (watch the sunlight change!)
//   - Pendant lamp-> turns the light on / off
//   - Chairs      -> rotate 90 degrees
//   - Walls       -> cycle through paint colors
//   - Floor       -> cycle through floor finishes (oak, concrete, terrazzo...)
//
// Units: 1 unit = 1 meter. The room is 6m wide, 5m deep and 3m tall.
// The floor sits at y = 0.

'use client';

import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFResult } from '../types/gltf';
import { Finish, HoverProps, RoomProps, Vec3 } from '../types/room';

// ---------------------------------------------------------------------------
// ROOM DIMENSIONS (in meters) — change these to reshape the room
// ---------------------------------------------------------------------------
const WIDTH = 6;       // along the x-axis (left to right)
const DEPTH = 5;       // along the z-axis (back to front)
const HEIGHT = 3;      // along the y-axis (floor to ceiling)
const WALL = 0.15;     // wall thickness

// Handy edges of the room so we don't repeat the math everywhere
const LEFT = -WIDTH / 2;   // x = -3
const BACK = -DEPTH / 2;   // z = -2.5

// ---------------------------------------------------------------------------
// MATERIAL LIBRARIES — the options each click cycles through
// ---------------------------------------------------------------------------
const WALL_PAINTS: Finish[] = [
  { name: 'Gallery White', color: '#f2efe9', roughness: 0.9 },
  { name: 'Sage', color: '#b7c4a8', roughness: 0.9 },
  { name: 'Terracotta', color: '#c9765a', roughness: 0.9 },
  { name: 'Slate Blue', color: '#6f8196', roughness: 0.9 },
  { name: 'Charcoal', color: '#3b3b3e', roughness: 0.9 },
];

const FLOOR_FINISHES: Finish[] = [
  { name: 'Oak', color: '#b98a5e', roughness: 0.6 },
  { name: 'Polished Concrete', color: '#9a9a96', roughness: 0.25 },
  { name: 'Terrazzo', color: '#e3ddd2', roughness: 0.35 },
  { name: 'Walnut', color: '#5c3d2a', roughness: 0.55 },
];

// ---------------------------------------------------------------------------
// HELPER: hover handlers
// Returns the two functions every clickable object needs so that:
//  - the cursor turns into a pointing hand
//  - the page shows a hint describing what you can do
// e.stopPropagation() stops the event from also reaching objects behind it.
// ---------------------------------------------------------------------------
function hoverHandlers(label: string, onHover: HoverProps['onHover']) {
  return {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onHover(label);
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      onHover(null);
      document.body.style.cursor = 'default';
    },
  };
}

// ---------------------------------------------------------------------------
// HELPER: a simple box ("Block") — the Lego brick of this whole scene
// Almost everything here (walls, table, chairs) is made of boxes.
// ---------------------------------------------------------------------------
function Block({
  size,
  position,
  color = '#ffffff',
  roughness = 0.8,
}: {
  size: Vec3;
  position: Vec3;
  color?: string;
  roughness?: number;
}) {
  return (
    // castShadow: this box blocks light. receiveShadow: shadows can land on it.
    <mesh position={position} castShadow receiveShadow>
      {/* boxGeometry args = [width, height, depth] */}
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// FLOOR — click to change the finish
// ---------------------------------------------------------------------------
function Floor({ onHover }: HoverProps) {
  // useState remembers which finish we're on (an index into FLOOR_FINISHES)
  const [index, setIndex] = useState(0);
  const finish = FLOOR_FINISHES[index];

  return (
    <mesh
      // Planes are created standing up, so we rotate -90° (−π/2) to lay it flat
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        // % (modulo) wraps back to 0 after the last finish
        setIndex((index + 1) % FLOOR_FINISHES.length);
      }}
      {...hoverHandlers(`Floor: ${finish.name} — click to change finish`, onHover)}
    >
      <planeGeometry args={[WIDTH, DEPTH]} />
      <meshStandardMaterial color={finish.color} roughness={finish.roughness} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// BACK WALL with a window opening
// A wall with a hole is built from 4 boxes around the opening:
//
//    +--------------------------+
//    |           top            |
//    +------+==========+--------+
//    | left |  window  | right  |
//    +------+==========+--------+
//    |          bottom          |
//    +--------------------------+
// ---------------------------------------------------------------------------
const WIN_W = 2.4;       // window width
const WIN_BOTTOM = 0.9;  // sill height (from the floor)
const WIN_TOP = 2.3;     // head height

function BackWall({ onHover }: HoverProps) {
  const [index, setIndex] = useState(0);
  const paint = WALL_PAINTS[index];
  const z = BACK - WALL / 2; // centre of the wall's thickness
  const sideW = (WIDTH - WIN_W) / 2;
  const winH = WIN_TOP - WIN_BOTTOM;

  return (
    // A <group> bundles objects so one click handler covers all 4 pieces
    <group
      onClick={(e) => {
        e.stopPropagation();
        setIndex((index + 1) % WALL_PAINTS.length);
      }}
      {...hoverHandlers(`Back wall: ${paint.name} — click to repaint`, onHover)}
    >
      {/* bottom (below the sill) — slightly wider to close the corner */}
      <Block size={[WIDTH + WALL, WIN_BOTTOM, WALL]} position={[-WALL / 2, WIN_BOTTOM / 2, z]} color={paint.color} roughness={paint.roughness} />
      {/* top (above the window head) */}
      <Block size={[WIDTH + WALL, HEIGHT - WIN_TOP, WALL]} position={[-WALL / 2, (WIN_TOP + HEIGHT) / 2, z]} color={paint.color} roughness={paint.roughness} />
      {/* left of the window */}
      <Block size={[sideW + WALL, winH, WALL]} position={[LEFT + (sideW - WALL) / 2, (WIN_BOTTOM + WIN_TOP) / 2, z]} color={paint.color} roughness={paint.roughness} />
      {/* right of the window */}
      <Block size={[sideW, winH, WALL]} position={[WIN_W / 2 + sideW / 2, (WIN_BOTTOM + WIN_TOP) / 2, z]} color={paint.color} roughness={paint.roughness} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// WINDOW — glass, frame, and a roller blind you can raise and lower
// ---------------------------------------------------------------------------
function Window({ onHover }: HoverProps) {
  const [blindDown, setBlindDown] = useState(false);
  // useRef gives us direct access to the blind's 3D object so we can animate it
  const blindRef = useRef<THREE.Group>(null);
  const winH = WIN_TOP - WIN_BOTTOM;
  const centerY = (WIN_BOTTOM + WIN_TOP) / 2;
  const frameColor = '#2b2b2b';

  // useFrame runs ~60 times per second. We gently move the blind's
  // vertical scale toward its target (1 = fully down, 0.06 = rolled up).
  // THREE.MathUtils.damp gives a smooth, natural-feeling ease.
  useFrame((_, delta) => {
    if (!blindRef.current) return;
    const target = blindDown ? 1 : 0.06;
    blindRef.current.scale.y = THREE.MathUtils.damp(blindRef.current.scale.y, target, 6, delta);
  });

  const toggle = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setBlindDown(!blindDown);
  };
  const hover = hoverHandlers(`Window — click to ${blindDown ? 'raise' : 'lower'} the blind`, onHover);

  return (
    <group>
      {/* GLASS — a see-through pane. It does not cast shadows, so sunlight passes. */}
      <mesh position={[0, centerY, BACK - WALL / 2]} onClick={toggle} {...hover}>
        <planeGeometry args={[WIN_W, winH]} />
        <meshStandardMaterial color="#bfe3ff" transparent opacity={0.15} roughness={0.05} side={THREE.DoubleSide} />
      </mesh>

      {/* FRAME — thin dark boxes around the edge plus a centre mullion */}
      <Block size={[WIN_W, 0.05, 0.08]} position={[0, WIN_BOTTOM, BACK - WALL / 2]} color={frameColor} />
      <Block size={[WIN_W, 0.05, 0.08]} position={[0, WIN_TOP, BACK - WALL / 2]} color={frameColor} />
      <Block size={[0.05, winH, 0.08]} position={[-WIN_W / 2, centerY, BACK - WALL / 2]} color={frameColor} />
      <Block size={[0.05, winH, 0.08]} position={[WIN_W / 2, centerY, BACK - WALL / 2]} color={frameColor} />
      <Block size={[0.04, winH, 0.06]} position={[0, centerY, BACK - WALL / 2]} color={frameColor} />

      {/* WINDOW SILL — a little ledge sticking into the room */}
      <Block size={[WIN_W + 0.2, 0.04, 0.25]} position={[0, WIN_BOTTOM - 0.02, BACK + 0.1]} color="#e8e4dc" />

      {/* ROLLER BLIND
          The group sits at the TOP of the window. The fabric hangs DOWN from
          it (position y = -winH/2), so scaling the group shrinks it upward,
          just like a real roller blind. */}
      <group ref={blindRef} position={[0, WIN_TOP, BACK + 0.06]} scale={[1, 0.06, 1]}>
        <mesh position={[0, -winH / 2, 0]} castShadow onClick={toggle} {...hover}>
          <boxGeometry args={[WIN_W - 0.1, winH, 0.01]} />
          <meshStandardMaterial color="#efe6d2" roughness={1} />
        </mesh>
      </group>
      {/* the roll at the top */}
      <mesh position={[0, WIN_TOP - 0.03, BACK + 0.06]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, WIN_W - 0.05, 16]} />
        <meshStandardMaterial color="#d8cfbb" />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// LEFT WALL with a door opening, and the door itself
// ---------------------------------------------------------------------------
const DOOR_W = 0.95;       // door width
const DOOR_H = 2.1;        // door height
const DOOR_START = 0.5;    // z-position where the door opening begins (hinge side)

function LeftWall({ onHover }: HoverProps) {
  const [index, setIndex] = useState(1); // start on "Sage" so the walls differ
  const paint = WALL_PAINTS[index];
  const x = LEFT - WALL / 2;
  const doorEnd = DOOR_START + DOOR_W;
  const segA = DOOR_START - BACK;          // wall length behind the door
  const segB = DEPTH / 2 - doorEnd;        // wall length in front of the door

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        setIndex((index + 1) % WALL_PAINTS.length);
      }}
      {...hoverHandlers(`Side wall: ${paint.name} — click to repaint`, onHover)}
    >
      <Block size={[WALL, HEIGHT, segA]} position={[x, HEIGHT / 2, BACK + segA / 2]} color={paint.color} roughness={paint.roughness} />
      <Block size={[WALL, HEIGHT, segB]} position={[x, HEIGHT / 2, doorEnd + segB / 2]} color={paint.color} roughness={paint.roughness} />
      {/* lintel = the piece of wall above the door */}
      <Block size={[WALL, HEIGHT - DOOR_H, DOOR_W]} position={[x, (DOOR_H + HEIGHT) / 2, DOOR_START + DOOR_W / 2]} color={paint.color} roughness={paint.roughness} />
    </group>
  );
}

function Door({ onHover }: HoverProps) {
  const [open, setOpen] = useState(false);
  const hingeRef = useRef<THREE.Group>(null);

  // Animate the door swinging around its hinge (the y-axis)
  useFrame((_, delta) => {
    if (!hingeRef.current) return;
    const target = open ? 1.4 : 0; // 1.4 radians ≈ 80 degrees
    hingeRef.current.rotation.y = THREE.MathUtils.damp(hingeRef.current.rotation.y, target, 4, delta);
  });

  return (
    // The group is placed AT the hinge. Rotating the group swings the door.
    <group ref={hingeRef} position={[LEFT - WALL / 2, 0, DOOR_START]}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        {...hoverHandlers(`Door — click to ${open ? 'close' : 'open'}`, onHover)}
      >
        {/* door leaf, offset so its edge sits on the hinge */}
        <Block size={[0.05, DOOR_H, DOOR_W]} position={[0, DOOR_H / 2, DOOR_W / 2]} color="#7a5638" roughness={0.5} />
        {/* door handle */}
        <mesh position={[0.07, 1.0, DOOR_W - 0.1]} castShadow>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial color="#c9b37e" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// INVISIBLE SHADOW CASTERS
// Because the ceiling and right wall are "cut away" so we can see inside,
// sunlight would flood in from above. These invisible slabs still block the
// sun (cast shadows) but are never drawn, so sunlight only enters through
// the window — like a real room.
// ---------------------------------------------------------------------------
function ShadowOnly({ size, position }: { size: Vec3; position: Vec3 }) {
  return (
    // raycast={() => null} means clicks pass straight through it
    <mesh position={position} castShadow raycast={() => null}>
      <boxGeometry args={size} />
      {/* colorWrite/depthWrite false = invisible to the camera, still casts shadow */}
      <meshBasicMaterial colorWrite={false} depthWrite={false} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// FURNITURE
// ---------------------------------------------------------------------------
function Table({ position }: { position: Vec3 }) {
  const w = 1.6, d = 0.85, h = 0.75, leg = 0.05;
  const lx = w / 2 - 0.08, lz = d / 2 - 0.08;
  return (
    <group position={position}>
      <Block size={[w, 0.04, d]} position={[0, h, 0]} color="#d9c3a0" roughness={0.5} />
      {/* four legs: one at each corner, using +/- combinations */}
      {[[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]].map(([x, z], i) => (
        // "key" helps React keep track of items created in a loop
        <Block key={i} size={[leg, h, leg]} position={[x, h / 2, z]} color="#222222" />
      ))}
    </group>
  );
}

function Chair({ position, startRotation, onHover }: HoverProps & { position: Vec3; startRotation: number }) {
  // Each click adds a quarter turn (π/2 radians = 90°)
  const [turns, setTurns] = useState(0);
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const target = startRotation + (turns * Math.PI) / 2;
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, target, 6, delta);
  });

  const seat = 0.45, s = 0.45, leg = 0.035;
  const o = s / 2 - 0.03;
  return (
    <group
      ref={ref}
      position={position}
      rotation={[0, startRotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        setTurns(turns + 1);
      }}
      {...hoverHandlers('Chair — click to rotate', onHover)}
    >
      <Block size={[s, 0.04, s]} position={[0, seat, 0]} color="#2f4f4f" roughness={0.7} />
      {/* backrest */}
      <Block size={[s, 0.42, 0.04]} position={[0, seat + 0.23, -s / 2 + 0.02]} color="#2f4f4f" roughness={0.7} />
      {[[-o, -o], [o, -o], [-o, o], [o, o]].map(([x, z], i) => (
        <Block key={i} size={[leg, seat, leg]} position={[x, seat / 2, z]} color="#1a1a1a" />
      ))}
    </group>
  );
}

function Bookshelf({ position }: { position: Vec3 }) {
  const w = 0.35, h = 2.0, d = 1.2;
  const wood = '#a07850';
  // Colors for the books — feel free to change them!
  const bookColors = ['#8c2f39', '#2e4a62', '#d9a441', '#5b7553', '#e7e1d6', '#3b3b3b'];
  const shelfHeights = [0.02, 0.5, 1.0, 1.5, 1.98];

  return (
    <group position={position}>
      {/* sides */}
      <Block size={[w, h, 0.03]} position={[0, h / 2, -d / 2]} color={wood} />
      <Block size={[w, h, 0.03]} position={[0, h / 2, d / 2]} color={wood} />
      {/* shelves */}
      {shelfHeights.map((y, i) => (
        <Block key={i} size={[w, 0.03, d]} position={[0, y, 0]} color={wood} />
      ))}
      {/* books on the lower three shelves */}
      {[0.02, 0.5, 1.0].map((y, row) =>
        Array.from({ length: 7 }).map((_, i) => {
          const bh = 0.28 + ((i * 7 + row * 3) % 5) * 0.03; // vary heights a little
          return (
            <Block
              key={`${row}-${i}`}
              size={[0.22, bh, 0.07]}
              position={[0.02, y + 0.015 + bh / 2, -d / 2 + 0.12 + i * 0.12 + row * 0.03]}
              color={bookColors[(i + row * 2) % bookColors.length]}
              roughness={0.9}
            />
          );
        })
      )}
    </group>
  );
}

// A soft rug under the table (a very thin box)
function Rug({ position }: { position: Vec3 }) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={[2.6, 0.01, 1.9]} />
      <meshStandardMaterial color="#c7b299" roughness={1} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// PENDANT LAMP — click to turn on and off
// ---------------------------------------------------------------------------
function PendantLamp({ position, onHover }: HoverProps & { position: Vec3 }) {
  const [on, setOn] = useState(true);
  const lightRef = useRef<THREE.PointLight>(null);
  const cordLength = HEIGHT - position[1];

  // Fade the light in/out instead of snapping
  useFrame((_, delta) => {
    if (!lightRef.current) return;
    lightRef.current.intensity = THREE.MathUtils.damp(lightRef.current.intensity, on ? 6 : 0, 8, delta);
  });

  return (
    <group position={position}>
      {/* cord hanging from the ceiling */}
      <mesh position={[0, cordLength / 2, 0]}>
        <cylinderGeometry args={[0.006, 0.006, cordLength, 6]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      <group
        onClick={(e) => {
          e.stopPropagation();
          setOn(!on);
        }}
        {...hoverHandlers(`Pendant lamp — click to turn ${on ? 'off' : 'on'}`, onHover)}
      >
        {/* shade: an open cone (openEnded = no bottom cap) */}
        <mesh castShadow>
          <cylinderGeometry args={[0.06, 0.28, 0.25, 32, 1, true]} />
          <meshStandardMaterial color="#1f1f1f" side={THREE.DoubleSide} roughness={0.4} metalness={0.3} />
        </mesh>
        {/* bulb: "emissive" makes it look like it glows */}
        <mesh position={[0, -0.08, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#fff6e0" emissive="#ffcf7a" emissiveIntensity={on ? 3 : 0} />
        </mesh>
      </group>

      {/* the actual light source, a warm point light just below the bulb */}
      <pointLight
        ref={lightRef}
        position={[0, -0.15, 0]}
        color="#ffcf8a"
        intensity={6}
        distance={8}
        decay={2}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.003}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// PLANT — reuses the potted-plant.glb model that came with the starter repo
// (The original PottedPlant component jumps around when clicked, so here we
// just borrow its geometry and let it sit still in the corner.)
// ---------------------------------------------------------------------------
function Plant({ position }: { position: Vec3 }) {
  const { nodes, materials } = useGLTF('/potted-plant.glb') as unknown as GLTFResult;
  return (
    // The model is ~0.28m tall at scale 1, so scale 3.5 makes it about 1m
    <group position={position} scale={3.5}>
      <mesh
        geometry={(nodes.Potted_Plant000 as unknown as THREE.Mesh).geometry}
        material={materials.Material}
        scale={100}
        castShadow
        receiveShadow
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE ROOM — puts every piece together, plus the sun
// ---------------------------------------------------------------------------
export function Room({ onHover, isNight }: RoomProps) {
  const sunRef = useRef<THREE.DirectionalLight>(null);

  // Fade the sun in (day) or out (night)
  useFrame((_, delta) => {
    if (!sunRef.current) return;
    sunRef.current.intensity = THREE.MathUtils.damp(sunRef.current.intensity, isNight ? 0 : 4, 3, delta);
  });

  return (
    <group>
      {/* SUN — a directional light behind the back wall, low in the sky,
          so a patch of sunlight falls through the window onto the floor.
          The shadow-camera settings define the area where shadows are calculated. */}
      <directionalLight
        ref={sunRef}
        position={[-2, 6, -8]}
        intensity={4}
        color="#fff1d6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={25}
      />

      {/* ARCHITECTURE */}
      <Floor onHover={onHover} />
      <BackWall onHover={onHover} />
      <Window onHover={onHover} />
      <LeftWall onHover={onHover} />
      <Door onHover={onHover} />

      {/* Invisible ceiling + right wall that only block sunlight */}
      <ShadowOnly size={[WIDTH + 1, 0.1, DEPTH + 1]} position={[0, HEIGHT + 0.05, 0]} />
      <ShadowOnly size={[0.1, HEIGHT, DEPTH + 1]} position={[WIDTH / 2 + 0.05, HEIGHT / 2, 0]} />

      {/* FURNITURE */}
      <Rug position={[0.6, 0.005, 1.0]} />
      <Table position={[0.6, 0, 1.0]} />
      <Chair position={[0.2, 0, 1.65]} startRotation={Math.PI} onHover={onHover} />
      <Chair position={[1.0, 0, 0.35]} startRotation={0} onHover={onHover} />
      <Bookshelf position={[LEFT + 0.2, 0, -1.4]} />
      <Plant position={[2.4, 0, -1.9]} />

      {/* LIGHTING FIXTURE hanging over the table */}
      <PendantLamp position={[0.6, 2.1, 1.0]} onHover={onHover} />
    </group>
  );
}

// Load the plant file early so it's ready when the room appears
useGLTF.preload('/potted-plant.glb');
