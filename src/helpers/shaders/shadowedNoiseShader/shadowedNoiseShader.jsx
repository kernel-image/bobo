// @ts-nocheck
import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import vertex from './glsl/shader.vert'
import fragment from './glsl/shader.frag'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { UniformsLib } from 'three/src/renderers/shaders/UniformsLib'

const uniforms = {
  ...UniformsLib.lights,
  uColorMain: new THREE.Color(1.0, 1.0, 1.0),
  uColorNoise: new THREE.Color(0.0, 0.0, 0.0),
  uOctaves: 1.0,
  uContrast: 1.0,
  uGain: 1.0,
  uLevel: 0.0,
  uScale: 1.0,
  uSeed: 0.0,
}

const CustomShadowedNoise = shaderMaterial(uniforms, vertex, fragment, (material) => {
  if (material) {
    material.lights = true
  }
})

extend({ CustomShadowedNoise })

// eslint-disable-next-line react/display-name
const MeshShadowedNoiseMaterial = forwardRef(({ children, ...props }, ref) => {
  const localRef = useRef()

  useImperativeHandle(ref, () => localRef.current)

  return (
    <customShadowedNoise key={CustomShadowedNoise.key} ref={localRef} glsl={THREE.GLSL3} {...props} attach='material' />
  )
})

export { MeshShadowedNoiseMaterial, CustomShadowedNoise }
