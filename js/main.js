var canvas, engine, scene, camera, light;
var stateManager,
    animManager,
    inputHandler,
    uIHandler,
    jsonHandler,
    particleManager,
    infoHandler;

class JsonHandler {
    constructor() {
        this.resources = [
            {
                "url": "data/states.json",
                "json": ""
            },
            {
                "url": "data/curves.json",
                "json": ""
            },
            {
                "url": "data/packetData.json",
                "json": ""
            }
        ];
    }
    setUp() {
        this.resources.forEach(function (obj) {
            this.getJson(obj);
        }.bind(this));
    }
    loadJson(callback){
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', this.url, true);
        xobj.onreadystatechange = function () {
            if (xobj.readyState === 4 && xobj.status == "200") {
                callback(xobj.responseText);
            }
        }.bind(this);
        xobj.send(null);
    }
    getJson(dataSet) {
        this.url = dataSet.url;

        this.loadJson(function (response) {
            dataSet.json = JSON.parse(response);
            if (this.resources[0].json !== "" && this.resources[1].json !== "" && this.resources[2].json !== "") {
                stateManager.setUp();
            }
        }.bind(this));

    }
}
class ObjectFactory {
    constructor(className, constructorParams) {
        return new dynamicClassMap[className](constructorParams);
    }
}
class StateManager {
    setUp() {
        var stage = new Stage();
        this.stateLookup = jsonHandler.resources[0].json; //TODO: call function that returns this

        this.changeScenario("overview");
    }
    changeScenario(newScenario){
        if (typeof this.currentScenario === 'object') {
            this.currentScenario.tearDown();
        }

        this.newScenarioClassName = this.stateLookup.scenarios[newScenario].className;

        this.currentScenario = new ObjectFactory(this.newScenarioClassName, null);
        this.currentScenario.setUp();

        this.changeMode(newScenario, "dummy");
    }
    changeMode(currentScenario, newMode) {
        if (typeof this.currentMode === 'object') {
            this.currentMode.tearDown();
            this.currentMode.stopAnims();
        }
        this.newModeClassName = this.stateLookup.scenarios[currentScenario].modes[newMode].className;
        //console.log(this.currentMode);
        this.currentMode = new ObjectFactory(this.newModeClassName, null);
        this.currentMode.setUp();
    }
}
class Stage {
    constructor() {
        scene = new BABYLON.Scene(engine);
        //scene.debugLayer.show();
        scene.clearColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        camera = new BABYLON.ArcRotateCamera("globeCamera", 0,0,0, BABYLON.Vector3.Zero(), scene);
        camera.setPosition(new BABYLON.Vector3(-100, 100, -100));
        camera.attachControl(canvas, true);
        camera.lowerRadiusLimit = 90;
        camera.upperRadiusLimit = 330;

        light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.5;

        var music = new BABYLON.Sound("Music", "sfx/Lobo_Loco_-_Space_Elves_ID_710.mp3", scene, null, { loop: true, autoplay: true, volume: 0.05 });

        uIHandler.createUIBase();
        uIHandler.createUIElements();
        this.createSkybox();

        //setInterval(function () {
        //    console.log(stateManager.currentScenario.babylonObjects);
        //    console.log(camera.radius)
        //}, 10000);

        engine.runRenderLoop(function () {
            scene.render();
            light.position = camera.position;
            // console.log(this.globeCamera.alpha)

        }.bind(this))
    }
    createSkybox() {
        var skybox = BABYLON.MeshBuilder.CreateBox("skybox", {size:3000.0}, scene);
        var skyboxMat = new BABYLON.StandardMaterial("skybox", scene);
        skyboxMat.backFaceCulling = false;
        skyboxMat.reflectionTexture = new BABYLON.CubeTexture("img/skybox/skybox_blank", scene);
        skyboxMat.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMat.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMat;
    }
}
class LoadingScreen {
    constructor(color) {
        this.loadedObjects = [];
    }
    displayLoadingUI() {
        var loadingContainer = document.querySelector("#loading");
        var mimicText = new Image();


        this.loadedObjects.push(bg)
    }
    hideLoadingUI() {

    }
}
class BaseScenario {
    constructor() {
        // Anytime anything is created, push to this.babylonObjects.
        this.babylonObjects = [];
        this.allAnims = [];
    }
    tearDown() {
        // Iterate through this.babylonObjects and .dispose() of them.
        for (var i = this.babylonObjects.length - 1; i >= 0; i--){
            var objectToRemove = this.babylonObjects.splice(i, 1);
            if ('dispose' in objectToRemove[0]) {
                objectToRemove[0].dispose();
            }
            objectToRemove[0] = null;
        }

        infoHandler.hideInfo();
    }
}
class BaseMode extends BaseScenario {
    constructor() {
        super();
    }
    stopAnims() {
        for (var i = this.allAnims.length - 1; i >= 0; i--) {
            var animToStop = this.allAnims[i];

            animToStop.stop();
        }
    }
}

