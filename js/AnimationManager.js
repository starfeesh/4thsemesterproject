var laneCamera;
var parent, animation;
var frameRate = 1000;
class AnimationManager {
    Setup(){
        parent = new BABYLON.Mesh.CreateBox("cambox", 20, scene);
        //laneCamera.parent = parent;
        //laneCamera.position = new BABYLON.Vector3(0,5,0);
        laneCamera.lockedTarget = parent;
        parent.isVisible = false;
        parent.alpha = 0;

        scene.activeCamera = laneCamera;
    }
    CameraJourneyAnimation(tubePath){
        var animation = new BABYLON.Animation("camanim", "position", 10, BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                            BABYLON.ANIMATIONLOOPMODE_CONSTANT);
        var keys = [];
        for (var i = 0; i < tubePath.length; i++){
            keys.push({
                frame: i,
                value: tubePath[i]
            });
        }
        animation.setKeys(keys);
        parent.animations.push(animation);
        scene.beginAnimation(parent, 0, 100 * frameRate, false)
    }

    Update() {
        if (typeof parent !== "undefined")
        {
         //console.log(parent.position)
        }
    }
}