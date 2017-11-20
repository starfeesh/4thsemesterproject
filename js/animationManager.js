class AnimationManager {
    cameraFlyThrough(cameraParent) {
        var movementAnim = new BABYLON.Animation("cameraFlyThrough", "position", 10, BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.ANIMATIONLOOPMODE_CONSTANT);

        var keys = [
            { frame: 0, value: new BABYLON.Vector3(119, 8, -710) },
            { frame: 25, value: new BABYLON.Vector3(119, 8, -755) },
            { frame: 50, value: new BABYLON.Vector3(180, 8, -755) },
            { frame: 75, value: new BABYLON.Vector3(180, 8, -814) },
            { frame: 100, value: new BABYLON.Vector3(119, 8, -814) },
            { frame: 125, value: new BABYLON.Vector3(119, 8, -873) },
            { frame: 150, value: new BABYLON.Vector3(101, 8, -873) },
            { frame: 175, value: new BABYLON.Vector3(101, 30, -873) }
        ];
        movementAnim.setKeys(keys);
        cameraParent.animations.push(movementAnim);

        return movementAnim;
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
}