import { RigidBody, MeshCollider, BallCollider, CuboidCollider } from '@react-three/rapier'
import { useEffect, useRef } from 'react'
import { getBoundingBoxSize } from '@/helpers/getBoundingBoxSize'
import { getAngularInertia } from '@/helpers/getInertia'
import { useFrame } from '@react-three/fiber'
import { testMaterial } from '@/helpers/materials'
import { nullPointerErrorHandler } from '@/helpers/nullPointerErrorHandler'
import { Vector3, Euler } from 'three'

const RigidBodyWorld = ({ meshes, handlers, states, setters}) => {
  //parse props
  const { setBoboObjWrapper, setLRB, setRRB, setCamRB, setBoboRB }= setters
  if ( !setBoboObjWrapper || !setLRB || !setRRB || !setBoboRB ) return null;
  const { bobo, levelColliders } = meshes
  const { handleSkyZoneEnter, handleKillZoneEnter, handleBoboContactForce, handleBoboClick } = handlers
  const { ko } = states
  //constants
  const WORLD_UP_VECTOR = new Vector3(0, 1, 0)
  const BOBO_MASS = 4
  const BOBO_ORIGIN = [0, 0.001, -2]
  const GLOVE_MASS = 50
  //refs
  const boboRB = useRef(null)

  useEffect(() => {
    setBoboRB(boboRB)
  }, [boboRB])

  //compute bobo bounding box
  const { size: boboSize } = getBoundingBoxSize(bobo.children[0])

  //initialize bobo rigidbody mass properties
  useEffect(() => {
    if (boboRB.current) {
      const collider = boboRB.current.colliderSet.getAll()[0]
      collider.setMassProperties(
        BOBO_MASS, //mass
        boboRB.current.translation(), //centerOfMass
        getAngularInertia(boboSize, BOBO_MASS), //principalAngularInertia
        { w: 1.0, x: 0.0, y: 0.0, z: 0.0 }, //angularInertiaLocalFrame
      )
    }
  }, [boboRB])

  //bobo self balancing forces
  let angularVelocity = { x: 0, y: 0, z: 0 }
  let rotation = { x: 0, y: 0, z: 0 }
  let axis = new Vector3()
  let objUpWorld = new Vector3()
  let angle = 0
  let torque = 0
  let rotationEuler = new Euler(0, 0, 0, 'XYZ')
  useFrame((state, delta) => {
    if (boboRB && boboRB.current && !ko) {
      try {
        rotation = boboRB.current.rotation()
        angularVelocity = boboRB.current.angvel()
        if (
          (Math.abs(rotation.x) < 0.025 && Math.abs(rotation.z) < 0.025) ||
          Math.abs(angularVelocity.x) > 1.1 ||
          Math.abs(angularVelocity.z) > 1.1
        ) {
          boboRB.current.resetTorques()
        } else {
          objUpWorld = WORLD_UP_VECTOR.clone().applyEuler(rotationEuler.set(rotation.x, rotation.y, rotation.z))
          axis.crossVectors(objUpWorld, WORLD_UP_VECTOR)
          angle = Math.acos(objUpWorld.dot(WORLD_UP_VECTOR))
          torque = axis.clone().multiplyScalar(angle * delta * 500)
          boboRB.current.addTorque(
            { x: torque.x + angularVelocity.x * -1, y: 0, z: torque.z + angularVelocity.z * -1 },
            true,
          )
        }
      } catch (e) {
        nullPointerErrorHandler(e)
      }
    }
  })

  return (
    <>
      {/* Kinematic Rigidbodies */}
      <RigidBody name='leftHand' type='kinematicPosition' ref={(el) => setLRB(el)} ccd={true} mass={GLOVE_MASS}>
        <BallCollider args={[0.25]} />
      </RigidBody>
      <RigidBody name='rightHand' type='kinematicPosition' ref={(el) => setRRB(el)} ccd={true} mass={GLOVE_MASS}>
        <BallCollider args={[0.25]} />
      </RigidBody>
      <RigidBody name='camRB' type='kinematicPosition' ref={(el) => setCamRB(el)}>
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
        <MeshCollider name='boboCollider' type='hull'>
          <primitive
            object={bobo}
            onClick={handleBoboClick}
            ref={(el) => {
              setBoboObjWrapper(el)
            }}
          />
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
      <RigidBody
        name='skyZone'
        type='fixed'
        colliders={false}
        position={[0, 6, 0]}
        onIntersectionEnter={handleSkyZoneEnter}
        onIntersectionExit={handleSkyZoneEnter}
        sensor={true}
      >
        <CuboidCollider args={[100, 4, 100]} />
      </RigidBody>
      {/* kill zone */}
      <RigidBody
        name='killZone'
        type='fixed'
        colliders={false}
        position={[0, -10, 0]}
        onIntersectionEnter={handleKillZoneEnter}
        sensor={true}
      >
        <CuboidCollider args={[100, 4, 100]} />
      </RigidBody>
    </>
  )
}

export { RigidBodyWorld }
