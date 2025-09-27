import * as THREE from 'three';
import { A, D, DIRECTIONS } from './utils.js';
import {Box} from './Box.js';

class CharacterControls extends Box {
    constructor(name,model, mixer, animationsMap, orbitControl, camera, initialAction,
        jumpSound,
        chickenSong,
        danceSong,
        jinnSong,
        collisionDetectionEnabled=true,
        showFootBoxes=false,
        gravityEnabled=true,
        showCollisionBox=false,

    ) {

        // bounding box for collision detect
        const size = new THREE.Vector3(1,1.5,1);
        super({
            name: name,
            width: size.x,
            height: size.y,
            depth: size.z,
            position: new THREE.Vector3(0, size.y/2, 0),
        });
        model.add(this.cube);
        this.model = model;
        this.showFootBoxes = false;
        this.jumpSound = jumpSound;
        this.chickenSong = chickenSong;
        this.danceSong = danceSong;
        this.jinnSong = jinnSong;
        this.mixer = mixer;
        this.animationsMap = animationsMap;
        this.orbitControl = orbitControl;
        this.camera = camera;

        this.currentAction = initialAction;
        this.toggleRun = true;
        this.isJumping = false;
        this.onGround = true;
        this.jumpStrength = 0.2;

        this.walkDirection = new THREE.Vector3();
        this.rotateAngle = new THREE.Vector3(0, 1, 0);
        this.rotateQuaternion = new THREE.Quaternion();
        this.cameraTarget = new THREE.Vector3();

        this.fadeDuration = 0.01;
        this.runVelocity = 0.2;
        this.walkVelocity = 0.2;
        this.gravityEnabled = gravityEnabled;
        this.showCollisionBox = showCollisionBox;
        this.showFootBoxes = showFootBoxes;
        this.collisionDetectionEnabled = collisionDetectionEnabled;

        this.idleTimeoutDurationMin = 30000;
        this.idleTimeoutDurationMax = 38000;
        this.anyActionDateTime = Date.now();

        this.playInitialAnimation();
        this.setupCameraTarget();
        this.mapObject = null;

        
        this.IdleAction = 'Idle';
        this.IdleYawnAction = 'Yawn';
        this.IdleDanceAction = 'Dance';
        this.IdleChickenDanceAction = 'ChickenDance';
        this.IdleSnakeDaceAction = 'SnakeDance';
        this.RunAction = 'Run';
        this.WalkAction = 'Walk';
        this.JumpAction = 'ForwardFlip';
        this.IdleCurrentAction = this.IdleAction;
        this.IdelCurrentWaitAction = this.IdleYawnAction;
        this.currentDanceSong = this.danceSong;
        this.angle = 0;
        this.radius = 25;
        
    }

    playInitialAnimation() {
        const initialAnimation = this.animationsMap.get(this.currentAction);
        if (initialAnimation) {
            initialAnimation.play();
        }
    }

    switchRunToggle() {
        this.toggleRun = !this.toggleRun;
    }

    jump() {
        if (this.onGround) {
            this.onGround = false;
            this.velocity.y = this.jumpStrength;
            this.isJumping = true;
            console.log('Jump initiated');
        }
        else {
            // Prevent double jump
            return;
        }
    }

    getBones(boneName) {
        let bone = null;
        this.model.traverse((object) => {
            if (object.isBone && object.name === boneName) {
                bone = object;
            }
        });
        return bone;
    }


    update(delta, keysPressed, floor) {
        const directionPressed = this.isDirectionPressed(keysPressed);
        const {isJump,isMove,nextAction} = this.determineNextAction(directionPressed);
        // console.log(`isJump: ${isJump}, isMove: ${isMove}, nextAction: ${nextAction}`);
        this.updateAnimation(nextAction);
        this.mixer.update(delta);

        if (isMove) {
            this.handleMovement(delta, keysPressed,this.mapObject);
        }
        

        if(this.gravityEnabled)
        {
            const currentPosition = this.model.position.clone();
            let { y, velocity, onGround } =  this.applyGravity(floor,delta);
            this.model.position.y = y;
            let {isColiision,isPassThrough}  = this.collisionDetection(this.mapObject);
            if (isColiision && !isPassThrough) {
                this.model.position.copy(currentPosition);
                this.isJumping = false;
            }
            if(onGround){
                if(this.isJumping)
                {
                    console.log("Play sound Jump Landing");
                    if(this.jumpSound)
                    {
                        if (this.jumpSound.isPlaying) {
                            this.jumpSound.stop(); // Stop if already playing to allow re-triggering
                        }
                        this.jumpSound.play();
                        console.log("play jump sound")
                    }
                }
                this.isJumping = false;
            }
        }

        if(this.isMoving(this.currentAction) || isJump){
            this.updateCameraTarget();
        }
    }

