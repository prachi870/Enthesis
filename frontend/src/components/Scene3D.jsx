import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float, MeshDistortMaterial, Stars, Text, Html } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

// Animated DNA/Neural Network Helix (representing AI analysis)
function NeuralHelix() {
  const groupRef = useRef()
  const nodes = useMemo(() => {
    const arr = []
    for (let i = 0; i < 25; i++) {
      const angle = (i / 25) * Math.PI * 6
      const radius = 2.5
      arr.push({
        position: [
          Math.cos(angle) * radius,
          i * 0.5 - 6,
          Math.sin(angle) * radius
        ],
        color: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'][i % 4]
      })
    }
    return arr
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    groupRef.current.rotation.y = time * 0.15
    groupRef.current.position.y = Math.sin(time * 0.5) * 0.3
  })

  return (
    <group ref={groupRef} position={[0, 0, -3]}>
      {nodes.map((node, i) => (
        <group key={i}>
          <mesh position={node.position}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial 
              color={node.color} 
              emissive={node.color}
              emissiveIntensity={0.6}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {i > 0 && (
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    ...node.position,
                    ...nodes[i - 1].position
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color={node.color} opacity={0.3} transparent />
            </line>
          )}
        </group>
      ))}
    </group>
  )
}

// Floating research papers
function FloatingPaper({ position, rotation, color, delay }) {
  const paperRef = useRef()
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime() + delay
    paperRef.current.position.y = position[1] + Math.sin(time * 0.4) * 0.5
    paperRef.current.rotation.z = rotation[2] + Math.sin(time * 0.3) * 0.1
    paperRef.current.rotation.y = time * 0.2
  })

  return (
    <mesh ref={paperRef} position={position} rotation={rotation}>
      <boxGeometry args={[0.7, 1, 0.02]} />
      <meshStandardMaterial 
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        metalness={0.4}
        roughness={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// Orbiting papers constellation
function PaperConstellation() {
  const groupRef = useRef()
  const papers = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2
      const radius = 6
      return {
        position: [
          Math.cos(angle) * radius,
          Math.sin(i * 0.5) * 2,
          Math.sin(angle) * radius
        ],
        rotation: [Math.random() * 0.5, 0, Math.random() * 0.3],
        color: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'][i % 4],
        delay: i * 0.5
      }
    })
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    groupRef.current.rotation.y = time * 0.08
  })

  return (
    <group ref={groupRef}>
      {papers.map((paper, i) => (
        <FloatingPaper key={i} {...paper} />
      ))}
    </group>
  )
}

// AI Brain (pulsating central element)
function AIBrain() {
  const meshRef = useRef()
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    const scale = 1 + Math.sin(time * 1.5) * 0.08
    meshRef.current.scale.set(scale, scale, scale)
    meshRef.current.rotation.y = time * 0.3
    meshRef.current.rotation.x = Math.sin(time * 0.2) * 0.1
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <icosahedronGeometry args={[1.5, 1]} />
      <MeshDistortMaterial
        color="#a855f7"
        attach="material"
        distort={0.5}
        speed={2}
        roughness={0.1}
        metalness={0.9}
        emissive="#a855f7"
        emissiveIntensity={0.6}
      />
    </mesh>
  )
}

// Data particle streams
function DataStreams({ count = 300 }) {
  const points = useRef()
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 2
      const radius = 8 + Math.random() * 10
      
      positions[i * 3] = radius * Math.sin(theta) * Math.cos(phi)
      positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi)
      positions[i * 3 + 2] = radius * Math.cos(theta)
    }
    return positions
  }, [count])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    points.current.rotation.y = time * 0.04
    points.current.rotation.x = time * 0.02
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#6366f1"
        sizeAttenuation
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Glowing connection rings
function ConnectionRings() {
  const ring1 = useRef()
  const ring2 = useRef()
  const ring3 = useRef()
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    ring1.current.rotation.x = time * 0.25
    ring1.current.rotation.y = time * 0.15
    ring2.current.rotation.x = -time * 0.3
    ring2.current.rotation.z = time * 0.2
    ring3.current.rotation.y = time * 0.35
    ring3.current.rotation.z = -time * 0.15
  })

  return (
    <>
      <mesh ref={ring1}>
        <torusGeometry args={[5, 0.04, 16, 100]} />
        <meshStandardMaterial 
          color="#3b82f6" 
          emissive="#3b82f6"
          emissiveIntensity={0.6}
          transparent
          opacity={0.5}
        />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[6.5, 0.04, 16, 100]} />
        <meshStandardMaterial 
          color="#8b5cf6" 
          emissive="#8b5cf6"
          emissiveIntensity={0.6}
          transparent
          opacity={0.4}
        />
      </mesh>
      <mesh ref={ring3}>
        <torusGeometry args={[4, 0.04, 16, 100]} />
        <meshStandardMaterial 
          color="#ec4899" 
          emissive="#ec4899"
          emissiveIntensity={0.6}
          transparent
          opacity={0.6}
        />
      </mesh>
    </>
  )
}

