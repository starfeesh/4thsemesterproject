var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true);
var baseScene;
var library = [];
document.addEventListener("DOMContentLoaded", function () {
    if (BABYLON.Engine.isSupported){
        var init = new Init();
    }
});
class Init {
    constructor() {
        var stateManager = new StateManager();
        stateManager.start();
    }
}
class StateManager {
    constructor() {
        this.currentState = new StartingState(this);
    }
    changeState(state) {
        this.currentState.tearDown();
        this.currentState = state;
        this.currentState.go();
    }
    start() {
        this.currentState.go();
    }
}
class RuntimeData {
    constructor() {
        this.currentState = {};
    }
    getState() {
        return this.currentState;
    }
    setState(newState) {
        this.currentState = newState;
    }
}
class StartingState {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }
    go() {
        this.setup();
        this.mainState = new MainState(this.stateManager, this.globeCamera);
        this.stateManager.changeState(this.mainState);
        runtimeData.setState(this.mainState);
    }
    tearDown() {
        if (baseScene !== null && typeof baseScene !== "undefined"){
            baseScene.dispose();

        }
    }
    setup() {
        baseScene = new BABYLON.Scene(engine);
        baseScene.clearColor = new BABYLON.Color3(0, 0, 0);
        var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), baseScene);
        light.intensity = 0.5;
        var loader = new BABYLON.AssetsManager(baseScene);
        var globe = loader.addMeshTask("globe", "", "models/", "globe7.babylon");
        var innerGlobe = loader.addMeshTask("outer", "", "models/", "inner.babylon");
        var highlight = new BABYLON.HighlightLayer("hl", baseScene);

        this.makeSkybox();
        this.globeCamera = new BABYLON.ArcRotateCamera("globeCamera", 0,0,0, BABYLON.Vector3.Zero(), baseScene);
        this.globeCamera.setPosition(new BABYLON.Vector3(-100, 100, -100));
        this.globeCamera.attachControl(canvas, true);

        globe.onSuccess = function (task) {
            library['globe'] = task.loadedMeshes[0];
            highlight.addMesh(library['globe'], new BABYLON.Color3.FromHexString("#315d28"));
            highlight.innerGlow = false;
            highlight.blurHorizontalSize = 3;
            highlight.blurVerticalSize = 3;
            library['globe'].backFaceCulling = false;
        }.bind(this);

        this.globeSpeed = 0.0005;

        loader.onFinish = function (tasks) {
            engine.runRenderLoop(function () {
                baseScene.render();
                light.position = this.globeCamera.position;
                //this.globeCamera.alpha += this.globeSpeed;
               // console.log(this.globeCamera.alpha)
            }.bind(this))
        }.bind(this);


        loader.load();
    }
    makeSkybox(){
        var mainSkybox = BABYLON.MeshBuilder.CreateBox("mainSkyBox", {size:1000.0}, baseScene);
        var mainSkyboxMat = new BABYLON.StandardMaterial("mainSkyBox", baseScene);
        mainSkyboxMat.backFaceCulling = false;
        mainSkyboxMat.reflectionTexture = new BABYLON.CubeTexture("img/skybox/skybox_blank", baseScene);
        mainSkyboxMat.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        mainSkyboxMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
        mainSkyboxMat.specularColor = new BABYLON.Color3(0, 0, 0);
        mainSkybox.material = mainSkyboxMat;
    }
}
class MainState {
    constructor(stateManager, globeCamera) {
        this.stateManager = stateManager;
        this.globeCamera = globeCamera;
    }
    go() {
        this.setup();

        var homeLink = document.querySelector(".home");
        homeLink.addEventListener("click", function () {
            this.tearDown();
            this.startingState = new StartingState(this.stateManager)
            runtimeData.setState(this.startingState);
            this.stateManager.changeState(this.startingState);
        }.bind(this));

        var aggregationLink = document.querySelector(".aggregation");
        aggregationLink.addEventListener("click", function () {
            this.rotate();
            this.tearDown();
            this.stateManager.changeState(new Aggregation(this.stateManager, this.globeCamera));
        }.bind(this));

        var mimicButton = document.querySelector(".mimic");
        mimicButton.addEventListener("click", function () {

        }.bind(this));
    }
    setup() {
        this.loadJson(function (data) {
            var json = JSON.parse(data);
            this.makeCityConnections(json);
        }.bind(this));
    }

