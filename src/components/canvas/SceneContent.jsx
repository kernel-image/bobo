'use client'

import { useSpring, useSprings, animated, config } from '@react-spring/three'
import { PerspectiveCamera, Text3D } from '@react-three/drei'
import { useEffect, useRef, useState} from 'react'
import { Vector3, Euler } from 'three'
import { useFrame } from '@react-three/fiber'
import { Physics, RigidBody, MeshCollider, BallCollider, CuboidCollider } from '@react-three/rapier'
import { rotateAroundPoint } from '@/helpers/rotateAroundPoint'
import { remap } from '@/helpers/Remap'
import { useSFX, useMusic } from '@/helpers/AudioManager'
import { useModels } from '@/helpers/gltfLoadingMan'
import { levelMaterial, gloveMaterial, testMaterial } from '@/helpers/materials'
import { useRaycaster } from '@/helpers/useRaycaster'
import { getBoundingBoxSize } from '@/helpers/getBoundingBoxSize'
import { getAngularInertia } from '@/helpers/getInertia'
import { getLookatRotation } from '@/helpers/getLookatRotation'

const SceneContent = () =>  {
  //constants
  const WORLD_UP_VECTOR = new Vector3(0, 1, 0);
  const PLAYER_HEIGHT = 1.5
  const CAM_ORIGIN = [0, PLAYER_HEIGHT, 1.5]
  const BOBO_MASS = 4;
  const BOBO_ORIGIN = [0, 0.001, -2]
  const GLOVE_MASS = 50;
  const GLOVE_ORIGINS = {
    right: [0.5, -0.5, -0.8],
    left: [-0.5, -0.5, -0.8],
  }
  //refs
  const boboRef = useRef(null);
  const cameraRef = useRef(null);
  const floorRef = useRef(null);
  const gloveLeftRB = useRef(null);
  const gloveRightRB = useRef(null);
  const boboRB = useRef(null);
  const camRB = useRef(null);
  //states
  const [round, setRound] = useState(0)
  const [swings, setSwings] = useState(0)
  const [points, setPoints] = useState(0)
  const [ko, setKO] = useState(false)
  let punching = [false, false]
  //functions
  const getRaycastHit = useRaycaster()
  const sfx = useSFX()
  const music = useMusic()

  ////////////////////////////
  //loaders
  //////////////////////////

  const models = useModels()
  const {bobo, levelMeshes, levelColliders, boxingGlove} = models

  ////////////////////////////
  // config
  //////////////////////////

  //compute bobo bounding box
  const { size: boboSize } = getBoundingBoxSize(bobo.children[0]);

  //autostart
  useEffect(() => {
    music();
    setRound(1)
  }, [music])

  //round transition

  useEffect(() => {
    console.log(`round ${round}`)
    sfx({id:'bell'});
    //respawn bobo
    if (round > 1) {
      setKO(true)
    }
  }, [round])

  useEffect(() => {
    const to = setTimeout(() => {
      setKO(false);
      sfx({id:'bell'});
    }, 5000);
    return () => clearTimeout(to);
  }, [ko])


  ///////////////////////////////////
  // animation
  /////////////////////////////////

  //camera spring
  const [camPosition, setCamPosition] = useState(CAM_ORIGIN);
  const [nextCamPosition, setNextCamPosition] = useState(camPosition)
  const [camRotation, setCamRotation] = useState([0, 0, 0])
  const [nextCamRotation, setNextCamRotation] = useState(camRotation)
  const [camSpring, camSpringApi] = useSpring(() => ({
    from: { position: camPosition, rotation: camRotation},
    to: { position: nextCamPosition, rotation: nextCamRotation},
    config: config.molasses,
    onChange: () => updateKinematicObjects(),
    onRest: () => {
      const restPos = camSpring.position.get()
      const currentPos = [restPos[0], PLAYER_HEIGHT, restPos[2]]
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
  const [leftTarget, setLeftTarget] = useState(GLOVE_ORIGINS.left);
  const [rightTarget, setRightTarget] = useState(GLOVE_ORIGINS.right);
  const gloveSpringConfig = {
    mass: 1,
    tension: 400,
    friction: 10,
    velocity: .01,
    precision: 0.2
  }

  const [springs, springsApi] = useSprings(2,[{
    from: { position: GLOVE_ORIGINS.left },
    to: [{ position: leftTarget }, {position: GLOVE_ORIGINS.left}],
    config: gloveSpringConfig,
    onChange: () => {updateKinematicObjects(); startPunchingState(0)},
    onRest: () => stopPunchingState(0),
  },
  {
    from: { position: GLOVE_ORIGINS.right },
    to: [{ position: rightTarget}, {position: GLOVE_ORIGINS.right}],
    config: gloveSpringConfig,
    onChange: () => {updateKinematicObjects(); startPunchingState(1)},
    onRest: () => stopPunchingState(1),
  }], [target]);

  //punch logic

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

  const onPunch = () => {
    sfx({id:'whoosh'})
    setSwings(swings + 1)
  }

  const punchLeft = (target) => {
    onPunch()
    setLeftTarget(cameraSpace(target))
  }

  const punchRight = (target) => {
    onPunch()
    setRightTarget(cameraSpace(target))
  }

  const cameraSpace = (vec) => {
    return cameraRef.current.worldToLocal(vec).toArray()
  }

  const stopPunchingState = (key) => {
    console.log("stop punching")
    if (key) {
      if (rightTarget.some((value, index) => value !== GLOVE_ORIGINS.right[index])) {
        setRightTarget(GLOVE_ORIGINS.right)
      }
      else{
        punching[key] = false;
      }
      
    } else {
      if (leftTarget.some((value, index) => value !== GLOVE_ORIGINS.left[index])) {
        setLeftTarget(GLOVE_ORIGINS.left)
      }
      else{
        punching[key] = false;
      }
      console.log(`punching ${key ? 'right' : 'left'}: ${punching[key]}`)
    }
  }
  

  //camera logic

  const recenterCamera = () => {
    const nextPos = [0, PLAYER_HEIGHT, 0]
    setNextCamPosition(nextPos)
    lookAtBobo(nextPos)
    sfx({id:'whoosh'})
  }

  const navigateToPoint = (point) => {
    const nextPos = [point.x, PLAYER_HEIGHT, point.z]
    setNextCamPosition(nextPos)
    lookAtBobo(nextPos)
    sfx({id:'whoosh'})
  }

  const lookAtBobo = (nextPos) => {
    const nextRotation = getLookatRotation(nextPos, boboRB.current.translation())
    //console.log(`next rotation: ${nextRotation}`)
    setNextCamRotation(nextRotation)
  }

  const resetPlayer = () => {
    setNextCamPosition(CAM_ORIGIN)
    setNextCamRotation([0, 0, 0])
  }


  ////////////////////////////
  //click handlers
  //////////////////////////


  const handleBoboClick = (event) => {
    event.stopPropagation()
    //console.log('bobo clicked')
    target = getRaycastHit(event.pointer, cameraRef.current, boboRef.current)
    if (target) {
      //console.log(`hit ${target.toArray()}`)
      if (shouldPunchRight(target)) {
        if (!punching[1]) {
          punchRight(target)
        }
      } else {
        if (!punching[0]) {
          punchLeft(target)
        }
      }
    }
  }

  const handleLevelClick = (event, naviagateToPoint) => {
    event.stopPropagation()
    //console.log('level clicked')
    if (punching.every((value) => value === false)) {
      if (naviagateToPoint) {
        target = getRaycastHit(event.pointer, cameraRef.current, floorRef.current)
        if (target) {
          navigateToPoint(target)
        }
      }else{
        recenterCamera()
      }
    }
  }


  ///////////////////////////
  //physics handlers
  /////////////////////////

  const updateKinematicObjects = () => {
    const camPos = camSpring.position.get()
    camRB.current.setNextKinematicTranslation({x: camPos[0], y: camPos[1], z: camPos[2]})
    //console.log(`camera position: ${camPos}`)
    const rightGlovePos = springs[1].position.get()
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



  //initialize bobo rigidbody mass properties
  useEffect(() => {
    if (boboRB.current) {
      //const collider = boboRB.current.colliderSet.getAll()[0]
      //console.log(collider)
      boboRB.current.colliderSet.forEach((collider) =>
        collider.setMassProperties(
          BOBO_MASS, //mass
          boboRB.current.translation(), //centerOfMass
          getAngularInertia(boboSize, BOBO_MASS), //principalAngularInertia
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
  let rotationEuler = new Euler(0,0,0,'XYZ');
  useFrame((state, delta) => {
    if (boboRB && boboRB.current) {
      rotation = boboRB.current.rotation()
      angularVelocity = boboRB.current.angvel();
      if (Math.abs(rotation.x) < 0.025 && Math.abs(rotation.z) < 0.025 || Math.abs(angularVelocity.x) > 1.1 || Math.abs(angularVelocity.z) > 1.1){
        boboRB.current.resetTorques();
      }else{
        objUpWorld = WORLD_UP_VECTOR.clone().applyEuler(rotationEuler.set(rotation.x, rotation.y, rotation.z));
        axis.crossVectors( objUpWorld, WORLD_UP_VECTOR );
        angle = Math.acos(objUpWorld.dot(WORLD_UP_VECTOR));
        torque = axis.clone().multiplyScalar(angle * delta * 500);
        boboRB.current.addTorque({ x: torque.x + angularVelocity.x * -1, y: 0, z: torque.z + angularVelocity.z * -1}, true);
      }
    }
  })

  //collision handlers

  const handleBoboContactForce = (e) => {
    if (e.rigidBodyObject.name === 'rightHand' || e.rigidBodyObject.name === 'leftHand') { 
      if (punching.some((value) => value === true)) {
        const punchForce = e.totalForceMagnitude
        //console.log(`punch force: ${punchForce}`) // getting ranges 0-22000 but avg is 300-3000
        if (punchForce > 3000) {
          setPoints(points + 1)
        }else if (punchForce > 2000) {
          setPoints(points + 0.75)
        }else if (punchForce > 1000) {
          setPoints(points + 0.5)
        }else if (punchForce > 300) {
          setPoints(points + 0.25)
        }else{
          setPoints(points + 0.1)
        }
        sfx({id:'hit', volume: remap(punchForce, 0, 23000, 0, 1), playbackRate: (Math.random() - 0.75) * 0.6 + 1.0})
      }
    }
  }

  const handleSkyZoneEnter = (e) => {
    if (e.rigidBodyObject.name === 'bobo') {
      console.log('there he goes')
      recenterCamera()
    }
    else{
      console.log(`${e.rigidBodyObject.name} hit sky zone`)
    }
  }

  const handleKillZoneEnter = (e) => {
    if (e.rigidBodyObject.name === 'bobo') {
      console.log('bobo ko')
      resetPlayer()
      setRound(round + 1)
      console.log('new round')
    }
    else{
      console.log(`${e.rigidBodyObject.name} hit kill zone`)
    }
  }

  return (
    <group>
      {/* Camera */}
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
      {!ko &&
      <Physics debug={true}>
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
          position={BOBO_ORIGIN}
          restitution={0.6}
          friction={0.1}
          linearDamping={0.5}
          angularDamping={0.6}
          ccd={true}
          onContactForce={handleBoboContactForce}
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
            <MeshCollider key={obj.name} type='cuboid' restitution={0.1} friction={0.5}>
              <primitive object={obj} material={testMaterial} />
            </MeshCollider>
          ))}
        </RigidBody>
        {/* sky zone */}
        <RigidBody name='skyZone' type='fixed' colliders={false} position={[0, 6, 0]} onIntersectionEnter={handleSkyZoneEnter} onIntersectionExit={handleSkyZoneEnter} sensor={true}>
          <CuboidCollider args={[100, 4, 100]} />
        </RigidBody>
        {/* kill zone */}
        <RigidBody name='killZone' type='fixed' colliders={false} position={[0, -10, 0]} onIntersectionEnter={handleKillZoneEnter} sensor={true}>
          <CuboidCollider args={[100, 4, 100]} />
        </RigidBody>
      </Physics>}

      {/*Level Geometry*/}
      {levelMeshes.map((obj) => {
        const isFloor = obj.name.includes('floor')
        return (
          <primitive
            key={obj.name}
            object={obj}
            material={levelMaterial}
            onClick={(e) => handleLevelClick(e, isFloor)}
            ref={isFloor ? floorRef : null}
          />
        )
      })}

      {/* UI */}
      {/*<StatsUI round={round} score={points} swings={swings}/>*/}
      {ko && <Text3D font={'/font/CircusOrnate.json'} size={0.5} position={[-1,1,0]} material={gloveMaterial}>KO</Text3D>}
    </group>
  )
}

export { SceneContent }