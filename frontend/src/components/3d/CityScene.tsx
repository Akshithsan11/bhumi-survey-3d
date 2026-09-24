import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Grid, Html, OrbitControls } from "@react-three/drei";

export function colorForType(t?: string): string {
  const s = (t || "").toLowerCase();
  if (s.includes("commercial") || s.includes("tower")) return "#f0abfc";
  if (s.includes("mixed")) return "#c4b5fd";
  if (s.includes("low")) return "#6ee7b7";
  if (s.includes("mid")) return "#67e8f9";
  if (s.includes("residential")) return "#22d3ee";
  return "#38bdf8";
}

function hash(n: number): number {
  let x = (n * 2654435761) % 4294967296;
  x ^= x >> 15;
  x = (x * 2246822519) % 4294967296;
  return Math.abs(x);
}

const INFRA_COLORS: Record<string, string> = {
  "Water Pipeline": "#38bdf8",
  "Water Pipeline main": "#38bdf8",
  Sewer: "#a3a3a3",
  "Sewer Line": "#a3a3a3",
  "Electric Cable": "#facc15",
  Power: "#facc15",
  "Power Cable": "#facc15",
  "Metro Tunnel": "#f472b6",
  "Fiber Cable": "#34d399",
};

export interface SceneBuilding {
  id: number;
  code: string;
  parcel_id?: number | null;
  height_m?: string | number | null;
  total_floors?: number | null;
  building_type?: string | null;
  ai_confidence?: string | number | null;
  footprint?: unknown;
}

export interface SceneParcel {
  id: number;
  code: string;
  name?: string | null;
}

export interface SceneInfra {
  id: number;
  type: string;
  name?: string | null;
  depth_m?: string | number | null;
  building_id?: number | null;
}