const dynamicClassMap = {
    OverviewScenario: class extends BaseScenario {
        constructor() {
            super();
            this.infoIsShown = false;
            this.cameraSpeed = 0.001;
        }
        setUp() {
            console.log("Reached Overview Scenario");
            camera.setPosition(new BABYLON.Vector3(-100, 100, -100));
            scene.activeCamera = camera;
            var loader = new BABYLON.AssetsManager(scene);
            var globe = loader.addMeshTask("globe", "", "models/", "globe7.babylon");
            var innerGlobe = loader.addMeshTask("outer", "", "models/", "inner.babylon");
            var highlight = new BABYLON.HighlightLayer("hl", scene);

            globe.onSuccess = function (task) {
                highlight.addMesh(task.loadedMeshes[0], new BABYLON.Color3.FromHexString("#315d28"));
                highlight.innerGlow = false;
                highlight.blurHorizontalSize = 3;
                highlight.blurVerticalSize = 3;
                this.babylonObjects.push(task.loadedMeshes[0], highlight);

            }.bind(this);

            innerGlobe.onSuccess = function (task) {
                this.babylonObjects.push(task.loadedMeshes[0]);
            }.bind(this);

            loader.load();

            this.createCityConnections(jsonHandler.resources[1].json);

            engine.runRenderLoop(function () {
                camera.alpha += this.cameraSpeed;
            }.bind(this))

        };
        createCityConnections(json) {
            this.citiesCovered = [];
            var origins = json.countries;
            var pointCount = 200;

            origins.forEach(function (origin, i) {
                var originCoordinates = new BABYLON.Vector3(origin.coordinates.x,origin.coordinates.y,origin.coordinates.z);
                var destinations = origin.destinations;
                destinations.forEach(function (destination, j) {
                    var destinationCoordinates = new BABYLON.Vector3(destination.coordinates.x,destination.coordinates.y,destination.coordinates.z);
                    var point1 = new BABYLON.Vector3(destination.waypoints[0].p1.x,destination.waypoints[0].p1.y,destination.waypoints[0].p1.z);
                    var point2 = new BABYLON.Vector3(destination.waypoints[1].p2.x,destination.waypoints[1].p2.y,destination.waypoints[1].p2.z);

                    var bezierVector = BABYLON.Curve3.CreateCubicBezier(
                    originCoordinates,
                    point1,
                    point2,
                    destinationCoordinates, pointCount);
                    var path = bezierVector.getPoints();

                    // var curve = BABYLON.Mesh.CreateLines("bezier", path, baseScene);
                    // curve.color = new BABYLON.Color3(0.36,0.68,0.25);
                    particleManager = new ParticleManager();
                    particleManager.cityParticles(path, bezierVector);
                    if (!this.citiesCovered.includes(origin.location)){
                        this.citiesCovered.push(origin.location);
                        this.createCityTitles(json, origin.location);
                    }
                    if (!this.citiesCovered.includes(destination.location)){
                        this.citiesCovered.push(destination.location);
                        this.createCityTitles(json, destination.location);
                    }
                    this.babylonObjects.push(particleManager.ps, destinationCoordinates, point1, point2, bezierVector, path);
                }.bind(this));
                this.babylonObjects.push(originCoordinates, destinations);
            }.bind(this));
            this.babylonObjects.push(this.citiesCovered, origins);
        }
        createCityTitles(json, location) {
            var cityCoordinates;

            json.countries.forEach(function (origin) {
                if (origin.location === location){
                    cityCoordinates = origin.coordinates;
                }
                origin.destinations.forEach(function (destination) {
                    if (destination.location === location) {
                        cityCoordinates = destination.coordinates;
                    }
                })
            });
            this.textPlanes = [];
            var textPlane = BABYLON.Mesh.CreatePlane("textPlane", 5, scene);
            textPlane.scaling = new BABYLON.Vector3(1, 1, 0.2);
            textPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
            textPlane.backFaceCulling = false;
            textPlane.position.x = cityCoordinates.x;
            textPlane.position.y = cityCoordinates.y + 2.5;
            textPlane.position.z = cityCoordinates.z;
            textPlane.parentCity = location;
            this.textPlanes.push(textPlane);

            var advancedTextTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(textPlane, 128, 128);
            //var advancedTextTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("ui");
            //advancedTextTexture.idealHeight = 1080;
            //advancedTextTexture.idealWidth = 1920;

            var text = new BABYLON.GUI.TextBlock();
            text.text = location;
            text.fontSize = 20;
            text.color = "#ffffff";
            text.fontFamily = "Century Gothic";
            text.fontStyle = "bold";
            advancedTextTexture.addControl(text);

            var showWindow = function () {
                infoHandler.showInfo(1)
            };

            inputHandler.attachClickUIListener(text, showWindow);

            textPlane.actionManager = new BABYLON.ActionManager(scene);
            inputHandler.attachHoverUIListener(textPlane, this.playOverviewSounds);

            this.babylonObjects.push(cityCoordinates, textPlane, advancedTextTexture, text, this.textPlanes);
        }
        playOverviewSounds() {
            var beeps = [
                { "url": "sfx/LV-HTIS Beeps Simple 01.wav" },
                { "url": "sfx/LV-HTIS Beeps Simple 02.wav" },
                { "url": "sfx/LV-HTIS Beeps Simple 03.wav" },
                { "url": "sfx/LV-HTIS Beeps Simple 04.wav" }
            ];
            var beep = beeps[Math.floor(Math.random() * beeps.length)];

            var sound = new BABYLON.Sound("beep", beep.url, scene, null, { loop: false, autoplay: true, volume: 0.2});
            sound.play();
        }
        rotate(setPrioritizationState) {
            var anims = animManager.resetRotation(camera);
            var globeHasRotated = false;
            this.cameraSpeed = 0;

            scene.beginDirectAnimation(camera, [anims[0], anims[1]],0, 25, false, 1, function () {

                if (!globeHasRotated) {
                    globeHasRotated = true;
                    scene.beginDirectAnimation(camera, [anims[2]], 0, 25, false, 1, function () {
                        setPrioritizationState();
                    }.bind(this))
                }
            }.bind(this));
        }
    },
    OverviewDummyMode: class extends BaseMode {
        constructor() {
            super();
        }
        setUp() {
            console.log("- Reached Overview Dummy Mode")
        }
    },
    PrioritizationScenario: class extends BaseScenario {
        constructor() {
            super();
        }
        setUp() {
            console.log("Reached Prioritization Scenario");

            light.intensity = 0.3;

            var ground = new BABYLON.Mesh.CreateGround("ground", 2000, 2000, 2, scene);
            ground.position.y = -0.2;
            var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
            groundMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
            ground.material = groundMat;

            var loader = new BABYLON.AssetsManager(scene);
            var city = loader.addMeshTask("city", "", "models/", "city6.babylon");
            //var highlight = new BABYLON.HighlightLayer("hl", scene);

            city.onSuccess = function (task) {
                var cityMesh = task.loadedMeshes[0];
                cityMesh.position = new BABYLON.Vector3(cityMesh.position.x, cityMesh.position.y, -890);
                var cityClone = task.loadedMeshes[0].clone("city2");
                cityClone.position = new BABYLON.Vector3(cityMesh.position.x, cityMesh.position.y, 890);
                cityClone.rotation.y = 0;
                this.babylonObjects.push(cityMesh, cityClone);
            }.bind(this);

            var camHolder = new BABYLON.Mesh.CreateBox("camholder", 3, scene);
            camHolder.position = new BABYLON.Vector3(119, 8, -600);
            camHolder.isVisible = false;

            var flyCam = new BABYLON.FollowCamera("flyCam", new BABYLON.Vector3(119, 8, -600), scene);
            flyCam.attachControl(canvas, true);
            scene.activeCamera = flyCam;
            flyCam.radius = 10;
            flyCam.lockedTarget = camHolder;

            //var debugCam = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(0, 0, -10), scene);
            //debugCam.attachControl(canvas, true);
            //scene.activeCamera = debugCam;

            var anims = animManager.cameraFlyThrough(camHolder);

            var setTopDownNormalMode = function () {
                stateManager.changeMode("prioritization", "topDownNormal");
            };

            var animatable = scene.beginDirectAnimation(camHolder, anims, 0, 200, false, 1, setTopDownNormalMode);

            loader.load();

            var cityPauseEvent = new BABYLON.AnimationEvent(25, function() {
                this.pauseAndShowInfo(animatable);
            }.bind(this), true);

            anims[0].addEvent(cityPauseEvent);
            anims[1].addEvent(cityPauseEvent);

            var buildingPauseEvent = new BABYLON.AnimationEvent(100, function() {
                this.pauseAndShowInfo(animatable);
            }.bind(this), true);

            anims[0].addEvent(buildingPauseEvent);
            anims[1].addEvent(buildingPauseEvent);

            this.babylonObjects.push(ground, groundMat, loader, city, camHolder, flyCam, anims)
        }
        showDashboard() {

        }
        hideDashboard() {

        }
        pauseAndShowInfo(anim) {
            anim.pause();
            var border = infoHandler.showInfo(4);

            var continueFunction = function () {
                this.startAndHideInfo(border, anim);
            }.bind(this);

            inputHandler.attachDOMListener(border, continueFunction);
        }
        startAndHideInfo(border, anim) {
            anim.restart();
            infoHandler.hideInfo(border);
        }
    },
    PrioritizationDummyMode: class extends BaseMode {
        constructor() {
            super();
        }
        setUp() {
            console.log("- Reached Prioritization Dummy Mode");
        }
    },
    PrioritizationTopDownNormalMode: class extends BaseMode {
        constructor() {
            super();

            this.packets = jsonHandler.resources[2].json.packets;
            this.clones = [];
            this.cloneAnims = [];
            this.spawnerEnabled = true;
            this.placedPackets = [];
            this.packetUIWithLinks = [];
            this.packetUIWithoutLinks = [];
            this.packetInfoIsOpen = false;
        }
        setUp() {
            if (debugMode) {
                console.log("- Reached Top Down Normal Mode");
            }
            var laneCount = 6;
            this.pathPointCount = 50;
            var lanes = [];

            for (var i = 0; i < laneCount; i++) {
                var origin = new BABYLON.Vector3(Math.floor(Math.random() * (107 - 97) + 97), 20, -885);
                var p1 = new BABYLON.Vector3(100 + i * Math.random(), Math.floor(Math.random() * 400) + 500, -285);
                var p2 = new BABYLON.Vector3(100 + i * Math.random(), Math.floor(Math.random() * 400) + 450, 285);
                var destination = new BABYLON.Vector3(Math.floor(Math.random() * (107 - 97) + 97), 20, 885);
                var bezierVector = BABYLON.Curve3.CreateCubicBezier(
                    origin,
                    p1,
                    p2,
                    destination, this.pathPointCount);
                var path = bezierVector.getPoints();
                lanes.push(path);

                this.babylonObjects.push(origin, p1, p2, destination, bezierVector, path);
            }
            this.createModeUI();
            this.moveCamera();
            this.iteratePackets(lanes);

            this.babylonObjects.push(lanes);
        }
        createModeUI() {
            var hud = document.querySelector("#hud");
            if (hud.classList.contains("fadeIn")) {
                hud.classList.remove("fadeIn");
                hud.classList.add("fadeOut");
            }
        }
        iteratePackets(lanes) {
            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 5, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -888);

            for (var i = 0; i < this.packets.length; i++) {
                var packet = this.packets[Math.floor(Math.random() * this.packets.length)];
                //console.log(Math.floor(Math.random() * this.packets.length));
                for (var j = packet.count - 1; j >= 0; j--) {
                    var ranTime = Math.round(Math.random() * (12000 - 1000)) + 1000;

                    (function(packet, self, sphere) {
                        var spawn = function () {
                            self.spawnPackets(lanes, packet, sphere)
                        };
                        setTimeout(spawn, ranTime);
                    })(packet, this, packetSphere)
                }
            }
            this.babylonObjects.push(packetSphere);
        }
        spawnPackets(lanes, packet, packetSphere) {
            if (this.spawnerEnabled) {
                //if (debugMode) {
                //    console.log('[' + new Date().toISOString() + ']' + " creating a " + packet.color);
                //    console.log(this.spawnerEnabled);
                //}
                var packetClone = packetSphere.clone("clone");
                var packetMat = new BABYLON.StandardMaterial("packetMat", scene);
                packetMat.diffuseColor = new BABYLON.Color3.FromHexString(packet.color);
                packetMat.emissiveTexture = new BABYLON.Texture(packet.emissiveTexture, scene);
                packetClone.material = packetMat;

                animManager.moveNormalPacket(packetClone, lanes);

                var animatable = scene.beginAnimation(packetClone, 0, this.pathPointCount, true);

                this.clones.push(packetClone);
                this.cloneAnims.push(animatable);
                this.babylonObjects.push(packetClone, packetMat);
            }
        }
        moveCamera() {
            var topDownCam = new BABYLON.TargetCamera("arcCam", new BABYLON.Vector3(102, 40, -888), scene);
            scene.activeCamera = topDownCam;

            var movementAnim = animManager.moveTopDownCamera(topDownCam);
            var movementAnimatable = scene.beginAnimation(topDownCam, 0, 360, false);

            this.pointCamera(topDownCam, movementAnim, movementAnimatable);

        }
        pointCamera(cam, movementAnim, movementAnimatable) {
            var origin = new BABYLON.Vector3(102, 10, -885);
            var p1 = new BABYLON.Vector3(102, 300, -485);
            var p2 = new BABYLON.Vector3(102, 300, 485);
            var destination = new BABYLON.Vector3(102, 10, 885);
            var bezierVector = BABYLON.Curve3.CreateCubicBezier(origin, p1, p2, destination, 180);
            var path = bezierVector.getPoints();

            var dummy = new BABYLON.Mesh.CreateBox("box", 2, scene);
            var dummyMat = new BABYLON.StandardMaterial("dummyMat", scene);
            dummyMat.diffuseTexture =  new BABYLON.Texture("img/blank.png", scene);
            dummyMat.diffuseTexture.hasAlpha = true;
            dummyMat.alpha = 0;
            dummy.material = dummyMat;

            var anim = animManager.pointTopDownCamera(dummy, path);
            var animatable = scene.beginAnimation(dummy, 0, path.length, false);

            scene.onBeforeRenderObservable.add(function () {
                cam.setTarget(dummy.position);
            });
            this.allAnims.push(movementAnimatable, animatable);

            var placedPacketSpawnPoint = new BABYLON.AnimationEvent(60, function () {
                this.createGreenPacket();
            }.bind(this));
            movementAnim.addEvent(placedPacketSpawnPoint);

            var quarterPausePoint = new BABYLON.AnimationEvent(90, function () {
                this.cloneAnims.forEach(function (cloneAnimatable) {
                    this.allAnims.push(cloneAnimatable);
                }.bind(this));
                this.allAnims.forEach(function (animatable) {
                    this.pauseAndShowInfo(animatable);
                }.bind(this));
                this.clones.forEach(function (clone) {
                    var anim = animManager.fadePackets(clone, 1, 0.2);
                    scene.beginDirectAnimation(clone, [anim], 0, 25, false);
                })

            }.bind(this));
            movementAnim.addEvent(quarterPausePoint);

            var fadeInPoint = new BABYLON.AnimationEvent(91, function () {
                this.clones.forEach(function (clone) {
                    var anim = animManager.fadePackets(clone, 0.2, 1);
                    scene.beginDirectAnimation(clone, [anim], 0, 25, false);
                })
            }.bind(this));
            movementAnim.addEvent(fadeInPoint);

            var halfPausePoint = new BABYLON.AnimationEvent(180, function () {
                movementAnimatable.speedRatio = 3;
            }, true);
            movementAnim.addEvent(halfPausePoint);
        }
        pauseAndShowInfo(anim) {
            this.spawnerEnabled = false;

            anim.pause();
            var border = infoHandler.showInfo(4);

            var continueFunction = function () {
                this.startAndHideInfo(border, anim);
            }.bind(this);

            if (typeof border !== "undefined"){
                inputHandler.attachDOMListener(border, continueFunction);
            }
        }
        createGreenPacket() {
            var green = BABYLON.Curve3.CreateCubicBezier(new BABYLON.Vector3(102, 40, -898), new BABYLON.Vector3(102, 400, -444), new BABYLON.Vector3(102, 400, 444), new BABYLON.Vector3(102, 40, 898), 180);
            var greenPath = green.getPoints();

            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 12, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -888);
            var packetMat = new BABYLON.StandardMaterial("packetMat", scene);

            packetMat.diffuseColor = new BABYLON.Color3.FromHexString("#00A32E");
            packetMat.emissiveColor = new BABYLON.Color3.FromHexString("#22b14c");
            packetSphere.material = packetMat;

            packetSphere.clicked = false;
            packetSphere.application = "Voice call";
            packetSphere.destination = "Skype";
            packetSphere.scheduling = "Low-latency priority";
            packetSphere.bandwidth = "Assured 90kb/s";

            var radius = Math.floor(Math.random() * 10) + 20;
            var anim = animManager.moveTopDownPlacedPackets(packetSphere, radius, greenPath);
            var animatable = scene.beginAnimation(packetSphere, 0, 180, false, 1, function () {
                packetSphere.dispose();
            });

            var yellowSpawnPoint = new BABYLON.AnimationEvent(20, function () {
                this.createYellowPacket();
            }.bind(this));
            anim.addEvent(yellowSpawnPoint);

            var greenPausePoint = new BABYLON.AnimationEvent(100, function () {
                animatable.pause();
                this.allAnims.push(animatable);
                packetSphere.actionManager = new BABYLON.ActionManager(scene);
                var click = function () {
                    if (this.packetInfoIsOpen) {
                        this.destroyPacketUI();
                        this.packetInfoIsOpen = false;
                        this.showPacketUI(packetSphere);
                    } else {
                        this.showPacketUI(packetSphere)
                    }
                }.bind(this);
                inputHandler.attachUIListener(packetSphere, click);
            }.bind(this));
            anim.addEvent(greenPausePoint);

            this.placedPackets.push(packetSphere);
            this.babylonObjects.push(green, packetSphere, packetMat);
        }
        createYellowPacket() {
            var yellow = BABYLON.Curve3.CreateCubicBezier(new BABYLON.Vector3(102, 40, -898), new BABYLON.Vector3(102, 370, -644), new BABYLON.Vector3(102, 370, 644), new BABYLON.Vector3(102, 40, 898), 180);
            var yellowPath = yellow.getPoints();

            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 12, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -878);
            var packetMat = new BABYLON.StandardMaterial("packetMat", scene);

            packetMat.diffuseColor = new BABYLON.Color3.FromHexString("#A3A300");
            packetMat.emissiveColor = new BABYLON.Color3.FromHexString("#fff200");
            packetSphere.material = packetMat;

            packetSphere.clicked = false;
            packetSphere.application = "Web";
            packetSphere.destination = "Dropbox";
            packetSphere.scheduling = "---";
            packetSphere.bandwidth = "---";

            var radius = Math.floor(Math.random() * 5) + 25;
            var anim = animManager.moveTopDownPlacedPackets(packetSphere, radius, yellowPath);
            var animatable = scene.beginAnimation(packetSphere, 0, 180, false, 1, function () {
                packetSphere.dispose();
            });

            var redSpawnPoint = new BABYLON.AnimationEvent(20, function () {
                this.createRedPacket();
            }.bind(this));
            anim.addEvent(redSpawnPoint);

            var yellowPausePoint = new BABYLON.AnimationEvent(90, function () {
                animatable.pause();
                this.allAnims.push(animatable);
                packetSphere.actionManager = new BABYLON.ActionManager(scene);
                var click = function () {
                    if (this.packetInfoIsOpen) {
                        this.destroyPacketUI();
                        this.packetInfoIsOpen = false;
                        this.showPacketUI(packetSphere);
                    }
                    else {
                        this.showPacketUI(packetSphere)
                    }
                }.bind(this);
                inputHandler.attachUIListener(packetSphere, click);
            }.bind(this));
            anim.addEvent(yellowPausePoint);

            this.placedPackets.push(packetSphere);
            this.babylonObjects.push(yellow, packetSphere, packetMat);

        }
        createRedPacket() {
            var red = BABYLON.Curve3.CreateCubicBezier(new BABYLON.Vector3(102, 40, -898), new BABYLON.Vector3(102, 345, -444), new BABYLON.Vector3(102, 345, 444), new BABYLON.Vector3(102, 40, 898), 180);
            var redPath = red.getPoints();

            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 12, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -888);
            var packetMat = new BABYLON.StandardMaterial("packetMat", scene);

            packetMat.diffuseColor = new BABYLON.Color3.FromHexString("#99000B");
            packetMat.emissiveColor = new BABYLON.Color3.FromHexString("#ed1c24");
            packetSphere.material = packetMat;

            packetSphere.clicked = false;
            packetSphere.application = "Web";
            packetSphere.destination = "Spotify";
            packetSphere.scheduling = "---";
            packetSphere.bandwidth = "---";

            var radius = Math.floor(Math.random() * 10) + 15;
            var anim = animManager.moveTopDownPlacedPackets(packetSphere, radius, redPath);
            var animatable = scene.beginAnimation(packetSphere, 0, 180, false, 1, function () {
                packetSphere.dispose();
            });

            var redPausePoint = new BABYLON.AnimationEvent(80, function () {
                animatable.pause();
                this.allAnims.push(animatable);
                packetSphere.actionManager = new BABYLON.ActionManager(scene);
                var click = function () {
                    if (this.packetInfoIsOpen) {
                        this.destroyPacketUI();
                        this.packetInfoIsOpen = false;
                        this.showPacketUI(packetSphere);
                    }
                    else {
                        this.showPacketUI(packetSphere)
                    }
                }.bind(this);
                inputHandler.attachUIListener(packetSphere, click);
            }.bind(this));
            anim.addEvent(redPausePoint);

            this.placedPackets.push(packetSphere);
            this.babylonObjects.push(red, packetSphere, packetMat);

        }
        showPacketUI(packet) {
            if (!packet.clicked) {
                if (!this.packetInfoIsOpen) {
                    this.packetInfoIsOpen = true;
                    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

                    var textBox = new BABYLON.GUI.Rectangle();
                    textBox.width = "260px";
                    textBox.height = "120px";
                    textBox.cornerRadius = 10;
                    textBox.color = "#47b92d";
                    textBox.thickness = 2;
                    textBox.background = "transparent";
                    advancedTexture.addControl(textBox);
                    textBox.linkWithMesh(packet);
                    textBox.linkOffsetY = -200;

                    var textBG = new BABYLON.GUI.Rectangle();
                    textBG.width = "260px";
                    textBG.height = "120px";
                    textBG.cornerRadius = 10;
                    textBG.thickness = 0;
                    textBG.background = "#499b12";
                    textBG.alpha = 0.25;
                    advancedTexture.addControl(textBG);
                    textBG.linkWithMesh(packet);
                    textBG.linkOffsetY = -200;

                    var label = new BABYLON.GUI.TextBlock();
                    label.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                    label.text = "Packet details";
                    label.color = "#47b92d";
                    label.width = "12%";
                    label.top = "-25px";
                    advancedTexture.addControl(label);
                    label.linkWithMesh(packet);
                    label.linkOffsetY = -255;

                    var text1 = new BABYLON.GUI.TextBlock();
                    text1.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                    text1.text = "Application: " + packet.application;
                    text1.color = "#47b92d";
                    text1.fontSize = "16px";
                    text1.top = "-30px";
                    text1.paddingLeft = "10px";
                    textBox.addControl(text1);

                    var text2 = new BABYLON.GUI.TextBlock();
                    text2.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                    text2.text = "Destination: " + packet.destination;
                    text2.color = "#47b92d";
                    text2.fontSize = "16px";
                    text2.top = "-10px";
                    text2.paddingLeft = "10px";
                    textBox.addControl(text2);

                    var text3 = new BABYLON.GUI.TextBlock();
                    text3.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                    text3.text = "Scheduling: " + packet.scheduling;
                    text3.color = "#47b92d";
                    text3.fontSize = "16px";
                    text3.top = "10px";
                    text3.paddingLeft = "10px";
                    textBox.addControl(text3);

                    var text4 = new BABYLON.GUI.TextBlock();
                    text4.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                    text4.text = "Bandwidth: " + packet.bandwidth;
                    text4.color = "#47b92d";
                    text4.fontSize = "16px";
                    text4.top = "30px";
                    text4.paddingLeft = "10px";
                    textBox.addControl(text4);

                    var target = new BABYLON.GUI.Ellipse();
                    target.width = "40px";
                    target.height = "40px";
                    target.color = "#47b92d";
                    target.thickness = 2;
                    target.background = "transparent";
                    advancedTexture.addControl(target);
                    target.linkWithMesh(packet);

                    var targetBG = new BABYLON.GUI.Ellipse();
                    targetBG.width = "40px";
                    targetBG.height = "40px";
                    targetBG.thickness = 0;
                    targetBG.background = "#47b92d";
                    targetBG.alpha = 0.25;
                    advancedTexture.addControl(targetBG);
                    targetBG.linkWithMesh(packet);

                    var line = new BABYLON.GUI.Line();
                    line.lineWidth = 2;
                    line.color = "#47b92d";
                    line.y2 = 60;
                    line.linkOffsetY = -20;
                    advancedTexture.addControl(line);
                    line.linkWithMesh(packet);
                    line.connectedControl = textBox;

                    this.packetUIWithLinks.push(textBox, textBG, label, target, targetBG, line);
                    this.packetUIWithoutLinks.push(text1, text2, text3, text4);

                    this.babylonObjects.push(advancedTexture, textBox, textBG, text1, target, targetBG, line, this.packetUIWithLinks, packet);
                }
                packet.clicked = true;
            }
        }
        destroyPacketUI() {
            this.packetUIWithLinks.forEach(function (element) {
                element.linkWithMesh(null);
                element.dispose();
                element = null;
                this.packetUIWithLinks = [];
            }.bind(this));
            this.packetUIWithoutLinks.forEach(function (element) {
                element.dispose();
                element = null;
                this.packetUIWithoutLinks = [];
            }.bind(this));
            this.placedPackets.forEach(function (packet) {
                packet.clicked = false;
            })
        }
        startAndHideInfo() {
            this.allAnims.forEach(function (animatable) {
                animatable.restart();
            });
            this.packetUIWithLinks.forEach(function (element) {
                element.linkWithMesh(null);
                element.dispose();
                element = null;
            }.bind(this));
            this.packetUIWithoutLinks.forEach(function (element) {
                element.dispose();
                element = null;
            });
            infoHandler.hideInfo();
        }
    },
    PrioritizationTopDownMimicMode: class extends BaseMode {
        constructor() {
            super();

            this.packets = jsonHandler.resources[2].json.packets;
            this.cloneAnims = [];
            this.spawnerEnabled = true;
        }
        setUp() {
            if (debugMode) {
                console.log("- Reached Top Down Mimic Mode");
            }
            var laneCount = 6;
            this.pathPointCount = 50;
            var lanes = [];

            for (var i = 0; i < laneCount; i++) {
                var origin = new BABYLON.Vector3(102, 20, -885);
                var p1 = new BABYLON.Vector3(100 + (i * 20), 400, -285);
                var p2 = new BABYLON.Vector3(100 + (i * 20), 400, 285);
                var destination = new BABYLON.Vector3(102, 20, 885);
                var bezierVector = BABYLON.Curve3.CreateCubicBezier(
                    origin,
                    p1,
                    p2,
                    destination, this.pathPointCount);
                var path = bezierVector.getPoints();

                //TODO: Improve this to make it more extendable. Currently hard coded.
                if (i < 3) {
                    path.laneType = "green";
                    //var line = BABYLON.Mesh.CreateLines("bezier", path, scene);
                    //line.color = new BABYLON.Color3.FromHexString("#00A32E");
                    lanes.push(path);
                }
                else if (i >= 3 && i < 5) {
                    path.laneType = "yellow";
                    //line = BABYLON.Mesh.CreateLines("bezier", path, scene);
                    //line.color = new BABYLON.Color3.FromHexString("#A3A300");
                    lanes.push(path);
                }
                else if (i === 5) {
                    path.laneType = "red";
                    //line = BABYLON.Mesh.CreateLines("bezier", path, scene);
                    //line.color = new BABYLON.Color3.FromHexString("#99000B");
                    lanes.push(path);
                }

                this.babylonObjects.push(origin, p1, p2, destination, bezierVector, path);
            }
            this.createModeUI();
            this.iteratePackets(lanes);
            this.moveCamera(path);

            this.babylonObjects.push(lanes);
        }
        createModeUI() {
            var hud = document.querySelector("#hud");
            if (hud.classList.contains("fadeOut")) {
                hud.classList.remove("fadeOut");
            }
            hud.classList.add("fadeIn");

        }
        iteratePackets(lanes) {
            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 5, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -888);

            var greenLanes = [];
            var yellowLanes = [];
            var redLanes = [];

            for (var i = 0; i < lanes.length; i++) {
                if (lanes[i].laneType === "green") {
                    greenLanes.push(lanes[i]);
                }
                else if (lanes[i].laneType === "yellow") {
                    yellowLanes.push(lanes[i]);
                }
                else if (lanes[i].laneType === "red") {
                    redLanes.push(lanes[i]);
                }
            }

            this.packets.forEach(function (packet) {
                var count = packet.count * 2;
                for (var j = count - 1; j >= 0; j--) {
                    var ranTime = Math.round(Math.random() * (18000 - 2000)) + 2000;

                    (function(greenLanes, yellowLanes, redLanes, packet, sphere, self) {
                        var spawn = function () {
                            self.spawnPackets(greenLanes, yellowLanes, redLanes, packet, sphere, self)
                        };
                        setTimeout(spawn, ranTime);
                    })(greenLanes, yellowLanes, redLanes, packet, packetSphere, this)
                }
            }.bind(this));

            this.babylonObjects.push(packetSphere);
        }
        spawnPackets(greenLanes, yellowLanes, redLanes, packet, packetSphere) {
            if (this.spawnerEnabled) {
                var packetClone = packetSphere.clone("clone");
                var packetMat = new BABYLON.StandardMaterial("packetMat", scene);
                packetMat.diffuseColor = new BABYLON.Color3.FromHexString(packet.color);
                packetMat.emissiveTexture = new BABYLON.Texture(packet.emissiveTexture, scene);
                packetClone.material = packetMat;
                var anim;

                switch (packet.color) {
                    case "#00A32E":
                        anim = animManager.moveMimicPacket(packetClone, greenLanes, 7);
                        break;
                    case "#A3A300":
                        anim = animManager.moveMimicPacket(packetClone, yellowLanes, 4);
                        break;
                    case "#99000B":
                        anim = animManager.moveMimicPacket(packetClone, redLanes, 3);
                        break;
                }
                var animatable = scene.beginAnimation(packetClone, 0, this.pathPointCount, true);

                this.cloneAnims.push(animatable);
                this.babylonObjects.push(packetClone, packetMat);
            }
        }
        moveCamera() {
            var topDownCam = new BABYLON.TargetCamera("arcCam", new BABYLON.Vector3(102, 40, -888), scene);
            scene.activeCamera = topDownCam;

            var movementAnim = animManager.moveTopDownCamera(topDownCam);
            var movementAnimatable = scene.beginAnimation(topDownCam, 0, 360, false);

            this.pointCamera(topDownCam, movementAnim, movementAnimatable);

        }
        pointCamera(cam, movementAnim, movementAnimatable) {
            var origin = new BABYLON.Vector3(102, 10, -885);
            var p1 = new BABYLON.Vector3(102, 300, -485);
            var p2 = new BABYLON.Vector3(102, 300, 485);
            var destination = new BABYLON.Vector3(102, 10, 885);
            var bezierVector = BABYLON.Curve3.CreateCubicBezier(origin, p1, p2, destination, 180);
            var path = bezierVector.getPoints();

            var dummy = new BABYLON.Mesh.CreateBox("box", 2, scene);
            var dummyMat = new BABYLON.StandardMaterial("dummyMat", scene);
            dummyMat.diffuseTexture =  new BABYLON.Texture("img/blank.png", scene);
            dummyMat.diffuseTexture.hasAlpha = true;
            dummyMat.alpha = 0;
            dummy.material = dummyMat;

            var anim = animManager.pointTopDownCamera(dummy, path);
            var animatable = scene.beginAnimation(dummy, 0, path.length, false);

            scene.onBeforeRenderObservable.add(function () {
                cam.setTarget(dummy.position);
            });
            this.allAnims.push(movementAnimatable, animatable);

            var quarterPausePoint = new BABYLON.AnimationEvent(90, function () {
                this.cloneAnims.forEach(function (cloneAnimatable) {
                    this.allAnims.push(cloneAnimatable);
                }.bind(this));
                this.allAnims.forEach(function (animatable) {
                    this.pauseAndShowInfo(animatable);
                }.bind(this));
            }.bind(this));
            movementAnim.addEvent(quarterPausePoint);

            var halfPausePoint = new BABYLON.AnimationEvent(180, function () {
                movementAnimatable.speedRatio = 3;
            }, true);
            movementAnim.addEvent(halfPausePoint);
        }
        pauseAndShowInfo(anim) {
            this.spawnerEnabled = false;

            anim.pause();
            var border = infoHandler.showInfo(4);

            var continueFunction = function () {
                this.startAndHideInfo(border, anim);
            }.bind(this);

            if (typeof border !== "undefined"){
                inputHandler.attachDOMListener(border, continueFunction);
            }
        }
        startAndHideInfo(border, anim) {
            this.allAnims.forEach(function (animatable) {
                animatable.restart();
            });
            infoHandler.hideInfo(border);
        }
    }
};
class InfoHandler {
    constructor() {
        this.infoIsShown = false;
    }
    showInfo(i) {
        var border = this.showBorder(this);
        return border;
    }
    showBorder(self) {
        if (!this.infoIsShown) {
            var openingSound = new BABYLON.Sound("Music", "sfx/LV-HTIS Buttons 26.wav", scene, null, { loop: false, autoplay: true, volume: 0.2 });
            var popup = document.querySelector("#textPopup");
            var border = new Image();
            border.onload = function () {
                var w = (window.innerWidth / 2) - (border.width / 2);
                border.id = "border";
                border.style.bottom = "10%";
                border.style.left = w + "px";

            }.bind(self);
            popup.appendChild(border);
            border.src = "img/ui/border.png";

            if (stateManager.newScenarioClassName === "OverviewScenario") {
                var hideWithContext = function () {
                    self.hideOverviewInfo(self);
                };

                inputHandler.attachDOMListener(border, hideWithContext);
            }

            this.infoIsShown = true;

        }
        return border;
    }
    hideOverviewInfo(self) {
        var border = document.querySelector("#border");
        if (border !== null) {
            var openingSound = new BABYLON.Sound("Music", "sfx/LV-HTIS Buttons 31.wav", scene, null, { loop: false, autoplay: true, volume: 0.2 });
            border.parentNode.removeChild(border);
            border = null;
            self.infoIsShown = false;

        }
    }
    hideInfo() {
        var border = document.querySelector("#border");
        if (border !== null) {
            var openingSound = new BABYLON.Sound("Music", "sfx/LV-HTIS Buttons 31.wav", scene, null, { loop: false, autoplay: true, volume: 0.2 });
            border.parentNode.removeChild(border);
            border = null;
            this.infoIsShown = false;

        }
    }
}
class InputHandler {
    //debugInput(clickResult){
    //    if (clickResult.hit){
    //        console.log("x " + clickResult.pickedPoint.x + ", y " + clickResult.pickedPoint.y + ", z "
    //            + clickResult.pickedPoint.z);
    //    }
    //}
    attachClickUIListener(obj, methodName) {
        obj.onPointerUpObservable.add(methodName);
    }
    attachUIListener(obj, methodName) {
        var action = new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, methodName);
        obj.actionManager.registerAction(action);
    }
    attachHoverUIListener(obj, methodName) {
        var action = new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, methodName);
        obj.actionManager.registerAction(action);
    }
    attachDOMListener(obj, methodName) {
        obj.addEventListener('click', methodName)
    }
    attachActions(obj, methodName) {
        obj.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, methodName));
    }
    detachListener() {

    }
}

