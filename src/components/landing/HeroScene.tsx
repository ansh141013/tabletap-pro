import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  Float, 
  RoundedBox, 
  Environment, 
  PerspectiveCamera,
  MeshTransmissionMaterial,
  MeshReflectorMaterial,
  Sparkles,
  ContactShadows
} from "@react-three/drei";
import * as THREE from "three";

// Hook to track mouse position in normalized coordinates
function useMousePosition() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Normalize to -1 to 1 range
      setMouse({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      });
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  
  return mouse;
}

// Enhanced phone with interactive cursor tilt
function PhoneModel({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const phoneRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  
  useFrame((state, delta) => {
    if (phoneRef.current) {
      // Calculate target rotation based on mouse position
      const baseRotationY = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
      const baseRotationX = Math.sin(state.clock.elapsedTime * 0.2) * 0.03 - 0.1;
      
      // Add mouse-based tilt (stronger effect)
      targetRotation.current.x = baseRotationX + mouseY * 0.15;
      targetRotation.current.y = baseRotationY + mouseX * 0.25;
      
      // Smooth interpolation for natural feel
      phoneRef.current.rotation.x = THREE.MathUtils.lerp(
        phoneRef.current.rotation.x,
        targetRotation.current.x,
        delta * 3
      );
      phoneRef.current.rotation.y = THREE.MathUtils.lerp(
        phoneRef.current.rotation.y,
        targetRotation.current.y,
        delta * 3
      );
    }
    // Subtle screen shimmer
    if (screenRef.current) {
      const material = screenRef.current.material as THREE.MeshPhysicalMaterial;
      material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });
  return (
    <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.4}>
      <group ref={phoneRef} position={[0, 0.2, 0]}>
        {/* Phone body - premium metal finish */}
        <RoundedBox args={[1.3, 2.6, 0.14]} radius={0.12} smoothness={8}>
          <meshPhysicalMaterial 
            color="#1a1a1a" 
            metalness={0.95} 
            roughness={0.15}
            clearcoat={1}
            clearcoatRoughness={0.1}
            reflectivity={1}
          />
        </RoundedBox>
        
        {/* Phone frame accent */}
        <RoundedBox args={[1.32, 2.62, 0.13]} radius={0.13} smoothness={8} position={[0, 0, -0.005]}>
          <meshPhysicalMaterial 
            color="#2a2a2a" 
            metalness={0.9} 
            roughness={0.2}
          />
        </RoundedBox>
        
        {/* Screen bezel */}
        <RoundedBox args={[1.15, 2.45, 0.02]} radius={0.1} smoothness={8} position={[0, 0, 0.075]}>
          <meshPhysicalMaterial 
            color="#0a0a0a" 
            metalness={0.5} 
            roughness={0.3}
          />
        </RoundedBox>
        
        {/* Main screen - glowing display */}
        <mesh ref={screenRef} position={[0, 0, 0.086]}>
          <planeGeometry args={[1.08, 2.35]} />
          <meshPhysicalMaterial 
            color="#fefefe"
            emissive="#f5f5f5"
            emissiveIntensity={0.3}
            metalness={0}
            roughness={0.1}
          />
        </mesh>
        
        {/* Status bar */}
        <mesh position={[0, 1.05, 0.09]}>
          <planeGeometry args={[1.0, 0.12]} />
          <meshBasicMaterial color="#ea580c" />
        </mesh>
        
        {/* Notch */}
        <RoundedBox args={[0.35, 0.08, 0.02]} radius={0.02} smoothness={4} position={[0, 1.1, 0.09]}>
          <meshPhysicalMaterial color="#0a0a0a" metalness={0.8} roughness={0.2} />
        </RoundedBox>
        
        {/* App header */}
        <mesh position={[0, 0.85, 0.09]}>
          <planeGeometry args={[1.0, 0.25]} />
          <meshBasicMaterial color="#f97316" />
        </mesh>
        
        {/* Menu items with shadows */}
        {[0.45, 0.05, -0.35, -0.75].map((y, i) => (
          <group key={i}>
            <RoundedBox 
              args={[0.9, 0.28, 0.01]} 
              radius={0.03} 
              smoothness={4} 
              position={[0, y, 0.09]}
            >
              <meshPhysicalMaterial 
                color="#fff7ed"
                metalness={0}
                roughness={0.5}
              />
            </RoundedBox>
            {/* Menu item accent */}
            <mesh position={[-0.32, y, 0.095]}>
              <circleGeometry args={[0.08, 32]} />
              <meshBasicMaterial color={i % 2 === 0 ? "#fdba74" : "#fcd34d"} />
            </mesh>
          </group>
        ))}
        
        {/* Bottom navigation */}
        <mesh position={[0, -1.0, 0.09]}>
          <planeGeometry args={[1.0, 0.2]} />
          <meshBasicMaterial color="#fafafa" />
        </mesh>
        
        {/* Camera lens reflection */}
        <mesh position={[0.4, 1.15, -0.075]} rotation={[Math.PI, 0, 0]}>
          <circleGeometry args={[0.06, 32]} />
          <meshPhysicalMaterial 
            color="#1a1a1a" 
            metalness={1} 
            roughness={0}
            clearcoat={1}
          />
        </mesh>
      </group>
    </Float>
  );
}

// Glass-effect floating order cards
function OrderCard({ 
  position, 
  delay, 
  rotation = [0, 0, 0] 
}: { 
  position: [number, number, number]; 
  delay: number;
  rotation?: [number, number, number];
}) {
  const cardRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (cardRef.current) {
      cardRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + delay) * 0.08;
      cardRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + delay) * 0.03;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.2}>
      <group ref={cardRef} position={position} rotation={rotation}>
        {/* Glass card background */}
        <RoundedBox args={[0.85, 0.55, 0.03]} radius={0.06} smoothness={8}>
          <MeshTransmissionMaterial
            backside
            samples={8}
            thickness={0.2}
            chromaticAberration={0.02}
            anisotropy={0.1}
            distortion={0.1}
            distortionScale={0.2}
            temporalDistortion={0.1}
            iridescence={0.3}
            iridescenceIOR={1}
            iridescenceThicknessRange={[0, 1400]}
            transmission={0.9}
            roughness={0.1}
            color="#ffffff"
          />
        </RoundedBox>
        
        {/* Card content backing */}
        <mesh position={[0, 0, 0.018]}>
          <planeGeometry args={[0.75, 0.45]} />
          <meshPhysicalMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.85}
            metalness={0}
            roughness={0.3}
          />
        </mesh>
        
        {/* Order status indicator */}
        <mesh position={[-0.28, 0.15, 0.025]}>
          <circleGeometry args={[0.04, 32]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
        
        {/* Text lines simulation */}
        <mesh position={[0.05, 0.15, 0.025]}>
          <planeGeometry args={[0.35, 0.04]} />
          <meshBasicMaterial color="#374151" />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[0.5, 0.03]} />
          <meshBasicMaterial color="#9ca3af" />
        </mesh>
        <mesh position={[0.1, -0.12, 0.025]}>
          <planeGeometry args={[0.3, 0.03]} />
          <meshBasicMaterial color="#f97316" />
        </mesh>
      </group>
    </Float>
  );
}

