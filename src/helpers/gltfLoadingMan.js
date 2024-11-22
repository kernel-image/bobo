import { useGLTF } from '@react-three/drei'

const useModels = (serverPath) => {
    const dracoPath = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
    //bobo clown toy
    const { scene: bobo } = useGLTF(`${serverPath}/models//bobo.glb`, dracoPath)
    //level meshes
    const { nodes: levelNodes } = useGLTF(`${serverPath}/models/level.glb`, dracoPath)
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
    const {scene: boxingGloveScene } = useGLTF(`${serverPath}/models/player.glb`, dracoPath)
    const boxingGlove = boxingGloveScene.children[0]

    return {bobo, levelMeshes, levelColliders, boxingGlove}
}

export { useModels }