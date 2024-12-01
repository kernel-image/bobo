#ifdef GL_ES
precision lowp float;
#endif

varying vec3 vColorMain;
varying vec3 vColorFresnel;
varying float vPower;

in vec3 viewNV;

void main() {
  vec3 N = normalize(viewNV);
  vec3 L = vec3(0.0, 0.0, 1.0);
  float NdotL = dot(N, L);

  vec3 color = mix(vColorFresnel, vColorMain, abs(NdotL) * vPower);
  gl_FragColor.rgba = vec4(color.rgb, 1.0);
}
