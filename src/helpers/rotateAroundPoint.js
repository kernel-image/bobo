function rotateAroundPoint(point, center, eulerAngles) {
  const translatedPoint = {
    x: point.x - center.x,
    y: point.y - center.y,
    z: point.z - center.z,
  };

  const xAngle = eulerAngles[0];
  const yAngle = eulerAngles[1];
  const zAngle = eulerAngles[2];

  const rotatedPoint = {
    x: translatedPoint.x * Math.cos(yAngle) * Math.cos(zAngle) +
      translatedPoint.y * (Math.sin(xAngle) * Math.sin(yAngle) * Math.cos(zAngle) - Math.cos(xAngle) * Math.sin(zAngle)) +
      translatedPoint.z * (Math.cos(xAngle) * Math.sin(yAngle) * Math.cos(zAngle) + Math.sin(xAngle) * Math.sin(zAngle)),
    y: translatedPoint.x * Math.cos(yAngle) * Math.sin(zAngle) +
      translatedPoint.y * (Math.sin(xAngle) * Math.sin(yAngle) * Math.sin(zAngle) + Math.cos(xAngle) * Math.cos(zAngle)) +
      translatedPoint.z * (Math.cos(xAngle) * Math.sin(yAngle) * Math.sin(zAngle) - Math.sin(xAngle) * Math.cos(zAngle)),
    z: translatedPoint.x * -Math.sin(yAngle) +
      translatedPoint.y * Math.sin(xAngle) * Math.cos(yAngle) +
      translatedPoint.z * Math.cos(xAngle) * Math.cos(yAngle),
  };

  return {
    x: rotatedPoint.x + center.x,
    y: rotatedPoint.y + center.y,
    z: rotatedPoint.z + center.z,
  };
}

export {rotateAroundPoint};