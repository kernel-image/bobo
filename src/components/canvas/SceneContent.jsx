'use client'

import { useSpring, useSprings, animated, config } from '@react-spring/three'
import { useGLTF, PerspectiveCamera } from '@react-three/drei'
import { useEffect, useRef, useState} from 'react'
import { MeshStandardMaterial, Vector3, Euler } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Physics, RigidBody, MeshCollider, BallCollider } from '@react-three/rapier'
import { rotateAroundPoint } from '@/helpers/rotateAroundPoint'

const SceneContent = () =>  {
  const PLAYER_HEIGHT = 1.5
  const BOBO_MASS = 4;
  const GLOVE_MASS = 50;
  const WORLD_UP_VECTOR = new Vector3(0, 1, 0);

  const boboRef = useRef(null);
  const cameraRef = useRef(null);
  const floorRef = useRef(null);
  const gloveLeftRB = useRef(null);
  const gloveRightRB = useRef(null);
  const boboRB = useRef(null);
  const camRB = useRef(null);
  const { raycaster } = useThree();

  let punching = [false, false]


  ////////////////////////////
  //loaders
  //////////////////////////
  const dracoPath = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'

  const { scene: bobo } = useGLTF('/bobo.glb', dracoPath)
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
  const playerGltf = useGLTF('/player.glb', dracoPath)
  //confirm load
  if (!bobo || !levelNodes || !playerGltf) {
    console.log('loading failure')
    return null
  }

  ////////////////////////////
  //materials
  //////////////////////////
  const levelMaterial = new MeshStandardMaterial({ color: '#333333' });
  const gloveMaterial = new MeshStandardMaterial({ color: 'red'});
  const testMaterial = new MeshStandardMaterial({ color: 'green', alphaTest: 2});


  ////////////////////////////
  // config
  //////////////////////////
  const boxingGlove = playerGltf.scene.children[0] //scene didn't contain a mesh?
  const gloveOrigins = {
    right: [0.5, -0.5, -0.8],
    left: [-0.5, -0.5, -0.8],
  }
  //compute bobo bounding box
  useEffect(() => {
    if (bobo) {
      bobo.children[0].geometry.computeBoundingBox()
    }
  }, [bobo])


  ///////////////////////////////////
  // animation
  /////////////////////////////////

  //camera spring
  const camOrigin = [0, PLAYER_HEIGHT, 1.5]
  const [camPosition, setCamPosition] = useState(camOrigin);
  const [nextCamPosition, setNextCamPosition] = useState(camPosition)
  const [camRotation, setCamRotation] = useState([0, 0, 0])
  const [nextCamRotation, setNextCamRotation] = useState(camRotation)
  const [camSpring, camSpringApi] = useSpring(() => ({
    from: { position: camPosition, rotation: camRotation},
    to: { position: nextCamPosition, rotation: nextCamRotation},
    config: config.molasses,
    immediate: false,
    onChange: () => updateKinematicObjects(),
    onRest: () => {
      const restPos = camSpring.position.get()
      const currentPos = [restPos[0], PLAYER_HEIGHT, restPos[2]]
      //ref properties are not updated automatically
      //console.log(`current pos: ${currentPos} camera pos: ${cameraRef.current.position.toArray()}`)
      setCamPosition(currentPos)
      const restRot = camSpring.rotation.get()
      setCamRotation(restRot)
    }
    
  }), [camPosition, nextCamPosition, camRotation, nextCamRotation])

  //idle hands spring
  const [idleHands, idleHandsApi] = useSpring(() => ({
    from: { position: [0, 0, 0], rotation: [0, Math.PI / 80, Math.PI / 100]},
    to: { position: [0, -0.1, 0], rotation: [0, Math.PI / -80, Math.PI / -100]},
    loop: {reverse: true},
    config: {
      mass: 1,
      tension: 15,
      friction: 1,
      precision: 0.0035,
    },
  }), [])

  //punch spring
  let target = new Vector3();
  const [leftTarget, setLeftTarget] = useState(gloveOrigins.left);
  const [rightTarget, setRightTarget] = useState(gloveOrigins.right);
  const gloveSpringConfig = {
    mass: 1,
    tension: 400,
    friction: 10,
    velocity: .01,
    precision: 0.2
  }

  const [springs, springsApi] = useSprings(2,[{
    from: { position: gloveOrigins.left },
    to: [{ position: leftTarget }, {position: gloveOrigins.left}],
    config: gloveSpringConfig,
    onChange: () => updateKinematicObjects(),
    onRest: () => stopPunchingState(0),
  },
  {
    from: { position: gloveOrigins.right },
    to: [{ position: rightTarget}, {position: gloveOrigins.right}],
    config: gloveSpringConfig,
    onChange: () => updateKinematicObjects(),
    onRest: () => stopPunchingState(1),
  }], [target]);

  const shouldPunchRight = (worldPoint) => {
    const camPos = camSpring.position.get()
    const camVec = new Vector3(camPos[0], camPos[1], camPos[2])
    const boboToCamera = camVec.clone().sub(boboRef.current.position)
    const up = new Vector3(0, 1, 0)
    const right = up.clone().cross(boboToCamera)
    const cameraToPoint = new Vector3(worldPoint.x, worldPoint.y, worldPoint.z).sub(camVec)
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
      
    } else {
      if (leftTarget.some((value, index) => value !== gloveOrigins.left[index])) {
        setLeftTarget(gloveOrigins.left)
      }
    }
  }


  ////////////////////////////
  //click handlers
  //////////////////////////
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

  const handleBoboClick = (event) => {
    event.stopPropagation()
    console.log('bobo clicked')
    target = getRaycastHit(raycaster, event, cameraRef.current, boboRef)
    if (target) {
      //console.log(`hit ${target.toArray()}`)
      if (shouldPunchRight(target)) {
        if (!punching[1]) {
          setRightTarget(cameraOffset(target))
          startPunchingState(1)
        }
      } else {
        if (!punching[0]) {
          setLeftTarget(cameraOffset(target))
          startPunchingState(0)
        }
      }
    }
  }

  const handleLevelClick = (event, naviagateToPoint) => {
    event.stopPropagation()
    //console.log('level clicked')
    if (!punching.right && !punching.left) {
      let nextPos;
      if (naviagateToPoint) {
        target = getRaycastHit(raycaster, event, cameraRef.current, floorRef)
        if (target) {
          nextPos = [target.x, PLAYER_HEIGHT, target.z]
          //console.log(`move to ${nextPos}`)
          setNextCamPosition(nextPos)
        }
      }else{
        //recenter
        nextPos = [0, PLAYER_HEIGHT, 0]
        setNextCamPosition(nextPos)
      }
      const nextRotation = getNextRotation(nextPos, boboRB.current.translation())
      //console.log(`next rotation: ${nextRotation}`)
      setNextCamRotation(nextRotation)
    }
  }

  const cameraOffset = (vec) => {
    return cameraRef.current.worldToLocal(vec).toArray()
  }

  const getNextRotation = (nextPos, lookTargetPos) => {
    const nextPosVector = new Vector3(nextPos[0], nextPos[1], nextPos[2])
    const targetDirection = new Vector3().subVectors(lookTargetPos, nextPosVector).normalize();
    const nextRotation = Math.atan2(-targetDirection.x, -targetDirection.z);
    return [0, nextRotation, 0]
  }

  ///////////////////////////
  //physics handlers
  /////////////////////////
  const updateKinematicObjects = () => {
    const camPos = camSpring.position.get()
    camRB.current.setNextKinematicTranslation({x: camPos[0], y: camPos[1], z: camPos[2]})
    //console.log(`camera position: ${camPos}`)
    const rightGlovePos = springs[1].position.get()
    const rightGloveWorldPos = cameraRef
    //console.log(rightGlovePos)
    const nextPosRightGlove = rotateAroundPoint({x: rightGlovePos[0] + camPos[0], y:  rightGlovePos[1] + camPos[1], z: rightGlovePos[2] + camPos[2]},
    {x: camPos[0], y: camPos[1], z: camPos[2]}, [0, camSpring.rotation.get()[1], 0])
    //console.log(nextPosRightGlove)
    gloveRightRB.current.setNextKinematicTranslation(nextPosRightGlove)
    //console.log('right glove position:')
    //console.log(gloveRightRB.current.translation())
    const leftGlovePos = springs[0].position.get()
    //console.log(leftGlovePos)
    const nextPosLeftGlove = rotateAroundPoint({x: leftGlovePos[0]+ camPos[0], y: leftGlovePos[1] + camPos[1], z: leftGlovePos[2] + camPos[2]},
    {x: camPos[0], y: camPos[1], z: camPos[2]}, [0, camSpring.rotation.get()[1], 0])
    //console.log(nextPosLeftGlove)
    gloveLeftRB.current.setNextKinematicTranslation(nextPosLeftGlove)
    
  }

  const handleCollision = (e) => {
    console.log(`${e.other.rigidBodyObject.name} hit ${e.target.rigidBodyObject.name}`)
    //console.log(e)
  
  }

  const calcCylinderAngularInertia = (radius, height, mass) => {
    //https://en.wikipedia.org/wiki/List_of_moments_of_inertia
    const perpendicularAxes = (mass * (3 * radius * radius + height * height)) / 3.0; //assuming center of mass is at the bottom, divide by 12 if center of mass is at the middle
    const parallelAxes = (mass * radius * radius) / 2.0;
    return {x: perpendicularAxes, y: parallelAxes, z: perpendicularAxes};
  }

  const getBoboAngularInertia = (mass) => {
    let size = new Vector3();
    boboRef.current.children[0].geometry.boundingBox.getSize(size);
    const radius = size.x / 2;
    const height = size.y;
    return calcCylinderAngularInertia(radius, height, mass)
  }


  //initialize bobo rigidbody mass properties
  useEffect(() => {
    if (boboRB.current) {
      //boboRB.current.colliderSet.forEach((collider) => collider.density(3))
      const collider = boboRB.current.colliderSet.getAll()[0]
      boboRB.current.colliderSet.forEach((collider) =>
        collider.setMassProperties(
          BOBO_MASS, //mass
          boboRB.current.translation(), //centerOfMass
          getBoboAngularInertia(BOBO_MASS), //principalAngularInertia
          { w: 1.0, x: 0.0, y: 0.0, z: 0.0 } //angularInertiaLocalFrame
        ),
      )
    }
  }, [boboRB])

  //bobo self balancing forces
  let angularVelocity = { x: 0, y: 0, z: 0 }
  let rotation = { x: 0, y: 0, z: 0 };
  let axis = new Vector3();
  let objUpWorld = new Vector3();
  let angle = 0;
  let torque = 0;
  useFrame((state, delta) => {
      rotation = boboRB.current.rotation()
      angularVelocity = boboRB.current.angvel();
      if (Math.abs(rotation.x) < 0.025 && Math.abs(rotation.z) < 0.025 || Math.abs(angularVelocity.x) > 1 || Math.abs(angularVelocity.z) > 1){
        boboRB.current.resetTorques();
      }else{
        objUpWorld = WORLD_UP_VECTOR.clone().applyEuler(new Euler(rotation.x, rotation.y, rotation.z, 'XYZ'));
        axis = new Vector3().crossVectors( objUpWorld, WORLD_UP_VECTOR );
        angle = Math.acos(objUpWorld.dot(WORLD_UP_VECTOR));
        torque = axis.clone().multiplyScalar(angle * delta * 500);
        boboRB.current.addTorque({ x: torque.x + angularVelocity.x * -1, y: 0, z: torque.z + angularVelocity.z * -1}, true);
      }
  })

  return (
    <group>
      <Physics debug>
        <animated.group position={camSpring.position} rotation={camSpring.rotation}>
          <PerspectiveCamera makeDefault fov={90} ref={cameraRef}>
            <animated.group position={idleHands.position} rotation={idleHands.rotation}>
              {/*Left Glove*/}
              <animated.mesh
                args={[boxingGlove.geometry, gloveMaterial, 2]}
                rotation={[Math.PI * -0.5, Math.PI * 0.8, Math.PI * 0.2]}
                position={springs[0].position}
              ></animated.mesh>
              {/*Right Glove*/}
              <animated.mesh
                args={[boxingGlove.geometry, gloveMaterial, 2]}
                rotation={[Math.PI * -0.25, Math.PI * 1.1, Math.PI * -0.2]}
                position={springs[1].position}
                scale={[-1, 1, 1]}
              ></animated.mesh>
            </animated.group>
          </PerspectiveCamera>
        </animated.group>

        {/* Kinematic Rigidbodies */}
        <RigidBody name='leftHand' type='kinematicPosition' ref={gloveLeftRB} ccd={true} mass={GLOVE_MASS}>
          <BallCollider args={[0.25]} />
        </RigidBody>
        <RigidBody name='rightHand' type='kinematicPosition' ref={gloveRightRB} ccd={true} mass={GLOVE_MASS}>
          <BallCollider args={[0.25]} />
        </RigidBody>
        <RigidBody name='camRB' type='kinematicPosition' ref={camRB}>
          <BallCollider args={[1]} />
        </RigidBody>

        {/*Bobo*/}
        <RigidBody
          name='bobo'
          type='dynamic'
          colliders={false}
          position={[0, 0.001, -2]}
          restitution={0.6}
          friction={0.1}
          linearDamping={0.5}
          angularDamping={0.6}
          ccd={true}
          onCollisionEnter={handleCollision}
          ref={boboRB}
        >
          <MeshCollider
            name='boboCollider'
            type='hull'
            args={{ massProperties: { mass: 10, centerOfMass: { x: 0, y: 0.01, z: -2 } } }}
          >
            <primitive ref={boboRef} object={bobo} onClick={handleBoboClick} />
          </MeshCollider>
        </RigidBody>

        {/* level colliders */}
        <RigidBody name='level' type='fixed' colliders={false}>
          {levelColliders.map((obj) => (
            <MeshCollider
              key={obj.name}
              type='cuboid'
              args={[0.5, 1]}
              position={[0, 0.75, 0]}
              centerOfMass={[0, 0, 0]}
              restitution={0.1}
              friction={0.5}
            >
              <primitive object={obj} material={testMaterial} />
            </MeshCollider>
          ))}
        </RigidBody>


      </Physics>

      {/*Level Geometry*/}
      {levelMeshes.map((obj) => {
        const isFloor = obj.name.includes('floor')
        return (
          <primitive
            key={obj.name}
            object={obj}
            material={levelMaterial}
            onClick={ (e) => handleLevelClick(e, isFloor) }
            ref={isFloor ? floorRef : null}
          />
        )
      })}
    </group>
  )
}

export { SceneContent }