import { useTent } from '@/helpers/gltfLoadingMan'
import { MeshRaysMaterial } from '@/helpers/shaders/raysShader/raysShader'
import { useRouter } from 'next/navigation'
import { Clouds, Cloud } from '@react-three/drei'
import { MeshBasicMaterial } from 'three'
import { Camera } from './View'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

const SceneContent = () => {
  const tent = useTent('')
  const router = useRouter()
  const worldRef = useRef()

  useFrame((state, delta) => {
    if (worldRef.current) {
      worldRef.current.rotation.y += delta * 0.1
    }
  })

  return (
    <>
      <Camera />
      <group ref={worldRef} position={[0, 0, -3]}>
        <primitive
          object={tent}
          geometry={tent.geometry}
          position={[0, -1, 0]}
          scale={0.1}
          onClick={() => router.push('/tent')}
        >
          <MeshRaysMaterial rays={16} color1='purple' color2='black' attach='material' />
        </primitive>
        {
          <Clouds material={MeshBasicMaterial}>
            <Cloud
              position={[-1.95, 1.75, -1]}
              speed={0.2}
              opacity={0.95}
              scale={0.5}
              bounds={[1, 0.25, 0.25]}
              fade={2}
              growth={0.5}
            />
            <Cloud
              position={[3.5, 0.5, 0]}
              speed={0.1}
              opacity={0.95}
              scale={0.4}
              bounds={[2, 0.5, 0.5]}
              fade={4}
              growth={0.5}
            />
          </Clouds>
        }
        <mesh name='ground' position={[0, -2, 0]}>
          <cylinderGeometry args={[3.5, 3.5, 2, 32]} attach={'geometry'} />
          <meshBasicMaterial color='green' attach='material' />
        </mesh>
      </group>
    </>
  )
}

export { SceneContent }
