import { PerspectiveCamera, OrbitControls } from '@react-three/drei'
import { MeshFresnelMaterial } from '@/helpers/shaders/fresnelShader/fresnelShader'
import { MeshRaysMaterial } from '@/helpers/shaders/raysShader/raysShader'
import { MeshStripeMaterial } from '@/helpers/shaders/raysShader/stripeShader'
import { MeshBurstMaterial } from '@/helpers/shaders/burstShader/burstShader'
import { MeshNoiseMaterial } from '@/helpers/shaders/noiseShader/noiseShader'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Color } from 'three'

const FresnelTest = () => {
  return (
    <>
      <mesh position={[1, 0, 0]}>
        <sphereGeometry args={[2, 32, 32]} />
        <MeshFresnelMaterial colorMain='blue' colorFresnel='#222222' power={0.5} />
      </mesh>

      <mesh position={[-1, 0, 0]}>
        <sphereGeometry args={[2, 32, 32]} />
        <MeshFresnelMaterial colorMain='red' colorFresnel='white' power={0.9} />
      </mesh>

      <PerspectiveCamera makeDefault fov={90} position={[0, 0, 10]} />
    </>
  )
}

const TentRays = () => {
  const rays = 16
  const color1 = 'red'
  const color2 = 'blue'
  return (
    <>
      <OrbitControls />
      <mesh position={[0, 1, 0]}>
        <coneGeometry args={[2, 1, 32]} />
        <MeshRaysMaterial rays={rays} color1={color1} color2={color2} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[2, 2, 1, 32]} />
        <MeshRaysMaterial rays={rays} color1={color1} color2={color2} />
      </mesh>
    </>
  )
}

const TentStripes = () => {
  const rays = 16
  const color1 = 'yellow'
  const color2 = 'blue'
  return (
    <>
      <OrbitControls />
      <mesh position={[0, 1, 0]}>
        <coneGeometry args={[2, 1, 32, 1, true]} />
        <MeshStripeMaterial rays={rays} color1={color1} color2={color2} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[2, 2, 1, 32, 1, true]} />
        <MeshStripeMaterial rays={rays} color1={color1} color2={color2} />
      </mesh>
    </>
  )
}

const TentInside = () => {
  const rays = 16
  const color1 = 'yellow'
  const color2 = 'blue'
  const cullMode = 1
  return (
    <>
      <OrbitControls />
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1, 1, 1, 32]} attach={'geometry'} />
        <MeshRaysMaterial rays={rays} color1={color1} color2={color2} side={cullMode} attach='material' />
      </mesh>
    </>
  )
}

const Burst = () => {
  const color = 'orange'
  const materialRef = useRef()
  let progress = 0

  useFrame((state, delta) => {
    materialRef.current.progress += delta
  })
  return (
    <>
      <OrbitControls />
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[6, 6]} attach={'geometry'} />
        <MeshBurstMaterial ref={materialRef} color={color} progress={progress} attach='material' />
      </mesh>
    </>
  )
}

const Noise = () => {
  return (
    <>
      <OrbitControls />
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[6, 6]} attach={'geometry'} />
        <MeshNoiseMaterial
          uColorMain={new Color(0.4, 0.4, 0.6)}
          uColorNoise={new Color(0.6, 0.6, 0.75)}
          uContrast={0.8}
          uGain={1.1}
          uLevel={0.07}
          uScale={3}
          uOctaves={4}
          uSeed={3}
        />
      </mesh>
    </>
  )
}

export { FresnelTest, TentRays, TentStripes, TentInside, Burst, Noise }
