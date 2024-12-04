'use client'

import { Canvas } from '@react-three/fiber'
import { Preload, Stats } from '@react-three/drei'
import { r3f } from '@/helpers/global'
import * as THREE from 'three'

export default function Scene({ ...props }) {
  const showStats = process.env.NODE_ENV === 'development'
  // Everything defined in here will persist between route changes, only children are swapped
  return (
    <Canvas
      {...props}
      shadows={'basic'}
      gl={{ shadowMap: { enabled: true } }}
      onCreated={(state) => {
        state.gl.toneMapping = THREE.AgXToneMapping
      }}
    >
      {/* @ts-ignore */}
      <r3f.Out />
      <Preload all />
      {showStats && <Stats />}
    </Canvas>
  )
}
