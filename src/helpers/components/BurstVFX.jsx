import { useRef, useEffect, useState, use } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { CustomBurst } from '@/helpers/shaders/burstShader/burstShader'
import { Color } from 'three'

function BurstSprite({ x, y, z, color = new Color(1.0, 0.65, 0.0), lifespan = 0.333 }) {
  const spriteRef = useRef()
  const burstMat = new CustomBurst({
    color: color,
    progress: 0,
  })
  const rotationDirection = Math.random() > 0.5 ? 1 : -1
  const [position, setPosition] = useState([x, y, z])

  useEffect(() => {
    setPosition([x, y, z])
  }, [x, y, z])

  useEffect(() => {
    if (position) {
      // Remove the sprite after the timer hits end of lifespan
      const timer = setTimeout(() => {
        setPosition(null)
      }, lifespan * 1000)

      return () => {
        clearTimeout(timer)
      }
    }
  }, [position, lifespan])

  useFrame((state, delta) => {
    if (spriteRef.current) {
      spriteRef.current.material.progress += delta //shader animation
      spriteRef.current.rotation.z += delta * rotationDirection
    }
  })
  if (!position) return null
  return (
    <Billboard position={position}>
      <sprite ref={spriteRef} args={[1, 1]} material={burstMat} />
    </Billboard>
  )
}

export { BurstSprite }
