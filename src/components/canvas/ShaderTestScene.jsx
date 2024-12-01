import { PerspectiveCamera } from '@react-three/drei'
import { MeshFresnelMaterial } from '@/helpers/shaders/fresnelShader/fresnelShader'

const SceneContent = () => {
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

export { SceneContent }
