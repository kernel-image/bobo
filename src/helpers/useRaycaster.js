import { useThree } from "@react-three/fiber";

const useRaycaster = () => {
    const { raycaster, scene } = useThree();
    const getRaycastHit = (screenCoord, camera, meshObj) => {
        // Update the raycaster
        raycaster.setFromCamera(screenCoord, camera)
        // Check for intersections with the mesh
        const intersects = raycaster.intersectObject(meshObj)
        if (intersects.length > 0) {
            const intersection = intersects[0]
            const worldPoint = intersection.point
            return worldPoint
        }
        return null
    }
    return getRaycastHit
}

export { useRaycaster } 
