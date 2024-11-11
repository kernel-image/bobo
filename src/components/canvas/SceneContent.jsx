import { useGLTF } from '@react-three/drei'
import { MeshStandardMaterial } from 'three'


function SceneContent() {

  //loaders

  const dracoPath = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'

  const { scene: bobo } = useGLTF('/bobo.glb', dracoPath)
  const { nodes: levelNodes } = useGLTF('/level.glb', dracoPath)
  const playerGltf = useGLTF('/player.glb', dracoPath)

  if (!bobo || !levelNodes || !playerGltf) {
    console.log('loading failure')
    return null
  }

  const boxingGlove = playerGltf.scene.children[0] //scene didn't contain a mesh?

  //materials
  const levelMaterial = new MeshStandardMaterial({ color: '#333333' });
  const gloveMaterial = new MeshStandardMaterial({ color: 'red' });

  //click handlers

  const handleBoboClick = (event) => {
    event.stopPropagation()
    console.log('bobo clicked')
  }

  const handleLevelClick = (event) => {
    event.stopPropagation()
    console.log('level clicked')
  }

  return (
    <group>
      {/*Level*/}
      {levelNodes.Scene.children.map((child) => {
        if (child.name.indexOf('_mesh') !== -1){
          return (
            <primitive
              key={child.name}
              object={child}
              material={levelMaterial}
              onClick={handleLevelClick}
            />
          )
        }
      })}
      {/*Bobo*/}
      <primitive
          object={bobo}
          material={bobo.material}
          onClick={handleBoboClick}
          position={[0, 0, -2]}
        />

      {/*Right Glove*/}
      <instancedMesh
        args={[boxingGlove.geometry, gloveMaterial, 2]}
        rotation={[Math.PI * -0.4, Math.PI * 0.8, Math.PI * -.1]}
        position={[1, 1, 0.5]}
        scale={[-0.025, 0.025, 0.025]}
      />
      {/*Left Glove*/}
      <instancedMesh
        args={[boxingGlove.geometry, gloveMaterial, 2]}
        rotation={[Math.PI * -0.5, Math.PI * 0.8, Math.PI * 0.2]}
        position={[-1, 1, 0.5]}
        scale={0.025}
      />
    </group>
  )
}

export default SceneContent
