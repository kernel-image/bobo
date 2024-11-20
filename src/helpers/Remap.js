function remap(value, inMin, inMax, outMin, outMax, clamp=true) {
if (clamp) {
    if (value < inMin) return outMin;
    if (value > inMax) return outMax;
}
return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

export { remap }