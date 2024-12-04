// @ts-nocheck
import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import vertex from './glsl/shader.vert'
import fragment from './glsl/shader.frag'
import { forwardRef, useImperativeHandle, useRef } from 'react'

const CustomRays = shaderMaterial(
  {
    color1: new THREE.Color(1.0, 1.0, 1.0),
    color2: new THREE.Color(1.0, 0.0, 0.0),
    rays: 32.0,
    cullMode: THREE.FrontSide,
  },
  vertex,
  fragment,
)

extend({ CustomRays })

// eslint-disable-next-line react/display-name
const MeshRaysMaterial = forwardRef(({ children, ...props }, ref) => {
  const localRef = useRef()

  useImperativeHandle(ref, () => localRef.current)

  return <customRays key={CustomRays.key} ref={localRef} glsl={THREE.GLSL3} {...props} attach='material' />
})

export { MeshRaysMaterial, CustomRays }
