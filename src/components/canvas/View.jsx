'use client'

import { forwardRef, Suspense, useImperativeHandle, useRef } from 'react'
import { PerspectiveCamera, View as ViewImpl } from '@react-three/drei'
import { Three } from '@/helpers/components/Three'
//import useShadowHelper from '@/helpers/useShadowHelper'

export const Lights = () => {
  //const lightRef = useRef()
  //useShadowHelper(lightRef)
  return (
    <Suspense fallback={null}>
      <ambientLight intensity={0.5} />
      <directionalLight
        //ref={lightRef}
        position={[0.1, 5, 0]}
        intensity={4}
        castShadow={true}
        shadow-mapSize={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={5.5}
        shadow-camera-left={-2.8}
        shadow-camera-right={2.8}
        shadow-camera-top={2.8}
        shadow-camera-bottom={-2.8}
      />
    </Suspense>
  )
}

export const Camera = ({ position }) => <PerspectiveCamera makeDefault fov={90} position={position} />

const View = forwardRef(({ children, ...props }, ref) => {
  const localRef = useRef(null)
  useImperativeHandle(ref, () => localRef.current)

  return (
    <>
      <div ref={localRef} {...props} />
      <Three>
        <ViewImpl track={localRef}>{children}</ViewImpl>
      </Three>
    </>
  )
})
View.displayName = 'View'

export { View }
