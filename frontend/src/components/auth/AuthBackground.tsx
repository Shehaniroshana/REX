/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

interface AntigravityInnerProps {
    count?: number
    magnetRadius?: number
    ringRadius?: number
    waveSpeed?: number
    waveAmplitude?: number
    particleSize?: number
    lerpSpeed?: number
    color?: string
    autoAnimate?: boolean
    particleVariance?: number
    rotationSpeed?: number
    depthFactor?: number
    pulseSpeed?: number
    particleShape?: 'capsule' | 'sphere' | 'box' | 'tetrahedron'
    fieldStrength?: number
}

const AntigravityInner = ({
    count = 200, // Reduced count further for smoother performance
    magnetRadius = 25,
    ringRadius = 25,
    waveSpeed = 0.8,
    waveAmplitude = 4,
    particleSize = 1.3,
    lerpSpeed = 0.08,
    color = '#06b6d4',
    autoAnimate = true,
    particleVariance = 1.2,
    rotationSpeed = 0.2,
    depthFactor = 1.5,
    pulseSpeed = 4,
    particleShape = 'capsule',
    fieldStrength = 15
}: AntigravityInnerProps) => {
    const meshRef = useRef<THREE.InstancedMesh>(null)
    const { viewport } = useThree()
    const dummy = useMemo(() => new THREE.Object3D(), [])

    // OptimizedRefs to avoid re-creation
    const lastMousePos = useRef({ x: 0, y: 0 })
    const lastMouseMoveTime = useRef(0)
    const virtualMouse = useRef({ x: 0, y: 0 })

    const particles = useMemo(() => {
        const temp = []
        const width = viewport.width || 100
        const height = viewport.height || 100

        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100
            const factor = 20 + Math.random() * 100
            const speed = 0.01 + Math.random() / 200
            const xFactor = -50 + Math.random() * 100
            const yFactor = -50 + Math.random() * 100
            const zFactor = -50 + Math.random() * 100

            const x = (Math.random() - 0.5) * width
            const y = (Math.random() - 0.5) * height
            const z = (Math.random() - 0.5) * 20

            const randomRadiusOffset = (Math.random() - 0.5) * 2

            temp.push({
                t,
                factor,
                speed,
                xFactor,
                yFactor,
                zFactor,
                mx: x,
                my: y,
                mz: z,
                cx: x,
                cy: y,
                cz: z,
                vx: 0,
                vy: 0,
                vz: 0,
                randomRadiusOffset
            })
        }
        return temp
    }, [count, viewport.width, viewport.height])

    useFrame((state) => {
        const mesh = meshRef.current
        if (!mesh) return

        const { viewport: v, pointer: m } = state

        // Optimization: Skip calculation if frame delta is too high (lag spike mitigation) or just clamp

        const mouseDist = Math.sqrt(Math.pow(m.x - lastMousePos.current.x, 2) + Math.pow(m.y - lastMousePos.current.y, 2))

        if (mouseDist > 0.001) {
            lastMouseMoveTime.current = Date.now()
            lastMousePos.current = { x: m.x, y: m.y }
        }

        let destX = (m.x * v.width) / 2
        let destY = (m.y * v.height) / 2

        // Auto-animate only if mouse idle
        if (autoAnimate && Date.now() - lastMouseMoveTime.current > 2000) {
            const time = state.clock.getElapsedTime()
            destX = Math.sin(time * 0.5) * (v.width / 4)
            destY = Math.cos(time * 0.5 * 2) * (v.height / 4)
        }

        // Smooth mouse movement
        const smoothFactor = 0.05
        virtualMouse.current.x += (destX - virtualMouse.current.x) * smoothFactor
        virtualMouse.current.y += (destY - virtualMouse.current.y) * smoothFactor

        const targetX = virtualMouse.current.x
        const targetY = virtualMouse.current.y

        const globalRotation = state.clock.getElapsedTime() * rotationSpeed

        // Batch updates for performance
        for (let i = 0; i < count; i++) {
            const particle = particles[i]
            let { t, speed, mx, my, mz, cz, randomRadiusOffset } = particle

            // Update time
            particle.t += speed / 2
            t = particle.t

            const projectionFactor = 1 - cz / 50
            const projectedTargetX = targetX * projectionFactor
            const projectedTargetY = targetY * projectionFactor

            const dx = mx - projectedTargetX
            const dy = my - projectedTargetY

            // Optimization: Simple Manhattan distance check before expensive sqrt
            // if (Math.abs(dx) > magnetRadius && Math.abs(dy) > magnetRadius) { ... }

            const dist = Math.sqrt(dx * dx + dy * dy)

            let targetPos = { x: mx, y: my, z: mz * depthFactor }

            if (dist < magnetRadius) {
                const angle = Math.atan2(dy, dx) + globalRotation
                const wave = Math.sin(t * waveSpeed + angle) * (0.5 * waveAmplitude)
                const deviation = randomRadiusOffset * (5 / (fieldStrength + 0.1))
                const currentRingRadius = ringRadius + wave + deviation

                targetPos.x = projectedTargetX + currentRingRadius * Math.cos(angle)
                targetPos.y = projectedTargetY + currentRingRadius * Math.sin(angle)
                targetPos.z = mz * depthFactor + Math.sin(t) * (1 * waveAmplitude * depthFactor)
            }

            particle.cx += (targetPos.x - particle.cx) * lerpSpeed
            particle.cy += (targetPos.y - particle.cy) * lerpSpeed
            particle.cz += (targetPos.z - particle.cz) * lerpSpeed

            dummy.position.set(particle.cx, particle.cy, particle.cz)
            dummy.lookAt(projectedTargetX, projectedTargetY, particle.cz)
            dummy.rotateX(Math.PI / 2)

            const currentDistToMouse = Math.sqrt(
                Math.pow(particle.cx - projectedTargetX, 2) + Math.pow(particle.cy - projectedTargetY, 2)
            )

            const distFromRing = Math.abs(currentDistToMouse - ringRadius)
            let scaleFactor = 1 - distFromRing / 10
            scaleFactor = Math.max(0, Math.min(1, scaleFactor))

            const finalScale = scaleFactor * (0.8 + Math.sin(t * pulseSpeed) * 0.2 * particleVariance) * particleSize
            dummy.scale.set(finalScale, finalScale, finalScale)

            dummy.updateMatrix()
            mesh.setMatrixAt(i, dummy.matrix)
        }

        mesh.instanceMatrix.needsUpdate = true
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            {particleShape === 'capsule' && <capsuleGeometry args={[0.12, 0.45, 4, 8]} />}
            <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.8} />
        </instancedMesh>
    )
}

export default function AntigravityBackground() {
    return (
        <div className="fixed inset-0 -z-50 bg-[#0a0e17]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e17] via-[#0f172a] to-[#020617]" />
            <div className="absolute inset-0 opacity-80">
                {/* Pixel Ratio Optimization: Cap DPR at 1.5 to prevent lag on 4K/Retina screens */}
                <Canvas
                    camera={{ position: [0, 0, 50], fov: 35 }}
                    dpr={[1, 1.5]}
                    performance={{ min: 0.5 }}
                >
                    <AntigravityInner
                        color="#22d3ee"
                        magnetRadius={25}
                        ringRadius={25}
                        count={200}
                        particleSize={1.3}
                        particleShape="capsule"
                    />
                </Canvas>
            </div>
        </div>
    )
}
