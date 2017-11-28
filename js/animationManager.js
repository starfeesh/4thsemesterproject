class AnimationManager {
    cameraFlyThrough(cameraParent) {
        var movementAnim = new BABYLON.Animation("cameraFlyThrough", "position", 10, BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.ANIMATIONLOOPMODE_CONSTANT);

        var movementKeys = [
            { frame: 0, value: new BABYLON.Vector3(119, 8, -610) },
            { frame: 50, value: new BABYLON.Vector3(119, 8, -873) },
            { frame: 75, value: new BABYLON.Vector3(101, 8, -873) },
            { frame: 100, value: new BABYLON.Vector3(101, 30, -873) },
            { frame: 110, value: new BABYLON.Vector3(101, 30, -895) }
        ];
        movementAnim.setKeys(movementKeys);

        var turningAnim = new BABYLON.Animation("turningFlyThrough", "rotation.y", 10, BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.ANIMATIONLOOPMODE_CONSTANT);

        var turningKeys = [
            { frame: 0, value: 0 },
            { frame: 50, value: 0 },
            { frame: 55, value: 1.5708 },
            { frame: 75, value: 1.5708 },
            { frame: 80, value: 0 },
            { frame: 105, value: 0 },
            { frame: 110, value: 3.14 }
        ];
        turningAnim.setKeys(turningKeys);

        cameraParent.animations.push(movementAnim, turningAnim);

        var anims = [movementAnim, turningAnim];

        return anims;
    }
    moveNormalPacket(packetSphere, lanes) {
        var packetFlow = new BABYLON.Animation("packetFlow", "position", 5, BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.ANIMATIONLOOPMODE_CONSTANT);

        var lane = lanes[Math.floor(Math.random() * lanes.length)];
        var radius = 5;
        var ranOffset = Math.random() * (20 - 1) + 1;

        var keysFlow = [];
        for (var i = 0; i < lane.length; i++) {
            keysFlow.push({ frame: i, value: new BABYLON.Vector3(Math.sin(i) * radius + lane[i].x + ranOffset, Math.sin(i) * radius + lane[i].y + ranOffset, Math.sin(i) * radius + lane[i].z + ranOffset) });
        }
        packetFlow.setKeys(keysFlow);
        packetSphere.animations.push(packetFlow);

        return packetFlow;
    }
    moveMimicPacket(packetSphere, lanes, speed) {
        var mimicPacketFlow = new BABYLON.Animation("mimicPacketFlow", "position", speed, BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.ANIMATIONLOOPMODE_CONSTANT);
        var mimicKeysFlow = [];
        var lane = lanes[Math.floor(Math.random() * lanes.length)];
        for (var i = 0; i < lane.length; i++) {
            mimicKeysFlow.push({ frame: i, value: lane[i] });
        }

        mimicPacketFlow.setKeys(mimicKeysFlow);
        packetSphere.animations.push(mimicPacketFlow);
    }
    moveTopDownCamera(camera) {
        var camMovementAnim = new BABYLON.Animation("camMove", "position", 8, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.ANIMATIONLOOPMODE_CONSTANT);

        var firstQuadraticBezierVectors = BABYLON.Curve3.CreateQuadraticBezier(new BABYLON.Vector3(102, 40, -898), new BABYLON.Vector3(650, 40, -444), new BABYLON.Vector3( 800, 40, 0), 90);
        var secondQuadraticBezierVectors = BABYLON.Curve3.CreateQuadraticBezier(new BABYLON.Vector3(800, 40, 0), new BABYLON.Vector3(650, 40, 444), new BABYLON.Vector3( 102, 40, 898), 90);
        var thirdQuadraticBezierVectors = BABYLON.Curve3.CreateQuadraticBezier(new BABYLON.Vector3(102, 40, 898), new BABYLON.Vector3(-650, 40, 444), new BABYLON.Vector3( -800, 40, 0), 90);
        var fourthQuadraticBezierVectors = BABYLON.Curve3.CreateQuadraticBezier(new BABYLON.Vector3(-800, 40, 0), new BABYLON.Vector3(-650, 40, -444), new BABYLON.Vector3( 102, 40, -898), 90);

        var circle = firstQuadraticBezierVectors.continue(secondQuadraticBezierVectors).continue(thirdQuadraticBezierVectors).continue(fourthQuadraticBezierVectors);
        var path = circle.getPoints();

        var camMovementKeys = [];
        for (var i = 0; i < 360; i++) {
            camMovementKeys.push({ frame: i, value: path[i] });
        }
        camMovementAnim.setKeys(camMovementKeys);
        camera.animations.push(camMovementAnim);

        return camMovementAnim;
    }
    pointTopDownCamera(objToFollow, lookAtPath) {
        var targetAnim = new BABYLON.Animation("targetPos", "position", 8, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.ANIMATIONLOOPMODE_CONSTANT);
        var targetKeys = [];
        for (var j = 0; j < lookAtPath.length; j++){
            targetKeys.push( { frame: j, value: new BABYLON.Vector3(lookAtPath[j].x, lookAtPath[j].y, lookAtPath[j].z) } );
        }

        targetAnim.setKeys(targetKeys);
        objToFollow.animations.push(targetAnim);

        return targetAnim;
    }
}