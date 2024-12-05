// @ts-nocheck
import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import vertex from './glsl/shader.vert'
import fragment from './glsl/shader.frag'
import { forwardRef, useImperativeHandle, useRef } from 'react'

const CustomBurst = shaderMaterial(
  {
    color: new THREE.Color(1.0, 0.65, 0.0),
    progress: 0,
  },
  vertex,
  fragment,
)

extend({ CustomBurst })

// eslint-disable-next-line react/display-name
const MeshBurstMaterial = forwardRef(({ children, ...props }, ref) => {
  const localRef = useRef()

  useImperativeHandle(ref, () => localRef.current)

  return <customBurst key={CustomBurst.key} ref={localRef} glsl={THREE.GLSL3} {...props} attach='material' />
})

export { MeshBurstMaterial, CustomBurst }
