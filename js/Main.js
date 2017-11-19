var canvas, engine, scene, camera, light;
var stateManager,
    animManager,
    inputHandler,
    uIHandler,
    jsonHandler,
    particleManager;

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

        uIHandler.createUIBase();
        uIHandler.createUIElements();
        this.createSkybox();

        //setInterval(function () {
        //    console.log(stateManager.currentScenario.babylonObjects);
        //    console.log(camera.radius)
        //}, 10000);

        engine.runRenderLoop(function () {
            scene.render();
            //light.position = camera.position;
            //this.globeCamera.alpha += this.globeSpeed;
            // console.log(this.globeCamera.alpha)

        }.bind(this))
    }
    createSkybox() {
        var skybox = BABYLON.MeshBuilder.CreateBox("skybox", {size:2000.0}, scene);
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
        this.loadingUIBackgroundColor = color;
    }
    displayLoadingUI() {
        var bg = new BABYLON.Mesh.CreatePlane("plane", 100, scene);
        bg.width = window.innerWidth;
        bg.height = window.innerHeight;
        bg.position = new BABYLON.Vector3(-100,100,-100);
        bg.visibility = 1;
        bg.faded = false;
        bg.rotateAround(new BABYLON.Vector3(-100,100,-100), "y", 45);
        this.loadedObjects.push(bg)
    }
    hideLoadingUI() {
        scene.registerBeforeRender(function () {
            this.loadedObjects.forEach(function (obj) {
                if (obj.visibility < 1.1 && !obj.faded){
                    if (obj.visibility < 0.0){
                        obj.faded = true;
                    }

                    obj.visibility -= 0.01;
                }
            }.bind(this));
        }.bind(this));
    }
}
class BaseScenario {
    constructor() {
        // Anytime anything is created, push to this.babylonObjects.
        this.babylonObjects = [];
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
    }
}
class BaseMode extends BaseScenario {
    constructor() {
        super();
    }
}

const dynamicClassMap = {
    OverviewScenario: class extends BaseScenario {
        constructor() {
            super();
        }
        setUp() {
            console.log("Reached Overview Scenario");

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
        }
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

            var textPlane = BABYLON.Mesh.CreatePlane("textPlane", 24, scene);
            textPlane.scaling = new BABYLON.Vector3(1, 1, 0.2);
            textPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

            textPlane.backFaceCulling = false;
            textPlane.position.x = cityCoordinates.x;
            textPlane.position.y = cityCoordinates.y + 2.5;
            textPlane.position.z = cityCoordinates.z;

            var advancedTextTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(textPlane, 512, 512);
            //var advancedTextTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("ui");
            advancedTextTexture.idealHeight = 1080;
            advancedTextTexture.idealWidth = 1920;

            var text = new BABYLON.GUI.TextBlock();
            text.text = location;
            text.fontSize = 100;
            text.color = "#ffffff";
            text.fontFamily = "Century Gothic";
            text.fontStyle = "bold";
            advancedTextTexture.addControl(text);

            this.babylonObjects.push(cityCoordinates, textPlane, advancedTextTexture, text);
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
            groundMat.diffuseColor = new BABYLON.Color3(0.36, 0.53, 0.13);
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
            camHolder.position = new BABYLON.Vector3(119, 8, -700);
            camHolder.isVisible = false;

            var flyCam = new BABYLON.FollowCamera("flyCam", new BABYLON.Vector3(119, 8, -700), scene);
            //flyCam.attachControl(canvas, true);
            //scene.activeCamera = flyCam;
            flyCam.radius = 10;
            flyCam.lockedTarget = camHolder;

            var debugCam = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(0, 0, -10), scene);
            debugCam.attachControl(canvas, true);
            scene.activeCamera = debugCam;

            var movementAnim = animManager.cameraFlyThrough(camHolder);

            var setTopDownNormalMode = function () {
                stateManager.changeMode("prioritization", "topDownNormal");
            };

            scene.beginAnimation(camHolder, 0,200,false, 1, setTopDownNormalMode);

            loader.load();

            this.babylonObjects.push(ground, groundMat, loader, city, camHolder, flyCam, debugCam, movementAnim)
        }
        showDashboard() {

        }
        hideDashboard() {

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
                var p1 = new BABYLON.Vector3(100 + i * Math.random(), Math.floor(Math.random() * 600) + 500, -285);
                var p2 = new BABYLON.Vector3(100 + i * Math.random(), Math.floor(Math.random() * 600) + 450, 285);
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
            this.spawnPackets(lanes);

            this.babylonObjects.push(lanes);
        }
        spawnPackets(lanes) {
            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 5, scene);
            packetSphere.position = new BABYLON.Vector3(102, 20, -885);

            for (var i = 0; i < this.packets.length; i++) {
                var packet = this.packets[Math.floor(Math.random() * this.packets.length)];
                //console.log(Math.floor(Math.random() * this.packets.length));
                for (var j = packet.count - 1; j >= 0; j--) {
                    var ranTime = Math.round(Math.random() * (12000 - 1000)) + 1000;
                    (function(subjectPacket, objects) {
                        if (!debugMode) {
                            console.log('[' + new Date().toISOString() + ']' + " scheduling a " + subjectPacket.color + " for " + ranTime + " from now.")
                        }

                        setTimeout(function () {
                            var packetClone = packetSphere.clone("clone");
                            var packetMat = new BABYLON.StandardMaterial("packetMat", scene);
                            packetMat.diffuseColor = new BABYLON.Color3.FromHexString(subjectPacket.color);
                            packetMat.emissiveTexture = new BABYLON.Texture(subjectPacket.emissiveTexture, scene);
                            packetClone.material = packetMat;
                            //var highlight = new BABYLON.HighlightLayer("hl", scene);
                            //highlight.addMesh(packetSphere, BABYLON.Color3.FromHexString(packet.color));

                            animManager.movePacket(packetClone, lanes);

                            scene.beginAnimation(packetClone, 0, this.pathPointCount, true);

                            objects.push(packetClone, packetMat);

                        }, ranTime);
                    })(packet, this.babylonObjects); // http://bonsaiden.github.io/JavaScript-Garden/#function.closures
                }
            }

            this.babylonObjects.push(packetSphere);
        }
    },
    PrioritizationTopDownMimicMode: class extends BaseMode {
        constructor() {
            super();

            this.packets = jsonHandler.resources[2].json.packets;
        }
        setUp() {
            if (debugMode) {
                console.log("- Reached Top Down Mimic Mode");
            }
            var laneCount = 6;
            this.pathPointCount = 50;
            var lanes = [];

            for (var i = 0; i < laneCount; i++) {
                var origin = new BABYLON.Vector3(97 + (i * 2), 20, -885);
                var p1 = new BABYLON.Vector3(100 + (i * 2), 600, -285);
                var p2 = new BABYLON.Vector3(100 + (i * 2), 600, 285);
                var destination = new BABYLON.Vector3(97 + (i * 2), 20, 885);
                var bezierVector = BABYLON.Curve3.CreateCubicBezier(
                    origin,
                    p1,
                    p2,
                    destination, this.pathPointCount);
                var path = bezierVector.getPoints();
                lanes.push(path);

                this.babylonObjects.push(origin, p1, p2, destination, bezierVector, path);
            }
            this.spawnPackets(lanes);

            this.babylonObjects.push(lanes);
        }
        spawnPackets() {
            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 5, scene);
            packetSphere.position = new BABYLON.Vector3(102, 20, -885);

            
        }
    }
};

