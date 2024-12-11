precision highp float;

#include <common>
#include <shadowmap_pars_vertex>

varying vec2 vUv;
varying vec3 vNormal;

void main() {
    #include <beginnormal_vertex>
    #include <defaultnormal_vertex>
    #include <begin_vertex>
    #include <worldpos_vertex>
    #include <shadowmap_vertex>

    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}