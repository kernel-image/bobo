precision lowp float;

//built-in
//uniform mat4 viewMatrix;
//uniform vec3 cameraPosition;

varying vec3 viewNV;
varying vec3 vColorMain;
varying vec3 vColorFresnel;
varying float vPower;

void main() {
  vec3 N = normalize(viewNV);
  vec3 L = vec3(0.0, 0.0, 1.0);
  float NdotL = dot(N, L);

  vec3 color = mix(vColorFresnel, vColorMain, abs(NdotL) * vPower);
  gl_FragColor.rgba = vec4(color.rgb, 1.0);
}
