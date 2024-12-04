import { useTent } from '@/helpers/gltfLoadingMan'
import { MeshRaysMaterial } from '@/helpers/shaders/raysShader/raysShader'
import { useRouter } from 'next/navigation'
import { OrbitControls } from '@react-three/drei'

const SceneContent = () => {
  const tent = useTent('')
  const router = useRouter()
  return (
    <>
      <OrbitControls />

      <primitive
        object={tent}
        geometry={tent.geometry}
        position={[2, -1, 0]}
        scale={0.1}
        onClick={() => router.push('/tent')}
      >
        <MeshRaysMaterial rays={16} color1='red' color2='blue' attach='material' />
      </primitive>
    </>
  )
}

export { SceneContent }