function BuildingMesh({
  building,
  position,
  selected,
  exploded,
  onSelect,
}: {
  building: SceneBuilding;
  position: [number, number, number];
  selected: boolean;
  exploded: number;
  onSelect: (id: number) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const heightRaw = Number(building.height_m ?? 18) || 18;
  const hgt = Math.min(10, Math.max(0.7, heightRaw / 8));
  const nFloors = Math.min(
    30,
    Math.max(1, building.total_floors || Math.max(1, Math.round(heightRaw / 3.4)))
  );
  const hh = hash(building.id);
  const w = 1.7 + ((hh % 100) / 100) * 1.5;
  const d = 1.7 + (((hh >> 3) % 100) / 100) * 1.5;
  const color = colorForType(building.building_type || undefined);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const target = selected ? 1.06 + Math.sin(t * 2.2) * 0.012 : hover ? 1.03 : 1;
    group.current.scale.lerp(new THREE.Vector3(target, 1, target), 0.12);
  });

  const explodeGap = exploded * 1.6;
  const showSlabs = selected || exploded > 0.05;
  const slabCount = Math.min(nFloors, 16);
  const slabH = hgt / nFloors;

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
        <mesh position={[0, hgt / 2, 0]}>
          <boxGeometry args={[w, hgt, d]} />
          <meshStandardMaterial
            color={selected ? "#ffffff" : color}
            emissive={selected ? color : "#000000"}
            emissiveIntensity={selected ? 0.55 : hover ? 0.25 : 0.08}
            transparent
            opacity={0.92}
            roughness={0.35}
            metalness={0.25}
          />
        </mesh>
        {Array.from({ length: Math.min(nFloors, 24) }).map((_, i) => (
          <mesh
            key={i}
            position={[
              0,
              ((i + 1) / Math.min(nFloors, 24)) * hgt + (showSlabs ? explodeGap * ((i + 1) / 24) : 0),
              0,
            ]}
          >
            <boxGeometry args={[w * 1.002, 0.02, d * 1.002]} />
            <meshBasicMaterial color={selected ? "#ffffff" : "#0a0a0f"} transparent opacity={0.55} />
          </mesh>
        ))}
        {showSlabs &&
          Array.from({ length: slabCount }).map((_, i) => (
            <mesh
              key={`s${i}`}
              position={[0, i * slabH + (i + 1) * (explodeGap / Math.max(1, slabCount)) + slabH / 2, 0]}
            >
              <boxGeometry args={[w * 1.04, 0.05, d * 1.04]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.5} />
            </mesh>
          ))}
        <mesh position={[0, hgt + 0.25 + (showSlabs ? explodeGap : 0), 0]}>
          <octahedronGeometry args={[0.14]} />
          <meshStandardMaterial color="#ff5470" emissive="#ff5470" emissiveIntensity={1.6} />
        </mesh>
        {(selected || hover) && (
          <Html distanceFactor={22} position={[0, hgt + 1 + (showSlabs ? explodeGap : 0), 0]} center>
            <div
              style={{
                background: "rgba(8,12,20,0.92)",
                border: `1px solid ${color}`,
                borderRadius: 10,
                padding: "6px 10px",
                fontSize: 11,
                whiteSpace: "nowrap",
                color: "#fff",
              }}
            >
              <b>{building.code}</b> · {heightRaw} m · {building.total_floors ?? "?"} fl
              <br />
              <span style={{ color }}>{building.building_type || "Unclassified"}</span> · AI{" "}
              {building.ai_confidence ?? "?"}%
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

function ParcelPad({
  index,
  parcel,
  count,
}: {
  index: number;
  parcel?: SceneParcel;
  count: number;
}) {
  const cols = 3;
  const gx = ((index % cols) - 1) * 16;
  const gz = (Math.floor(index / cols) - 0.5) * 16;
  return (
    <group position={[gx, 0, gz]}>
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[12, 0.12, 12]} />
        <meshStandardMaterial color="#141a2e" roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11.6, 11.6]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.05} />
      </mesh>
      <Html distanceFactor={34} position={[0, 0.25, -5.4]} center>
        <div
          style={{
            fontSize: 11,
            color: "#9be9ff",
            background: "rgba(10,14,24,0.85)",
            border: "1px solid rgba(0,255,255,0.3)",
            padding: "3px 9px",
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          {parcel?.code || `ZONE-${index + 1}`} · {count} bldg
        </div>
      </Html>
    </group>
  );
}

function InfraPipes({ items, visible }: { items: SceneInfra[]; visible: boolean }) {
  const types = useMemo(() => [...new Set(items.map((i) => i.type || "Utility"))], [items]);
  if (!visible || items.length === 0) return null;
  return (
    <group>
      {types.map((t, ti) =>
        items
          .filter((i) => (i.type || "Utility") === t)
          .map((infra, idx) => {
            const depth = Math.min(6, Math.max(0.6, (Number(infra.depth_m) || 5) / 6));
            const color = INFRA_COLORS[infra.type || ""] || "#94a3b8";
            return (
              <group key={`${t}-${idx}`} position={[-10 + idx * 2.4, -depth, 8 + ti * 2.2]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.22, 0.22, 22, 14]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.45}
                    transparent
                    opacity={0.9}
                  />
                </mesh>
                <Html distanceFactor={30} position={[0, 0.6, 0]} center>
                  <div
                    style={{
                      fontSize: 10,
                      color,
                      background: "rgba(8,10,18,0.9)",
                      padding: "2px 8px",
                      borderRadius: 999,
                      border: `1px solid ${color}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {infra.type} · {infra.depth_m ?? "?"} m
                  </div>
                </Html>
              </group>
            );
          })
      )}
      <mesh position={[0, -3.4, 4]} receiveShadow>
        <boxGeometry args={[34, 0.25, 22]} />
        <meshStandardMaterial color="#1c1410" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

export default function CityScene({
  buildings,
  parcels = [],
  infra = [],
  selectedId = null,
  onSelect = () => {},
  showInfra = true,
  exploded = 0,
  height = 560,
}: {
  buildings: SceneBuilding[];
  parcels?: SceneParcel[];
  infra?: SceneInfra[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  showInfra?: boolean;
  exploded?: number;
  height?: number;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, SceneBuilding[]>();
    buildings.forEach((b) => {
      const key = String(b.parcel_id ?? "unassigned");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    const arr = [...map.entries()];
    arr.sort((a, b) => b[1].length - a[1].length);
    return arr.slice(0, 6);
  }, [buildings]);

  const parcelIndexOf = (pid?: number | null) => {
    const p = parcels.findIndex((x) => x.id === pid);
    return p >= 0 ? p : 0;
  };

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
        camera={{ position: [20, 16, 22], fov: 45 }}
        onPointerMissed={() => onSelect(-1)}
      >
        <color attach="background" args={["#070912"]} />
        <fog attach="fog" args={["#070912", 40, 95]} />
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[14, 20, 10]}
          intensity={1.15}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[-12, 8, -10]} intensity={0.6} color="#00ffff" />
        <pointLight position={[12, 6, 12]} intensity={0.4} color="#f0abfc" />

        <Grid
          position={[0, -0.12, 0]}
          args={[60, 60]}
          cellColor="#123"
          sectionColor="#0ff"
          fadeDistance={70}
          fadeStrength={2}
          infiniteGrid
        />

        {groups.map(([key, list], gi) => {
          const first = list[0];
          const parcel = parcels.find((p) => p.id === first?.parcel_id);
          return (
            <ParcelPad
              key={key}
              index={parcel ? parcelIndexOf(parcel.id) : gi}
              parcel={parcel}
              count={list.length}
            />
          );
        })}

        {groups.map(([key, list]) => {
          const first = list[0];
          const parcel = parcels.find((p) => p.id === first?.parcel_id);
          const pi = parcel ? parcelIndexOf(parcel.id) : 0;
          const gx = (pi % 3) - 1;
          const gz = Math.floor(pi / 3) - 0.5;
          return list.slice(0, 8).map((b, bi) => {
            const lx = ((bi % 2) - 0.5) * 5.4;
            const lz = ((Math.floor(bi / 2) % 2) - 0.5) * 5.4;
            return (
              <BuildingMesh
                key={`${key}-${b.id}`}
                building={b}
                position={[gx * 16 + lx, 0, gz * 16 + lz]}
                selected={selectedId === b.id}
                exploded={exploded}
                onSelect={onSelect}
              />
            );
          });
        })}

        <InfraPipes items={infra} visible={showInfra} />

        {buildings.length === 0 && (
          <Html center position={[0, 3, 0]}>
            <div
              style={{
                color: "#9be9ff",
                background: "rgba(10,14,24,0.9)",
                padding: "10px 16px",
                borderRadius: 12,
                border: "1px solid rgba(0,255,255,0.3)",
                fontSize: 13,
              }}
            >
              No buildings yet — run AI Analysis or seed the database.
            </div>
          </Html>
        )}

        <ContactShadows position={[0, -0.1, 0]} opacity={0.55} scale={60} blur={2.4} far={8} color="#00e5ff" />
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.05} minDistance={6} maxDistance={70} />
      </Canvas>
    </div>
  );
}
