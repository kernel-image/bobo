import { Vector3 } from "three";

const getLookatRotation = (lookFromPos, lookTargetVector) => {
    const lookFromVector = new Vector3(lookFromPos[0], lookFromPos[1], lookFromPos[2])
    const targetDirection = new Vector3().subVectors(lookTargetVector, lookFromVector).normalize();
    const nextRotation = Math.atan2(-targetDirection.x, -targetDirection.z);
    return [0, nextRotation, 0]
}

export { getLookatRotation}