// Floating text labels (module names)
function FloatingLabel({ text, position, color }) {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.8}>
      <Html position={position} center distanceFactor={15}>
        <div 
          className="px-4 py-2 rounded-lg backdrop-blur-md border"
          style={{
            background: `${color}20`,
            borderColor: `${color}60`,
            color: color,
            fontSize: '14px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            textShadow: `0 0 10px ${color}`,
            boxShadow: `0 0 20px ${color}40`
          }}
        >
          {text}
        </div>
      </Html>
    </Float>
  )
}

// Knowledge graph nodes
function KnowledgeNodes() {
  const groupRef = useRef()
  const nodes = useMemo(() => {
    return [
      { pos: [-4, 3, 2], color: '#3b82f6', size: 0.3 },
      { pos: [4, 2, 1], color: '#8b5cf6', size: 0.25 },
      { pos: [-3, -2, 3], color: '#ec4899', size: 0.28 },
      { pos: [5, -3, 2], color: '#10b981', size: 0.26 },
      { pos: [0, 4, -2], color: '#f59e0b', size: 0.24 },
      { pos: [-5, 0, -1], color: '#06b6d4', size: 0.27 }
    ]
  }, [])

  useFrame((state) => {
    nodes.forEach((node, i) => {
      const time = state.clock.getElapsedTime() + i
      const mesh = groupRef.current.children[i]
      if (mesh) {
        mesh.position.y = node.pos[1] + Math.sin(time * 0.5) * 0.3
        mesh.scale.setScalar(node.size + Math.sin(time * 2) * 0.05)
      }
    })
  })

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <mesh key={i} position={node.pos}>
          <sphereGeometry args={[node.size, 16, 16]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={0.8}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}

const Scene3D = () => {
  return (
    <Canvas
      camera={{ position: [0, 2, 14], fov: 75 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ alpha: true, antialias: true }}
    >
      {/* Multi-color lighting setup */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#3b82f6" />
      <pointLight position={[-10, -10, -10]} intensity={1.2} color="#8b5cf6" />
      <pointLight position={[0, 15, 5]} intensity={0.8} color="#ec4899" />
      <spotLight position={[0, 20, 0]} angle={0.4} penumbra={1} intensity={0.6} color="#10b981" />
      
      {/* Starfield background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0.5} fade speed={1} />
      
      {/* Central AI Brain */}
      <AIBrain />
      
      {/* Neural network helix */}
      <NeuralHelix />
      
      {/* Orbiting papers */}
      <PaperConstellation />
      
      {/* Connection rings */}
      <ConnectionRings />
      
      {/* Knowledge graph nodes */}
      <KnowledgeNodes />
      
      {/* Data particle streams */}
      <DataStreams count={400} />
      
      {/* Floating module labels */}
      <FloatingLabel text="Related Work" position={[-7, 3.5, 0]} color="#3b82f6" />
      <FloatingLabel text="Novelty Detection" position={[7, 2, -1]} color="#10b981" />
      <FloatingLabel text="Weaknesses" position={[-6, -3, 1]} color="#ec4899" />
      <FloatingLabel text="Clarity Analysis" position={[6, -2.5, 2]} color="#8b5cf6" />
      
      {/* Camera controls with auto-rotation */}
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        autoRotate 
        autoRotateSpeed={0.4}
        maxPolarAngle={Math.PI / 1.6}
        minPolarAngle={Math.PI / 3}
      />
    </Canvas>
  )
}

export default Scene3D
