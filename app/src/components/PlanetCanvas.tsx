import { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useIsDark } from '../hooks/useIsDark';

/* ═══════════════════════════════════════════════════════════════
   Earth shaders — day/night blend driven by sun direction
   ═══════════════════════════════════════════════════════════════ */

const EARTH_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const EARTH_FRAGMENT = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform vec3 sunDir;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vec3 n = normalize(vWorldNormal);
    float sunI = dot(n, normalize(sunDir));
    // 晨昏线：-0.1 ~ 0.25 之间柔和过渡
    float dayF = smoothstep(-0.1, 0.25, sunI);
    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 night = texture2D(nightMap, vUv).rgb;
    // 昼面正常光照；夜面 daymap 压暗 + 城市灯光发光
    vec3 col = day * (0.06 + 0.94 * dayF) + night * (1.0 - dayF) * 1.2;
    gl_FragColor = vec4(col, uOpacity);
  }
`;

/* ═══════════════════════════════════════════════════════════════
   Layout: desktop → planet right-of-center (text safe zone left)
           mobile  → planet small, upper center
   ═══════════════════════════════════════════════════════════════ */
function usePlanetLayout() {
  const { viewport } = useThree();
  const isMobile = viewport.width < 7.5;
  return {
    isMobile,
    x: 0, // Sanctuary 居中构图：行星如月，悬于词标之后
    y: isMobile ? 1.6 : 0.78, // 行星上移，为下方按钮留出净空
    scale: isMobile ? 0.55 : 0.9,
  };
}

/* ── Star field (theme-aware; drei Stars is invisible on light bg) ── */
function StarField() {
  const isDark = useIsDark();
  const geometry = useMemo(() => {
    const count = 1400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Random point on a far shell
      const r = 55 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.004;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={2.2}
        sizeAttenuation={false}
        color={isDark ? '#E8E4DC' : '#4A5570'}
        transparent
        opacity={isDark ? 0.9 : 0.62}
        depthWrite={false}
      />
    </points>
  );
}

/* ── Earth body: day/night shader, sun angle follows scroll ── */
function PlanetBody({ scrollProgress }: { scrollProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const [dayMap, nightMap] = useTexture([
    '/assets/planet_day.jpg',
    '/assets/planet_night.jpg',
  ]);
  dayMap.colorSpace = THREE.SRGBColorSpace;
  nightMap.colorSpace = THREE.SRGBColorSpace;

  const uniforms = useMemo(
    () => ({
      dayMap: { value: dayMap },
      nightMap: { value: nightMap },
      sunDir: { value: new THREE.Vector3(1, 0.35, 0.4) },
      uOpacity: { value: 1 },
    }),
    [dayMap, nightMap],
  );

  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    if (matRef.current) {
      // 滚动 = 时间流逝：太阳角度随滚动旋转 ~40°，晨昏线扫过地球
      const a = scrollProgress * 0.7;
      matRef.current.uniforms.sunDir.value.set(Math.cos(a), 0.35, Math.sin(a));
      // 滚动叙事：行星淡成幽灵圆环，成为下一场景"月落成原"的种子
      const fade = Math.min(Math.max((scrollProgress - 0.55) / 0.45, 0), 1);
      matRef.current.uniforms.uOpacity.value = 1 - fade * 0.82;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.6, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={EARTH_VERTEX}
        fragmentShader={EARTH_FRAGMENT}
        transparent
      />
    </mesh>
  );
}

/* ── Deep-space dome: 2k stars texture (dark mode only) ── */
function StarDome() {
  const stars = useTexture('/assets/2k_stars.jpg');
  stars.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh>
      <sphereGeometry args={[90, 32, 32]} />
      <meshBasicMaterial
        map={stars}
        side={THREE.BackSide}
        transparent
        opacity={0.5}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ── Atmosphere: two additive shells → rim glow ── */
function Atmosphere() {
  const isDark = useIsDark();
  const color = isDark ? '#A8C8E8' : '#7FA8D0'; // 地球大气蓝白
  return (
    <>
      <mesh>
        <sphereGeometry args={[1.72, 48, 48]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isDark ? 0.16 : 0.12}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.94, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isDark ? 0.07 : 0.05}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

/* ── Spaceship: body + solar panels + engine glow, elliptical orbit ── */
function Spaceship() {
  const groupRef = useRef<THREE.Group>(null);
  const engineRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      const angle = t * 0.22;
      groupRef.current.position.x = Math.cos(angle) * 4.4;
      groupRef.current.position.z = Math.sin(angle) * 3.4;
      groupRef.current.position.y = Math.sin(t * 0.3) * 0.6 + 0.4;
      groupRef.current.rotation.y = -angle;
    }
    if (engineRef.current) {
      const mat = engineRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.55 + Math.sin(t * 6) * 0.3;
    }
  });

  return (
    <group ref={groupRef} scale={0.9}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[0.16, 0.1, 0.1]} />
        <meshStandardMaterial color="#E4E0D8" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Solar panels */}
      <mesh position={[0, 0, 0.16]}>
        <boxGeometry args={[0.3, 0.015, 0.16]} />
        <meshStandardMaterial color="#7A93B0" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0, -0.16]}>
        <boxGeometry args={[0.3, 0.015, 0.16]} />
        <meshStandardMaterial color="#7A93B0" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Engine glow */}
      <mesh ref={engineRef} position={[-0.12, 0, 0]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color="#E8B86A" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

/* ── Camera rig: scroll-driven dolly, look at the offset planet ── */
function CameraRig({ scrollProgress, lookX }: { scrollProgress: number; lookX: number }) {
  const { camera } = useThree();

  useFrame(() => {
    const targetZ = 8 - scrollProgress * 3;
    camera.position.z += (targetZ - camera.position.z) * 0.05;

    const targetY = 2 - scrollProgress * 1.5;
    camera.position.y += (targetY - camera.position.y) * 0.05;

    camera.lookAt(lookX, 0, 0);
  });

  return null;
}

/* ── Fallback for load failure ── */
function Fallback() {
  return (
    <Html center>
      <div className="text-center text-muted-foreground">
        <div className="text-6xl mb-4">🪐</div>
        <p className="text-sm">行星场景加载中...</p>
      </div>
    </Html>
  );
}

/* ── 3D scene canvas (lazy-loaded by PlanetHero) ── */
export default function PlanetCanvas({ scrollProgress }: { scrollProgress: number }) {
  const isDark = useIsDark();
  // 离屏暂停：Hero 滚出视口时把 frameloop 切为 'never'，停止烧帧
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always');
  const ioRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => () => ioRef.current?.disconnect(), []);

  return (
    <Canvas
      frameloop={frameloop}
      camera={{ position: [0, 2, 8], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      onCreated={(state) => {
        // Let vertical touch scroll pass through to the page on mobile
        state.gl.domElement.style.touchAction = 'pan-y';
        // Observe the Canvas wrapper: offscreen → pause render loop
        const el = state.gl.domElement.parentElement ?? state.gl.domElement;
        ioRef.current?.disconnect();
        ioRef.current = new IntersectionObserver((entries) => {
          setFrameloop(entries[0]?.isIntersecting ? 'always' : 'never');
        });
        ioRef.current.observe(el);
      }}
    >
      <Suspense fallback={<Fallback />}>
        {/* Lighting: warm key + cool rim → visible terminator line */}
        <ambientLight intensity={isDark ? 0.12 : 0.25} />
        <directionalLight position={[6, 4, 6]} intensity={isDark ? 2.8 : 3.4} color="#E8D9BE" />
        <directionalLight position={[-7, -2, -5]} intensity={isDark ? 1.1 : 0.55} color="#7A8B9F" />

        <StarField />
        {isDark && <StarDome />}

        <SceneContent scrollProgress={scrollProgress} />

        {/* Orbit controls: drag to rotate (mouse), scroll stays free */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
          autoRotate={false}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 3}
        />
      </Suspense>
    </Canvas>
  );
}

/* Separated so usePlanetLayout (useThree) stays inside Canvas */
function SceneContent({ scrollProgress }: { scrollProgress: number }) {
  const layout = usePlanetLayout();
  const groupRef = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });

  // Pointer parallax: the planet drifts gently against the cursor,
  // tying the text side and the 3D side into one living scene
  useEffect(() => {
    function onMove(e: PointerEvent) {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    }
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const tx = layout.x + pointer.current.x * 0.22;
    const ty = layout.y + pointer.current.y * 0.14;
    g.position.x += (tx - g.position.x) * 0.04;
    g.position.y += (ty - g.position.y) * 0.04;
  });

  return (
    <>
      <group ref={groupRef} position={[layout.x, layout.y, 0]} scale={layout.scale}>
        <PlanetBody scrollProgress={scrollProgress} />
        <Atmosphere />
        <Spaceship />
      </group>
      <CameraRig scrollProgress={scrollProgress} lookX={layout.x} />
    </>
  );
}
