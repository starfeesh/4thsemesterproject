class ParticleManager{
    CityParticles(path){
        var color1 = new BABYLON.Color3.FromHexString("#3fae2a");
        var color2 = new BABYLON.Color3.FromHexString("#6ec75d");
        var colorDead = new BABYLON.Color3.FromHexString("#315d28");

        var sphere = new BABYLON.Mesh.CreateSphere('sphere', 6, 10, scene);
        this.CreateCityParticleSystem(sphere, new BABYLON.ParticleSystem("ps1", 3600, scene), color1, color2, colorDead, path);
    }
    CreateCityParticleSystem(emitter, ps, color1, color2, colorDead, path) {

        var url = "img/flare.png";

        ps.particleTexture = new BABYLON.Texture(url, scene);

        ps.minSize = 0.1;
        ps.maxSize = Math.random() + 1;
        ps.minLifeTime = 8;
        ps.maxLifeTime = 8;
        ps.minEmitPower = 3;
        ps.maxEmitPower = 3;

        ps.minAngularSpeed = 0;
        ps.maxAngularSpeed = 0;

        ps.emitter = emitter;

        ps.emitRate = 50;
        ps.updateSpeed = 0.02;
        ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        ps.color1 = color1;
        ps.color2 = color2;
        ps.colorDead = colorDead;

        ps.direction1 = new BABYLON.Vector3(0, 0, 0);
        ps.direction2 = new BABYLON.Vector3(0, 0, 0);
        ps.minEmitBox = new BABYLON.Vector3(0, 0, 0);
        ps.maxEmitBox = new BABYLON.Vector3(0, 0, 0);

        ps.updateFunction = function(particles) {
            for (var index = 0; index < particles.length; index++) {
                var particle = particles[index];
                particle.age += this._scaledUpdateSpeed;

                if (particle.age >= particle.lifeTime) { // Recycle
                    this._stockParticles.push(particles.splice(index, 1)[0]);
                    index--;

                } else {
                    particle.colorStep.scaleToRef(this._scaledUpdateSpeed, this._scaledColorStep);
                    particle.color.addInPlace(this._scaledColorStep);

                    if (particle.color.a < 0)
                        particle.color.a = 0;

                    particle.angle += particle.angularSpeed * this._scaledUpdateSpeed;

                    particle.direction.scaleToRef(this._scaledUpdateSpeed, this._scaledDirection);
                    particle.position.addInPlace(this._scaledDirection);

                    var i = index % path.length;

                    var current = path[i];
                    var next = path[i + 1];

                    if (i + 1 < path.length){
                        particle.position.x = next.x + (next.x - current.x);
                        particle.position.y = next.y + (next.y - current.y);
                        particle.position.z = next.z + (next.z - current.z);

                    }
                    this.gravity.scaleToRef(this._scaledUpdateSpeed, this._scaledGravity);
                    particle.direction.addInPlace(this._scaledGravity);
                }
            }
        };
        ps.start();
    }

    AllowedLaneParticles(path){
        var color1 = new BABYLON.Color3.FromHexString("#3fae2a");
        var color2 = new BABYLON.Color3.FromHexString("#6ec75d");
        var colorDead = new BABYLON.Color3.FromHexString("#142913");

        var sphere = new BABYLON.Mesh.CreateSphere('sphere', 6, 10, scene);
        this.CreateLaneParticleSystem(sphere, new BABYLON.ParticleSystem("ps1", 3600, scene), color1, color2, colorDead, path);
    }

    DisallowedLaneParticles(path){
        var color1 = new BABYLON.Color4(0, 0.93, 0.90, 1);
        var color2 = new BABYLON.Color4(0, 0.3, 0.2, 1);
        var colorDead = new BABYLON.Color4(0, 0.3, 0.2, 1);

        var sphere = new BABYLON.Mesh.CreateSphere('sphere', 6, 10, scene);
        this.CreateLaneParticleSystem(sphere, new BABYLON.ParticleSystem("ps1", 3600, scene), color1, color2, colorDead, path);
    }

    CreateLaneParticleSystem(emitter, ps, color1, color2, colorDead, path) {

        var url = "img/flare.png";

        ps.particleTexture = new BABYLON.Texture(url, scene);

        ps.minSize = 10;
        ps.maxSize = Math.random() * 20;
        ps.minLifeTime = 8;
        ps.maxLifeTime = 8;
        ps.minEmitPower = 3;
        ps.maxEmitPower = 3;

        ps.minAngularSpeed = 0;
        ps.maxAngularSpeed = 0;

        ps.emitter = emitter;

        ps.emitRate = 50;
        ps.updateSpeed = 0.02;
        ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        ps.color1 = color1;
        ps.color2 = color2;
        ps.colorDead = colorDead;

        ps.direction1 = new BABYLON.Vector3(0, 0, 0);
        ps.direction2 = new BABYLON.Vector3(1, 0, 0);
        ps.minEmitBox = new BABYLON.Vector3(0, 0, 0);
        ps.maxEmitBox = new BABYLON.Vector3(0, 0, 0);

        ps.updateFunction = function (particles) {
            for (var index = 0; index < particles.length; index++) {
                var particle = particles[index];
                particle.age += this._scaledUpdateSpeed;

                if (particle.age >= particle.lifeTime) { // Recycle
                    this._stockParticles.push(particles.splice(index, 1)[0]);
                    index--;

                } else {
                    particle.colorStep.scaleToRef(this._scaledUpdateSpeed, this._scaledColorStep);
                    particle.color.addInPlace(this._scaledColorStep);

                    if (particle.color.a < 0)
                        particle.color.a = 0;

                    particle.angle += particle.angularSpeed * this._scaledUpdateSpeed;

                    particle.direction.scaleToRef(this._scaledUpdateSpeed, this._scaledDirection);
                    particle.position.addInPlace(this._scaledDirection);
/*
                    var i = index % path.length;

                    var current = path[i];
                    var next = path[i + 1];

                    if (i + 1 < path.length){
                        particle.position.x = next.x + (next.x - current.x);
                        particle.position.y = next.y + (next.y - current.y);
                        particle.position.z = next.z + (next.z - current.z);

                    }
*/
//console.log(ps.direction1)
                    this.gravity.scaleToRef(this._scaledUpdateSpeed, this._scaledGravity);
                    particle.direction.addInPlace(this._scaledGravity);


                }
            }
        };
        ps.start();
    }
}