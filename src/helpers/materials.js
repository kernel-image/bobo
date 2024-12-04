import { MeshBasicMaterial, MeshPhongMaterial, Color, BackSide } from 'three'
import { CustomFresnel } from './shaders/fresnelShader/fresnelShader'
import { CustomRays } from './shaders/raysShader/raysShader'

const levelMaterial = new CustomFresnel({
  colorMain: new Color(0.25, 0.08, 0.087),
  colorFresnel: new Color(0.09, 0.08, 0.25),
  power: 0.5,
})
const gloveMaterial = new CustomFresnel({
  colorMain: new Color(0.8, 0.18, 0.0),
  colorFresnel: new Color(0.09, 0.0045, 0.08),
  power: 0.5,
})
const floorMaterial = new MeshPhongMaterial({ color: '#505090', shininess: 0.01 })
const testMaterial = new MeshBasicMaterial({ color: 'green', alphaTest: 2 })
const tentMaterial = new CustomRays({
  color1: new Color(0.01, 0, 0.01),
  color2: new Color(0.1, 0, 0.1),
  rays: 32,
  side: BackSide,
})

export { levelMaterial, gloveMaterial, floorMaterial, testMaterial, tentMaterial }
