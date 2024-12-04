// @ts-nocheck
import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import vertex from './glsl/shader.vert'
import fragment from './glsl/stripeShader.frag'
import { forwardRef, useImperativeHandle, useRef } from 'react'

const CustomStripes = shaderMaterial(
  {
    color1: new THREE.Color(1.0, 1.0, 1.0),
    color2: new THREE.Color(1.0, 0.0, 0.0),
    rays: 32.0,
  },
  vertex,
  fragment,
)

extend({ CustomStripes })

// eslint-disable-next-line react/display-name
const MeshStripeMaterial = forwardRef(({ children, ...props }, ref) => {
  const localRef = useRef()

  useImperativeHandle(ref, () => localRef.current)

  return <customStripes key={CustomStripes.key} ref={localRef} glsl={THREE.GLSL3} {...props} attach='material' />
})

export { MeshStripeMaterial }
