'use client'

import { useSpring, useSprings, animated, config } from '@react-spring/three'
import { PerspectiveCamera, Text3D } from '@react-three/drei'
import { useEffect, useRef, useState} from 'react'
import { Vector3 } from 'three'
import { Physics } from '@react-three/rapier'
import { useSFX, useMusic } from '@/helpers/AudioManager'
import { useModels } from '@/helpers/gltfLoadingMan'
import { levelMaterial, gloveMaterial } from '@/helpers/materials'
import { useRaycaster } from '@/helpers/useRaycaster'
import { getLookatRotation } from '@/helpers/getLookatRotation'
import { remap } from '@/helpers/Remap'
import { RigidBodyWorld } from '@/helpers/components/RigidBodyWorld'
import { rotateAroundPoint } from '@/helpers/rotateAroundPoint'
import { nullPointerErrorHandler } from '@/helpers/nullPointerErrorHandler'

const SceneContent = () =>  {
  //constants
  const MAX_ROUNDS = 2
  const PLAYER_HEIGHT = 1.5
  const CAM_ORIGIN = [0, PLAYER_HEIGHT, 1.5]
  const GLOVE_ORIGINS = {
    right: [0.5, -0.5, -0.8],
    left: [-0.5, -0.5, -0.8],
  }
  //refs
  const cameraRef = useRef(null);
  const floorRef = useRef(null);
  const gloveInstanceRef = useRef(null);
  const score = useRef({});
  //states
  const [boboObj, setBoboObj] = useState(null)
  const [boboRB, setBoboRigidBody] = useState(null)
  const [gloveLeftRB, setLeftRB] = useState(null)
  const [gloveRightRB, setRightRB] = useState(null)
  const [camRB, setCamRigidBody] = useState(null)
  const [round, setRound] = useState(1)
  const [swings, setSwings] = useState(0)
  const [points, setPoints] = useState(0)
  const [ko, setKO] = useState(false)
  let punching = [false, false]
  //functions
  const getRaycastHit = useRaycaster()
  const sfx = useSFX()
  const music = useMusic()
  const setBoboObjWrapper = (obj) => {
    setBoboObj(obj)
  }
  const setLRB = (rb) => {
    setLeftRB(rb)
  }
  const setRRB = (rb) => {
    setRightRB(rb)
  }
  const setCamRB = (rb) => {
    setCamRigidBody(rb)
  }
  const setBoboRB = (rb) => {
    setBoboRigidBody(rb)
  }

  ////////////////////////////
  //loaders
  //////////////////////////

  const models = useModels()
  const {bobo, levelMeshes, levelColliders, boxingGlove} = models

  ////////////////////////////
  // game flow logic
  //////////////////////////

  //autostart
  useEffect(() => {
    music();
  }, [music])

  //round transition
  const endRound = () => {
    score.current[round] = { swings, points } //store round points
    resetPlayer()
    setSwings(0)
    setPoints(0)
    setRound(round + 1)
  }

  useEffect(() => {
    if (round > MAX_ROUNDS){
      console.log('game over')
      console.log(score.current)
      console.log(`final stats:`)
      console.log(Object.values(score.current).reduce((acc, curr) => ({
        points: (acc?.points || 0) + curr.points,
        swings: (acc?.swings || 0) + curr.swings
      }), {points: 0, swings: 0}))
      return
    }
    console.log(`round ${round}`)
    sfx({id:'bell'});
    setKO(round > 1)
  }, [round])

  useEffect(() => {
    const to = setTimeout(() => {
      setKO(false);
      if (ko) sfx({id:'bell'});
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
  const [idleHands] = useSpring(() => ({
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
  const [leftTarget, setLeftTarget] = useState(GLOVE_ORIGINS.left);
  const [rightTarget, setRightTarget] = useState(GLOVE_ORIGINS.right);

  const gloveSpringConfig = {
    mass: 1,
    tension: 400,
    friction: 10,
    velocity: .01,
    precision: 0.2
  }

  const [gloveSprings] = useSprings(2,[{
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
  }], [leftTarget, rightTarget]);

  //punch logic

  const shouldPunchRight = (worldPoint) => {
    const camPos = camSpring.position.get()
    const camVec = new Vector3(camPos[0], camPos[1], camPos[2])
    const boboToCamera = camVec.clone().sub(boboObj.getWorldPosition(new Vector3()))
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
      //console.log(`punching ${key ? 'right' : 'left'}: ${punching[key]}`)
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
  // handlers
  //////////////////////////

  const updateKinematicObjects = () => {
    //todo: optimize so only necessary objects are updated
    if (camRB && gloveRightRB && gloveLeftRB){
      try {
        //update camera
        const camPos = camSpring.position.get()
        if (camRB)
          camRB.setNextKinematicTranslation({ x: camPos[0], y: camPos[1], z: camPos[2] })
        //update right glove
        const rightGlovePos = gloveSprings[1].position.get()
        const nextPosRightGlove = rotateAroundPoint(
          { x: rightGlovePos[0] + camPos[0], y: rightGlovePos[1] + camPos[1], z: rightGlovePos[2] + camPos[2] },
          { x: camPos[0], y: camPos[1], z: camPos[2] },
          [0, camSpring.rotation.get()[1], 0],
        )
        gloveRightRB.setNextKinematicTranslation(nextPosRightGlove)
        //update left glove
        const leftGlovePos = gloveSprings[0].position.get()
        const nextPosLeftGlove = rotateAroundPoint(
          { x: leftGlovePos[0] + camPos[0], y: leftGlovePos[1] + camPos[1], z: leftGlovePos[2] + camPos[2] },
          { x: camPos[0], y: camPos[1], z: camPos[2] },
          [0, camSpring.rotation.get()[1], 0],
        )
        gloveLeftRB.setNextKinematicTranslation(nextPosLeftGlove)
      } catch (e) {
        nullPointerErrorHandler(e)
      }
    }
    
  }

  //click handlers

  const handleBoboClick = (event) => {
    event.stopPropagation()
    //console.log('bobo clicked')
    const target = getRaycastHit(event.pointer, cameraRef.current, boboObj)
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
        const target = getRaycastHit(event.pointer, cameraRef.current, floorRef.current)
        if (target) {
          navigateToPoint(target)
        }
      }else{
        recenterCamera()
      }
    }
  }

  //collision handlers

  const handleBoboContactForce = (e) => {
    if (e.rigidBodyObject.name === 'rightHand' || e.rigidBodyObject.name === 'leftHand') {
      if (punching.some((value) => value === true)) {
        const punchForce = e.totalForceMagnitude
        //console.log(`punch force: ${punchForce}`) // getting ranges 0-22000 but avg is 300-3000
        if (punchForce > 3000) {
          setPoints(points + 1)
        } else if (punchForce > 2000) {
          setPoints(points + 0.75)
        } else if (punchForce > 1000) {
          setPoints(points + 0.5)
        } else if (punchForce > 300) {
          setPoints(points + 0.25)
        } else {
          setPoints(points + 0.1)
        }
        sfx({ id: 'hit', volume: remap(punchForce, 0, 23000, 0, 1), playbackRate: (Math.random() - 0.75) * 0.6 + 1.0 })
      }
    }
  }

  const handleSkyZoneEnter = (e) => {
    if (e.rigidBodyObject.name === 'bobo') {
      console.log('there he goes')
      recenterCamera()
    } else {
      console.log(`${e.rigidBodyObject.name} hit sky zone`)
    }
  }

  const handleKillZoneEnter = (e) => {
    if (e.rigidBodyObject.name === 'bobo') {
      console.log('bobo ko')
      endRound()
    } else {
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
            <animated.instancedMesh
              args={[boxingGlove.geometry, gloveMaterial, 2]}
              rotation={[Math.PI * -0.5, Math.PI * 0.8, Math.PI * 0.2]}
              position={gloveSprings[0].position}
              ref = {gloveInstanceRef}
            ></animated.instancedMesh>
            {/*Right Glove*/}
            <animated.instancedMesh
              args={[boxingGlove.geometry, gloveMaterial, 2]}
              rotation={[Math.PI * -0.25, Math.PI * 1.1, Math.PI * -0.2]}
              position={gloveSprings[1].position}
              scale={[-1, 1, 1]}
              ref = {gloveInstanceRef}
            ></animated.instancedMesh>
          </animated.group>
        </PerspectiveCamera>
      </animated.group>
      {!ko &&
      <Physics debug={true}>
        <RigidBodyWorld 
          meshes = {{ bobo, levelColliders }}
          handlers = {{ handleSkyZoneEnter, handleKillZoneEnter, handleBoboContactForce, handleBoboClick }}
          states = {{ ko }}
          setters = {{ setBoboObjWrapper, setLRB, setRRB, setCamRB, setBoboRB }}
        />
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