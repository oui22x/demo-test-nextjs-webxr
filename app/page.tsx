// This directive tells Next.js that this component runs on the client-side
// It's needed because we're using browser-specific features like 3D graphics and WebXR
'use client';

// useState lets the page "remember" values that change (day/night, hover hint)
import { useState } from 'react';

// Import required components for 3D rendering
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// Our interactive room (see app/components/Room.tsx)
import { Room } from './components/Room';

// Import XR components for WebXR functionality (AR/VR)
import { XR, createXRStore, XROrigin } from '@react-three/xr';

// Create an XR store that manages the WebXR session state
const store = createXRStore();

// Main homepage component
export default function Home() {
  // isNight: false = daytime (sun on). Change to true for night lighting.
  const isNight = false;
  // hint: the label of whatever the mouse is currently pointing at
  const [hint, setHint] = useState<string | null>(null);

  // Sky / background colors for day and night
  const skyColor = isNight ? '#0d1424' : '#dfe9f2';

  return (
    // Full-screen container. "position: relative" lets the UI float on top.
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: skyColor, transition: 'background 1s' }}>

      {/*
        CANVAS — the 3D scene
        shadows: turns on shadow rendering
        camera: starts outside the "cut-away" corner, looking into the room
      */}
      <Canvas shadows camera={{ position: [5.5, 3.6, 6], fov: 45 }}>
        {/* Set the scene background to match the sky color */}
        <color attach="background" args={[skyColor]} />

        <XR store={store}>
          {/* In VR you'll start standing inside the room, near the front */}
          <XROrigin position={[0.5, 0, 2]} />

          {/* Soft overall light. Brighter in the day, dim blue at night. */}
          <ambientLight intensity={isNight ? 0.08 : 0.35} color={isNight ? '#8fa3ff' : '#ffffff'} />
          {/* Sky light from above + ground bounce from below (feels more natural) */}
          <hemisphereLight args={[isNight ? '#1b2440' : '#dfefff', '#8a7a66', isNight ? 0.1 : 0.5]} />

          {/* THE ROOM — walls, window, door, furniture, lamp and sun */}
          <Room isNight={isNight} onHover={setHint} />

          {/*
            CAMERA CONTROLS
            - Left drag: orbit   - Right drag: pan   - Scroll: zoom
            target: the point the camera orbits around (middle of the room)
            maxPolarAngle: stops you going below the floor
          */}
          <OrbitControls
            target={[0, 1.1, 0]}
            enablePan
            enableZoom
            minDistance={2}
            maxDistance={16}
            maxPolarAngle={Math.PI / 2 - 0.05}
          />
        </XR>
      </Canvas>

      {/* HOVER HINT — only shows when you're pointing at something clickable */}
      {hint && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-neutral-900/85 px-4 py-2 text-sm text-white shadow-lg">
          {hint}
        </div>
      )}
    </div>
  );
}
