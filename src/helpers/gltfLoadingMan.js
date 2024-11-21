import { useGLTF } from '@react-three/drei'

const useModels = () => {
    const dracoPath = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
    //bobo clown toy
    const { scene: bobo } = useGLTF('/bobo.glb', dracoPath)
    //level meshes
    const { nodes: levelNodes } = useGLTF('/level.glb', dracoPath)
    const levelMeshes = Object.values(levelNodes).filter((value) => {
    if (value.name.includes('_mesh')){
        return value
    }
    })
    const levelColliders = Object.values(levelNodes).filter((value) => {
    if (value.name.includes('_Collider')){
        return value
    }
    })
    //boxing glove
    const {scene: boxingGloveScene } = useGLTF('/player.glb', dracoPath)
    const boxingGlove = boxingGloveScene.children[0]

    return {bobo, levelMeshes, levelColliders, boxingGlove}
}

export { useModels }