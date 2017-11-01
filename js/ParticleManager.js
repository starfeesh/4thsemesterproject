class ParticleManager {
    cityParticles(path, curve) {
        var color1 = new BABYLON.Color3.FromHexString("#76ff1d");
        var color2 = new BABYLON.Color3.FromHexString("#a1ff1b");
        var colorDead = new BABYLON.Color3.FromHexString("#152607");

        var sphere = new BABYLON.Mesh.CreateSphere('sphere', 6, 10, baseScene);
        var particleCount = Math.round(curve.length()* 2);
        // console.log("path before pass ");
        // console.log(path);
        this.createCityParticleSystem(sphere, new BABYLON.ParticleSystem("ps1", particleCount, baseScene), color1, color2, colorDead, path);

    }
    createCityParticleSystem(emitter, ps, color1, color2, colorDead, path) {

        var url = "img/flare.png";

        ps.particleTexture = new BABYLON.Texture(url, baseScene);

        ps.minSize = 0.001;
        ps.maxSize = 2;
        ps.minLifeTime = Infinity;
        ps.maxLifeTime = Infinity;
        ps.emitter = emitter;

        ps.emitRate = 100;
        ps.updateSpeed = 0.001;
        ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        ps.color1 = color1;
        ps.color2 = color2;
        ps.colorDead = colorDead;

        // console.log("path after pass ");
        // console.log(path);

        ps.updateFunction = function (particles) {
            for (var index = 0; index < particles.length; index++) {
                var particle = particles[index];
                particle.age += this._scaledUpdateSpeed;

                // particle.colorStep.scaleToRef(this._scaledUpdateSpeed, this._scaledColorStep);
                // particle.color.addInPlace(this._scaledColorStep);
                if (particle.age >= particle.lifeTime) { // Recycle
                    this._stockParticles.push(particles.splice(index, 1)[0]);
                    index--;
                    continue;
                } else {
                    if (particle.color.a < 0)
                        particle.color.a = 0.5;

                    if (typeof particle.pathIndex === "undefined") {
                        particle.pathIndex = 0;
                    }

                    particle.pathIndex = (particle.pathIndex + 1) % path.length;
                    particle.position = path[particle.pathIndex];
                }

                // path.forEach(function (point, j) {
                //     console.log("CurrentX = " + particle.position.x + ", CandidateX = " + point.x);
                //     if (particle.position === point) {
                //         particle.position = path[j + 1];
                //     }
                // });

                // var i = index % path.length;
                //
                // for (var pathIndex = 0; pathIndex < path.length - 1; pathIndex++){
                //     var currentPathPoint = path[pathIndex];
                //
                //
                //     var nextPathPoint = path[pathIndex + 1];
                //     var diff = currentPathPoint.subtract(nextPathPoint);
                //     var pos = nextPathPoint.add(diff);
                //
                //     if (i + 1 < path.length){
                //         particle.position = pos;
                //         // console.log(pos)
                //
                //     }
                // }
                //
                // var current = path[i];
                // console.log("current: " +path[i]);
                // var next = path[i + 1];
                // console.log("next: " +path[i + 1]);
            }
        };
        ps.start();
    }

}