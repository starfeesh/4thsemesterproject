class ParticleManager {
    destroySystem() {
        this.ps.dispose();
        this.ps = {};
    }
    cityParticles(path, curve) {
        var color1 = new BABYLON.Color3.FromHexString("#3FAE2A");
        var color2 = new BABYLON.Color3.FromHexString("#a1ff1b");
        var colorDead = new BABYLON.Color3.FromHexString("#152607");

        var sphere = new BABYLON.Mesh.CreateSphere('sphere', 6, 10, scene);
        sphere.isVisible = false;
        var particleCount = Math.round(curve.length()* 2);
        // console.log("path before pass ");
        // console.log(path);
        this.ps = new BABYLON.ParticleSystem("ps1", particleCount, scene);

        this.createCityParticleSystem(sphere, this.ps, color1, color2, colorDead, path);

    }
    createCityParticleSystem(emitter, ps, color1, color2, colorDead, path) {

        var url = "img/flare.png";

        ps.particleTexture = new BABYLON.Texture(url, scene);

        ps.minSize = 0.001;
        ps.maxSize = 2;
        ps.minLifeTime = Infinity;
        ps.maxLifeTime = Infinity;
        ps.emitter = emitter;

        ps.emitRate = 75;
        ps.updateSpeed = 0.001;
        ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        ps.color1 = color1;
        ps.color2 = color2;
        ps.colorDead = colorDead;


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
            }
        };
        ps.start();
    }
}
