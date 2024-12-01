#ifdef GL_ES
precision lowp float;
#endif

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
