'use client'

import { useSpring, useSprings, animated, config } from '@react-spring/three'
import { PerspectiveCamera, Text3D } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Vector3 } from 'three'
import { Physics } from '@react-three/rapier'
import { useSFX, useMusic, useVO, getRandomID } from '@/helpers/AudioManager'
import { useModels, useTent } from '@/helpers/gltfLoadingMan'
import { levelMaterial, gloveMaterial, floorMaterial, tentMaterial } from '@/helpers/materials'
import { useRaycaster } from '@/helpers/useRaycaster'
import { getLookatRotation } from '@/helpers/getLookatRotation'
import { remap } from '@/helpers/Remap'
import { RigidBodyWorld } from '@/helpers/components/RigidBodyWorld'
import { rotateAroundPoint } from '@/helpers/rotateAroundPoint'
import { nullPointerErrorHandler } from '@/helpers/nullPointerErrorHandler'
import { StatusUI, FinalStatusUI } from '@/helpers/components/StatusUI'
import { Lights } from './View'
import { BurstSprite } from '@/helpers/components/BurstVFX'

const SceneContent = () => {
  //constants
  const SERVER_PATH = process.env.NODE_ENV === 'development' ? '' : 'https://www.kernel-image.net/bobo'
  const MAX_ROUNDS = 5
  const ROUND_TIME = 60
  const PLAYER_HEIGHT = 1.5
  const CAM_ORIGIN = useMemo(() => [0, PLAYER_HEIGHT, 1.5], [PLAYER_HEIGHT])
  const CAM_EXTENT = 2
  const GLOVE_ORIGINS = [
    [-0.5, -0.5, -0.8],
    [0.5, -0.5, -0.8],
  ]
  const EPSILON = 0.01
  //refs
  const cameraRef = useRef(null)
  const floorRef = useRef(null)
  const gloveInstanceRef = useRef(null)
  const score = useRef({})
  //states
  const [clockTime, setClockTime] = useState(ROUND_TIME)
  const [boboObj, setBoboObj] = useState(null)
  const [boboRB, setBoboRigidBody] = useState(null)
  const [gloveLeftRB, setLeftRB] = useState(null)
  const [gloveRightRB, setRightRB] = useState(null)
  const [camRB, setCamRigidBody] = useState(null)
  const [round, setRound] = useState(1)
  const [swings, setSwings] = useState(0)
  const [points, setPoints] = useState(0)
  const [ko, setKO] = useState(null)
  const [hitPosition, setHitPosition] = useState(null)
  const [TO, setTO] = useState(null)
  const [punchingLeft, setPunchingLeft] = useState(false)
  const [punchingRight, setPunchingRight] = useState(false)
  //const punching = [punchingLeft, punchingRight]
  //functions
  const getRaycastHit = useRaycaster()
  const playSFX = useSFX(SERVER_PATH)
  const playMusic = useMusic(SERVER_PATH)
  const playVO = useVO(SERVER_PATH)

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

  const { bobo, levelMeshes, levelColliders, boxingGlove } = useModels(SERVER_PATH)
  const tent = useTent(SERVER_PATH)

  ////////////////////////////
  // game flow logic
  //////////////////////////

  useEffect(() => {
    const clock = setInterval(() => {
      if (clockTime > 0) {
        setClockTime(clockTime - 1)
      }
    }, 1000)
    return () => clearInterval(clock)
  }, [clockTime])

  //autostart
  useEffect(() => {
    playMusic()
    playVO({ id: getRandomID('start') })
  }, [playMusic, playVO])

  //round transition
  const endRound = useCallback(() => {
    clearTimeout(TO)
    const gameOver = round >= MAX_ROUNDS
    const koValue = gameOver ? 'STOP' : clockTime > 0 ? 'KO' : 'TIME'
    const koBonus = clockTime > 0 ? clockTime / 2 : 0
    const blows = points + koBonus
    score.current[round] = { swings, blows } //store round points
    const resetPlayer = () => {
      setNextCamPosition(CAM_ORIGIN)
      setNextCamRotation([0, 0, 0])
    }
    playSFX({ id: 'bell' })
    resetPlayer()
    setPoints(blows)
    setKO(koValue)
  }, [CAM_ORIGIN, TO, clockTime, playSFX, points, round, swings])

  useEffect(() => {
    if (clockTime === 0) {
      endRound()
    }
  }, [clockTime, endRound])

  //handle round end
  useEffect(() => {
    if (ko === 'STOP') {
      return
    }
    //setup next round
    const to = setTimeout(() => {
      if (ko && ko !== 'STOP') {
        playSFX({ id: 'bell' })
        setClockTime(ROUND_TIME)
        setSwings(0)
        setPoints(0)
        setRound(round + 1)
      }
      setKO(null)
    }, 4000)
    return () => clearTimeout(to)
  }, [ko, round, ROUND_TIME, setRound, setClockTime, setSwings, setPoints, playSFX])

  const restartTimeout = useCallback(() => {
    //modify points as hack to restart timeout effect
    setPoints(points - 0.0001)
  }, [points])

  // timeout
  useEffect(() => {
    if (ko === 'STOP') {
      return
    }
    const promptUser = () => {
      const id = getRandomID('inactivity')
      playVO({ id: id })
    }
    //console.log('start timeout')
    const to = setTimeout(() => {
      //console.log('end timeout')
      promptUser()
      restartTimeout()
    }, 10000)
    setTO(to)
    return () => clearTimeout(to)
  }, [playVO, restartTimeout, ko])

  ///////////////////////////////////
  // animation
  /////////////////////////////////

  //camera spring
  const [camPosition, setCamPosition] = useState(CAM_ORIGIN)
  const [nextCamPosition, setNextCamPosition] = useState(camPosition)
  const [camRotation, setCamRotation] = useState([0, 0, 0])
  const [nextCamRotation, setNextCamRotation] = useState(camRotation)
  const [camSpring, camSpringApi] = useSpring(
    () => ({
      from: { position: camPosition, rotation: camRotation },
      to: { position: nextCamPosition, rotation: nextCamRotation },
      config: config.molasses,
      onChange: () => updateKinematicObjects(),
      onRest: () => {
        const restPos = camSpring.position.get()
        const currentPos = [restPos[0], PLAYER_HEIGHT, restPos[2]]
        setCamPosition(currentPos)
        const restRot = camSpring.rotation.get()
        setCamRotation(restRot)
        restartTimeout()
      },
    }),
    [camPosition, nextCamPosition, camRotation, nextCamRotation],
  )

  //idle hands spring
  const [idleHands] = useSpring(
    () => ({
      from: { position: [0, 0, 0], rotation: [0, Math.PI / 80, Math.PI / 100] },
      to: { position: [0, -0.1, 0], rotation: [0, Math.PI / -80, Math.PI / -100] },
      loop: { reverse: true },
      config: {
        mass: 1,
        tension: 15,
        friction: 1,
        precision: 0.0035,
      },
    }),
    [],
  )

  //punch spring
  const [leftTarget, setLeftTarget] = useState(GLOVE_ORIGINS[0])
  const [rightTarget, setRightTarget] = useState(GLOVE_ORIGINS[1])

  const gloveSpringConfig = {
    mass: 1,
    tension: 400,
    friction: 10,
    velocity: 0.01,
    precision: 0.2,
  }

  const [gloveSprings] = useSprings(
    2,
    [
      {
        from: { position: GLOVE_ORIGINS[0] },
        to: [{ position: leftTarget }, { position: GLOVE_ORIGINS[0] }],
        config: gloveSpringConfig,
        onChange: () => {
          updateKinematicObjects()
          startPunchingState(0)
        },
        onRest: () => stopPunchingState(0),
      },
      {
        from: { position: GLOVE_ORIGINS[1] },
        to: [{ position: rightTarget }, { position: GLOVE_ORIGINS[1] }],
        config: gloveSpringConfig,
        onChange: () => {
          updateKinematicObjects()
          startPunchingState(1)
        },
        onRest: () => stopPunchingState(1),
      },
    ],
    [leftTarget, rightTarget],
  )

  const isGloveAtOrigin = (key) => {
    return gloveSprings[key].position
      .get()
      .every((value, index) => Math.abs(value - GLOVE_ORIGINS[key][index]) < EPSILON)
  }

  const isTargetAtOrigin = (key) => {
    if (key) {
      return rightTarget.every((value, index) => Math.abs(value - GLOVE_ORIGINS[1][index]) < EPSILON)
    } else if (key === 0) {
      return leftTarget.every((value, index) => Math.abs(value - GLOVE_ORIGINS[0][index]) < EPSILON)
    }
    console.log('isTargetAtOrigin error')
    return false
  }

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
    return isRight
  }

  const startPunchingState = (key) => {
    if (key) {
      setPunchingRight(true)
    } else {
      setPunchingLeft(true)
    }
  }

  const onPunch = () => {
    playSFX({ id: 'whoosh' })
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
    console.log('trying to stop punching state key: ' + key)
    if (key) {
      if (!isTargetAtOrigin(1)) {
        setRightTarget(GLOVE_ORIGINS[1])
      } else if (isGloveAtOrigin(1)) {
        setPunchingRight(false)
        console.log('stop punching state right')
      } else {
        console.log('right glove is not at origin and neither is target')
      }
    } else if (key === 0) {
      if (!isTargetAtOrigin(0)) {
        setLeftTarget(GLOVE_ORIGINS[0])
      } else if (isGloveAtOrigin(0)) {
        setPunchingLeft(false)
        console.log('stop punching state left')
      } else {
        console.log('left glove is not at origin and neither is target')
      }
    }
  }

  //camera logic

  const recenterCamera = () => {
    const nextPos = [0, PLAYER_HEIGHT, 0]
    setNextCamPosition(nextPos)
    lookAtBobo(nextPos)
    playSFX({ id: 'whoosh' })
  }

  const navigateToPoint = (point) => {
    const nextPos = correctNextCamPosition(point)
    setNextCamPosition(nextPos)
    lookAtBobo(nextPos)
    playSFX({ id: 'whoosh' })
  }

  const checkNextCamPosition = (nextPos) => {
    const _nextPos = [nextPos[0], nextPos[1]]
    if (_nextPos.every((value, index) => Math.abs(value) < CAM_EXTENT)) {
      //console.log(`in bounds: ${_nextPos[0]}, ${_nextPos[1]}`)
      return true
    } else {
      //console.log(`out of bounds: ${_nextPos[0]}, ${_nextPos[1]}`)
      return false
    }
  }

  const correctNextCamPosition = (point) => {
    const _nextPos = [point.x, point.z]
    const correctedNextPos = checkNextCamPosition(_nextPos)
      ? _nextPos
      : _nextPos.map((value, index) => Math.min(Math.max(value, -CAM_EXTENT), CAM_EXTENT))
    //console.log(`corrected next pos: ${correctedNextPos[0]}, ${correctedNextPos[1]}`)
    return [correctedNextPos[0], PLAYER_HEIGHT, correctedNextPos[1]]
  }

  const lookAtBobo = (nextPos) => {
    const nextRotation = getLookatRotation(nextPos, boboRB.current.translation())
    //console.log(`next rotation: ${nextRotation}`)
    setNextCamRotation(nextRotation)
  }

  ////////////////////////////
  // event handlers
  //////////////////////////

  const updateKinematicObjects = () => {
    //todo: optimize so only necessary objects are updated
    if (camRB && gloveRightRB && gloveLeftRB) {
      try {
        //update camera
        const camPos = camSpring.position.get()
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
        if (!punchingRight) {
          punchRight(target)
        }
      } else {
        if (!punchingLeft) {
          punchLeft(target)
        }
      }
    }
  }

  const handleLevelClick = (event, floorClick) => {
    event.stopPropagation()
    if (ko || clockTime <= 0) return
    //console.log('level clicked')
    if (!punchingRight && !punchingLeft) {
      if (floorClick) {
        const target = getRaycastHit(event.pointer, cameraRef.current, floorRef.current)
        if (target) {
          navigateToPoint(target)
        }
      } else {
        recenterCamera()
      }
    }
  }

  //collision handlers

  const handleBoboContactForce = (e) => {
    if (e.rigidBodyObject.name === 'rightHand' || e.rigidBodyObject.name === 'leftHand') {
      if (punchingRight || punchingLeft) {
        const punchForce = e.totalForceMagnitude
        console.log(`punch force: ${punchForce}`) // getting ranges 0-22000 but avg is 300-3000
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
        playSFX({
          id: 'hit',
          volume: remap(punchForce, 0, 23000, 0, 1),
          playbackRate: (Math.random() - 0.75) * 0.6 + 1.0,
        })
        setHitPosition({ ...e.rigidBodyObject.position }) // returns vector object
        playVO({ id: getRandomID(e.rigidBodyObject.position.y < 0.5 ? 'dirty' : 'punch') })
      } else {
        console.log('not punching')
      }
    }
  }

  const handleSkyZoneEnter = (e) => {
    if (e.rigidBodyObject.name === 'bobo') {
      //playVO({ id: getRandomID('sky') })
      recenterCamera()
    }
  }

  const handleKillZoneEnter = (e) => {
    if (e.rigidBodyObject.name === 'bobo') {
      endRound()
    }
  }

  return (
    <group>
      {/* 3D UI */}
      {ko && (
        <Text3D
          font={`${SERVER_PATH}/font/CircusOrnate.json`}
          size={ko === 'KO' ? 0.5 : 0.25}
          position={[-1, 1, 0]}
          material={gloveMaterial}
        >
          {ko}
        </Text3D>
      )}
      {/* Lights */}
      <Lights />
      {/* Camera */}
      <animated.group position={camSpring.position} rotation={camSpring.rotation}>
        <PerspectiveCamera makeDefault fov={90} ref={cameraRef} near={0.1} far={20}>
          {/* UI */}
          {ko === 'STOP' ? (
            <FinalStatusUI stats={score.current} />
          ) : (
            <StatusUI round={round} points={points} swings={swings} time={clockTime} />
          )}
          <animated.group position={idleHands.position} rotation={idleHands.rotation}>
            {/*Left Glove*/}
            <animated.instancedMesh
              args={[boxingGlove.geometry, gloveMaterial, 2]}
              rotation={[Math.PI * -0.5, Math.PI * 0.8, Math.PI * 0.2]}
              position={gloveSprings[0].position}
              ref={gloveInstanceRef}
            ></animated.instancedMesh>
            {/*Right Glove*/}
            <animated.instancedMesh
              args={[boxingGlove.geometry, gloveMaterial, 2]}
              rotation={[Math.PI * -0.25, Math.PI * 1.1, Math.PI * -0.2]}
              position={gloveSprings[1].position}
              scale={[-1, 1, 1]}
              ref={gloveInstanceRef}
            ></animated.instancedMesh>
          </animated.group>
        </PerspectiveCamera>
      </animated.group>
      {!ko && (
        <Physics debug={false}>
          <RigidBodyWorld
            meshes={{ bobo, levelColliders }}
            handlers={{ handleSkyZoneEnter, handleKillZoneEnter, handleBoboContactForce, handleBoboClick }}
            states={{ ko }}
            setters={{ setBoboObjWrapper, setLRB, setRRB, setCamRB, setBoboRB }}
          />
        </Physics>
      )}
      {/* VFX */}
      {hitPosition && <BurstSprite x={hitPosition.x} y={hitPosition.y} z={hitPosition.z} />}

      {/*Level Geometry*/}
      {levelMeshes.map((obj) => {
        const isFloor = obj.name.includes('floor')
        return (
          <primitive
            key={obj.name}
            object={obj}
            material={isFloor ? floorMaterial : levelMaterial}
            onClick={(e) => handleLevelClick(e, isFloor)}
            ref={isFloor ? floorRef : null}
            receiveShadow={isFloor}
          />
        )
      })}
      <primitive object={tent} position={[0, -3, 0]} scale={(0.5, 0.5, 0.5)} material={tentMaterial} />
    </group>
  )
}

export { SceneContent }