// Wooden table with realistic texture
function TableModel() {
  const tableRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (tableRef.current) {
      tableRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.02;
    }
  });

  return (
    <group ref={tableRef} position={[0, -1.6, -0.8]}>
      {/* Table top with wood grain effect */}
      <RoundedBox args={[3.2, 0.12, 2.2]} radius={0.03} smoothness={8} position={[0, 0, 0]}>
        <meshPhysicalMaterial 
          color="#92400e"
          metalness={0.05}
          roughness={0.75}
          clearcoat={0.3}
          clearcoatRoughness={0.4}
        />
      </RoundedBox>
      
      {/* Table edge detail */}
      <RoundedBox args={[3.25, 0.08, 2.25]} radius={0.02} smoothness={4} position={[0, -0.08, 0]}>
        <meshPhysicalMaterial 
          color="#78350f"
          metalness={0.05}
          roughness={0.8}
        />
      </RoundedBox>
      
      {/* QR code stand */}
      <group position={[1.1, 0.2, 0.6]}>
        <RoundedBox args={[0.25, 0.35, 0.08]} radius={0.02} smoothness={4}>
          <meshPhysicalMaterial 
            color="#1c1917"
            metalness={0.7}
            roughness={0.3}
          />
        </RoundedBox>
        {/* QR code */}
        <mesh position={[0, 0.02, 0.045]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.18, 0.18]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.02, 0.046]}>
          <planeGeometry args={[0.14, 0.14]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
      </group>
      
      {/* Decorative plate */}
      <mesh position={[-0.9, 0.08, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.28, 0.02, 32]} />
        <meshPhysicalMaterial 
          color="#f5f5f4"
          metalness={0.1}
          roughness={0.3}
          clearcoat={0.8}
        />
      </mesh>
      
      {/* Table legs - tapered modern style */}
      {[
        [-1.3, -0.55, -0.85], 
        [1.3, -0.55, -0.85], 
        [-1.3, -0.55, 0.85], 
        [1.3, -0.55, 0.85]
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.04, 0.06, 1, 16]} />
          <meshPhysicalMaterial 
            color="#451a03"
            metalness={0.1}
            roughness={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

// Ambient particles for atmosphere
function Particles() {
  return (
    <Sparkles
      count={40}
      scale={8}
      size={1.5}
      speed={0.3}
      opacity={0.4}
      color="#f97316"
    />
  );
}

// Floor with reflections
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.7, 0]}>
      <planeGeometry args={[15, 15]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mixBlur={0.8}
        mixStrength={0.5}
        roughness={0.8}
        depthScale={1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#f5f5f4"
        metalness={0.2}
        mirror={0.5}
      />
    </mesh>
  );
}

