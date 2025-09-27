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
import { glbObject } from './glbObject.js';
import GUI from 'lil-gui';



// Get UI elements
const menu = document.getElementById('start-menu');
const loadingScreen = document.getElementById('loading-screen');
const loadingText = document.getElementById('loading-text');
let loadingCount = 0;
const progressBar = document.getElementById('progress-bar');
const gameCanvas = document.getElementById('game-canvas');


// Constants
const loadingManager = new THREE.LoadingManager();


loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    console.log(`Loading file: ${url}. Loaded ${itemsLoaded} of ${itemsTotal} files.`);
    
    const progress = itemsLoaded / itemsTotal;
    console.log(loadingText);
    loadingCount++;
    const dot = '.'.repeat(loadingCount % 4);
    loadingText.textContent = `Loading${dot} (${Math.round(progress * 100)}%)`;
    progressBar.style.width = `${progress * 100}%`;
};



loadingManager.onError = function(url) {
    console.error('Error loading:', url);
};

const GRAVITY = 0.1;
const FLOOR_SIZE = 24;
const TERRAIN_SCALE = 0.02;
const TERRAIN_HEIGHT = 20;

let scene, camera, renderer, cssRenderer, orbitControls;
let floor, characterControls, keyDisplayQueue;
let sky, sun;
let audioBackground;
let raycaster = new THREE.Raycaster();;
let objects = [];
let animationFrameId = null; // Stores the ID of the requestAnimationFrame call
let isStart = false;

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
    setupStartMenu();
    createMenuSettings();
    setupScene();
    setupCamera();
    setupRenderer();
    setupLights();
    initSky();
    setupFloor();
    setupInteractiveCube();
    setupHouse();
    setupSchool();
    setupOfficeBuilding1();
    setupOfficeBuilding2();
    setupCrystal()
    setupDanceCube();
    setupDanceCube2();
    setupDanceCube3();
    setupTree(15, Math.PI/4, 0.5, 'models/jabami_anime_tree_v2.glb', 'Tree1');
    setupTree(15, Math.PI/4 + Math.PI/6, 0.8, 'models/jabami_anime_tree_v3.glb', 'Tree2');
    setupTree(15, Math.PI/4 + Math.PI/3, 0.6, 'models/jabami_anime_tree_v4.glb', 'Tree3');
    setupTree(15, Math.PI/4 + Math.PI/2, 0.7, 'models/jabami_anime_tree_v2.glb', 'Tree4');
    setupTree(15, Math.PI/4 + 2*Math.PI/3, 0.5, 'models/jabami_anime_tree_v3.glb', 'Tree5');
    setupTree(15, Math.PI/4 + 5*Math.PI/6, 0.6, 'models/jabami_anime_tree_v4.glb', 'Tree6');
    setupTree(15, Math.PI/4 + Math.PI, 0.7, 'models/jabami_anime_tree_v2.glb', 'Tree7');
    setupTree(15, Math.PI/4 + 7*Math.PI/6, 0.5, 'models/jabami_anime_tree_v3.glb', 'Tree8');
    setupTree(15, Math.PI/4 + 4*Math.PI/3, 0.6, 'models/jabami_anime_tree_v4.glb', 'Tree9');
    setupTree(15, Math.PI/4 + 3*Math.PI/2, 0.8, 'models/jabami_anime_tree_v2.glb', 'Tree10');
    setupTree(15, Math.PI/4 + 5*Math.PI/3, 0.6, 'models/jabami_anime_tree_v3.glb', 'Tree11');
    setupTree(15, Math.PI/4 + 11*Math.PI/6, 0.7, 'models/jabami_anime_tree_v4.glb', 'Tree12');
    loadCharacterModel();
    setupEventListeners();
    setupControls();
    
    // animate();
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
    renderer = new THREE.WebGLRenderer({ canvas: gameCanvas });
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
        rayleigh: 0.116,
        mieCoefficient: 0.007,
        mieDirectionalG: 0.594,
        elevation: 12.6,
        azimuth: -94.4,
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
    {
        const textureLoader = new THREE.TextureLoader(loadingManager);
        const sandBaseColor = textureLoader.load('./textures/sand/Sand 002_COLOR.jpg');
        const sandNormalMap = textureLoader.load('./textures/sand/Sand 002_NRM.jpg');
        const sandHeightMap = textureLoader.load('./textures/sand/Sand 002_DISP.jpg');
        const sandAmbientOcclusion = textureLoader.load('./textures/sand/Sand 002_OCC.jpg');

        const geometry = new THREE.CircleGeometry(FLOOR_SIZE+3, 512, 0, 2*Math.PI);
        
        geometry.rotateX(-Math.PI / 2);

        // Generate terrain using Perlin noise
        // const noise = new ImprovedNoise();
        // const positionAttribute = geometry.getAttribute('position');
        // for (let i = 0; i < positionAttribute.count; i++) {
        //     const x = positionAttribute.getX(i);
        //     const z = positionAttribute.getZ(i);
        //     const y = noise.noise(x * TERRAIN_SCALE, z * TERRAIN_SCALE, 0) * TERRAIN_HEIGHT;
        //     positionAttribute.setY(i, y);
        // }
        // positionAttribute.needsUpdate = true;
        // geometry.computeVertexNormals();

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
    {
        const textureLoader = new THREE.TextureLoader(loadingManager);
        const grassBaseColor = textureLoader.load('./textures/grass/Ground_Grass_001_COLOR.jpg');
        const grassNormalMap = textureLoader.load('./textures/grass/Ground_Grass_001_NORM.jpg');
        const grassHeightMap = textureLoader.load('./textures/grass/Ground_Grass_001_DISP.PNG');
        const grassAmbientOcclusion = textureLoader.load('./textures/grass/Ground_Grass_001_OCC.jpg');

        const geometry = new THREE.CircleGeometry(FLOOR_SIZE, 512);
        
        geometry.rotateX(-Math.PI / 2);

        // Generate terrain using Perlin noise
        // const noise = new ImprovedNoise();
        // const positionAttribute = geometry.getAttribute('position');
        // for (let i = 0; i < positionAttribute.count; i++) {
        //     const x = positionAttribute.getX(i);
        //     const z = positionAttribute.getZ(i);
        //     const y = noise.noise(x * TERRAIN_SCALE, z * TERRAIN_SCALE, 0) * TERRAIN_HEIGHT;
        //     positionAttribute.setY(i, y);
        // }
        // positionAttribute.needsUpdate = true;
        // geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            map: grassBaseColor,
            normalMap: grassNormalMap,
            displacementMap: grassHeightMap,
            displacementScale: 0.1,
            aoMap: grassAmbientOcclusion,
        });
        wrapAndRepeatTexture(material.map);
        wrapAndRepeatTexture(material.normalMap);
        wrapAndRepeatTexture(material.displacementMap);
        wrapAndRepeatTexture(material.aoMap);

        let floor2 = new THREE.Mesh(geometry, material);
        floor2.position.y = 0.015;
        floor2.receiveShadow = true;
        scene.add(floor2);
    }
    {
        
        const geometry = new THREE.CylinderGeometry(FLOOR_SIZE+3, FLOOR_SIZE, 2, 512);
        const material = new THREE.MeshStandardMaterial({ color: "#f5cda0" });
        let land = new THREE.Mesh(geometry, material);
        land.position.y = -0.965;
        land.receiveShadow = true;
        scene.add(land);
    }
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
        height: 2,
        depth: 1,
        position: new THREE.Vector3(29, 0, 5)
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
    const {x,z} = circlePosition(Math.PI-Math.PI/20, 25);
    const objParams = {
        name: "DanceCube",
        width: 3,
        height: 2,
        depth: 5,
        position: new THREE.Vector3(x, 0, z)
    };
    const cubeObject = new DanceObject(objParams);
    cubeObject.model.name = 'DanceCube';
    cubeObject.setPalyerAction('Dance');
    scene.add(cubeObject.model);
    // scene.add(cubeObject.cube);
    objects.push(cubeObject);
}

