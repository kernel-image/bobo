precision mediump float;

varying vec3 vColor1;
varying vec3 vColor2;
varying vec2 vUv;
varying float vOctaves;
varying float vContrast;
varying float vScale;
varying float vLevel;
varying float vGain;
varying float vSeed;

float random1d(float st, float seed){
    return fract(abs(sin(st * (468759.468795+seed)) * 432152.001579));
}

float random2d(vec2 st, float seed) {
    //return fract(sin(dot(st, vec2(13.4127, 78.00186))) * 86845.1349787);
    return fract(sin(dot(st, vec2(random1d(st.x, seed)*100., vec2(st.y, seed)*100.))));
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
    vec2 u = smoothstep(0.,1.,f);
    //u = f * f * f * (f * (f * 6. - 15.) + 10.); //<quintic interpolation is a little sharper

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
        (c - a) * u.y * (1.0 - u.x) +
        (d - b) * u.x * u.y;
}

float fbm (in vec2 st, in float _octaves, in float scale, in float seed) {
    float val = 0.;
    float amp = 0.5;
    float freq = 0.;
    int octaves = int(clamp(_octaves, 1.0, 8.0));

    for (int i = 0; i < octaves; i++){
        val += amp * noise2d(st * scale, seed);
        st *= 2.;
        amp *= .5;
    }
    return val;
}

vec3 contrast(vec3 color, float contrast){
    return ((color - 0.5) * contrast + 0.5);
}

float circleGrad(in vec2 st){
    vec2 dist = st-0.5;
    return 1.-dot(dist,dist)*4.;
}

float maskShape(in vec2 st){
    //noisy vignette
    return circleGrad(st) * fbm(st, 4., 2., 0.0);
}

void main(){
    //float val = noise2d(vUv * vScale);
    vec2 st = vUv;
    float val = fbm (st, vOctaves, vScale, vSeed);
    val *= maskShape(st) * 3.;
    vec3 color = mix(vColor1, vColor2, val);
    color = clamp(contrast(color, vContrast) * vGain + vLevel,0.0, 1.0);
    //color = vec3(random1d(vUv.x * vUv.y, vSeed));
    gl_FragColor = vec4(color, 1.0);

}