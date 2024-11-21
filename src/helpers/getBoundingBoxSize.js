import { Vector3 } from 'three'

const getBoundingBoxSize = (object3D) => {
    object3D.geometry.computeBoundingBox()
    const bbox = object3D.geometry.boundingBox
    let size = new Vector3()
    bbox.getSize(size)
    return {bbox, size}
}

export { getBoundingBoxSize }