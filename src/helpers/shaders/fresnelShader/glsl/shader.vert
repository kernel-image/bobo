precision lowp float;

//built-in uniforms:
//
// = object.matrixWorld
//uniform mat4 modelMatrix;
// = camera.matrixWorldInverse * object.matrixWorld
//uniform mat4 modelViewMatrix;
// = camera.projectionMatrix
//uniform mat4 projectionMatrix;
// = camera.matrixWorldInverse
//uniform mat4 viewMatrix;
// = inverse transpose of modelViewMatrix
//uniform mat3 normalMatrix;
// = camera position in world space
//uniform vec3 cameraPosition;
//
// default vertex attributes provided by BufferGeometry
//attribute vec3 position;
//attribute vec3 normal;
//attribute vec2 uv;

uniform vec3 colorMain;
uniform vec3 colorFresnel;
uniform float power;

varying vec3 viewNV;
varying vec3 vColorMain;
varying vec3 vColorFresnel;
varying float vPower;

void main() {

  viewNV = mat3(modelViewMatrix) * normal;
  vColorMain = colorMain;
  vColorFresnel = colorFresnel;
  vPower = power;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
