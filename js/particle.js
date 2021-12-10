"use strict";

// Particle constructor
function Particle(x, y, z, mass) {
  this.position = new THREE.Vector3(); // position
  this.previous = new THREE.Vector3(); // previous
  this.original = new THREE.Vector3(); // original
  initParameterizedPosition(x, y, this.position);
  initParameterizedPosition(x, y, this.previous);
  initParameterizedPosition(x, y, this.original);

  this.netForce = new THREE.Vector3(); // net force acting on particle
  this.mass = mass; // mass of the particle
  this.correction = new THREE.Vector3(); // offset to apply to enforce constraints
}

// Snap a particle back to its original position
Particle.prototype.lockToOriginal = function() {
  this.position.copy(this.original);
  this.previous.copy(this.original);
};

// Snap a particle back to its previous position
Particle.prototype.lock = function() {
  this.position.copy(this.previous);
  this.previous.copy(this.previous);
};

// Add the given force to a particle's total netForce.
// Params:
// * force: THREE.Vector3 - the force to add
Particle.prototype.addForce = function(force) {
  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 1 lines of code.
  this.netForce.add(force);
  // ----------- STUDENT CODE END ------------
};

// Perform Verlet integration on this particle with the provided
// timestep deltaT.
// Params:
// * deltaT: Number - the length of time dt over which to integrate
Particle.prototype.integrate = function(deltaT) {
  const DAMPING = SceneParams.DAMPING;

  // ----------- STUDENT CODE BEGIN ------------
  // You need to:
  // (1) Save the old (i.e. current) position into this.previous.
  // (2) Compute the new position of this particle using Verlet integration,
  //     and store it into this.position.
  // (3) Reset the net force acting on the particle (i.e. make it (0, 0, 0) again).
  // ----------- Our reference solution uses 13 lines of code.
  //this.previous = this.position.clone();
  let newPos = new THREE.Vector3();
  newPos.add(this.position);
  newPos.add(this.position.clone().sub(this.previous).multiplyScalar(1 - DAMPING));
  let accel = this.netForce.clone().divideScalar(this.mass);
  newPos.add(accel.multiplyScalar(deltaT ** 2));
  this.previous = this.position;
  this.position = newPos;
  this.netForce = new THREE.Vector3();
  // ----------- STUDENT CODE END ------------
};

// Handle collisions between this Particle and the provided floor.
// Note: the fields of floor are documented for completeness, but you
//       *WILL NOT* need to use all of them.
// Params:
// * floor: An object representing the floor of the scene, with properties:
//    - mesh: THREE.Mesh - the physical representation in the scene
//    - geometry: THREE.PlaneBufferGeometry - the abstract geometric representation
//    - material: THREE.MeshPhongMaterial - material information for lighting
Particle.prototype.handleFloorCollision = function(floor) {
  let floorMesh = floor.mesh;
  let floorPosition = floorMesh.position;
  const EPS = 3;
  // ----------- STUDENT CODE BEGIN ------------
  // Handle collision of this particle with the floor.
  // ----------- Our reference solution uses 4 lines of code.
  if (this.position.y <= floorPosition.y + EPS)
  this.position.setY(floorPosition.y + EPS);
  // ----------- STUDENT CODE END ------------
};

// Handle collisions between this Particle and the provided sphere.
// Note: the fields of sphere are documented for completeness, but you
//       *WILL NOT* need to use all of them.
// Params:
// * sphere: An object representing a sphere in the scene, with properties:
//    - mesh: THREE.Mesh - the physical representation in the scene
//    - geometry: THREE.SphereGeometry - the abstract geometric representation
//    - material: THREE.MeshPhongMaterial - material information for lighting
//    - radius: number - the radius of the sphere
//    - position: THREE.Vector3 - the sphere's position in this frame
//    - prevPosition: THREE.Vector3 - the sphere's position in the previous frame
Particle.prototype.handleSphereCollision = function(sphere) {
  if (sphere.mesh.visible) {
    const friction = SceneParams.friction;
    let spherePosition = sphere.position.clone();
    let prevSpherePosition = sphere.prevPosition.clone();
    let EPS = 5; // empirically determined
    // ----------- STUDENT CODE BEGIN ------------
    // Handle collision of this particle with the sphere.
    // As with the floor, use EPS to prevent clipping.
    let posFriction = new THREE.Vector3();
    let posNoFriction = new THREE.Vector3();
    // ----------- Our reference solution uses 28 lines of code.
    let distVec = this.position.clone().sub(spherePosition);
    let dist = distVec.length();
    if (dist - sphere.radius > EPS) return;
    posNoFriction = distVec.normalize().multiplyScalar(sphere.radius + EPS).add(spherePosition);
    let prevDist = this.previous.clone().sub(spherePosition).length();
    let newPos = new THREE.Vector3();
    // if outside of sqphere in the last time-step
    if (prevDist - sphere.radius > EPS) {
      let vSphere = spherePosition.clone().sub(prevSpherePosition);
      posFriction.add(this.previous).add(vSphere);
      newPos.add(posFriction.multiplyScalar(friction));
      newPos.add(posNoFriction.multiplyScalar(1 - friction));
    } else {
      newPos = posNoFriction;
    }
    this.position = newPos;
    // ----------- STUDENT CODE END ------------
  }
};

