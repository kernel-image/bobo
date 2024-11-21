
const calcCylinderAngularInertia = (radius, height, mass) => {
    //https://en.wikipedia.org/wiki/List_of_moments_of_inertia
    const perpendicularAxes = (mass * (3 * radius * radius + height * height)) / 3.0; //assuming center of mass is at the bottom, divide by 12 if center of mass is at the middle
    const parallelAxes = (mass * radius * radius) / 2.0;
    return {x: perpendicularAxes, y: parallelAxes, z: perpendicularAxes};
  }

  const getAngularInertia = (size, mass) => {
    const radius = size.x / 2;
    const height = size.y;
    return calcCylinderAngularInertia(radius, height, mass)
  }

  export {getAngularInertia}