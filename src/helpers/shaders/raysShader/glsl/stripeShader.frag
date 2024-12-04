precision lowp float;

varying vec3 vColor1;
varying vec3 vColor2;
varying float vRays;
varying vec2 vUv;

void main() {
    vec2 st = vUv;
    float d = mod(st.x, 1.0/vRays);
    vec3 val = mix(vColor1, vColor2, step(0.5/vRays, d));
    gl_FragColor.rgba = vec4( val, 1.0);
}