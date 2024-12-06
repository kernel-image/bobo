// @ts-nocheck
import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import vertex from './glsl/shader.vert'
import fragment from './glsl/shader.frag'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { extendMaterial } from '@/helpers/shaders/ExtendMaterial'

const CustomNoise = shaderMaterial(
  {
    uColorMain: new THREE.Color(1.0, 1.0, 1.0),
    uColorNoise: new THREE.Color(0.0, 0.0, 0.0),
    uOctaves: 1.0,
    uContrast: 1.0,
    uGain: 1.0,
    uLevel: 0.0,
    uScale: 1.0,
    uSeed: 0.0,
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
