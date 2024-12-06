// @ts-nocheck
import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import vertex from './glsl/shader.vert'
import fragment from './glsl/shader.frag'
import { forwardRef, useImperativeHandle, useRef } from 'react'

const CustomNoise = shaderMaterial(
  {
    colorMain: new THREE.Color(1.0, 1.0, 1.0),
    colorNoise: new THREE.Color(0.0, 0.0, 0.0),
    octaves: 1.0,
    contrast: 1.0,
    gain: 1.0,
    level: 0.0,
    scale: 1.0,
    seed: 0.0,
  },
  vertex,
  fragment,
)

extend({ CustomNoise })

// eslint-disable-next-line react/display-name
const MeshNoiseMaterial = forwardRef(({ children, ...props }, ref) => {
  const localRef = useRef()

  useImperativeHandle(ref, () => localRef.current)

  return <customNoise key={CustomNoise.key} ref={localRef} glsl={THREE.GLSL3} {...props} attach='material' />
})

export { MeshNoiseMaterial, CustomNoise }
