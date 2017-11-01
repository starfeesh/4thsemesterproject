class AnimationManager {
    rotateGlobe(globeCamera){
        var animation = new BABYLON.Animation("globeanim", "alpha", 10, BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.ANIMATIONLOOPMODE_CONSTANT);
        var current = globeCamera.alpha;
        var keys = [];
        keys.push({
            frame: 0,
            value: current
        });
        keys.push({
            frame: 100,
            value: -15
        });

        animation.setKeys(keys);
        globeCamera.animations.push(animation);
        baseScene.beginAnimation(globeCamera, 0, 30, false);
    }
    zoomGlobe(globeCamera) {
        var animation = new BABYLON.Animation("zoomanim", "radius", 10, BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.ANIMATIONLOOPMODE_CONSTANT);

        var current = globeCamera.radius;
        var keys = [];
        keys.push({
            frame: 0,
            value: current
        });
        keys.push({
            frame: 100,
            value: 5
        });
        animation.setKeys(keys);
        globeCamera.animations.push(animation);
        baseScene.beginAnimation(globeCamera, 0, 30, false);
    }
}