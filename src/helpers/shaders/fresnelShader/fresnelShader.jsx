// @ts-nocheck
import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import vertex from './glsl/shader.vert'
import fragment from './glsl/shader.frag'
import { forwardRef, useImperativeHandle, useRef } from 'react'

const CustomFresnel = shaderMaterial(
  {
    colorMain: new THREE.Color(1.0, 1.0, 0.0),
    colorFresnel: new THREE.Color(0.0, 0.0, 0.0),
    power: 5.0,
  },
  vertex,
  fragment,
)

extend({ CustomFresnel })

// eslint-disable-next-line react/display-name
const MeshFresnelMaterial = forwardRef(({ children, ...props }, ref) => {
  const localRef = useRef()

  useImperativeHandle(ref, () => localRef.current)

  return <customFresnel key={CustomFresnel.key} ref={localRef} glsl={THREE.GLSL3} {...props} attach='material' />
})

export { MeshFresnelMaterial }
