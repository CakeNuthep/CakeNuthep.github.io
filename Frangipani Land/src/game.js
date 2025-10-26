import { KeyDisplay } from './utils.js';
import { CharacterControls } from './characterControls.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { glbObject } from './glbObject.js';
import GUI from 'lil-gui';
import GhibliGrass from "./GhibliGrass.js";
import { bloom } from "./bloom.js";



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


const FLOOR_SIZE = 10;
const TERRAIN_SCALE = 0.02;
const TERRAIN_HEIGHT = 20;

let scene, camera, renderer, cssRenderer, orbitControls;
let floor, grass, characterControls, keyDisplayQueue;
let sky, sun;
let audioBackground;
let objects = [];
let animationFrameId = null; // Stores the ID of the requestAnimationFrame call
let isStart = false;
let abtLight, dirLight;

const gui = new GUI();
//gui.hide();
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

    // setupDanceCube(danceData);
    // setupTrees(treeData);
    setupTreeWind(3);
    // setupBuildinds(buildingData);
    loadCharacterModel(
        'Player',
        'models/MyAvatar.glb',
        './Sound/Sound Effect/Jump Land.mp3',
        './Sound/Sound Background/ChickenSong.mp3',
        './Sound/Sound Background/Dance.mp3',
        './Sound/Sound Background/Jinn.mp3'
    );
    setupEventListeners();
    setupControls();
    
    // animate();
    audioBackground = createMusic("./Sound/Sound Background/Epic Spectrum.mp3", true,0.5);
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
    abtLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(abtLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 1);
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

function setupTreeWind(effectRate=12.0){
    const data = { radius:0, angle: Math.PI/4, scale: 2, modelPath: 'models/tree.glb', name: 'Tree1', rotate: new THREE.Euler(0, Math.PI/2, 0) }
    const loader = new GLTFLoader(loadingManager);
    loader.load(data.modelPath, (gltf) => {
        const model = gltf.scene;
        model.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
        const instance = model.clone();
        const {x,z} = circlePosition(data.angle, data.radius);
        instance.position.set(x, 0, z);
        instance.rotation.y = data.rotate.y;
        instance.rotation.x = data.rotate.x;
        instance.rotation.z = data.rotate.z;
        instance.scale.set(data.scale, data.scale, data.scale);

        const textureLoader = new THREE.TextureLoader(loadingManager);
        const leafTexture = textureLoader.load('textures/tree/foliage_alpha3.png');
        leafTexture.flipY = false;
        

        const leafMaterial = new THREE.MeshStandardMaterial( {
            color: new THREE.Color('#85e843').convertLinearToSRGB(),
            alphaTest: 0.5,
            transparent: false,
            side: THREE.DoubleSide,
            alphaMap: leafTexture,

        } );

        leafMaterial.customProgramCacheKey = () => 'vertex_wavy_shader_key';

        leafMaterial.onBeforeCompile = (shader) => {
            // Add our custom uniforms
            shader.uniforms.u_windTime  = { value: 0 };
            shader.uniforms.u_effectBlend = { value: 0.9};
            shader.uniforms.u_inflate = { value: 0.0 };
            shader.uniforms.u_scale = { value: 1.0 };
            shader.uniforms.u_windSpeed = { value: 1.0 };

             // Inject our uniform declaration
            shader.vertexShader = shader.vertexShader.replace(
                `#include <common>`,
                `
                #include <common>
                uniform float u_effectBlend;
                uniform float u_inflate;
                uniform float u_scale;
                uniform float u_windSpeed;
                uniform float u_windTime;

                // Custom functions from your GLSL
                float inverseLerp(float v, float minValue, float maxValue) {
                    return (v - minValue) / (maxValue - minValue);
                }

                float remap(float v, float inMin, float inMax, float outMin, float outMax) {
                    float t = inverseLerp(v, inMin, inMax);
                    return mix(outMin, outMax, t);
                }

                mat4 rotationZ(float radians) {
                    float c = cos(radians);
                    float s = sin(radians);
                        return mat4(
                        c, -s, 0, 0,
                        s, c, 0, 0,
                        0, 0, 1, 0,
                        0, 0, 0, 1
                    );
                }

                vec4 applyWind(vec4 v) {
                    float boundedYNormal = remap(normal.y, -1.0, 1.0, 0.0, 1.0);
                    float posXZ = position.x + position.z;
                    float power = u_windSpeed / 5.0 * -0.5;
                    float topFacing = remap(sin(u_windTime + posXZ), -1.0, 1.0, 0.0, power);
                    float bottomFacing = remap(cos(u_windTime + posXZ), -1.0, 1.0, 0.0, 0.05);
                    float radians = mix(bottomFacing, topFacing, boundedYNormal);
                    return rotationZ(radians) * v;
                }

                vec2 calcInitialOffsetFromUVs() {
                    vec2 offset = vec2(
                        remap(uv.x, 0.0, 1.0, -1.0, 1.0),
                        remap(uv.y, 0.0, 1.0, -1.0, 1.0)
                    );
                    offset *= vec2(-1.0, 1.0);
                    offset = normalize(offset) * u_scale;
                    return offset;
                }

                vec3 inflateOffset(vec3 offset) {
                    return offset + normal.xyz * u_inflate;
                }
                `
            );

            // Call custom functions and modify the vertex position
            shader.vertexShader = shader.vertexShader.replace(
                `#include <begin_vertex>`,
                `
                #include <begin_vertex>
                
                 
                vec2 vertexOffset = calcInitialOffsetFromUVs();
                vec3 inflatedVertexOffset = inflateOffset(vec3(vertexOffset, 0.0));

                transformed += mix(vec3(0.0), inflatedVertexOffset, u_effectBlend);
                transformed = applyWind(vec4(transformed,0.0)).xyz;
                // This is a Three.js chunk. The applyWind function operates on
                // world-space, so we will apply it later.
                `
            );

            // Store the custom uniforms and the material itself for the animation loop
            leafMaterial.userData.shader = shader;
        };

        const foliageModel = instance.getObjectByName('foliage');
        instance.traverse((object) => {
            if (object.isMesh && object.name.includes('foliage')) {
                object.material = leafMaterial;
            }
        });
        scene.add(instance);
        const tree = new glbObject(data.name,
            instance,
            1,
            1,
            1,
            settings.collisionDetectionEnabled,
            settings.gravityEnabled,
            settings.showCollisionBoxes
        );
        objects.push(tree);
        



        //////// emit broom //////
        const vfxPath = 'textures/vfx/bloom.png';
        const bloomEffect = bloom({
            camera,
            emitter: foliageModel,
            parent: scene,
            rate: effectRate,
            texture: vfxPath,
            scale: data.scale,
        });
       
        function update(delta){
            if(leafMaterial.userData.shader){
                leafMaterial.userData.shader.uniforms.u_windTime.value += leafMaterial.userData.shader.uniforms.u_windSpeed.value * delta;
            }
            bloomEffect.update(0.016);
        }
        tree.setUpdateFunction(update);
    });
}