    isDirectionPressed(keysPressed) {
        return DIRECTIONS.some((key) => keysPressed[key] === true);
    }

    determineNextAction(directionPressed) {
        var isJump = false;
        var nextAction = this.IdleCurrentAction;
        var isMove = false;
        if (this.isJumping) {
            isJump = true;
            nextAction = this.JumpAction;
            this.anyActionDateTime = Date.now(); 
        }
        if (directionPressed && this.toggleRun) {
            isMove = true;

            if(!isJump){
                nextAction = this.RunAction;
            }
            this.anyActionDateTime = Date.now(); 
        } else if (directionPressed) {
            isMove = true;
            if(!isJump){
                nextAction = this.WalkAction;
            }
            this.anyActionDateTime = Date.now(); 
        } else {
            if(!isJump){
                const diffTime = (Date.now() - this.anyActionDateTime);
                if(diffTime > this.idleTimeoutDurationMin)
                {
                    nextAction = this.IdelCurrentWaitAction;
                    if( diffTime > this.idleTimeoutDurationMax)
                    {
                        this.anyActionDateTime = Date.now();
                    }
                    
                }
                else
                {
                    nextAction = this.IdleCurrentAction;
                }
            }
        }

        
        return {isJump, isMove, nextAction};
    }

    updateIdleAction(){
        let isColiision = false;
        this.mapObject.forEach((object, objName) => {
            const obj = object.object
            if(object.collision)
            {
                this.updateIdleCurrentAction(obj.action);
                this.updateIdleCurrentWaitAction(obj.action);
                isColiision = true;
            }
        });
        if(!isColiision){
            this.setDefaultIdleAction();
        }
        
    }

    setDefaultIdleAction(){
        this.updateIdleCurrentAction(this.IdleAction);
        this.updateIdleCurrentWaitAction(this.IdleYawnAction);
    }

    updateIdleCurrentAction(newIdleAction){
        if(this.IdleCurrentAction != newIdleAction)
        {
            this.IdleCurrentAction = newIdleAction;
        }
    }

    updateIdleCurrentWaitAction(newIdleAction){
        if(this.IdelCurrentWaitAction != newIdleAction)
        {
            this.IdelCurrentWaitAction = newIdleAction;
        }
    }

    updateAnimation(nextAction) {
        if (this.currentAction !== nextAction) {
            const toPlay = this.animationsMap.get(nextAction);
            const current = this.animationsMap.get(this.currentAction);

            if (current) current.fadeOut(this.fadeDuration);
            if (toPlay) toPlay.reset().fadeIn(this.fadeDuration).play();

            this.currentAction = nextAction;
        }
    }

    isMoving(action) {
        return action === this.RunAction || action === this.WalkAction;
    }

    handleMovement(delta, keysPressed, mapObjects) {
        const angleYCameraDirection = this.calculateCameraDirectionAngle();
        const directionOffset = this.calculateDirectionOffset(keysPressed);
        const currentPosition = this.model.position.clone();

        this.rotateModel(angleYCameraDirection, directionOffset);
        this.moveModel(delta, directionOffset);
        let {isColiision,isPassThrough} = this.collisionDetection(mapObjects);
        if (isColiision && !isPassThrough) {
            this.model.position.copy(currentPosition);
        }
        
    }

    

    collisionDetection(mapObjects) {
        let isColiision = false;
        let isPassThrough = false;
        this.updateSides(this.model.position);
        mapObjects.forEach((object, objName) => {
            const obj = object.object
            obj.updateSides();
            if (this.boxCollision({ box1: this, box2: obj })) {
                console.log('Collision detected');
                obj.showHtml();
                isColiision = true;
                this.mapObject.set(objName, {object: obj, collision: true});
                if(obj.passThroughWhenCollision)
                {
                    isPassThrough = true;
                }
            } 
            else{
                obj.hideHtml();
                this.mapObject.set(objName, {object: obj, collision: false});
            }
        });
        return {isColiision, isPassThrough}
    }

