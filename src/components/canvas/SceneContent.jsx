'use client'

import { useSpring, useSprings, animated } from '@react-spring/three'
import { useGLTF, PerspectiveCamera } from '@react-three/drei'
import { useEffect, useRef, useState} from 'react'
import { Euler, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import { useThree } from '@react-three/fiber'


const SceneContent = () =>  {
  const playerHeight = 1.5
  const boboRef = useRef(null);
  const cameraRef = useRef(null);
  const floorRef = useRef(null);
  const { raycaster } = useThree();


  useEffect(() => {
    console.log('scene rendered')
  }, [])



  //loaders

  const dracoPath = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'

  const { scene: bobo } = useGLTF('/bobo.glb', dracoPath)
  const { nodes: levelNodes } = useGLTF('/level.glb', dracoPath)
  const levelMeshes = Object.values(levelNodes).filter((value) => {
    if (value.name.includes('_mesh')){
      return value
    }
  })
  
  const playerGltf = useGLTF('/player.glb', dracoPath)

  if (!bobo || !levelNodes || !playerGltf) {
    console.log('loading failure')
    return null
  }

  //materials
  const levelMaterial = new MeshStandardMaterial({ color: 'white', wireframe: true });
  const gloveMaterial = new MeshStandardMaterial({ color: 'red'});
  
  // config
  const boxingGlove = playerGltf.scene.children[0] //scene didn't contain a mesh?
  const gloveOrigins = {
    right: [0.5, -0.5, -0.4],
    left: [-0.5, -0.5, -0.4],
  }

  //animation

  //camera spring
  const camOrigin = [0, playerHeight, 1.5]
  const [camPosition, setCamPosition] = useState(camOrigin);
  const [nextCamPosition, setNextCamPosition] = useState(camPosition)
  const [camRotation, setCamRotation] = useState([0, 0, 0])
  const [nextCamRotation, setNextCamRotation] = useState(camRotation)
  const [camSpring, camSpringApi] = useSpring(() => ({
    from: { position: camPosition, rotation: camRotation},
    to: { position: nextCamPosition, rotation: nextCamRotation},
    config: {
      mass: 1,
      tension: 200,
      friction: 10,
      velocity: .02,
      precision: 0.4
    },
    immediate: false,
    onRest: () => {
      const restPos = camSpring.position.get()
      const currentPos = [restPos[0], playerHeight, restPos[2]]
      //ref properties are not updated automatically
      //console.log(`current pos: ${currentPos} camera pos: ${cameraRef.current.position.toArray()}`)
      setCamPosition(currentPos)
      const restRot = camSpring.rotation.get()
      setCamRotation(restRot)
    }
    
  }), [camPosition, nextCamPosition, camRotation, nextCamRotation])


  //glove spring
  let target = new Vector3();
  const [leftTarget, setLeftTarget] = useState(gloveOrigins.left);
  const [rightTarget, setRightTarget] = useState(gloveOrigins.right);
  let punching = {0: false, 1: false}

  const [springs, springsApi] = useSprings(2,[{
    from: { position: gloveOrigins.left },
    to: [{ position: leftTarget }, {position: gloveOrigins.left}],
    config: {
      mass: 1,
      tension: 500,
      friction: 10,
      velocity: .01,
      precision: 0.3
    },
    immediate: false,
    //onStart: () => console.log('left punch started'),
    onRest: () => stopPunchingState(0),
  },
  {
    from: { position: gloveOrigins.right },
    to: [{ position: rightTarget}, {position: gloveOrigins.right}],
    config: {
      mass: 1,
      tension: 500,
      friction: 10,
      velocity: .01,
      precision: 0.3
    },
    immediate: false,
    //onStart: () => console.log('right punch started'), 
    onRest: () => stopPunchingState(1),
  }], [target]);
  
  
  const shouldPunchRight = (worldPoint) => {
    const camPos = camSpring.position.get()
    const camVec = new Vector3(camPos[0], camPos[1], camPos[2])
    const boboToCamera = camVec.clone().sub(boboRef.current.position)
    const up = new Vector3(0, 1, 0)
    const right = up.clone().cross(boboToCamera)
    const cameraToPoint = new Vector3(worldPoint.x, camPos.y, worldPoint.z).sub(camVec)
    const dot = right.dot(cameraToPoint)
    const isRight = dot > 0
    return isRight;
  };

  const startPunchingState = (key) => {
    punching[key] = true;
  }

  const stopPunchingState = (key) => {
    punching[key] = false;
    if (key) {
      if (rightTarget.some((value, index) => value !== gloveOrigins.right[index])) {
        setRightTarget(gloveOrigins.right)
      }
      else{
        //console.log("right hand at rest")
      }
      
    } else {
      if (leftTarget.some((value, index) => value !== gloveOrigins.left[index])) {
        setLeftTarget(gloveOrigins.left)
      }
      else{
        //console.log("left hand at rest")
      }
    }
  }

  //click handlers

  const getRaycastHit = (raycaster, event, camera, meshRef) => {
    const screenCoord = event.pointer
    // Update the raycaster
    raycaster.setFromCamera(screenCoord, camera)
    // Check for intersections with the mesh
    const intersects = raycaster.intersectObject(meshRef.current)
    if (intersects.length > 0) {
      const intersection = intersects[0]
      const worldPoint = intersection.point
      return worldPoint
    }
    return null
  }

  const cameraOffset = (vec) => {
    const camLocalCoords = cameraRef.current.worldToLocal(vec)
    return camLocalCoords.toArray()
  }

  const handleBoboClick = (event) => {
    event.stopPropagation()
    console.log('bobo clicked')
    target = getRaycastHit(raycaster, event, cameraRef.current, boboRef)
    if (target) {
      //console.log(`hit ${target.toArray()}`)
      if (shouldPunchRight(target)) {
        if (!punching.right) {
          setRightTarget(cameraOffset(target))
          startPunchingState(1)
        }
      } else {
        if (!punching.left) {
          setLeftTarget(cameraOffset(target))
          startPunchingState(0)
        }
      }
    }
  }

  const handleLevelClick = (event) => {
    event.stopPropagation()
    //console.log('level clicked')
    if (!punching.right && !punching.left) {
      target = getRaycastHit(raycaster, event, cameraRef.current, floorRef)
      if (target) {
        const nextPos = [target.x, playerHeight, target.z]
        //console.log(`move to ${nextPos}`)
        setNextCamPosition(nextPos)
        const nextRotation = getNextRotation(nextPos, boboRef.current.position)
        //console.log(`next rotation: ${nextRotation}`)
        setNextCamRotation(nextRotation)
      }
    }
  }

const getNextRotation = (nextPos, lookTargetPos) => {
  const nextPosVector = new Vector3(nextPos[0], nextPos[1], nextPos[2])
  const cameraForwardVector = new Vector3(0, 0, -1); // camera's local forward vector
  const cameraUpVector = new Vector3(0, 1, 0); // camera's local up vector
  const targetDirection = new Vector3().subVectors(lookTargetPos, nextPosVector).normalize();
  const targetQuaternion = new Quaternion();
  targetQuaternion.setFromUnitVectors(cameraForwardVector, targetDirection, cameraUpVector);
  const nextRotationEuler = new Euler().setFromQuaternion(targetQuaternion);
  return [0, nextRotationEuler.y, 0]
}



  return (
    <group>

    <animated.group position={camSpring.position} rotation = {camSpring.rotation}>
      <PerspectiveCamera makeDefault fov={90} ref={cameraRef}>
          {/*Right Glove*/}
          <animated.instancedMesh
            args={[boxingGlove.geometry, gloveMaterial, 2]}
            rotation={[Math.PI * -0.3, Math.PI * 0.9, Math.PI * -.2]}
            position={springs[1].position}
            scale={[-0.025, 0.025, 0.025]}
          />
          {/*Left Glove*/}
          <animated.instancedMesh
            args={[boxingGlove.geometry, gloveMaterial, 2]}
            rotation={[Math.PI * -0.5, Math.PI * 0.8, Math.PI * 0.2]}
            position={springs[0].position}
            scale={0.025}
          />
      </PerspectiveCamera>
    </animated.group>

    {/*Level*/}
    {levelMeshes.map((obj) => {const isFloor = obj.name.includes("floor"); return <primitive key={obj.name} object={obj} material={levelMaterial} onClick={isFloor ? handleLevelClick : null} ref={isFloor ? floorRef : null}/>})}
    
    {/*Bobo*/}
    <primitive
        ref={boboRef}
        object={bobo}
        material={bobo.material}
        onClick={handleBoboClick}
        position={[0, 0, -2]}
      />

    </group>
  )
}

export { SceneContent }