function circlePosition(angle, radius) {
        return {
            x: radius * Math.cos(angle),
            z: radius * Math.sin(angle)
        };
}

// Load character model
function loadCharacterModel(name, modlePath, jumpSoundPath, danceSong1Path, danceSong2Path, danceSong3Path) {
    const jumpSound = createMusic(jumpSoundPath,false,1);//createJumpLandSound();
    const chickenSong = createMusic(danceSong1Path,false,1);//createChickenDanceSound();
    const danceSong = createMusic(danceSong2Path,false,1);//createDanceSound();
    const jinnSong = createMusic(danceSong3Path,false,1);//createJinnSong();
    new GLTFLoader(loadingManager).load(modlePath, (gltf) => {
        const model = gltf.scene;
        model.name = name;
        model.traverse((object) => {
            if (object.isMesh) object.castShadow = true;
        });
        const {x,z} = circlePosition(0, FLOOR_SIZE+1);
        model.position.set(x, 0, z);
        model.rotation.y = -Math.PI/2;
        scene.add(model);

        const mixer = new THREE.AnimationMixer(model);
        const animationsMap = new Map();
        gltf.animations.filter((a) => a.name !== 'TPose').forEach((a) => {
            animationsMap.set(a.name, mixer.clipAction(a));
        });

        characterControls = new CharacterControls(
            name,
            model, 
            mixer, 
            animationsMap, 
            orbitControls, 
            camera, 
            jumpSound,
            chickenSong,
            danceSong,
            jinnSong,
            settings.collisionDetectionEnabled,
            settings.showFootBoxes,
            settings.gravityEnabled,
            settings.showCollisionBoxes,
            'Idle',
            'Yawn',
            'Dance',
            'ChickenDance',
            'SnakeDance',
            'Walk',
            'Run',
            'ForwardFlip',
            FLOOR_SIZE+1,
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
    var time = clock.getElapsedTime();

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

    if(grass){
        grass.tick(time);
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

function createMusic(musicPath, loop,volumne){
    const listener = new THREE.AudioListener();
    camera.add( listener );
    let music = new THREE.Audio( listener );
    const audioLoad = new THREE.AudioLoader(loadingManager);
    audioLoad.load( musicPath, function( buffer ) {
        music.setBuffer( buffer );
        music.setLoop( loop );
        music.setVolume( volumne );
        // music.play();
    } );
    return music;
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
    setGrass(floor, characterControls);
    // Hide loading screen by setting its CSS display property to 'none'
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


function setGrass(floorMesh, characterControls){
        grass = new GhibliGrass(floorMesh, characterControls );
        scene.add(grass.mesh);
        //characterControls.model.add(grass.mesh);
}


