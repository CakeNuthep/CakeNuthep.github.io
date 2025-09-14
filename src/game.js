import { KeyDisplay } from './utils.js';
import { CharacterControls } from './characterControls.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { Object } from './Objects.js';
import { DanceObject } from './DanceObject.js';
import GUI from 'lil-gui';

// Constants
const GRAVITY = 0.1;
const FLOOR_SIZE = 80;
const TERRAIN_SCALE = 0.02;
const TERRAIN_HEIGHT = 20;

let scene, camera, renderer, cssRenderer, orbitControls;
let floor, characterControls, keyDisplayQueue;
let sky, sun;
let audioBackground;
let raycaster = new THREE.Raycaster();;
let objects = [];

const gui = new GUI();
const settingGUI = gui.addFolder("Generic")
const skySettingGUI = gui.addFolder("Sky")

const settings = {
        collisionDetection: true,
        showCollisionBoxes: false,
        showFootBoxes: false,
        gravityEnabled: true,
        soundEffect: true,
        soundBackground: true        
    };

const clock = new THREE.Clock();


function init() {
    createMenuSettings();
    setupScene();
    setupCamera();
    setupRenderer();
    setupLights();
    initSky();
    setupFloor();
    setupInteractiveCube();
    setupDanceCube();
    loadCharacterModel();
    setupEventListeners();
    setupControls();
    
    animate();
    createBackGroundMusic();
    updateSetting();
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

function initSky() {

    // Add Sky
    sky = new Sky();
    sky.scale.setScalar( 450000 );
    scene.add( sky );

    sun = new THREE.Vector3();

    /// GUI

    const effectController = {
        turbidity: 0,
        rayleigh: 0.46,
        mieCoefficient: 0.007,
        mieDirectionalG: 0.594,
        elevation: 5.9,
        azimuth: -180,
        exposure: renderer.toneMappingExposure
    };

    function guiChanged() {

        const uniforms = sky.material.uniforms;
        uniforms[ 'turbidity' ].value = effectController.turbidity;
        uniforms[ 'rayleigh' ].value = effectController.rayleigh;
        uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
        uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
        const theta = THREE.MathUtils.degToRad( effectController.azimuth );

        sun.setFromSphericalCoords( 1, phi, theta );

        uniforms[ 'sunPosition' ].value.copy( sun );

        renderer.toneMappingExposure = effectController.exposure;
        renderer.render( scene, camera );

    }

    skySettingGUI.add( effectController, 'turbidity', 0.0, 20.0, 0.1 ).onChange( guiChanged );
    skySettingGUI.add( effectController, 'rayleigh', 0.0, 4, 0.001 ).onChange( guiChanged );
    skySettingGUI.add( effectController, 'mieCoefficient', 0.0, 0.1, 0.001 ).onChange( guiChanged );
    skySettingGUI.add( effectController, 'mieDirectionalG', 0.0, 1, 0.001 ).onChange( guiChanged );
    skySettingGUI.add( effectController, 'elevation', 0, 90, 0.1 ).onChange( guiChanged );
    skySettingGUI.add( effectController, 'azimuth', - 180, 180, 0.1 ).onChange( guiChanged );
    skySettingGUI.add( effectController, 'exposure', 0, 1, 0.0001 ).onChange( guiChanged );

    guiChanged();

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
        name: "InterActiveCube",
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

// Setup interactive cube
function setupDanceCube() {
    const objParams = {
        name: "DanceCube",
        width: 1,
        height: 1,
        depth: 1,
        position: new THREE.Vector3(5, 3, 0)
    };
    const cubeObject = new DanceObject(objParams);
    cubeObject.model.name = 'DanceCube';
    scene.add(cubeObject.model);
    // scene.add(cubeObject.cube);
    objects.push(cubeObject);
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
    const jumpSound = createJumpLandSound();
    new GLTFLoader().load('models/MyAvatar.glb', (gltf) => {
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

        characterControls = new CharacterControls(
            "Player",
            model, 
            mixer, 
            animationsMap, 
            orbitControls, 
            camera, 
            'Idle',
            jumpSound,
            settings.collisionDetectionEnabled,
            settings.showFootBoxes,
            settings.gravityEnabled,
            settings.showCollisionBoxes
        );
        keyDisplayQueue = new KeyDisplay(characterControls);
        initialObjectInCharacter()
        
        
    });
}

// Setup event listeners
function setupEventListeners() {
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', (event) => {
        keyDisplayQueue?.down(event.code, playBackGroundMusic);
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
    // Create an object to hold the settings

    // Add controls to the GUI

    settingGUI.add(settings, 'collisionDetection').name('Collision Detection').onChange((value) => {
        updateSetting();
    });

    settingGUI.add(settings, 'showCollisionBoxes').name('Show Collision Boxes').onChange((value) => {
        updateSetting();
    });

    // settingGUI.add(settings, 'showFootBoxes').name('Show Foot Boxes').onChange((value) => {
    //     updateSetting();
    // });

    settingGUI.add(settings, 'gravityEnabled').name('Gravity Enabled').onChange((value) => {
        updateSetting();
    });

    settingGUI.add(settings, 'soundEffect').name('Sound Effects').onChange((value) => {
        updateSetting();
    });

    settingGUI.add(settings, 'soundBackground').name('Background Sound').onChange((value) => {
        updateSetting();
        playBackGroundMusic();
        console.log('Background Sound toggled:', value);
        
    });
}

function updateSetting(){
    if(characterControls)
    {
        characterControls.collisionDetectionEnabled = settings.collisionDetection;
        characterControls.showFootBoxes = settings.showFootBoxes;
        characterControls.gravityEnabled = settings.gravityEnabled;
        characterControls.showCollisionBox = settings.showCollisionBoxes;
    }

    for (let obj of objects) {
        obj.showCollisionBox = settings.showCollisionBoxes;
    }
}

function playBackGroundMusic(){
    console.log("!audioBackground.isPlaying" + !audioBackground.isPlaying);
    if(settings.soundBackground){
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

function createJumpLandSound(){
    const listener = new THREE.AudioListener();
    camera.add( listener );
    let jumpSound = new THREE.Audio( listener );
    const audioLoad = new THREE.AudioLoader();
    audioLoad.load( './Sound/Sound Effect/Jump Land.mp3', function( buffer ) {
        jumpSound.setBuffer( buffer );
        jumpSound.setLoop( false );
        jumpSound.setVolume( 1 );
    } );
    return jumpSound;
}

function initialObjectInCharacter(){
    if(characterControls){
        for (let obj of objects) {
            characterControls.initialObjectDetection(obj);
        }
    }
}

init();