var canvas, engine, scene, camera, light;
var loadingScreen,
    stateManager,
    animManager,
    inputHandler,
    uIHandler,
    jsonHandler,
    particleManager,
    infoHandler;

// JsonHandler reads JSON from file, loads the JSON and the callback is then used
// in various scenarios and modes. Once all JSON is loaded, the StateManager is called.
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
            },
            {
                "url": "data/infoText.json",
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
            //TODO: Fix this. It's terrible and hardcoded.
            if (this.resources[0].json !== "" && this.resources[1].json !== "" && this.resources[2].json !== "" && this.resources[3].json !== "") {
                stateManager.setUp();
            }
        }.bind(this));

    }
}
// ObjectFactory is called from StateManager and instantiates the class with its
// name and potential parameters.
class ObjectFactory {
    constructor(className, constructorParams) {
        return new dynamicClassMap[className](constructorParams);
    }
}
// StateManager is called from JsonHandler and handles the changing of modes and
// scenarios, taking in a class name string, retrieving the class names from JSON and
// passing them to ObjectFactory, to then be instantiated.
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
// Stage sets up the base scene, camera, light, UI and skybox. It also contains the render loop.
class Stage {
    constructor() {
        scene = new BABYLON.Scene(engine);
        //scene.debugLayer.show();
        scene.clearColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        camera = new BABYLON.ArcRotateCamera("globeCamera", 0,0,0, BABYLON.Vector3.Zero(), scene);
        camera.setPosition(new BABYLON.Vector3(-100, 100, -100));
        camera.lowerRadiusLimit = 90;
        camera.upperRadiusLimit = 330;
        light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.5;

        var music = new BABYLON.Sound("Music", "sfx/Lobo_Loco_-_Space_Elves_ID_710.mp3", scene, null, { loop: true, autoplay: true, volume: 0.05 });

        uIHandler.createUIBase();
        uIHandler.createUIElements();
        this.createSkybox();

        engine.runRenderLoop(function () {
            scene.render();
            light.position = camera.position;
            // console.log(this.globeCamera.alpha)

        }.bind(this))
    }
    createSkybox() {
        var skybox = BABYLON.MeshBuilder.CreateBox("skybox", {size:8500.0}, scene);
        var skyboxMat = new BABYLON.StandardMaterial("skybox", scene);
        skyboxMat.backFaceCulling = false;
        skyboxMat.reflectionTexture = new BABYLON.CubeTexture("img/skybox/skybox_blank", scene);
        skyboxMat.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMat.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMat;
    }
}
// Custom loading screen to sit on top of Babylon.JS's loading screen.
// Mostly handled with HTML and CSS. Future improvement would be to
// merge the packet methods.
class LoadingScreen {
    constructor() {
        this.loadedObjects = [];

    }
    displayLoadingUI() {
        var loadingContainer = document.querySelector("#loading");
        if (loadingContainer.classList.contains("loadingFadeOut")) {
            loadingContainer.classList.remove("loadingFadeOut");
            loadingContainer.style.display = "block";
            loadingContainer.classList.add("loadingFadeIn");
        }

        var mimicText = new Image();
        mimicText.style.display = "none";
        mimicText.onload = function () {
            var w = (window.innerWidth / 2) - (mimicText.width / 2);
            var h = (window.innerHeight / 2) - (mimicText.height / 2);
            mimicText.id = "mimicText";
            mimicText.style.position = "absolute";
            mimicText.style.top = h + "px";
            mimicText.style.left = w + "px";
            mimicText.style.display = "block";

            this.createGreenPackets(loadingContainer, w, h);
            this.createYellowPackets(loadingContainer, w, h);
            this.createRedPackets(loadingContainer, w, h);
        }.bind(this);
        loadingContainer.appendChild(mimicText);
        mimicText.src = "img/loadingscreen/mimic.png";


        this.loadedObjects.push(mimicText);
        this.hideLoadingUI();
    }
    createGreenPackets(container, width, height) {
        for (var i = 0; i < 6; i++) {
            var packetImg = new Image();
            packetImg.style.display = "none";
            packetImg.style.left = "-200px";

            (function (img, parent, index) {
                img.onload = function () {
                    img.className = "packet";
                    img.style.position = "absolute";
                    img.style.top = height + 20 + "px";
                    img.style.left = "-20px";
                    img.style.display = "block";

                };
                parent.appendChild(img);
                var ranTime = Math.round(Math.random() * (3000 - 1000)) + 1000;
                setTimeout(function () {
                    img.classList.add("animatePacket");
                    img.style.animationDuration = ranTime / 1000 + 1 + "s"
                }, ranTime);
                img.src = "img/loadingscreen/green.png";
            })(packetImg, container, i);
            this.loadedObjects.push(packetImg);

        }
    }
    createYellowPackets(container, width, height) {
        for (var i = 0; i < 5; i++) {
            var packetImg = new Image();
            packetImg.style.display = "none";
            packetImg.style.left = "-200px";

            (function (img, parent, index) {
                img.onload = function () {
                    img.className = "packet";
                    img.style.position = "absolute";
                    img.style.top = height + "px";
                    img.style.left = "-20px";
                    img.style.display = "block";

                };
                parent.appendChild(img);
                var ranTime = Math.round(Math.random() * (5000 - 3000)) + 3000;
                setTimeout(function () {
                    img.classList.add("animatePacket");
                    img.style.animationDuration = ranTime / 1000 + 1 + "s"
                }, ranTime);
                img.src = "img/loadingscreen/yellow.png";
            })(packetImg, container, i);
            this.loadedObjects.push(packetImg);
        }
    }
    createRedPackets(container, width, height) {
        for (var i = 0; i < 5; i++) {
            var packetImg = new Image();
            packetImg.style.display = "none";
            packetImg.style.left = "-200px";

            (function (img, parent, index) {
                img.onload = function () {
                    img.className = "packet";
                    img.style.position = "absolute";
                    img.style.top = height - 20 + "px";
                    img.style.left = "-20px";
                    img.style.display = "block";

                };
                parent.appendChild(img);
                var ranTime = Math.round(Math.random() * (8000 - 5000)) + 5000;
                setTimeout(function () {
                    img.classList.add("animatePacket");
                    img.style.animationDuration = ranTime / 1000 + 1 + "s"
                }, ranTime);
                img.src = "img/loadingscreen/red.png";
            })(packetImg, container, i);
            this.loadedObjects.push(packetImg);
        }
    }
    hideLoadingUI() {
        var loadingContainer = document.querySelector("#loading");
        setTimeout(function () {
            if (loadingContainer.classList.contains("loadingFadeIn")) {
                loadingContainer.classList.remove("loadingFadeIn");
                loadingContainer.classList.add("loadingFadeOut");
            }
            else {
                loadingContainer.classList.add("loadingFadeOut");
            }
        }.bind(this), 5000);



        loadingContainer.addEventListener("animationend", function () {
            if (loadingContainer.classList.contains("loadingFadeOut")) {
                loadingContainer.style.display = "none";
                for (var i = this.loadedObjects.length - 1; i >= 0; i--) {
                    if (this.loadedObjects[i] !== null) {
                        this.loadedObjects[i].parentNode.removeChild(this.loadedObjects[i]);
                        this.loadedObjects.splice(i, 1);
                    }
                }
            }
        }.bind(this))

    }
}
// Parent class for Scenarios, this class simply contains tearDown to clean up.
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
// BaseMode is the parent class of Modes, child class of Scenarios.
// Includes packetUI code, in order to cut down on repetition, as
// all of the modes need to access the packetUI method.
class BaseMode extends BaseScenario {
    constructor() {
        super();

        this.packetUIWithLinks = [];
        this.packetUIWithoutLinks = [];
    }
    showPacketUI(packet) {
        if (!packet.clicked) {
            if (!this.packetInfoIsOpen) {
                this.packetInfoIsOpen = true;
                var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
                advancedTexture.idealWidth = 1720;

                var textBox = new BABYLON.GUI.Rectangle();
                textBox.width = "290px";
                textBox.height = "140px";
                textBox.cornerRadius = 10;
                textBox.color = "#47b92d";
                textBox.fontFamily = "Century Gothic";
                textBox.thickness = 2;
                textBox.background = "transparent";
                advancedTexture.addControl(textBox);
                textBox.linkWithMesh(packet);
                textBox.linkOffsetY = -200;

                var textBG = new BABYLON.GUI.Rectangle();
                textBG.width = "290px";
                textBG.height = "140px";
                textBG.cornerRadius = 10;
                textBG.thickness = 0;
                textBG.background = "#499b12";
                textBG.alpha = 0.25;
                advancedTexture.addControl(textBG);
                textBG.linkWithMesh(packet);
                textBG.linkOffsetY = -200;

                var label = new BABYLON.GUI.TextBlock();
                label.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                label.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                label.text = "Packet details";
                label.color = "#47b92d";
                label.width = "13%";
                label.fontStyle = "bold";
                label.fontFamily = "Century Gothic";
                advancedTexture.addControl(label);
                label.linkWithMesh(packet);
                label.linkOffsetY = -265;

                if (stateManager.newModeClassName !== "PrioritizationWipeoutNormalMode" && stateManager.newModeClassName !== "PrioritizationWipeoutMimicMode") {
                    var text1 = new BABYLON.GUI.TextBlock();
                    text1.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                    text1.text = "Application: " + packet.application;
                    text1.color = "#47b92d";
                    text1.fontSize = "16px";
                    text1.fontFamily = "Century Gothic";
                    text1.top = "-30px";
                    text1.paddingLeft = "10px";
                    textBox.addControl(text1);

                    var text2 = new BABYLON.GUI.TextBlock();
                    text2.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                    text2.text = "Destination: " + packet.destination;
                    text2.color = "#47b92d";
                    text2.fontSize = "16px";
                    text2.fontFamily = "Century Gothic";
                    text2.top = "-10px";
                    text2.paddingLeft = "10px";
                    textBox.addControl(text2);

                    var text3 = new BABYLON.GUI.TextBlock();
                    text3.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                    text3.text = "Scheduling: " + packet.scheduling;
                    text3.color = "#47b92d";
                    text3.fontSize = "16px";
                    text3.fontFamily = "Century Gothic";
                    text3.top = "10px";
                    text3.paddingLeft = "10px";
                    textBox.addControl(text3);

                    var text4 = new BABYLON.GUI.TextBlock();
                    text4.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                    text4.text = "Bandwidth: " + packet.bandwidth;
                    text4.color = "#47b92d";
                    text4.fontSize = "16px";
                    text4.fontFamily = "Century Gothic";
                    text4.top = "30px";
                    text4.paddingLeft = "10px";
                    textBox.addControl(text4);

                    var textArray = [];
                    textArray.push(text1, text2, text3, text4);
                }
                else {
                    var appText = new BABYLON.GUI.TextBlock();
                    appText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                    appText.text = "Application: " + packet.application;
                    appText.color = "#47b92d";
                    appText.fontSize = "16px";
                    appText.fontStyle = "bold";
                    appText.fontFamily = "Century Gothic";
                    appText.top = "-42px";
                    appText.paddingLeft = "10px";
                    textBox.addControl(appText);

                    var text5 = new BABYLON.GUI.TextBlock();
                    text5.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                    text5.text = packet.text1;
                    text5.color = "#47b92d";
                    text5.fontSize = "16px";
                    text5.fontFamily = "Century Gothic";
                    text5.top = "-18px";
                    text5.paddingLeft = "10px";
                    textBox.addControl(text5);

                    var text6 = new BABYLON.GUI.TextBlock();
                    text6.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                    text6.text = packet.text2;
                    text6.color = "#47b92d";
                    text6.fontSize = "16px";
                    text6.fontFamily = "Century Gothic";
                    text6.top = "2px";
                    text6.paddingLeft = "10px";
                    textBox.addControl(text6);

                    var text7 = new BABYLON.GUI.TextBlock();
                    text7.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                    text7.text = packet.text3;
                    text7.color = "#47b92d";
                    text7.fontSize = "16px";
                    text7.fontFamily = "Century Gothic";
                    text7.top = "22px";
                    text7.paddingLeft = "10px";
                    textBox.addControl(text7);

                    var text8 = new BABYLON.GUI.TextBlock();
                    text8.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                    text8.text = packet.text4;
                    text8.color = "#47b92d";
                    text8.fontSize = "16px";
                    text8.fontFamily = "Century Gothic";
                    text8.top = "42px";
                    text8.paddingLeft = "10px";
                    textBox.addControl(text8);

                    var descArray = [];
                    descArray.push(appText, text5, text6, text7, text8);
                }

                if (typeof textArray !== "undefined") {
                    this.packetUIWithoutLinks.push(textArray);
                }
                if (typeof descArray !== "undefined") {
                    this.packetUIWithoutLinks.push(descArray);
                }

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
                line.y2 = 70;
                line.linkOffsetY = -20;
                advancedTexture.addControl(line);
                line.linkWithMesh(packet);
                line.connectedControl = textBox;

                this.packetUIWithLinks.push(textBox, textBG, label, target, targetBG, line);


                this.babylonObjects.push(advancedTexture, textBox, textBG, label, target, targetBG, line, this.packetUIWithLinks, packet);
            }
            packet.clicked = true;
        }
    }
}
// DynamicClassMap contains the scenarios and modes which make up the vast majority of the code.
// A lot of repetition done in here, that should eventually be cleaned up and inserted into parent classes.
const dynamicClassMap = {
    // Network overview scenario. Creates the connections between cities based on bezier curves defined
    // in JSON. Then, creates the city names and plays sounds.
    OverviewScenario: class extends BaseScenario {
        constructor() {
            super();
            this.infoIsShown = false;
            this.cameraSpeed = 0.001;
        }
        setUp() {
            //console.log("Reached Overview Scenario");
            camera.setPosition(new BABYLON.Vector3(-100, 100, -100));
            scene.activeCamera = camera;
            var loader = new BABYLON.AssetsManager(scene);
            //loader.useDefaultLoadingScreen = false;
            var globe = loader.addMeshTask("globe", "", "models/", "globe7.babylon");
            var countries = loader.addMeshTask("outer", "", "models/", "inner.babylon");
            var highlight = new BABYLON.HighlightLayer("hl", scene);

            globe.onSuccess = function (task) {
                highlight.addMesh(task.loadedMeshes[0], new BABYLON.Color3.FromHexString("#315d28"));
                highlight.innerGlow = false;
                highlight.blurHorizontalSize = 3;
                highlight.blurVerticalSize = 3;
                this.babylonObjects.push(task.loadedMeshes[0], highlight);

            }.bind(this);

            countries.onSuccess = function (task) {
                this.babylonObjects.push(task.loadedMeshes[0]);
            }.bind(this);

            loader.load();

            uIHandler.hideActiveIcon();
            uIHandler.removeMimicPointer();
            var opener = infoHandler.showInfo("opener");
            if (typeof opener !== "undefined") {
                if (!opener.classList.contains("borderPointer")){
                    opener.classList.add("borderPointer");
                }
                this.babylonObjects.push(opener);
            }
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
            text.fontFamily = "Arial";
            text.fontStyle = "bold";
            advancedTextTexture.addControl(text);

            var showWindow = function () {
                var cityView = infoHandler.showInfo("cityOverview");
                if (typeof cityView !== "undefined") {
                    if (!cityView.classList.contains("borderPointer")) {
                        cityView.classList.add("borderPointer");
                    }
                }
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
            //console.log("- Reached Overview Dummy Mode")
        }
    },
    // Prioritization Scenario is the lead up to the modes. This plays an animation with the camera, zooms in
    // on the city, and shows info boxes.
    PrioritizationScenario: class extends BaseScenario {
        constructor() {
            super();
        }
        setUp() {
            //console.log("Reached Prioritization Scenario");

            light.intensity = 0.3;

            var loader = new BABYLON.AssetsManager(scene);
            //loader.useDefaultLoadingScreen = false;
            var city = loader.addMeshTask("city", "", "models/", "city6.babylon");
            var uk = loader.addMeshTask("uk", "", "models/", "uk2.babylon");
            //var highlight = new BABYLON.HighlightLayer("hl", scene);

            city.onSuccess = function (task) {
                var cityMesh = task.loadedMeshes[0];
                cityMesh.position = new BABYLON.Vector3(cityMesh.position.x, cityMesh.position.y, -890);
                var cityClone = task.loadedMeshes[0].clone("city2");
                cityClone.position = new BABYLON.Vector3(cityMesh.position.x, cityMesh.position.y, 890);
                cityClone.rotation.y = 0;
                this.babylonObjects.push(cityMesh, cityClone);
            }.bind(this);

            uk.onSuccess = function (task) {
                var ukMesh = task.loadedMeshes[0];
                ukMesh.position = new BABYLON.Vector3(ukMesh.position.x, ukMesh.position.y - 10, ukMesh.position.z - 300);
                this.babylonObjects.push(ukMesh);
            }.bind(this);

            var camHolder = new BABYLON.Mesh.CreateBox("camholder", 3, scene);
            camHolder.position = new BABYLON.Vector3(100, 3000, -4000);
            //camHolder.isVisible = false;
            var camHolderMat = new BABYLON.StandardMaterial("camHolderMat", scene);
            camHolderMat.diffuseTexture =  new BABYLON.Texture("img/blank.png", scene);
            camHolderMat.diffuseTexture.hasAlpha = true;
            camHolderMat.alpha = 0;
            camHolder.material = camHolderMat;

            var flyCam = new BABYLON.FollowCamera("flyCam", new BABYLON.Vector3(100, 3000, -3950), scene);
            //flyCam.attachControl(canvas, true);
            scene.activeCamera = flyCam;
            flyCam.radius = 50;
            flyCam.heightOffset = 50;
            flyCam.lockedTarget = camHolder;

            //var debugCam = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(100, 3000, -2000), scene);
            //debugCam.attachControl(canvas, true);
            //scene.activeCamera = debugCam;

            var anims = animManager.cameraFlyThrough(camHolder);

            var setTopDownNormalMode = function () {
                stateManager.changeMode("prioritization", "topDownNormal");
            };

            var self = this;

            setTimeout(function () {
                self.animatable = scene.beginDirectAnimation(camHolder, anims, 0, 200, false, 1, setTopDownNormalMode);
            }, 3000);

            loader.load();

            var cityPauseEvent = new BABYLON.AnimationEvent(150, function() {
                this.pauseAndShowInfo(self.animatable, "prioritizationCountryView");
            }.bind(this), true);

            anims[0].addEvent(cityPauseEvent);
            anims[1].addEvent(cityPauseEvent);

            var buildingPauseEvent = new BABYLON.AnimationEvent(199, function() {
                this.pauseAndShowInfo(self.animatable, "prioritizationBuildingView");
            }.bind(this), true);

            anims[0].addEvent(buildingPauseEvent);
            anims[1].addEvent(buildingPauseEvent);

            uIHandler.hideActiveIcon();
            uIHandler.removeMimicPointer();

            this.babylonObjects.push(loader, city, camHolder, flyCam, anims, uk)
        }
        pauseAndShowInfo(anim, info) {
            anim.pause();
            var border = infoHandler.showInfo(info);
            if (typeof border !== "undefined") {
                if (!border.classList.contains("borderPointer")) {
                    border.classList.add("borderPointer");
                }
            }

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
            //console.log("- Reached Prioritization Dummy Mode");
        }
    },
    // "Top down normal mode" is the packet view. Lanes for the spheres to follow are created, and the
    // initial sphere is cloned to improve performance. Then, packets are animated along the lanes and
    // the camera is animated around the scene. "Placed" packets are then created to be interacted with.
    // Most code is repeated throughout modes, and should be placed in parent BaseMode.
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
                var p1 = new BABYLON.Vector3(100 + i * Math.random(), Math.floor(Math.random() * 400) + 450, -285);
                var p2 = new BABYLON.Vector3(100 + i * Math.random(), Math.floor(Math.random() * 400) + 425, 285);
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

            this.moveCamera();
            this.iteratePackets(lanes);

            uIHandler.hideActiveIcon();
            uIHandler.removeMimicPointer();


            this.babylonObjects.push(lanes);

        }
        iteratePackets(lanes) {
            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 5, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -888);

            for (var i = 0; i < this.packets.length; i++) {
                var packet = this.packets[i];

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
            var movementAnimatable = scene.beginAnimation(topDownCam, 3, 360, false);

            var endPoint = new BABYLON.AnimationEvent(359, function () {
                setTimeout(function () {
                    stateManager.changeMode("prioritization", "wipeoutNormal");
                }, 1000);
            }.bind(this));
            movementAnim.addEvent(endPoint);

            this.pointCamera(topDownCam, movementAnim, movementAnimatable);
            this.babylonObjects.push(topDownCam, movementAnim, movementAnimatable);

        }
        pointCamera(cam, movementAnim, movementAnimatable) {
            var origin = new BABYLON.Vector3(102, 25, -885);
            var p1 = new BABYLON.Vector3(102, 300, -485);
            var p2 = new BABYLON.Vector3(102, 300, 485);
            var destination = new BABYLON.Vector3(102, 25, 885);
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

            var placedPacketSpawnPoint = new BABYLON.AnimationEvent(63, function () {
                this.createGreenPacket();
            }.bind(this));
            movementAnim.addEvent(placedPacketSpawnPoint);

            var quarterPausePoint = new BABYLON.AnimationEvent(90, function () {
                this.cloneAnims.forEach(function (cloneAnimatable) {
                    this.allAnims.push(cloneAnimatable);
                }.bind(this));
                this.allAnims.forEach(function (animatable) {
                    this.pauseAndShowInfo(animatable, "prioritizationNormalPacketView");
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
        pauseAndShowInfo(anim, info) {
            this.spawnerEnabled = false;

            anim.pause();
            var border = infoHandler.showInfo(info);
            if (typeof border !== "undefined") {
                if (!border.classList.contains("borderPointer")) {
                    border.classList.add("borderPointer");
                }
            }

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

            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 16, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -888);
            var packetMat = new BABYLON.StandardMaterial("packetMat", scene);

            packetMat.diffuseColor = new BABYLON.Color3.FromHexString("#00A32E");
            packetMat.emissiveColor = new BABYLON.Color3.FromHexString("#22b14c");
            packetSphere.material = packetMat;

            packetSphere.clicked = false;
            packetSphere.application = "Voice call";
            packetSphere.destination = "Skype";
            packetSphere.scheduling = "Best effort only";
            packetSphere.bandwidth = "Best effort only";

            var radius = Math.floor(Math.random() * 10) + 20;
            var anim = animManager.moveTopDownPlacedPackets(packetSphere, radius, greenPath);
            var animatable = scene.beginAnimation(packetSphere, 0, 180, false, 1, function () {
                packetSphere.dispose();
            });

            var yellowSpawnPoint = new BABYLON.AnimationEvent(1, function () {
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

            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 16, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -878);
            var packetMat = new BABYLON.StandardMaterial("packetMat", scene);

            packetMat.diffuseColor = new BABYLON.Color3.FromHexString("#A3A300");
            packetMat.emissiveColor = new BABYLON.Color3.FromHexString("#fff200");
            packetSphere.material = packetMat;

            packetSphere.clicked = false;
            packetSphere.application = "Software update";
            packetSphere.destination = "Apple";
            packetSphere.scheduling = "Best effort only";
            packetSphere.bandwidth = "Best effort only";

            var radius = Math.floor(Math.random() * 5) + 25;
            var anim = animManager.moveTopDownPlacedPackets(packetSphere, radius, yellowPath);
            var animatable = scene.beginAnimation(packetSphere, 0, 180, false, 1, function () {
                packetSphere.dispose();
            });

            var redSpawnPoint = new BABYLON.AnimationEvent(1, function () {
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

            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 16, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -888);
            var packetMat = new BABYLON.StandardMaterial("packetMat", scene);

            packetMat.diffuseColor = new BABYLON.Color3.FromHexString("#99000B");
            packetMat.emissiveColor = new BABYLON.Color3.FromHexString("#ed1c24");
            packetSphere.material = packetMat;

            packetSphere.clicked = false;
            packetSphere.application = "Streaming music";
            packetSphere.destination = "Spotify";
            packetSphere.scheduling = "Best effort only";
            packetSphere.bandwidth = "Best effort only";

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
        destroyPacketUI() {
            this.packetUIWithLinks.forEach(function (element) {
                element.linkWithMesh(null);
                element.dispose();
                element = null;
                this.packetUIWithLinks = [];
            }.bind(this));
            this.packetUIWithoutLinks.forEach(function (elementArray) {
                elementArray.forEach(function (element) {
                    element.dispose();
                });
                elementArray = null;
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
            this.packetUIWithoutLinks.forEach(function (elementArray) {
                elementArray.forEach(function (element) {
                    element.dispose();
                });
                elementArray = null;
            });
            infoHandler.hideInfo();
        }
    },
    // "Top down mimic mode" is the packet view in MiMiC mode. Lanes for the spheres to follow are created, and the
    // initial sphere is cloned to improve performance. Then, packets are animated along the lanes and
    // the camera is animated around the scene. "Placed" packets are then created to be interacted with.
    // Most code is repeated throughout modes, and should be placed in parent BaseMode.
    PrioritizationTopDownMimicMode: class extends BaseMode {
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
                console.log("- Reached Top Down Mimic Mode");
            }
            var laneCount = 6;
            this.pathPointCount = 50;
            var lanes = [];

            for (var i = 0; i < laneCount; i++) {
                var origin = new BABYLON.Vector3(102, 20, -885);
                var p1 = new BABYLON.Vector3(100 + (i * 20), 500, -285);
                var p2 = new BABYLON.Vector3(100 + (i * 20), 500, 285);
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

            this.iteratePackets(lanes);
            this.moveCamera();
            uIHandler.hideActiveIcon();
            uIHandler.showActiveIcon();
            uIHandler.removeMimicPointer();


            this.babylonObjects.push(lanes);
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

            var endPoint = new BABYLON.AnimationEvent(359, function () {
                setTimeout(function () {
                    stateManager.changeMode("prioritization", "wipeoutMimic");
                }, 1000);
            }.bind(this));
            movementAnim.addEvent(endPoint);

            this.pointCamera(topDownCam, movementAnim, movementAnimatable);

            this.babylonObjects.push(topDownCam, movementAnim, movementAnimatable);

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

            var placedPacketSpawnPoint = new BABYLON.AnimationEvent(60, function () {
                this.createGreenPacket();
            }.bind(this));
            movementAnim.addEvent(placedPacketSpawnPoint);

            scene.onBeforeRenderObservable.add(function () {
                cam.setTarget(dummy.position);
            });

            this.allAnims.push(movementAnimatable, animatable);

            var quarterPausePoint = new BABYLON.AnimationEvent(90, function () {
                this.cloneAnims.forEach(function (cloneAnimatable) {
                    this.allAnims.push(cloneAnimatable);
                }.bind(this));
                this.allAnims.forEach(function (animatable) {
                    this.pauseAndShowInfo(animatable, "prioritizationMimicPacketView");
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


            this.babylonObjects.push(origin, p1, p2, destination, bezierVector, path, dummy, dummyMat, anim, animatable);
        }
        pauseAndShowInfo(anim, info) {
            this.spawnerEnabled = false;

            anim.pause();
            var border = infoHandler.showInfo(info);
            if (typeof border !== "undefined") {
                if (!border.classList.contains("borderPointer")) {
                    border.classList.add("borderPointer");
                }
            }

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

            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 16, scene);
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

            var radius = 0;
            var anim = animManager.moveTopDownMimicPlacedPackets(packetSphere, radius, greenPath);
            var animatable = scene.beginAnimation(packetSphere, 0, 180, false, 1.5, function () {
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

            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 16, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -878);
            var packetMat = new BABYLON.StandardMaterial("packetMat", scene);

            packetMat.diffuseColor = new BABYLON.Color3.FromHexString("#A3A300");
            packetMat.emissiveColor = new BABYLON.Color3.FromHexString("#fff200");
            packetSphere.material = packetMat;

            packetSphere.clicked = false;
            packetSphere.application = "Software update";
            packetSphere.destination = "Apple";
            packetSphere.scheduling = "Best effort";
            packetSphere.bandwidth = "Low priority";

            var radius = 10;
            var anim = animManager.moveTopDownMimicPlacedPackets(packetSphere, radius, yellowPath);
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

            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 16, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -888);
            var packetMat = new BABYLON.StandardMaterial("packetMat", scene);

            packetMat.diffuseColor = new BABYLON.Color3.FromHexString("#99000B");
            packetMat.emissiveColor = new BABYLON.Color3.FromHexString("#ed1c24");
            packetSphere.material = packetMat;

            packetSphere.clicked = false;
            packetSphere.application = "Streaming music";
            packetSphere.destination = "Spotify";
            packetSphere.scheduling = "High drop probability";
            packetSphere.bandwidth = "Idle";

            var radius = 20;
            var anim = animManager.moveTopDownMimicPlacedPackets(packetSphere, radius, redPath);
            var animatable = scene.beginAnimation(packetSphere, 0, 180, false, 0.8, function () {
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
        destroyPacketUI() {
            this.packetUIWithLinks.forEach(function (element) {
                element.linkWithMesh(null);
                element.dispose();
                element = null;
                this.packetUIWithLinks = [];
            }.bind(this));
            this.packetUIWithoutLinks.forEach(function (elementArray) {
                elementArray.forEach(function (element) {
                    element.dispose();
                });
                elementArray = null;
                this.packetUIWithoutLinks = [];
            }.bind(this));
            this.placedPackets.forEach(function (packet) {
                packet.clicked = false;
            });
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
            this.packetUIWithoutLinks.forEach(function (elementArray) {
                elementArray.forEach(function (element) {
                    element.dispose();
                });
                elementArray = null;
            });
            infoHandler.hideInfo();
        }
    },
    // "Wipeout" mode is the close-up view of packet lanes. Lanes for the spheres to follow are created, and the
    // initial sphere is cloned to improve performance. Then, packets are animated along the lanes and
    // the camera is animated around the scene. "Placed" packets are then created to be interacted with.
    // Most code is repeated throughout modes, and should be placed in parent BaseMode.
    PrioritizationWipeoutNormalMode: class extends BaseMode {
        constructor() {
            super();

            this.packets = jsonHandler.resources[2].json.packets;
            this.spawnerEnabled = true;
            this.clones = [];
            this.cloneAnims = [];
            this.placedPackets = [];
        }
        setUp() {
            if (debugMode) {
                console.log("- Reached Wipeout Normal Mode");
            }
            var laneCount = 6;
            this.pathPointCount = 50;
            var lanes = [];

            for (var i = 0; i < laneCount; i++) {
                var origin = new BABYLON.Vector3(Math.floor(Math.random() * (107 - 97) + 97), 20, -885);
                var p1 = new BABYLON.Vector3(100 + i * Math.random(), Math.floor(Math.random() * 400) + 500, -285);
                var p2 = new BABYLON.Vector3(100 + i * Math.random(), Math.floor(Math.random() * 400) + 450, 285);
                var destination = new BABYLON.Vector3(Math.floor(Math.random() * (107 - 97) + 97), 20, 885);
                var bezierVector = BABYLON.Curve3.CreateCubicBezier(origin, p1, p2, destination, this.pathPointCount);
                var path = bezierVector.getPoints();
                lanes.push(path);

                this.babylonObjects.push(origin, p1, p2, destination, bezierVector, path);
            }
            this.iteratePackets(lanes);

            loadingScreen.displayLoadingUI();

            this.moveCamera();
            uIHandler.hideActiveIcon();


            this.babylonObjects.push(lanes);
        }
        iteratePackets(lanes) {
            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 5, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -888);

            for (var i = 0; i < this.packets.length; i++) {
                var packet = this.packets[i];


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
            var wipeoutCam = new BABYLON.TargetCamera("arcCam", new BABYLON.Vector3(102, 40, -888), scene);
            scene.activeCamera = wipeoutCam;

            var height = 75;
            var movementAnim = animManager.moveWipeoutCamera(wipeoutCam, height);
            var movementAnimatable = scene.beginAnimation(wipeoutCam, 0, 140, false);

            this.pointCamera(wipeoutCam, movementAnim, movementAnimatable);

            this.babylonObjects.push(wipeoutCam, movementAnim, movementAnimatable);

        }
        pointCamera(cam, movementAnim, movementAnimatable) {
            var origin = new BABYLON.Vector3(102, 40, -888);
            var p1 = new BABYLON.Vector3(102, 300, -485);
            var p2 = new BABYLON.Vector3(102, 300, 485);
            var destination = new BABYLON.Vector3(102, 40, 888);
            var bezierVector = BABYLON.Curve3.CreateCubicBezier(origin, p1, p2, destination, 90);
            var path = bezierVector.getPoints();

            var dummy = new BABYLON.Mesh.CreateBox("box", 2, scene);
            var dummyMat = new BABYLON.StandardMaterial("dummyMat", scene);
            dummyMat.diffuseTexture = new BABYLON.Texture("img/blank.png", scene);
            dummyMat.diffuseTexture.hasAlpha = true;
            dummyMat.alpha = 0;
            dummy.material = dummyMat;

            var anim = animManager.pointWipeoutCamera(dummy, path);
            var animatable = scene.beginAnimation(dummy, 0, path.length, false);

            scene.onBeforeRenderObservable.add(function () {
                cam.setTarget(dummy.position);
            });
            this.allAnims.push(movementAnimatable, animatable);

            var placedPacketSpawnPoint = new BABYLON.AnimationEvent(50, function () {
                this.createGreenPacket();
            }.bind(this));
            movementAnim.addEvent(placedPacketSpawnPoint);

            var fadeOutPoint = new BABYLON.AnimationEvent(100, function () {
                this.clones.forEach(function (clone) {
                    var anim = animManager.fadePackets(clone, 1, 0.1);
                    scene.beginDirectAnimation(clone, [anim], 0, 25, false);
                }.bind(this));
            }.bind(this));
            movementAnim.addEvent(fadeOutPoint);

            var wipeoutPausePoint = new BABYLON.AnimationEvent(130, function () {
                this.cloneAnims.forEach(function (animatable) {
                    animatable.pause();
                }.bind(this));
                this.allAnims.forEach(function (animatable) {
                    animatable.pause();
                }.bind(this));

                var border = infoHandler.showInfo("prioritizationNormalWipeoutView");
                if (typeof border !== "undefined") {
                    if (border.classList.contains("borderPointer")) {
                        border.classList.remove("borderPointer");
                    }
                }
                var mimic = document.querySelector("#mimic");
                mimic.style.background = "url('img/ui/mimic-full.png') no-repeat 0 0";
                mimic.style.backgroundSize = "400%";
                uIHandler.removeMimicPointer();
                uIHandler.showMimicPointer();

                inputHandler.attachDOMHoverListener(mimic, uIHandler.hover);
                inputHandler.attachDOMHoverOutListener(mimic, uIHandler.hoverOut);

                this.babylonObjects.push(border);

                var setMode = function () {
                    this.destroyPacketUI();
                    infoHandler.hideInfo();
                    loadingScreen.displayLoadingUI();
                    setTimeout(function () {
                        stateManager.changeMode("prioritization", "topDownMimic");

                        var mimic = document.querySelector("#mimic");
                        mimic.style.background = "url('img/ui/mimic-off.png') no-repeat 0 0";
                        mimic.style.backgroundSize = "100%";
                        inputHandler.removeDOMListener(mimic, "click", setMode);
                        inputHandler.removeDOMListener(mimic, "mouseenter", uIHandler.hover);
                        inputHandler.removeDOMListener(mimic, "mouseleave", uIHandler.hoverOut);
                    }, 4500);
                }.bind(this);

                inputHandler.attachDOMListener(mimic, setMode);

            }.bind(this));
            movementAnim.addEvent(wipeoutPausePoint);

            this.babylonObjects.push(origin, p1, p2, destination, bezierVector, path, dummy, dummyMat, anim, animatable);
        }

        createGreenPacket() {
            var green = BABYLON.Curve3.CreateCubicBezier(new BABYLON.Vector3(102, 40, -898), new BABYLON.Vector3(140, 550, -444), new BABYLON.Vector3(140, 550, 444), new BABYLON.Vector3(102, 40, 898), 130);
            var greenPath = green.getPoints();

            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 16, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -888);
            var packetMat = new BABYLON.StandardMaterial("packetMat", scene);

            packetMat.diffuseColor = new BABYLON.Color3.FromHexString("#00A32E");
            packetMat.emissiveColor = new BABYLON.Color3.FromHexString("#22b14c");
            packetSphere.material = packetMat;

            packetSphere.clicked = false;
            packetSphere.application = "Voice call";
            packetSphere.text1 = "Your voice calls could have";
            packetSphere.text2 = "broken audio due to dropped";
            packetSphere.text3 = "or delayed delivery.";
            packetSphere.text4 = " ";

            var radius = 5;
            var anim = animManager.moveTopDownPlacedPackets(packetSphere, radius, greenPath);
            var animatable = scene.beginAnimation(packetSphere, 0, 180, false, 1.5, function () {
                packetSphere.dispose();
            });

            var yellowSpawnPoint = new BABYLON.AnimationEvent(1, function () {
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
            var yellow = BABYLON.Curve3.CreateCubicBezier(new BABYLON.Vector3(102, 40, -898), new BABYLON.Vector3(100, 525, -444), new BABYLON.Vector3(100, 525, 444), new BABYLON.Vector3(102, 40, 898), 130);
            var yellowPath = yellow.getPoints();

            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 16, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -878);
            var packetMat = new BABYLON.StandardMaterial("packetMat", scene);

            packetMat.diffuseColor = new BABYLON.Color3.FromHexString("#A3A300");
            packetMat.emissiveColor = new BABYLON.Color3.FromHexString("#fff200");
            packetSphere.material = packetMat;

            packetSphere.clicked = false;
            packetSphere.application = "Software update";
            packetSphere.text1 = "Bulky software updates could";
            packetSphere.text2 = "saturate your connection, ";
            packetSphere.text3 = "using up all the capacity.";
            packetSphere.text4 = "";

            var radius = 5;
            var anim = animManager.moveTopDownPlacedPackets(packetSphere, radius, yellowPath);
            var animatable = scene.beginAnimation(packetSphere, 0, 180, false, 1, function () {
                packetSphere.dispose();
            });

            var redSpawnPoint = new BABYLON.AnimationEvent(1, function () {
                this.createRedPacket();
            }.bind(this));
            anim.addEvent(redSpawnPoint);

            var yellowPausePoint = new BABYLON.AnimationEvent(100, function () {
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
            var red = BABYLON.Curve3.CreateCubicBezier(new BABYLON.Vector3(102, 40, -898), new BABYLON.Vector3(60, 500, -444), new BABYLON.Vector3(60, 500, 444), new BABYLON.Vector3(102, 40, 898), 130);
            var redPath = red.getPoints();

            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 16, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -888);
            var packetMat = new BABYLON.StandardMaterial("packetMat", scene);

            packetMat.diffuseColor = new BABYLON.Color3.FromHexString("#99000B");
            packetMat.emissiveColor = new BABYLON.Color3.FromHexString("#ed1c24");
            packetSphere.material = packetMat;

            packetSphere.clicked = false;
            packetSphere.application = "Streaming music";
            packetSphere.text1 = "Recreational listening to";
            packetSphere.text2 = "music could be impeding";
            packetSphere.text3 = "your business-critical activites.";
            packetSphere.text4 = " ";

            var radius = 5;
            var anim = animManager.moveTopDownPlacedPackets(packetSphere, radius, redPath);
            var animatable = scene.beginAnimation(packetSphere, 0, 180, false, 0.8, function () {
                packetSphere.dispose();
            });

            var redPausePoint = new BABYLON.AnimationEvent(100, function () {
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
        destroyPacketUI() {
            this.packetUIWithLinks.forEach(function (element) {
                element.linkWithMesh(null);
                element.dispose();
                element = null;
                this.packetUIWithLinks = [];
            }.bind(this));
            this.packetUIWithoutLinks.forEach(function (elementArray) {
                elementArray.forEach(function (element) {
                    element.dispose();
                });
                elementArray = null;
                this.packetUIWithoutLinks = [];
            }.bind(this));
            this.placedPackets.forEach(function (packet) {
                packet.clicked = false;
            });
        }
    },
    // "Wipeout Mimic" mode is the close-up view of packet lanes in Mimic mode. Lanes for the spheres to follow are
    // created, and the initial sphere is cloned to improve performance. Then, packets are animated along the lanes
    // and the camera is animated around the scene. "Placed" packets are then created to be interacted with.
    // Most code is repeated throughout modes, and should be placed in parent BaseMode.
    PrioritizationWipeoutMimicMode: class extends BaseMode {
        constructor() {
            super();
            this.packets = jsonHandler.resources[2].json.packets;
            this.spawnerEnabled = true;
            this.clones = [];
            this.cloneAnims = [];
            this.placedPackets = [];
        }
        setUp() {
            if (debugMode) {
                console.log("- Reached Wipeout Mimic Mode");
            }
            var laneCount = 6;
            this.pathPointCount = 50;
            var lanes = [];

            for (var i = 0; i < laneCount; i++) {
                var origin = new BABYLON.Vector3(102, 20, -885);
                var p1 = new BABYLON.Vector3(100 + (i * 20), 500, -285);
                var p2 = new BABYLON.Vector3(100 + (i * 20), 500, 285);
                var destination = new BABYLON.Vector3(102, 20, 885);
                var bezierVector = BABYLON.Curve3.CreateCubicBezier(origin, p1, p2, destination, this.pathPointCount);
                var path = bezierVector.getPoints();

                //TODO: Improve this to make it more extendable. Currently hard coded.
                if (i < 3) {
                    path.laneType = "green";
                    lanes.push(path);
                }
                else if (i >= 3 && i < 5) {
                    path.laneType = "yellow";
                    lanes.push(path);
                }
                else if (i === 5) {
                    path.laneType = "red";
                    lanes.push(path);
                }

                this.babylonObjects.push(origin, p1, p2, destination, bezierVector, path);
            }
            this.iteratePackets(lanes);

            loadingScreen.displayLoadingUI();

            this.moveCamera();
            uIHandler.hideActiveIcon();
            uIHandler.showActiveIcon();


            this.babylonObjects.push(lanes);
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

                this.clones.push(packetClone);
                this.cloneAnims.push(animatable);
                this.babylonObjects.push(packetClone, packetMat);
        }
        moveCamera() {
            var wipeoutCam = new BABYLON.TargetCamera("arcCam", new BABYLON.Vector3(102, 40, -888), scene);
            scene.activeCamera = wipeoutCam;

            var height = 25;
            var movementAnim = animManager.moveWipeoutCamera(wipeoutCam, height);
            var movementAnimatable = scene.beginAnimation(wipeoutCam, 0, 140, false);

            this.pointCamera(wipeoutCam, movementAnim, movementAnimatable);

            this.babylonObjects.push(wipeoutCam, movementAnim, movementAnimatable);

        }
        pointCamera(cam, movementAnim, movementAnimatable) {
            var origin = new BABYLON.Vector3(102, 40, -888);
            var p1 = new BABYLON.Vector3(140, 300, -485);
            var p2 = new BABYLON.Vector3(140, 300, 485);
            var destination = new BABYLON.Vector3(102, 40, 888);
            var bezierVector = BABYLON.Curve3.CreateCubicBezier(origin, p1, p2, destination, 90);
            var path = bezierVector.getPoints();

            var dummy = new BABYLON.Mesh.CreateBox("box", 2, scene);
            var dummyMat = new BABYLON.StandardMaterial("dummyMat", scene);
            dummyMat.diffuseTexture = new BABYLON.Texture("img/blank.png", scene);
            dummyMat.diffuseTexture.hasAlpha = true;
            dummyMat.alpha = 0;
            dummy.material = dummyMat;

            var anim = animManager.pointWipeoutCamera(dummy, path);
            var animatable = scene.beginAnimation(dummy, 0, path.length, false);

            scene.onBeforeRenderObservable.add(function () {
                cam.setTarget(dummy.position);
            });
            this.allAnims.push(movementAnimatable, animatable);

            var placedPacketSpawnPoint = new BABYLON.AnimationEvent(50, function () {
                this.createGreenPacket();
            }.bind(this));
            movementAnim.addEvent(placedPacketSpawnPoint);

            var fadeOutPoint = new BABYLON.AnimationEvent(100, function () {
                this.clones.forEach(function (clone) {
                    var anim = animManager.fadePackets(clone, 1, 0.1);
                    scene.beginDirectAnimation(clone, [anim], 0, 25, false);
                }.bind(this));
            }.bind(this));
            movementAnim.addEvent(fadeOutPoint);

            var wipeoutPausePoint = new BABYLON.AnimationEvent(130, function () {
                this.cloneAnims.forEach(function (animatable) {
                    animatable.pause();
                }.bind(this));
                this.allAnims.forEach(function (animatable) {
                    animatable.pause();
                }.bind(this));

                var border = infoHandler.showInfo("prioritizationMimicWipeoutView");
                if (typeof border !== "undefined") {
                    if (border.classList.contains("borderPointer")) {
                        border.classList.remove("borderPointer");
                    }
                }

                var mimic = document.querySelector("#mimic");
                mimic.style.background = "url('img/ui/mimic-full.png') no-repeat 100% 0";
                mimic.style.backgroundSize = "400%";
                uIHandler.removeMimicPointer();
                uIHandler.showMimicPointer();

                var setMode = function () {
                    this.destroyPacketUI();
                    infoHandler.hideInfo();
                    loadingScreen.displayLoadingUI();
                    setTimeout(function () {
                        stateManager.changeMode("prioritization", "topDownNormal");

                        var mimic = document.querySelector("#mimic");
                        mimic.style.background = "url('img/ui/mimic-off.png') no-repeat 0 0";
                        mimic.style.backgroundSize = "100%";
                        inputHandler.removeDOMListener(mimic, "click", setMode);
                    }, 4500);
                }.bind(this);

                inputHandler.attachDOMListener(mimic, setMode);

            }.bind(this));
            movementAnim.addEvent(wipeoutPausePoint);

            this.babylonObjects.push(origin, p1, p2, destination, bezierVector, path, dummy, dummyMat, anim, animatable)
        }

        createGreenPacket() {
            var green = BABYLON.Curve3.CreateCubicBezier(new BABYLON.Vector3(102, 40, -898), new BABYLON.Vector3(100, 550, -444), new BABYLON.Vector3(100, 550, 444), new BABYLON.Vector3(102, 40, 898), 130);
            var greenPath = green.getPoints();

            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 16, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -888);
            var packetMat = new BABYLON.StandardMaterial("packetMat", scene);

            packetMat.diffuseColor = new BABYLON.Color3.FromHexString("#00A32E");
            packetMat.emissiveColor = new BABYLON.Color3.FromHexString("#22b14c");
            packetSphere.material = packetMat;

            packetSphere.clicked = false;
            packetSphere.application = "Voice call";
            packetSphere.text1 = "Your voice call audio is clear";
            packetSphere.text2 = "and reliable, as it is ";
            packetSphere.text3 = "guaranteed bandwidth and ";
            packetSphere.text4 = "priority delivery";

            var radius = 5;
            var anim = animManager.moveTopDownMimicPlacedPackets(packetSphere, radius, greenPath);
            var animatable = scene.beginAnimation(packetSphere, 0, 180, false, 1.5, function () {
                packetSphere.dispose();
            });

            var yellowSpawnPoint = new BABYLON.AnimationEvent(1, function () {
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
            var yellow = BABYLON.Curve3.CreateCubicBezier(new BABYLON.Vector3(102, 40, -898), new BABYLON.Vector3(140, 525, -444), new BABYLON.Vector3(140, 525, 444), new BABYLON.Vector3(102, 40, 898), 130);
            var yellowPath = yellow.getPoints();

            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 16, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -878);
            var packetMat = new BABYLON.StandardMaterial("packetMat", scene);

            packetMat.diffuseColor = new BABYLON.Color3.FromHexString("#A3A300");
            packetMat.emissiveColor = new BABYLON.Color3.FromHexString("#fff200");
            packetSphere.material = packetMat;

            packetSphere.clicked = false;
            packetSphere.application = "Software update";
            packetSphere.text1 = "Your software updates get ";
            packetSphere.text2 = "lower priority for bandwidth,";
            packetSphere.text3 = "so they can come down in ";
            packetSphere.text4 = "the background.";

            var radius = 5;
            var anim = animManager.moveTopDownMimicPlacedPackets(packetSphere, radius, yellowPath);
            var animatable = scene.beginAnimation(packetSphere, 0, 180, false, 1, function () {
                packetSphere.dispose();
            });

            var redSpawnPoint = new BABYLON.AnimationEvent(1, function () {
                this.createRedPacket();
            }.bind(this));
            anim.addEvent(redSpawnPoint);

            var yellowPausePoint = new BABYLON.AnimationEvent(100, function () {
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
            var red = BABYLON.Curve3.CreateCubicBezier(new BABYLON.Vector3(102, 40, -898), new BABYLON.Vector3(180, 500, -444), new BABYLON.Vector3(180, 500, 444), new BABYLON.Vector3(102, 40, 898), 130);
            var redPath = red.getPoints();

            var packetSphere = new BABYLON.Mesh.CreateSphere("packet", 6, 16, scene);
            packetSphere.position = new BABYLON.Vector3(102, 15, -888);
            var packetMat = new BABYLON.StandardMaterial("packetMat", scene);

            packetMat.diffuseColor = new BABYLON.Color3.FromHexString("#99000B");
            packetMat.emissiveColor = new BABYLON.Color3.FromHexString("#ed1c24");
            packetSphere.material = packetMat;

            packetSphere.clicked = false;
            packetSphere.application = "Streaming music";
            packetSphere.text1 = "If there is a shortage of";
            packetSphere.text2 = "bandwidth, recreational music";
            packetSphere.text3 = "is moved aside to make way";
            packetSphere.text4 = "for critical things.";

            var radius = 5;
            var anim = animManager.moveTopDownMimicPlacedPackets(packetSphere, radius, redPath);
            var animatable = scene.beginAnimation(packetSphere, 0, 180, false, 0.8, function () {
                packetSphere.dispose();
            });

            var redPausePoint = new BABYLON.AnimationEvent(100, function () {
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
        destroyPacketUI() {
            this.packetUIWithLinks.forEach(function (element) {
                element.linkWithMesh(null);
                element.dispose();
                element = null;
                this.packetUIWithLinks = [];
            }.bind(this));
            this.packetUIWithoutLinks.forEach(function (elementArray) {
                elementArray.forEach(function (element) {
                    element.dispose();
                });
                elementArray = null;
                this.packetUIWithoutLinks = [];
            }.bind(this));
            this.placedPackets.forEach(function (packet) {
                packet.clicked = false;
            });
        }

    }
};
// InfoHandler retrieves text JSON based off of a string parameter, creates the boarder image
// plays a sound and for the overview scenario, attaches a listener to close the info box.
// Other classes handle the closing of the info box themselves, by calling hideInfo() here.
class InfoHandler {
    constructor() {
        this.infoIsShown = false;
    }
    showInfo(info) {
        var border = this.showBorder(this, info);
        return border;
    }
    showBorder(self, info) {
        if (!this.infoIsShown) {
            var openingSound = new BABYLON.Sound("Music", "sfx/LV-HTIS Buttons 26.wav", scene, null, { loop: false, autoplay: true, volume: 0.2 });
            var popup = document.querySelector("#textPopup");
            var border = new Image();
            border.onload = function () {
                border.id = "border";
                var w = (window.innerWidth / 2) - (border.width / 2);
                border.style.bottom = "10%";
                border.style.left = w + "px";
                self.showText(info, border);

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
    showText(spawnPoint, border) {
        var infoData = jsonHandler.resources[3].json;
        var textContainerDiv = document.createElement("div");
        textContainerDiv.id = "textContainerDiv";
        var w = (window.innerWidth / 2) - (border.width / 2);
        textContainerDiv.style.bottom = "12%";
        textContainerDiv.style.left = w + "px";
        textContainerDiv.style.width = border.width + "px";
        textContainerDiv.style.height = border.height + "px";

        var textDiv = document.createElement("div");
        textDiv.id = "textDiv";

        textDiv.textContent= infoData[spawnPoint].text;

        var continueText = document.createElement("div");
        continueText.id = "continueText";

        continueText.textContent = infoData[spawnPoint].continueText;

        var popup = document.querySelector("#textPopup");
        popup.appendChild(textContainerDiv);
        textContainerDiv.appendChild(textDiv);
        textContainerDiv.appendChild(continueText);

        var textElements = [];
        textElements.push(textContainerDiv, textDiv, continueText);

    }
    hideOverviewInfo(self) {
        var border = document.querySelector("#border");
        var textContainterDiv = document.querySelector("#textContainerDiv");
        var textDiv = document.querySelector("#textDiv");

        if (border !== null) {
            var closingSound = new BABYLON.Sound("Music", "sfx/LV-HTIS Buttons 31.wav", scene, null, { loop: false, autoplay: true, volume: 0.2 });
            border.parentNode.removeChild(border);
            textDiv.parentNode.removeChild(textDiv);
            textContainterDiv.parentNode.removeChild(textContainterDiv);

            border = null;
            textDiv = null;
            textContainterDiv = null;
            self.infoIsShown = false;

        }
    }
    hideInfo() {
        var border = document.querySelector("#border");
        var textContainterDiv = document.querySelector("#textContainerDiv");
        var textDiv = document.querySelector("#textDiv");

        if (border !== null) {
            var closingSound = new BABYLON.Sound("Music", "sfx/LV-HTIS Buttons 31.wav", scene, null, { loop: false, autoplay: true, volume: 0.2 });
            border.parentNode.removeChild(border);
            textDiv.parentNode.removeChild(textDiv);
            textContainterDiv.parentNode.removeChild(textContainterDiv);

            border = null;
            textDiv = null;
            textContainterDiv = null;
            this.infoIsShown = false;

        }
    }
}
// InputHandler attaches the listeners to the individual objects, with their associated methods.
// Likely unneeded abstraction.
class InputHandler {
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
    attachDOMHoverListener(obj, methodName) {
        obj.addEventListener('mouseenter', methodName);
    }
    attachDOMHoverOutListener(obj, methodName) {
        obj.addEventListener('mouseleave', methodName);
    }
    removeDOMListener(obj, type, methodName){
        obj.removeEventListener(type, methodName);
    }
}
// UIHandler is used to attach the coded functionality to the HTML buttons, icons and other
// various objects.
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
        var mimic = document.querySelector("#mimic");
        this.hover = function () {
            mimic.style.backgroundPosition = "33.33% 0";
        };
        this.hoverOut = function () {
            mimic.style.backgroundPosition = "0 0";
        };

        var setOverviewState = function () {
            mimic.style.background = "url('img/ui/mimic-off.png') no-repeat 0 0";
            mimic.style.backgroundSize = "100%";
            inputHandler.removeDOMListener(mimic, "mouseenter", this.hover);
            inputHandler.removeDOMListener(mimic, "mouseleave", this.hoverOut);

            stateManager.changeScenario("overview");
        }.bind(this);

        var home = document.querySelector("#home");
        inputHandler.attachDOMListener(home, setOverviewState);

        var setPrioritizationState = function () {
            mimic.style.background = "url('img/ui/mimic-off.png') no-repeat 0 0";
            mimic.style.backgroundSize = "100%";
            inputHandler.removeDOMListener(mimic, "mouseenter", this.hover);
            inputHandler.removeDOMListener(mimic, "mouseleave", this.hoverOut);

            stateManager.changeScenario("prioritization");
        }.bind(this);

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

        var chart = document.querySelector(".chart");
        inputHandler.attachDOMListener(chart, this.showDashboard);

        var dashboard = document.querySelector("#dashboard");
        inputHandler.attachDOMListener(dashboard, this.hideDashboard)

    }
    showMimicPointer() {
        var mimic = document.querySelector("#mimic");
        if (typeof mimic !== "undefined") {
            if (!mimic.classList.contains("mimicPointer")) {
                mimic.classList.add("mimicPointer");
            }
        }
    }
    removeMimicPointer() {
        var mimic = document.querySelector("#mimic");
        if (typeof mimic !== "undefined") {
            if (mimic.classList.contains("mimicPointer")) {
                mimic.classList.remove("mimicPointer");
            }
        }
    }
    showActiveIcon() {
        var container = document.querySelector("#wirelessIcon");
        container.style.display = "block";

        var iconDiv = document.querySelector(".wirelessContainer");
        var textDiv = document.createElement("div");
        iconDiv.appendChild(textDiv);

        textDiv.textContent = "MiMiC Active";
        textDiv.id = "iconText";
    }

    hideActiveIcon() {
        var container = document.querySelector("#wirelessIcon");
        container.style.display = "none";

        var textDiv = document.querySelector("#iconText");
        if (typeof textDiv !== "undefined" && textDiv !== null){
            textDiv.parentNode.removeChild(textDiv);
        }
    }
    showDashboard() {
        var container = document.querySelector("#dashboard");
        if (!container.classList.contains("dashboardAnim")){
            container.classList.add("dashboardAnim");
            container.style.display = "block";
        }
    }
    hideDashboard() {
        var container = document.querySelector("#dashboard");
        container.style.display = "none";
        container.classList.remove("dashboardAnim");
    }
}

var debugMode = false;

// Start the application
document.addEventListener('DOMContentLoaded', function () {
    loadingScreen = new LoadingScreen();
    if (BABYLON.Engine.isSupported){
        canvas = document.getElementById("renderCanvas");
        engine = new BABYLON.Engine(canvas, true);
        engine.loadingScreen = loadingScreen;

        animManager = new AnimationManager();
        inputHandler = new InputHandler();
        uIHandler = new UIHandler();
        jsonHandler = new JsonHandler();
        jsonHandler.setUp();
        infoHandler = new InfoHandler();
        stateManager = new StateManager();
    }
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});
