'use client'

import { useSprings, animated } from '@react-spring/three'
import { useGLTF, PerspectiveCamera } from '@react-three/drei'
import { useEffect, useRef, useState} from 'react'
import { MeshStandardMaterial, Vector3 } from 'three'
import { useThree } from '@react-three/fiber'


const SceneContent = () =>  {

  const boboRef = useRef(null);
  const cameraRef = useRef(null);
  const gloveRef = useRef(null);
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
    right: [1, 1, 0.5],
    left: [-1, 1, 0.5],
  }

  //animation

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
    //loop: { reverse: true },
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
  
  
  const whichPunch = (worldPoint) => {
    const localPoint = worldPoint.clone().applyMatrix4(boboRef.current.matrixWorld);
    const isRightSide = localPoint.x > 0;
    return isRightSide ? 1 : 0;
  };

  const startPunchingState = (key) => {
    punching[key] = true;
  }

  const stopPunchingState = (key) => {
    punching[key] = false;
    //console.log(`${key? 'right' : 'left'} punch ended`)
    if (key) {
      if (rightTarget.some((value, index) => value !== gloveOrigins.right[index])) {
        setRightTarget(gloveOrigins.right)
      }
      else{
        console.log("right hand at rest")
      }
      
    } else {
      if (leftTarget.some((value, index) => value !== gloveOrigins.left[index])) {
        setLeftTarget(gloveOrigins.left)
      }
      else{
        console.log("left hand at rest")
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

  const handleBoboClick = (event) => {
    event.stopPropagation()
    console.log('bobo clicked')
    target = getRaycastHit(raycaster, event, cameraRef.current, boboRef)
    if (target) {
      //console.log(`hit ${target.toArray()}`)
      const shouldPunchRight = whichPunch(target)
      if (shouldPunchRight) {
        if (!punching.right) {
          setRightTarget(target.toArray())
          startPunchingState(1)
        }
      } else {
        if (!punching.left) {
          setLeftTarget(target.toArray())
          startPunchingState(0)
        }
      }
    }
  }

  const handleLevelClick = (event) => {
    event.stopPropagation()
    console.log('level clicked')
  }

  return (
    <group>
    <PerspectiveCamera makeDefault fov={90} position={[0, 1.5, 1.5]} ref={cameraRef}/>
    {/*Level*/}
    {levelMeshes.map((obj) => <primitive key={obj.name} object={obj} material={levelMaterial} onClick={handleLevelClick}/>)}
    <group>
      {/*Bobo*/}
      <primitive
          ref={boboRef}
          object={bobo}
          material={bobo.material}
          onClick={handleBoboClick}
          position={[0, 0, -2]}
        />

      {/*Right Glove*/}
      <animated.instancedMesh
        args={[boxingGlove.geometry, gloveMaterial, 2]}
        rotation={[Math.PI * -0.4, Math.PI * 0.8, Math.PI * -.1]}
        position={springs[1].position}
        scale={[-0.025, 0.025, 0.025]}
        ref = {gloveRef}
      />
      {/*Left Glove*/}
      <animated.instancedMesh
        args={[boxingGlove.geometry, gloveMaterial, 2]}
        rotation={[Math.PI * -0.5, Math.PI * 0.8, Math.PI * 0.2]}
        position={springs[0].position}
        scale={0.025}
      />
    </group>
    </group>
  )
}

export { SceneContent }