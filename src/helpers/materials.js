import { MeshStandardMaterial } from 'three';

const levelMaterial = new MeshStandardMaterial({ color: '#333333' });
const gloveMaterial = new MeshStandardMaterial({ color: 'red'});
const testMaterial = new MeshStandardMaterial({ color: 'green', alphaTest: 2});

export { levelMaterial, gloveMaterial, testMaterial }