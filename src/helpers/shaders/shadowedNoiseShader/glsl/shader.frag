precision highp float;

#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>

uniform vec3 uColorMain;
uniform vec3 uColorNoise;
uniform float uOctaves;
uniform float uContrast;
uniform float uScale;
uniform float uLevel;
uniform float uGain;
uniform float uSeed;

varying vec2 vUv;
varying vec3 vNormal;


float random2d(vec2 st, float seed) {
    return fract(sin(dot(st, vec2(1.))* 432152.001579+seed));
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise2d(in vec2 st, in float seed) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random2d(i, seed);
    float b = random2d(i + vec2(1.0, 0.0), seed);
    float c = random2d(i + vec2(0.0, 1.0), seed);
    float d = random2d(i + vec2(1.0, 1.0), seed);

    // Smooth Interpolation
    vec2 u = smoothstep(0., 1., f);
    //u = f * f * f * (f * (f * 6. - 15.) + 10.); //<quintic interpolation is a little sharper

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
        (c - a) * u.y * (1.0 - u.x) +
        (d - b) * u.x * u.y;
}

float fbm(in vec2 st, in float _octaves, in float scale, in float seed) {
    float val = 0.;
    float amp = 0.5;
    int octaves = int(clamp(_octaves, 1.0, 8.0));

    for(int i = 0; i < octaves; i++) {
        val += amp * noise2d(st * scale, seed);
        st *= 2.;
        amp *= .5;
    }
    return val;
}

vec3 contrast(vec3 color, float contrast) {
    return ((color - 0.5) * contrast + 0.5);
}

float circleGrad(in vec2 st) {
    vec2 dist = st - 0.5;
    return 1. - dot(dist, dist) * 4.;
}

float maskShape(in vec2 st) {
    //noisy vignette
    return circleGrad(st) * fbm(st, 2., 2., 0.0);
}


void main() {
    //shadow map
    DirectionalLightShadow directionalShadow = directionalLightShadows[0];
    float shadow = getShadow(directionalShadowMap[0], directionalShadow.shadowMapSize, directionalShadow.shadowBias, directionalShadow.shadowRadius, vDirectionalShadowCoord[0]);
    // directional light
    float NdotL = dot(vNormal, directionalLights[0].direction);
    float lightIntensity = smoothstep(0.0, 0.01, NdotL * shadow);
    vec3 directionalLight = directionalLights[0].color * lightIntensity;
    vec2 st = vUv;
    float val = fbm(st, uOctaves, uScale, uSeed);
    val *= maskShape(st) * 3.;
    vec3 color = mix(uColorMain, uColorNoise, val);
    color = clamp(contrast(color, uContrast) * uGain + uLevel, 0.0, 1.0);
    gl_FragColor = vec4(color * clamp(directionalLight, 0.5, 1.), 1.0);

}