    tearDown() {
        this.citiesCovered = [];
    }

    loadJson(callback) {
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', 'data/curves.json', true); // Replace 'my_data' with the path to your file
        xobj.onreadystatechange = function () {
            if (xobj.readyState === 4 && xobj.status == "200") {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                callback(xobj.responseText);
            }
        };
        xobj.send(null);
    }
    makeCityConnections(json) {
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

                        particleManager.cityParticles(path, bezierVector);
                        if (!this.citiesCovered.includes(origin.location)){
                            this.citiesCovered.push(origin.location);
                            this.makeCityTitles(json, origin.location);
                        }
                        if (!this.citiesCovered.includes(destination.location)){
                            this.citiesCovered.push(destination.location);
                            this.makeCityTitles(json, destination.location);
                        }
                }.bind(this));
        }.bind(this));


    }
    makeCityTitles(json, location) {
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

        // var textPlane = BABYLON.Mesh.CreatePlane("textPlane", 24, baseScene);
        // textPlane.scaling = new BABYLON.Vector3(1, 1, 0.2);
        // textPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        //
        // textPlane.backFaceCulling = false;
        // textPlane.position.x = cityCoordinates.x;
        // textPlane.position.y = cityCoordinates.y + 0.5;
        // textPlane.position.z = cityCoordinates.z;

        var dummySphere = new BABYLON.Mesh.CreateSphere("sphere", 10, 2, baseScene);
        dummySphere.position.x = cityCoordinates.x;
        dummySphere.position.y = cityCoordinates.y;
        dummySphere.position.z = cityCoordinates.z;

        //var advancedTextTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(textPlane, 512, 512);
        var advancedTextTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("ui");
        advancedTextTexture.idealHeight = 1080;
        advancedTextTexture.idealWidth = 1920;

        var text = new BABYLON.GUI.TextBlock();
        text.text = location;
        text.fontSize = 10;
        text.color = "#ffffff";
        text.fontFamily = "Century Gothic";
        text.fontStyle = "bold";
        advancedTextTexture.addControl(text);
        text.linkWithMesh(dummySphere);
    }
    fade() {
        BABYLON.Effect.ShadersStore["fadePixelShader"] =
            "precision highp float;" +
            "varying vec2 vUV;" +
            "uniform sampler2D textureSampler; " +
            "uniform float fadeLevel; " +
            "void main(void){" +
            "vec4 baseColor = texture2D(textureSampler, vUV) * fadeLevel;" +
            "baseColor.a = 1.0;" +
            "gl_FragColor = baseColor;" +
            "}";

        var fadeLevel = 1.0;
        var postProcess = new BABYLON.PostProcess("Fade", "fade", ["fadeLevel"], null, 1.0, this.globeCamera);
        postProcess.onApply = (effect) => {
            effect.setFloat("fadeLevel", fadeLevel);
        };

        var alpha = 1;
        baseScene.registerBeforeRender(function () {
            fadeLevel = alpha;

            alpha -= 0.01;
        });
    }
    rotate() {
        anim.rotateGlobe(this.globeCamera);
        this.globeSpeed = 0.05;
        var londonAlpha = 4.3;
        var globeHasRotated = false;

        if (!globeHasRotated) {
            if (Math.abs(londonAlpha - this.globeCamera.alpha % (2 * Math.PI)) < 0.5) {
                this.globeSpeed = 0;
                this.zoom();
                globeHasRotated = true;
            }
        }
    }
    zoom() {
        anim.zoomGlobe(this.globeCamera);
        var globeHasBeenZoomed = false;
        if (!globeHasBeenZoomed) {
            globeHasBeenZoomed = true;
        }
    }
}

class Aggregation {
    constructor(stateManager, globeCamera) {
        this.stateManager = stateManager;
        this.globeCamera = globeCamera;
    }
    go() {

    }
    setup() {

    }

}

window.addEventListener("click", function () {
    var clickResult = baseScene.pick(baseScene.pointerX, baseScene.pointerY);
    var input = new InputHandler();
    input.ClickAction(clickResult);

});
class InputHandler {
    ClickAction(clickResult){
        if (clickResult.hit){
            console.log("x " + clickResult.pickedPoint.x + ", y " + clickResult.pickedPoint.y + ", z "
                + clickResult.pickedPoint.z);
        }
    }
}
var runtimeData = new RuntimeData();
var particleManager = new ParticleManager();
var anim = new AnimationManager();
