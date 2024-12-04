precision lowp float;

#define TUI 6.28

varying vec3 vColor1;
varying vec3 vColor2;
varying float vRays;
varying vec2 vUv;

void main(){
    vec2 st = vUv - 0.5;
    float d = fract(atan(st.y, st.x)/TUI * vRays);
    vec3 val = mix(vColor1, vColor2, step(0.5, d));
    gl_FragColor.rgba = vec4(val, 1.0);
}