function Scene({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.8, 5.5]} fov={40} />
      
      {/* Ambient lighting */}
      <ambientLight intensity={0.4} />
      
      {/* Key light - warm */}
      <directionalLight 
        position={[5, 8, 5]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        color="#fff5eb"
      />
      
      {/* Fill light - cool */}
      <directionalLight 
        position={[-5, 3, -5]} 
        intensity={0.4} 
        color="#e0f2fe"
      />
      
      {/* Accent lights */}
      <pointLight position={[3, 2, 2]} intensity={0.8} color="#f97316" distance={8} />
      <pointLight position={[-3, 2, 2]} intensity={0.4} color="#fbbf24" distance={6} />
      
      {/* Rim light */}
      <spotLight
        position={[0, 5, -3]}
        angle={0.5}
        penumbra={0.5}
        intensity={0.6}
        color="#ffffff"
      />
      
      <PhoneModel mouseX={mouseX} mouseY={mouseY} />
      
      {/* Order cards with varied positions */}
      <OrderCard position={[1.9, 0.9, -0.3]} delay={0} rotation={[0, -0.15, 0.05]} />
      <OrderCard position={[2.1, 0.2, -0.1]} delay={1.5} rotation={[0, -0.2, -0.03]} />
      <OrderCard position={[1.85, -0.5, -0.2]} delay={3} rotation={[0, -0.1, 0.02]} />
      
      <TableModel />
      <Particles />
      <Floor />
      
      {/* Contact shadows for grounding */}
      <ContactShadows 
        position={[0, -2.68, 0]} 
        opacity={0.4} 
        scale={10} 
        blur={2} 
        far={4}
      />
      
      {/* HDR environment for realistic reflections */}
      <Environment preset="apartment" />
    </>
  );
}

function Fallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-foreground/50 animate-pulse shadow-xl" />
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-accent animate-bounce delay-100" />
      </div>
    </div>
  );
}

export const HeroScene = () => {
  const mouse = useMousePosition();
  
  return (
    <div className="w-full h-full min-h-[450px] md:min-h-[550px]">
      <Suspense fallback={<Fallback />}>
        <Canvas 
          shadows 
          dpr={[1, 2]}
          gl={{ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
          }}
        >
          <Scene mouseX={mouse.x} mouseY={mouse.y} />
        </Canvas>
      </Suspense>
    </div>
  );
};
