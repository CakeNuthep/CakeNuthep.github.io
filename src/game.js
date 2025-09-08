import { KeyDisplay } from './utils.js';
import { CharacterControls } from './characterControls.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { Object } from './Objects.js';
import GUI from 'lil-gui';

// Constants
const GRAVITY = 0.1;
const FLOOR_SIZE = 80;
const TERRAIN_SCALE = 0.02;
const TERRAIN_HEIGHT = 20;

let scene, camera, renderer, cssRenderer, orbitControls;
let floor, characterControls, keyDisplayQueue
let audioBackground;
let isPlayBackgroundMusic = true;
let raycaster = new THREE.Raycaster();;
let objects = [];


const clock = new THREE.Clock();


function init() {
    createMenuSettings();
    setupScene();
    setupCamera();
    setupRenderer();
    setupLights();
    setupFloor();
    setupInteractiveCube();
    loadCharacterModel();
    setupEventListeners();
    setupControls();
    
    animate();
    createBackGroundMusic();
}

// Setup the scene
function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#a8def0');
}
// Setup the camera
function setupCamera() {
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 5);
}

// Setup the renderer
function setupRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    cssRenderer = new CSS2DRenderer();
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.domElement.id = 'label-container';
    document.body.appendChild(cssRenderer.domElement);
}

// Setup orbit controls
function setupControls() {
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.minDistance = 5;
    orbitControls.maxDistance = 15;
    orbitControls.enablePan = false;
    orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
    orbitControls.update();
}


// Setup lights
function setupLights() {
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


// Setup the floor
function setupFloor() {
    const textureLoader = new THREE.TextureLoader();
    const sandBaseColor = textureLoader.load('./textures/sand/Sand 002_COLOR.jpg');
    const sandNormalMap = textureLoader.load('./textures/sand/Sand 002_NRM.jpg');
    const sandHeightMap = textureLoader.load('./textures/sand/Sand 002_DISP.jpg');
    const sandAmbientOcclusion = textureLoader.load('./textures/sand/Sand 002_OCC.jpg');

    const geometry = new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE, 512, 512);
    geometry.rotateX(-Math.PI / 2);

    // Generate terrain using Perlin noise
    const noise = new ImprovedNoise();
    const positionAttribute = geometry.getAttribute('position');
    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const z = positionAttribute.getZ(i);
        const y = noise.noise(x * TERRAIN_SCALE, z * TERRAIN_SCALE, 0) * TERRAIN_HEIGHT;
        positionAttribute.setY(i, y);
    }
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
        map: sandBaseColor,
        normalMap: sandNormalMap,
        displacementMap: sandHeightMap,
        displacementScale: 0.1,
        aoMap: sandAmbientOcclusion,
    });
    wrapAndRepeatTexture(material.map);
    wrapAndRepeatTexture(material.normalMap);
    wrapAndRepeatTexture(material.displacementMap);
    wrapAndRepeatTexture(material.aoMap);

    floor = new THREE.Mesh(geometry, material);
    floor.receiveShadow = true;
    scene.add(floor);
}

function wrapAndRepeatTexture(map) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.x = map.repeat.y = 10;
}

// Setup interactive cube
function setupInteractiveCube() {
    const objParams = {
        width: 1,
        height: 1,
        depth: 1,
        position: new THREE.Vector3(2, 1, 0)
    };
    const cubeObject = new Object(objParams);
    cubeObject.model.name = 'InteractiveCube';
    scene.add(cubeObject.model);
    // scene.add(cubeObject.cube);
    objects.push(cubeObject);

    // Add click event listener
    window.addEventListener('click', (event) => handleCubeClick(event, cubeObject.model));
}

// Handle cube click
function handleCubeClick(event, cube) {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0 && intersects[0].object === cube) {
        window.open(cube.userData.link, '_blank');
    }
}