// Handle collisions between this Particle and the provided axis-aligned box.
// Note: the fields of box are documented for completeness, but you
//       *WILL NOT* need to use all of them.
// Params:
// * box: An object representing an axis-aligned box in the scene, with properties:
//    - mesh: THREE.Mesh - the physical representation in the scene
//    - geometry: THREE.BoxGeometry - the abstract geometric representation
//    - material: THREE.MeshPhongMaterial - material information for lighting
//    - boundingBox: THREE.Box3 - the bounding box of the box in the scene
Particle.prototype.handleBoxCollision = function(box) {
  if (box.mesh.visible) {
    const friction = SceneParams.friction;
    let boundingBox = box.boundingBox.clone();
    const EPS = 10; // empirically determined
    // ----------- STUDENT CODE BEGIN ------------
    // Handle collision of this particle with the axis-aligned box.
    // As before, use EPS to prevent clipping
    let posFriction = new THREE.Vector3();
    let posNoFriction = new THREE.Vector3();
    // ----------- Our reference solution uses 66 lines of code.
    // do nothing if outside of box
    boundingBox.expandByScalar(EPS);
    if (!boundingBox.containsPoint(this.position)) return;
    let minDist = Infinity;
    let project;
    let distLeft = Math.abs(boundingBox.min.x - this.position.x);
    if (distLeft < minDist) {
      minDist = distLeft;
      project = new THREE.Vector3(boundingBox.min.x, this.position.y, this.position.z);
    }
    let distRight = Math.abs(boundingBox.max.x - this.position.x);
    if (distRight < minDist) {
      minDist = distRight;
      project = new THREE.Vector3(boundingBox.max.x, this.position.y, this.position.z);
    }
    let distUp = Math.abs(boundingBox.min.y - this.position.y);
    if (distUp < minDist) {
      minDist = distUp;
      project = new THREE.Vector3(this.position.x, boundingBox.min.y, this.position.z);
    }
    let distDown = Math.abs(boundingBox.max.y - this.position.y);
    if (distDown < minDist) {
      minDist = distDown;
      project = new THREE.Vector3(this.position.x, boundingBox.max.y, this.position.z);
    }
    let distFront = Math.abs(boundingBox.min.z - this.position.z);
    if (distFront < minDist) {
      minDist = distFront;
      project = new THREE.Vector3(this.position.x, this.position.y, boundingBox.min.z);
    }
    let distBack = Math.abs(boundingBox.max.z - this.position.z);
    if (distBack < minDist) {
      minDist = distBack;
      project = new THREE.Vector3(this.position.x, this.position.y, boundingBox.max.z);
    }
    posNoFriction = project;
    let newPos = new THREE.Vector3();
    // particle was outside of the box in the last time-step
    if (!boundingBox.containsPoint(this.previous)) {
      posFriction.add(this.previous);
      newPos.add(posFriction.multiplyScalar(friction));
      newPos.add(posNoFriction.multiplyScalar(1 - friction));
    } else {
      newPos = posNoFriction;
    }
    this.position = newPos;
    // ----------- STUDENT CODE END ------------
  }
};

// ------------------------ Don't worry about this ---------------------------
// Apply the cached correction vector to this particle's position, and
// then zero out the correction vector.
// Particle.prototype.applyCorrection = function() {
//   this.position.add(this.correction);
//   this.correction.set(0,0,0);
// }