class UIHandler {
    createUIBase() {
        var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        advancedTexture.idealWidth = 1920;
        this.uiContainer = new BABYLON.GUI.Rectangle();
        this.uiContainer.width = "274px";
        this.uiContainer.height = "300px";
        this.uiContainer.thickness = 0;
        this.uiContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.uiContainer.left = "1%";
        advancedTexture.addControl(this.uiContainer);
    }
    createUIElements() {
        var setOverviewState = function () {
            stateManager.changeScenario("overview");
        };

        var home = document.querySelector("#home");
        inputHandler.attachDOMListener(home, setOverviewState);

        var setPrioritizationState = function () {
            stateManager.changeScenario("prioritization");
        };

        var rotateGlobe = function () {
            if (stateManager.newScenarioClassName === "OverviewScenario") {
                stateManager.currentScenario.rotate(setPrioritizationState);
            }
            else {
                stateManager.changeScenario("prioritization");
            }
        };
        var prioritization = document.querySelector("#prioritization");
        inputHandler.attachDOMListener(prioritization, rotateGlobe);

        var setMode = function () {
            if (stateManager.newScenarioClassName === "OverviewScenario") {
                stateManager.changeMode("overview", "dummy");
            }
            if (stateManager.newScenarioClassName === "PrioritizationScenario") {
                switch (stateManager.newModeClassName) {
                    case "PrioritizationDummyMode":
                        stateManager.changeMode("prioritization", "dummy");
                    break;
                    case "PrioritizationTopDownNormalMode":
                        stateManager.changeMode("prioritization", "topDownMimic");
                    break;
                    case "PrioritizationTopDownMimicMode":
                        stateManager.changeMode("prioritization", "topDownNormal");
                    break;
                }
            }
        };

        var mimic = document.querySelector("#mimic");
        inputHandler.attachDOMListener(mimic, setMode);

    }
    createButton(buttonText, methodName) {
        var parentTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        var text = new BABYLON.GUI.TextBlock();
        text.text = buttonText;
        text.color = "white";
        text.fontSize = 24;
        text.position = new BABYLON.Vector3(0,0,0);
        parentTexture.addControl(text);
        //
        // var text = new BABYLON.Mesh.CreateSphere("sphere", 2, scene);
        inputHandler.attachClickUIListener(text, methodName);

        // var text = new BABYLON.Mesh.CreateSphere('sphere', 16, 2, scene);
        // text.actionManager = new BABYLON.ActionManager(scene);
        // inputHandler.attachActions(text, methodName);

        return text;
    }
}

var debugMode = true;


document.addEventListener('DOMContentLoaded', function () {
    if (BABYLON.Engine.isSupported){
        canvas = document.getElementById("renderCanvas");
        engine = new BABYLON.Engine(canvas, true);
        //var loadingScreen = new LoadingScreen("");
        //loadingScreen.loadingUIBackgroundColor = new BABYLON.Color3.FromHexString("#FF0000");
        //engine.loadingScreen = loadingScreen;
        animManager = new AnimationManager();
        inputHandler = new InputHandler();
        uIHandler = new UIHandler();
        jsonHandler = new JsonHandler();
        jsonHandler.setUp();
        infoHandler = new InfoHandler();
        stateManager = new StateManager();
    }
});
window.addEventListener("resize", function () { // Watch for browser/canvas resize events
    engine.resize();
});
//window.addEventListener("click", function () {
//    var clickResult = scene.pick(scene.pointerX, scene.pointerY);
//    inputHandler.debugInput(clickResult);
//});