class InputHandler {
    //debugInput(clickResult){
    //    if (clickResult.hit){
    //        console.log("x " + clickResult.pickedPoint.x + ", y " + clickResult.pickedPoint.y + ", z "
    //            + clickResult.pickedPoint.z);
    //    }
    //}
    attachUIListener(obj, methodName) {
        obj.onPointerUpObservable.add(methodName);
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
        var homeContainer = new BABYLON.GUI.Rectangle();
        homeContainer.width = "100%";
        homeContainer.height = "52px";
        homeContainer.thickness = 0;
        homeContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        homeContainer.top = "0px";
        var home = new BABYLON.GUI.Button.CreateImageOnlyButton("homeButton", "img/ui/home.png");
        home.thickness = 0;
        inputHandler.attachUIListener(home, setOverviewState);
        homeContainer.addControl(home);

        var setPrioritizationState = function () {
            stateManager.changeScenario("prioritization");
        };
        var prioritizationContainer = new BABYLON.GUI.Rectangle();
        prioritizationContainer.width = "100%";
        prioritizationContainer.height = "52px";
        prioritizationContainer.thickness = 0;
        homeContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        prioritizationContainer.top = "-52";
        var prioritization = new BABYLON.GUI.Button.CreateImageOnlyButton("prioritizationButton", "img/ui/prioritization.png");
        prioritization.thickness = 0;
        inputHandler.attachUIListener(prioritization, setPrioritizationState);
        prioritizationContainer.addControl(prioritization);

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
        var mimicContainer = new BABYLON.GUI.Rectangle();
        mimicContainer.width = "100%";
        mimicContainer.height = "79px";
        mimicContainer.thickness = 0;
        mimicContainer.top = "100px";
        var mimic = new BABYLON.GUI.Button.CreateImageOnlyButton("mimicButton", "img/ui/mimic.png");
        mimic.thickness = 0;
        inputHandler.attachUIListener(mimic, setMode);
        mimicContainer.addControl(mimic);

        this.uiContainer.addControl(mimicContainer);
        this.uiContainer.addControl(prioritizationContainer);
        this.uiContainer.addControl(homeContainer);
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
        inputHandler.attachUIListener(text, methodName);

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
        stateManager = new StateManager();
    }
});
//window.addEventListener("click", function () {
//    var clickResult = scene.pick(scene.pointerX, scene.pointerY);
//    inputHandler.debugInput(clickResult);
//});
