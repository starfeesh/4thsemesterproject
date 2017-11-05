var canvas, engine, scene, camera;
var stateManager;
var inputHandler;
var uIHandler;
var jsonHandler;
class JsonHandler {
    loadStateJson(callback){
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', 'data/states.json', true);
        xobj.onreadystatechange = function () {
            if (xobj.readyState === 4 && xobj.status == "200") {
                callback(xobj.responseText);
            }
        }.bind(this);
        xobj.send(null);
    }
    callLoad() {
        this.loadStateJson(function (response) {
            this.setLookup(JSON.parse(response));
            stateManager.setUp();
        }.bind(this));
    }
    setLookup(json) {
        this.stateLookup = json;
    }
    getLookup() {
        return this.stateLookup;
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
        this.stateLookup = jsonHandler.getLookup();

        this.changeScenario("overview");
    }
    changeScenario(newScenario){
        if (typeof this.currentScenario === 'object') {
            this.currentScenario.tearDown();
        }

        var newScenarioClassName = this.stateLookup.scenarios[newScenario].className;

        this.currentScenario = new ObjectFactory(newScenarioClassName, null);
        this.currentScenario.setUp();
    }
    changeMode(currentScenario, newMode) {
        if (typeof this.currentMode === 'object') {
            this.currentMode.tearDown();
        }
        var newModeClassName = this.stateLookup.scenarios[currentScenario].modes[newMode].className;

        this.currentMode = new ObjectFactory(newModeClassName, null);
        this.currentMode.setUp();
    }
}
class Stage {
    constructor() {
        scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        camera = new BABYLON.ArcRotateCamera("globeCamera", 0,0,0, BABYLON.Vector3.Zero(), scene);
        camera.setPosition(new BABYLON.Vector3(-100, 100, -100));
        camera.attachControl(canvas, true);
        var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.5;

        uIHandler.createUIBase();
        uIHandler.createUIElements();
        this.createSkybox();

        engine.runRenderLoop(function () {
            scene.render();
            light.position = camera.position;
            //this.globeCamera.alpha += this.globeSpeed;
            // console.log(this.globeCamera.alpha)
        }.bind(this))
    }
    createSkybox() {

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
            objectToRemove[0].dispose();
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
            }.bind(this);

            loader.load();
        }
    },
    PrioritizationScenario: class extends BaseScenario {
        constructor() {
            super();
        }
        setUp() {
            console.log("Reached Prioritization Scenario")
        }
        showDashboard() {

        }
        hideDashboard() {

        }
    }
};

class InputHandler {
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
        this.uiContainer = new BABYLON.GUI.Rectangle();
        this.uiContainer.width = "14%";
        this.uiContainer.height = "114px";
        this.uiContainer.thickness = 1;
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
        prioritizationContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        var prioritization = new BABYLON.GUI.Button.CreateImageOnlyButton("homeButton", "img/ui/prioritization.png");
        prioritization.thickness = 0;
        inputHandler.attachUIListener(prioritization, setPrioritizationState);
        prioritizationContainer.addControl(prioritization);



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


document.addEventListener('DOMContentLoaded', function () {
    if (BABYLON.Engine.isSupported){
        canvas = document.getElementById("renderCanvas");
        engine = new BABYLON.Engine(canvas, true);
        inputHandler = new InputHandler();
        uIHandler = new UIHandler();
        jsonHandler = new JsonHandler();
        jsonHandler.callLoad();
        stateManager = new StateManager();
    }
});