    calculateCameraDirectionAngle() {
        return Math.atan2(
            this.camera.position.x - this.model.position.x,
            this.camera.position.z - this.model.position.z
        );
    }

    calculateDirectionOffset(keysPressed) {
        let directionOffset = 0;

        if (keysPressed[A]) {
            directionOffset = Math.PI / 2; // A
            
        } else if (keysPressed[D]) {
            directionOffset = -Math.PI / 2; // D
        }

        return directionOffset;
    }

    rotateModel(angleYCameraDirection, directionOffset) {
        this.rotateQuaternion.setFromAxisAngle(
            this.rotateAngle,
            angleYCameraDirection + directionOffset
        );
        this.model.quaternion.rotateTowards(this.rotateQuaternion, 2);
    }

    moveModel(delta, directionOffset) {
        this.calculateWalkDirection(directionOffset);

        const velocity =
            this.currentAction === 'Run' ? this.runVelocity : this.walkVelocity;


        this.angle += velocity * this.walkDirection.x*delta;
        
        // Calculate new position
        const {x, z} = this.circlePosition(this.angle, this.radius);
        this.model.position.x = x;
        this.model.position.z = z;
        console.log(`X: ${this.model.position.x} Z: ${this.model.position.z} Y:${this.model.position.y}`);
    }

    circlePosition(angle, radius) {
        return {
            x: radius * Math.cos(angle),
            z: radius * Math.sin(angle)
        };
    }

    calculateWalkDirection(directionOffset) {
        if(directionOffset > 0){
            this.walkDirection.x = 1;
            this.walkDirection.z = 1;
            this.walkDirection.y = 0;
        }
        else{
            this.walkDirection.x = -1;
            this.walkDirection.z = -1;
            this.walkDirection.y = 0;
        }
    }

    updateCameraTarget() {
        this.camera.position.x = Math.cos(this.angle) * (this.radius+10);
        this.camera.position.z = Math.sin(this.angle) * (this.radius+10);
        this.camera.position.y = 3; // Keep camera elevated


        if(this.isColiision || this.onGround){
            this.cameraTarget.setY(this.model.position.y + 1);
        }

       
        this.cameraTarget.setX(this.model.position.x);
        this.cameraTarget.setZ(this.model.position.z);
        // this.cameraTarget.set(
        //     this.model.position.x,
        //     y,
        //     this.model.position.z
        // );

        this.orbitControl.target = this.cameraTarget;
    }

    setupCameraTarget() {
        // Set initial camera position for third-person view
        const cameraOffset = new THREE.Vector3(4, 3, 0); // Adjust height and distance
        const initialCameraPosition = this.model.position.clone().add(cameraOffset);

        this.camera.position.copy(initialCameraPosition);

        // Set initial camera target
        this.cameraTarget.set(
            this.model.position.x,
            this.model.position.y + 1, // Keep target slightly above the model
            this.model.position.z
        );
        this.orbitControl.target = this.cameraTarget;
    }

    initialObjectDetection(object){
        if(object)
        {
            if(this.mapObject){
                if(!this.mapObject.has(object.name))
                {
                    this.mapObject.set(object.name, {object: object, collision: false});
                }
            }
            else{
                this.mapObject = new Map();
                this.mapObject.set(object.name, {object: object,  collision: false});
            }
        }
    }

    getFirstObjecHasCollision(){
        if(this.mapObject)
        {
            for(let [key, value] of this.mapObject.entries()){
                if(value && value.collision){
                    return value.object;
                }
            }
        }
    }

    playDanceSong(){

        const angleYCameraDirection = this.calculateCameraDirectionAngle();
        this.rotateModel(angleYCameraDirection, Math.PI);
        if(!this.currentDanceSong.isPlaying){

            this.currentDanceSong.play();
        }
    }

    stopDanceSong(){
        if(this.currentDanceSong.isPlaying){
            this.currentDanceSong.pause();
        }
    }

    isDancing(){
        if(this.IdleCurrentAction == this.IdleDanceAction)
        {
            this.currentDanceSong = this.danceSong;
            return true;
        }
        else if(this.IdleCurrentAction == this.IdleChickenDanceAction )
        {
            this.currentDanceSong = this.chickenSong;
            return true;
        }
        else if(this.IdleCurrentAction == this.IdleSnakeDaceAction)
        {
            this.currentDanceSong = this.jinnSong;
            return true;
        }
        return false;
    }
}

export { CharacterControls };