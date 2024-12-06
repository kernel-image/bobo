//passed in
uniform vec3 colorMain;
uniform vec3 colorNoise;
uniform float octaves;
uniform float contrast;
uniform float scale;
uniform float level;
uniform float gain;
uniform float seed;
//passed out
varying vec2 vUv;
varying vec3 vColor1;
varying vec3 vColor2;
varying float vContrast;
varying float vGain;
varying float vLevel;
varying float vScale;
varying float vOctaves;
varying float vSeed;

void main() {

    vUv = uv;
    vColor1 = colorMain;
    vColor2 = colorNoise;
    vContrast = contrast;
    vGain = gain;
    vLevel = level;
    vScale = scale;
    vOctaves = octaves;
    vSeed = seed;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}