// Load character model
function loadCharacterModel() {
    new GLTFLoader().load('models/Soldier.glb', (gltf) => {
        const model = gltf.scene;
        model.name = 'Soldier';
        model.traverse((object) => {
            if (object.isMesh) object.castShadow = true;
        });
        scene.add(model);

        const mixer = new THREE.AnimationMixer(model);
        const animationsMap = new Map();
        gltf.animations.filter((a) => a.name !== 'TPose').forEach((a) => {
            animationsMap.set(a.name, mixer.clipAction(a));
        });

        characterControls = new CharacterControls(model, mixer, animationsMap, orbitControls, camera, 'Idle');
        keyDisplayQueue = new KeyDisplay(characterControls);
        
        
    });
}

// Setup event listeners
function setupEventListeners() {
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', (event) => {
        keyDisplayQueue?.down(event.code);
        playBackGroundMusic();
    });
    document.addEventListener('keyup', (event) => {
        keyDisplayQueue?.up(event.code);
    });
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setSize(window.innerWidth, window.innerHeight);
    keyDisplayQueue?.updatePosition();
}

function animate() {
    var mixerUpdateDelta = clock.getDelta();

    if (characterControls) {
        if(keyDisplayQueue)
        {
            var keysPressed = keyDisplayQueue.getKeysPressed();
            characterControls.update(mixerUpdateDelta, keysPressed, floor, objects);
        }
    }

    for (let obj of objects) {
        obj.update();
    }

    orbitControls.update();
    // Update the CSS renderer
    cssRenderer.render(scene, camera);

    // Standard 3D renderer
    renderer.render(scene, camera);
    requestAnimationFrame(animate);

}

// Initialize the game
function createMenuSettings(){
    const gui = new GUI();
    // Create an object to hold the settings
    const settings = {
        collisionDetection: false,
        showCollisionBoxes: false,
        showFootBoxes: false,
        gravityEnabled: true,
        soundEffect: true,
        soundBackground: true        
    };

    // Add controls to the GUI

    gui.add(settings, 'collisionDetection').name('Collision Detection').onChange((value) => {
        if( characterControls){
            characterControls.collisionDetectionEnabled = value;
        }
    });

    gui.add(settings, 'showCollisionBoxes').name('Show Collision Boxes').onChange((value) => {
        // Handle showing/hiding collision boxes
        if( characterControls){
            characterControls.showCollisionBox = value;
        }

        for (let obj of objects) {
            obj.showCollisionBox = value;
        }
    });

    gui.add(settings, 'showFootBoxes').name('Show Foot Boxes').onChange((value) => {
        // Handle showing/hiding foot boxes
        if( characterControls){
            characterControls.showFootBoxes = value;
        }
    });

    gui.add(settings, 'gravityEnabled').name('Gravity Enabled').onChange((value) => {
        if( characterControls){
            characterControls.gravityEnabled = value;
        }
    });

    gui.add(settings, 'soundEffect').name('Sound Effects').onChange((value) => {
        // Handle sound effect toggle
        console.log('Sound Effects toggled:', value);
    });

    gui.add(settings, 'soundBackground').name('Background Sound').onChange((value) => {
        // Handle background sound toggle
        isPlayBackgroundMusic = value;
        playBackGroundMusic();
        console.log('Background Sound toggled:', value);
        
    });
}

function playBackGroundMusic(){
    if(isPlayBackgroundMusic){
        if(!audioBackground.isPlaying){
            audioBackground.play();
        }
    } else {
        if(audioBackground.isPlaying){
            audioBackground.pause();
        }
    }
}

function createBackGroundMusic(){
    const listener = new THREE.AudioListener();
    camera.add( listener );
    audioBackground = new THREE.Audio( listener );
    const audioLoad = new THREE.AudioLoader();
    audioLoad.load( './Sound/Sound Background/Epic Spectrum.mp3', function( buffer ) {
        audioBackground.setBuffer( buffer );
        audioBackground.setLoop( true );
        audioBackground.setVolume( 0.5 );
        // audioBackground.play();
    } );
}

init();