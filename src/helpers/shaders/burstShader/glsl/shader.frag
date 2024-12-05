precision lowp float;

varying vec2 vUv;
varying vec3 vColor;
varying float vProgress;

float random(in float seed){
    return abs(sin(seed*5723.4918)*46135.07829);
}

float impulse(in float progress, in float falloff)
{
    //https://iquilezles.org/articles/functions/
    //returns peak value of 1.0 when progress = 1/falloff
    float h = progress * falloff;
    return h*exp(1.0-h);
}

void main() {
    vec2 st = vUv;
    vec3 color = vec3(0.0);
    vec2 pos = vec2(0.5) - st;

    float r = length(pos) * 2.0;
    float a = atan(pos.y, pos.x);
    float pulse = impulse(vProgress, 11.);
    //float f = sin(a * 3.) * sin(a * 333. ) * pulse;
    float f = sin(a * 3.) * sin(a * (21.- vProgress * 20.)) * sin(a * (111.-vProgress * 100.)) * pulse;

    color = vec3(1. - step(f, r));
    float signal = max(max(step(.01, color.r), step(.01, color.g)), step(.01, color.b));
    color *= vColor;

    gl_FragColor = vec4(vec3(color), signal);
}