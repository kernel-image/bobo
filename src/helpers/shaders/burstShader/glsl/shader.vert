precision lowp float;

uniform vec3 color;
uniform float progress;
varying vec2 vUv;
varying vec3 vColor;
varying float vProgress;

void main() {
    vColor = color;
    vProgress = mod(progress, 3.14);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}