import { KeyDisplay } from './utils.js';
import { CharacterControls } from './characterControls.js';
import * as THREE from 'three';
import { CameraHelper } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';



// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color('#a8def0');

// CAMERA
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 5;
camera.position.z = 5;
camera.position.x = 0;

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

// CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 15;
orbitControls.enablePan = false;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
orbitControls.update();



//Link Label
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
    color: 0xff5733, // Change to a new color
    metalness: 0.5, // Add metallic property
    roughness: 0.7  // Add roughness property
});
const cube = new THREE.Mesh(geometry, material);
cube.position.set(2, 0, 0);

//// Attach a custom property with the link data
cube.userData.link = 'https://threejs.org/';
cube.userData.label = 'Click Me!';

//// Create the HTML label element
const labelDiv = document.createElement('a');
labelDiv.className = 'link-label';
labelDiv.textContent = cube.userData.label;
labelDiv.href = cube.userData.link; // Set the link URL
labelDiv.target = '_blank'; // Open in a new tab

const label = new CSS2DObject(labelDiv);
label.position.set(0, 1, 0); // Position relative to the cube
cube.add(label);
scene.add(cube);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(event) {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    if (object.userData.link) {
      window.open(object.userData.link, '_blank');
    }
  }
}

window.addEventListener('click', onClick);

const cssRenderer = new CSS2DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.id = 'label-container';
document.body.appendChild(cssRenderer.domElement);


// LIGHTS
light();

// FLOOR
generateFloor();

// MODEL WITH ANIMATIONS
var characterControls;
var keyDisplayQueue;
new GLTFLoader().load('models/Soldier.glb', function (gltf) {
    const model = gltf.scene;
    model.traverse(function (object) {
        if (object.isMesh) object.castShadow = true;
    });
    scene.add(model);

    const gltfAnimations = gltf.animations;
    const mixer = new THREE.AnimationMixer(model);
    const animationsMap = new Map();
    gltfAnimations.filter(a => a.name != 'TPose').forEach(function (a) {
        console.log(a.name);
        animationsMap.set(a.name, mixer.clipAction(a));
    });

    characterControls = new CharacterControls(model, mixer, animationsMap, orbitControls, camera, 'Idle');
    keyDisplayQueue = new KeyDisplay(characterControls);
});

// CONTROL KEYS
// const keysPressed = {};
document.addEventListener('keydown', function (event) {
    // console.log('key down');
    // console.log(event.code);
    if (characterControls) {
        keyDisplayQueue.down(event.code);
    //     characterControls.switchRunToggle();
    // } else {
        // keysPressed[event.code] = true;
    }
}, false);
document.addEventListener('keyup', function (event) {
    // console.log('key up');
    // console.log(event.code);
    if (characterControls) {
        keyDisplayQueue.up(event.code);
        // keysPressed[event.code] = false;
    }
}, false);

const clock = new THREE.Clock();
// ANIMATE
function animate() {
    var mixerUpdateDelta = clock.getDelta();
    
    if (characterControls && keyDisplayQueue) {
        var keysPressed = keyDisplayQueue.getKeysPressed();
        characterControls.update(mixerUpdateDelta, keysPressed);
    }
    orbitControls.update();
    // Update the CSS renderer
    cssRenderer.render(scene, camera);

    // Standard 3D renderer
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
document.body.appendChild(renderer.domElement);
animate();

// RESIZE HANDLER
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setSize(window.innerWidth, window.innerHeight);
    keyDisplayQueue.updatePosition();
}
window.addEventListener('resize', onWindowResize);

function generateFloor() {
    // TEXTURES
    var textureLoader = new THREE.TextureLoader();
    var placeholder = textureLoader.load("./textures/placeholder/placeholder.png");
    var sandBaseColor = textureLoader.load("./textures/sand/Sand 002_COLOR.jpg");
    var sandNormalMap = textureLoader.load("./textures/sand/Sand 002_NRM.jpg");
    var sandHeightMap = textureLoader.load("./textures/sand/Sand 002_DISP.jpg");
    var sandAmbientOcclusion = textureLoader.load("./textures/sand/Sand 002_OCC.jpg");

    var WIDTH = 80;
    var LENGTH = 80;

    var geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 512, 512);
    geometry.rotateX(-Math.PI / 2);

    // Create an instance of ImprovedNoise
    const noise = new ImprovedNoise();
    const positionAttribute = geometry.getAttribute('position');
    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const z = positionAttribute.getZ(i);

        // Generate height using Simplex noise
        const y = noise.noise(x * 0.02, z * 0.02,0)*20;

        // Set the vertex's new y position
        positionAttribute.setY(i, y);
    }

    // Mark the attribute as needing an update
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();



    var material = new THREE.MeshStandardMaterial({
        map: sandBaseColor,
        normalMap: sandNormalMap,
        displacementMap: sandHeightMap,
        displacementScale: 0.1,
        aoMap: sandAmbientOcclusion
    });
    wrapAndRepeatTexture(material.map);
    wrapAndRepeatTexture(material.normalMap);
    wrapAndRepeatTexture(material.displacementMap);
    wrapAndRepeatTexture(material.aoMap);
    // const material = new THREE.MeshPhongMaterial({ map: placeholder})

    var floor = new THREE.Mesh(geometry, material);
    floor.receiveShadow = true;;
    scene.add(floor);
}

function wrapAndRepeatTexture(map) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.x = map.repeat.y = 10;
}

function light() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    var dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(-60, 100, -10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    scene.add(dirLight);
    // scene.add( new THREE.CameraHelper(dirLight.shadow.camera))
}


