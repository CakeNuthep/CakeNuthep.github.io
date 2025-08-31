import * as THREE from 'three';
import { A, D, DIRECTIONS, S, W, SHIFT } from './utils.js';

class CharacterControls {
    constructor(model, mixer, animationsMap, orbitControl, camera, initialAction) {
        this.model = model;
        this.mixer = mixer;
        this.animationsMap = animationsMap;
        this.orbitControl = orbitControl;
        this.camera = camera;

        this.currentAction = initialAction;
        this.toggleRun = true;

        this.walkDirection = new THREE.Vector3();
        this.rotateAngle = new THREE.Vector3(0, 1, 0);
        this.rotateQuaternion = new THREE.Quaternion();
        this.cameraTarget = new THREE.Vector3();

        this.fadeDuration = 0.2;
        this.runVelocity = 5;
        this.walkVelocity = 2;

        this.playInitialAnimation();
        this.setupCameraTarget();
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

    update(delta, keysPressed) {
        const directionPressed = this.isDirectionPressed(keysPressed);
        const nextAction = this.determineNextAction(directionPressed);

        this.updateAnimation(nextAction);
        this.mixer.update(delta);

        if (this.isMoving(nextAction)) {
            this.handleMovement(delta, keysPressed);
        }
    }

    isDirectionPressed(keysPressed) {
        return DIRECTIONS.some((key) => keysPressed[key] === true);
    }

    determineNextAction(directionPressed) {
        if (directionPressed && this.toggleRun) {
            return 'Run';
        } else if (directionPressed) {
            return 'Walk';
        } else {
            return 'Idle';
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
        return action === 'Run' || action === 'Walk';
    }

    handleMovement(delta, keysPressed) {
        const angleYCameraDirection = this.calculateCameraDirectionAngle();
        const directionOffset = this.calculateDirectionOffset(keysPressed);

        this.rotateModel(angleYCameraDirection, directionOffset);
        this.moveModel(delta, directionOffset);
    }

    calculateCameraDirectionAngle() {
        return Math.atan2(
            this.camera.position.x - this.model.position.x,
            this.camera.position.z - this.model.position.z
        );
    }

    calculateDirectionOffset(keysPressed) {
        let directionOffset = 0;

        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4; // W + A
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4; // W + D
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2; // S + A
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2; // S + D
            } else {
                directionOffset = Math.PI; // S
            }
        } else if (keysPressed[A]) {
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
        this.model.quaternion.rotateTowards(this.rotateQuaternion, 0.2);
    }

    moveModel(delta, directionOffset) {
        this.calculateWalkDirection(directionOffset);

        const velocity =
            this.currentAction === 'Run' ? this.runVelocity : this.walkVelocity;
        const moveX = this.walkDirection.x * velocity * delta;
        const moveZ = this.walkDirection.z * velocity * delta;

        this.model.position.x += moveX;
        this.model.position.z += moveZ;

        this.updateCameraTarget(moveX, moveZ);
    }

    calculateWalkDirection(directionOffset) {
        this.camera.getWorldDirection(this.walkDirection);
        this.walkDirection.y = 0;
        this.walkDirection.normalize();
        this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);
    }

    updateCameraTarget(moveX, moveZ) {
        const distance = 5; // Desired distance from the model
        const direction = new THREE.Vector3();
        direction.subVectors(this.model.position, this.camera.position);
        const magnitude = direction.length();

        // 2. Normalize the direction vector (set its length to 1)
        direction.normalize();

        // 3. Scale the direction vector by the step size
        direction.multiplyScalar(magnitude - distance);

         // 4. Add the resulting vector to vectorA
        const cameraPosition = this.camera.position.clone().add(direction);

        this.camera.position.lerp(cameraPosition, 0.1); // Smooth transition
        this.camera.position.y = this.model.position.y + 3; // Maintain a height above the model

        // Update camera target
        this.cameraTarget.set(
            this.model.position.x,
            this.model.position.y + 1, // Keep target slightly above the model
            this.model.position.z
        );
        this.orbitControl.target = this.cameraTarget;
    }

    setupCameraTarget() {
        // Set initial camera position for third-person view
        const cameraOffset = new THREE.Vector3(0, 3, -4); // Adjust height and distance
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
}

export { CharacterControls };