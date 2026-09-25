import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Grid, Html, OrbitControls } from "@react-three/drei";
import { colorForType } from "./CityScene";

export interface PlotBuilding {
  id: number;
  code: string;
  parcel_id?: number | null;
  height_m?: string | number | null;
  total_floors?: number | null;
  area_sqm?: string | number | null;
  building_type?: string | null;
  status?: string | null;
  ulpin_code?: string | null;
  plot_code?: string | null;
}

function hash(n: number): number {
  let x = (n * 2654435761) % 4294967296;
  x ^= x >> 15;
  x = (x * 2246822519) % 4294967296;
  return Math.abs(x);
}

function PlotMesh({
  building,
  position,
  selected,
  onSelect,
}: {
  building: PlotBuilding;
  position: [number, number, number];
  selected: boolean;
  onSelect: (id: number) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);

  const heightRaw = Number(building.height_m ?? 18) || 18;
  const nFloors = Math.min(
    60,
    Math.max(1, building.total_floors || Math.max(1, Math.round(heightRaw / 3.4)))
  );
  const area = Number(building.area_sqm ?? 0);
  const side = area > 0 ? Math.min(14, Math.max(1.6, Math.sqrt(area) / 4)) : 2.4 + (hash(building.id) % 100) / 50;
  const hgt = Math.min(16, Math.max(0.9, heightRaw / 6));
  const color = colorForType(building.building_type || undefined);
  const slabH = hgt / nFloors;

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const target = selected ? 1.05 + Math.sin(t * 2.2) * 0.012 : hover ? 1.03 : 1;
    group.current.scale.lerp(new THREE.Vector3(target, 1, target), 0.12);
  });

  return (
    <group position={position}>
      <group
        ref={group}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(building.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "auto";
        }}
      >
        <mesh position={[0, -0.06, 0]} receiveShadow>
          <boxGeometry args={[side + 0.8, 0.12, side + 0.8]} />
          <meshStandardMaterial color="#141a2e" roughness={0.9} metalness={0.05} />
        </mesh>
        <mesh position={[0, hgt / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[side, hgt, side]} />
          <meshStandardMaterial
            color={selected ? "#ffffff" : color}
            emissive={selected ? color : "#000000"}
            emissiveIntensity={selected ? 0.55 : hover ? 0.3 : 0.1}
            transparent
            opacity={0.94}
            roughness={0.35}
            metalness={0.25}
          />
        </mesh>
        {Array.from({ length: Math.min(nFloors, 40) }).map((_, i) => (
          <mesh key={i} position={[0, (i + 1) * slabH, 0]}>
            <boxGeometry args={[side * 1.004, 0.02, side * 1.004]} />
            <meshBasicMaterial color="#0a0a0f" transparent opacity={0.55} />
          </mesh>
        ))}
        <mesh position={[0, hgt + 0.28, 0]}>
          <octahedronGeometry args={[0.16]} />
          <meshStandardMaterial color="#ff5470" emissive="#ff5470" emissiveIntensity={1.6} />
        </mesh>
        {(selected || hover) && (
          <Html distanceFactor={24} position={[0, hgt + 1.1, 0]} center>
            <div
              style={{
                background: "rgba(8,12,20,0.94)",
                border: `1px solid ${color}`,
                borderRadius: 10,
                padding: "6px 10px",
                fontSize: 11,
                whiteSpace: "nowrap",
                color: "#fff",
                textAlign: "center",
              }}
            >
              <b>{building.code}</b> · {nFloors} fl · {area > 0 ? `${Math.round(area)} m²` : "—"}
              {building.ulpin_code ? (
                <>
                  <br />
                  <span style={{ color: "#67e8f9", fontFamily: "monospace", fontSize: 10 }}>
                    {building.ulpin_code}
                  </span>
                </>
              ) : null}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

export default function BuilderScene({
  buildings,
  selectedId = null,
  onSelect = () => {},
  height = 480,
}: {
  buildings: PlotBuilding[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  height?: number;
}) {
  const positions = useMemo(() => {
    const cols = 3;
    const out = new Map<number, [number, number, number]>();
    buildings.forEach((b, i) => {
      const gx = (i % cols) * 8 - 8;
      const gz = Math.floor(i / cols) * 8 - (Math.floor(buildings.length / cols) % 2 === 0 ? 4 : 0);
      out.set(b.id, [gx, 0, gz]);
    });
    return out;
  }, [buildings]);

  return (
    <div
      style={{
        height,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(0,255,255,0.18)",
        background: "#070912",
      }}
    >
      <Canvas
        shadows
        camera={{ position: [16, 14, 18], fov: 48 }}
        onPointerMissed={() => onSelect(-1)}
      >
        <color attach="background" args={["#070912"]} />
        <fog attach="fog" args={["#070912", 45, 110]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[12, 18, 8]} intensity={1.15} castShadow shadow-mapSize={[2048, 2048]} />
        <pointLight position={[-10, 8, -8]} intensity={0.5} color="#00ffff" />
        <pointLight position={[10, 6, 10]} intensity={0.4} color="#f0abfc" />

        <Grid
          position={[0, -0.12, 0]}
          args={[60, 60]}
          cellColor="#123"
          sectionColor="#0ff"
          fadeDistance={70}
          fadeStrength={2}
          infiniteGrid
        />
        <mesh position={[0, -0.14, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color="#0b0f1a" roughness={1} />
        </mesh>

        {buildings.map((b) => (
          <PlotMesh
            key={b.id}
            building={b}
            position={positions.get(b.id) || [0, 0, 0]}
            selected={selectedId === b.id}
            onSelect={onSelect}
          />
        ))}

        {buildings.length === 0 && (
          <Html center position={[0, 2.5, 0]}>
            <div
              style={{
                color: "#9be9ff",
                background: "rgba(10,14,24,0.92)",
                padding: "12px 18px",
                borderRadius: 12,
                border: "1px solid rgba(0,255,255,0.3)",
                fontSize: 13,
                textAlign: "center",
                maxWidth: 280,
              }}
            >
              <b>No plots yet</b>
              <br />
              Enter ULPIN plot code, floors &amp; size — your building will appear here in 3D.
            </div>
          </Html>
        )}

        <ContactShadows position={[0, -0.1, 0]} opacity={0.5} scale={60} blur={2.4} far={8} color="#00e5ff" />
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.05} minDistance={5} maxDistance={60} />
      </Canvas>
    </div>
  );
}
