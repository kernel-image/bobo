precision lowp float;

//built in
//uniform mat4 modelViewMatrix;
//uniform mat4 projectionMatrix;
//attribute vec3 position;
//attribute vec2 uv;

//passed in
uniform vec3 color1;
uniform vec3 color2;
uniform float rays;
//passed out
varying vec3 vColor1;
varying vec3 vColor2;
varying float vRays;
varying vec2 vUv;

void main() {

    vRays = rays;
    vColor1 = color1;
    vColor2 = color2;
    vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}