function setupDanceCube2() {
    const {x,z} = circlePosition(Math.PI/2, 25);
    const objParams = {
        name: "DanceCube2",
        width: 3,
        height: 2,
        depth: 3,
        position: new THREE.Vector3(x, 0, z)
    };
    const cubeObject = new DanceObject(objParams);
    cubeObject.model.name = 'DanceCube2';
    cubeObject.setPalyerAction('ChickenDance');
    scene.add(cubeObject.model);
    // scene.add(cubeObject.cube);
    objects.push(cubeObject);
}

function setupDanceCube3() {
    const {x,z} = circlePosition(3*Math.PI/2-Math.PI/30, 25);
    const objParams = {
        name: "DanceCube3",
        width: 3,
        height: 2,
        depth: 3,
        position: new THREE.Vector3(x, 0, z)
    };
    const cubeObject = new DanceObject(objParams);
    cubeObject.model.name = 'DanceCube3';
    cubeObject.setPalyerAction('SnakeDance');
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

function setupHouse() {
    const loader = new GLTFLoader(loadingManager);
    loader.load('models/residential_family_house.glb', (gltf) => {
        const model = gltf.scene;
        model.name = 'House';
        model.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
        const {x,z} = circlePosition(0, 20);
        model.position.set(x, 0, z);
        model.rotation.y = Math.PI;
        model.scale.set(7, 7, 7);
        scene.add(model);
        const house = new glbObject('House', 
            model, 
            2, 
            2, 
            2, 
            settings.collisionDetectionEnabled, 
            settings.gravityEnabled, 
            settings.showCollisionBoxes
        );
        // objects.push(house);
    });
}


function setupSchool() {
    const loader = new GLTFLoader(loadingManager);
    loader.load('models/the_japanese_school_classroom.glb', (gltf) => {
        const model = gltf.scene;
        model.name = 'School';
        model.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
        const {x,z} = circlePosition(Math.PI/2, 20);
        model.position.set(x, 0.1, z);
        model.rotation.y = Math.PI;
        model.scale.set(1, 1, 1);
        scene.add(model);
        const school = new glbObject('School', 
            model, 
            2, 
            2, 
            2, 
            settings.collisionDetectionEnabled, 
            settings.gravityEnabled, 
            settings.showCollisionBoxes
        );
        // objects.push(school);
    });
}

function setupOfficeBuilding1() {
    const loader = new GLTFLoader(loadingManager);
    loader.load('models/old_office_building.glb', (gltf) => {
        const model = gltf.scene;
        model.name = 'OfficeBuilding1';
        model.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
        const {x,z} = circlePosition(Math.PI, 20);
        model.position.set(x, 10, z);
        model.rotation.y = Math.PI;
        model.scale.set(7, 7, 7);
        scene.add(model);
        const building1 = new glbObject('OfficeBuilding1', 
            model, 
            2, 
            2, 
            2, 
            settings.collisionDetectionEnabled, 
            settings.gravityEnabled, 
            settings.showCollisionBoxes
        );
        // objects.push(building1);
    });
}



function setupOfficeBuilding2() {
    const loader = new GLTFLoader(loadingManager);
    loader.load('models/singapore_office_skyscraper_free.glb', (gltf) => {
        const model = gltf.scene;
        model.name = 'OfficeBuilding2';
        model.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
        const {x,z} = circlePosition(3*Math.PI/2, 20);
        model.position.set(x, 0, z);
        model.rotation.y = Math.PI;
        model.scale.set(0.1, 0.1, 0.1);
        scene.add(model);
        const building2 = new glbObject('OfficeBuilding2', 
            model, 
            2, 
            2, 
            2, 
            settings.collisionDetectionEnabled, 
            settings.gravityEnabled, 
            settings.showCollisionBoxes
        );
        // objects.push(building2);
    });
}

function setupTree(radius, 
    angle, 
    scale, 
    modelPath, 
    name
) {
    const loader = new GLTFLoader(loadingManager);
    loader.load(modelPath, (gltf) => {
        const model = gltf.scene;
        model.name = name;
        model.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
        const {x,z} = circlePosition(angle, radius);
        model.position.set(x, 0, z);
        model.rotation.y = Math.PI;
        model.scale.set(scale, scale, scale);
        scene.add(model);
        const building2 = new glbObject(name, 
            model, 
            1, 
            1, 
            1, 
            settings.collisionDetectionEnabled, 
            settings.gravityEnabled, 
            settings.showCollisionBoxes
        );
        // objects.push(building2);
    });
}


function setupCrystal() {
    const loader = new GLTFLoader(loadingManager);
    loader.load('models/korok_seed_amulet__botw_inspired.glb', (gltf) => {
        const model = gltf.scene;
        model.name = 'House';
        model.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
        
        model.position.set(0, 5, 0);
        model.rotation.y = Math.PI;
        model.scale.set(0.6, 0.6, 0.6);
        scene.add(model);
        const crystal = new glbObject('House', 
            model, 
            2, 
            2, 
            2, 
            settings.collisionDetectionEnabled, 
            settings.gravityEnabled, 
            settings.showCollisionBoxes
        );
        objects.push(crystal);

        function update(delta){
            model.rotation.y += delta * 0.5; // Rotate at 0.5 radians per second
        }
        crystal.setUpdateFunction(update);
    });
    
}

function circlePosition(angle, radius) {
        return {
            x: radius * Math.cos(angle),
            z: radius * Math.sin(angle)
        };
    }

// Load character model
function loadCharacterModel() {
    const jumpSound = createJumpLandSound();
    const chickenSong = createChickenDanceSound();
    const danceSong = createDanceSound();
    const jinnSong = createJinnSong();
    new GLTFLoader(loadingManager).load('models/MyAvatar.glb', (gltf) => {
        const model = gltf.scene;
        model.name = 'Soldier';
        model.traverse((object) => {
            if (object.isMesh) object.castShadow = true;
        });
        const {x,z} = circlePosition(0, 25);
        model.position.set(x, 0, z);
        model.rotation.y = -Math.PI/2;
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
            chickenSong,
            danceSong,
            jinnSong,
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
     // Define a media query for landscape orientation
    const mediaQuery = window.matchMedia("(orientation: landscape)");
    // Set the initial state
    handleOrientationChange(mediaQuery);

    // Add a listener for future changes
    mediaQuery.addEventListener("change", handleOrientationChange);
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', (event) => {
        keyDisplayQueue?.down(event.code, null);
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


function startAnimation() {
    // Only start the animation if it's not already running
    if (animationFrameId === null) {
        console.log("Starting animation.");
        animate(); // Call the animate function to start the loop
    }
}

function stopAnimation() {
    // Only stop the animation if it's currently running
    if (animationFrameId !== null) {
        console.log("Stopping animation.");
        cancelAnimationFrame(animationFrameId); // Stop the animation frame
        animationFrameId = null; // Reset the ID
    }
}

function animate() {
    var mixerUpdateDelta = clock.getDelta();

    if (characterControls) {
        if(keyDisplayQueue)
        {
            var keysPressed = keyDisplayQueue.getKeysPressed();
            characterControls.update(mixerUpdateDelta, keysPressed, floor, objects);
            //get is dance from characterControls
            if(characterControls.isDancing()){
                //stop sound background
                if(audioBackground.isPlaying){
                    audioBackground.pause();
                }

                //play sound dance characterControls
                characterControls.playDanceSong();
            }
            else{
                characterControls.stopDanceSong();

                playBackGroundMusic();
            }
        }
    }

    for (let obj of objects) {
        obj.update(mixerUpdateDelta);
    }

    orbitControls.update();
    // Update the CSS renderer
    cssRenderer.render(scene, camera);

    // Standard 3D renderer
    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(animate);

}

// Initialize the game
function createMenuSettings(){
    // Create an object to hold the settings
    const guiElement = settingGUI.domElement;
    guiElement.id = 'my-lil-gui';
    // Add controls to the GUI

    settingGUI.add(settings, 'collisionDetection').name('Collision Detection').onChange((value) => {
        updateSetting();
    });

    settingGUI.add(settings, 'showCollisionBoxes').name('Show Collision Boxes').onChange((value) => {
        updateSetting();
    });

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
    // console.log("!audioBackground.isPlaying" + !audioBackground.isPlaying);
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
    const audioLoad = new THREE.AudioLoader(loadingManager);
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
    const audioLoad = new THREE.AudioLoader(loadingManager);
    audioLoad.load( './Sound/Sound Effect/Jump Land.mp3', function( buffer ) {
        jumpSound.setBuffer( buffer );
        jumpSound.setLoop( false );
        jumpSound.setVolume( 1 );
    } );
    return jumpSound;
}


function createChickenDanceSound(){
    const listener = new THREE.AudioListener();
    camera.add( listener );
    let jumpSound = new THREE.Audio( listener );
    const audioLoad = new THREE.AudioLoader(loadingManager);
    audioLoad.load( './Sound/Sound Background/ChickenSong.mp3', function( buffer ) {
        jumpSound.setBuffer( buffer );
        jumpSound.setLoop( false );
        jumpSound.setVolume( 1 );
    } );
    return jumpSound;
}

function createDanceSound(){
    const listener = new THREE.AudioListener();
    camera.add( listener );
    let jumpSound = new THREE.Audio( listener );
    const audioLoad = new THREE.AudioLoader(loadingManager);
    audioLoad.load( './Sound/Sound Background/Dance.mp3', function( buffer ) {
        jumpSound.setBuffer( buffer );
        jumpSound.setLoop( false );
        jumpSound.setVolume( 1 );
    } );
    return jumpSound;
}

function createJinnSong(){
    const listener = new THREE.AudioListener();
    camera.add( listener );
    let jumpSound = new THREE.Audio( listener );
    const audioLoad = new THREE.AudioLoader(loadingManager);
    audioLoad.load( './Sound/Sound Background/Jinn.mp3', function( buffer ) {
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

// Start rendering only after everything is loaded
loadingManager.onLoad = () => {
    loadingScreen.style.display = 'none';

    // Show start menu by setting its CSS display property to 'block'
    menu.style.display = '';
};


// Start Menu
function setupStartMenu(){
    const startButton = document.getElementById('start-button');

    startButton.addEventListener('click', () => {
        // Hide the menu by setting its CSS display property to 'none'
        menu.style.display = 'none';
        animate();
        if (!document.fullscreenElement) {
            isStart = true;
            document.body.requestFullscreen();
            document.body.setAttribute("fullscreen",""); 

        }
    });
}


//




// Function to handle the orientation change
function handleOrientationChange(mediaQuery) {
  const messageElement = document.getElementById("orientation-message");
  const gameCanvas = document.getElementById("game-canvas");
  if (mediaQuery.matches) {
    console.log('Switched to horizontal view');
    messageElement.style.display = "none";
    gameCanvas.style.display = "";
    if(isStart)
    {
        startAnimation();
    }
    // Place your Three.js code for horizontal view here
    // For example, reposition objects, change camera FOV, etc.
  } else {
    console.log('Switched to portrait view');
    messageElement.style.display = "flex";
    gameCanvas.style.display = "none";
    if(isStart)
    {
        stopAnimation();
    }
    // Place your Three.js code for portrait view here
  }

  onWindowResize();
}


