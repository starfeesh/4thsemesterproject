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
class StateManager {
    setUp() {
        this.currentState = "";
        var stage = new Stage();
        this.stateLookup = jsonHandler.getLookup();
        var startingState = this.stateLookup.states[0].className;
        this.selectState(startingState);
    }
    selectState(stateID){
        if (typeof this.currentState === 'object') {
            this.currentState.tearDown();
        }
        // If I am being called as a mode, iterate through my parent which is a scenario.
        // If I am being called as a scenario, iterate through top level scenarios.
        //if (this.isScenario) {
        //
        //}
        var currentClass;
        for (var i = 0; i > this.stateLookup.states.length; i++) {
            // Figure out how to get currentState to be scenario.
            this.currentState = this.stateLookup.states[i].className[stateID];
        }

        this.currentState.setUp();
        /*switch (stateID) {
            case OVERVIEW_STATE:
                this.currentState = new OverviewScenario(this);
                break;
            case PRIORITIZATION_STATE:
                this.currentState = new PrioritizationScenario(this);
                break;
        }*/
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

        engine.runRenderLoop(function () {
            scene.render();
            light.position = camera.position;
            //this.globeCamera.alpha += this.globeSpeed;
            // console.log(this.globeCamera.alpha)
        }.bind(this))
    }
}
class BaseScenario extends StateManager {
    baseSetUp() {
        // Anytime anything is created, push to this.babylonObjects.
        this.babylonObjects = [];
        //var self = this;
        //var selectState = function () {
        //    self.selectState(PRIORITIZATION_STATE);
        //};
    }
    baseTearDown() {
        // Iterate through this.babylonObjects and .dispose() of them.
        for (var i = this.babylonObjects.length - 1; i >= 0; i--){
            var objectToRemove = this.babylonObjects.splice(i, 1);
            objectToRemove[0].dispose();
            objectToRemove[0] = null;
        }
    }
}
class OverviewScenario extends BaseScenario {
    constructor() {
        super();
        //this.baseScenario = super;
        this.isScenario = true;
    }
    setUp() {
        this.baseScenario.baseSetUp();
        var prioritizationButton = uIHandler.createButton("Prioritization Scenario", this.selectState);
        this.babylonObjects.push(prioritizationButton);
    }
    tearDown() {
        this.baseScenario.baseTearDown();
    }
}
class PrioritizationScenario extends BaseScenario {
    constructor() {
        //this.baseScenario = super;
        this.isScenario = true;
    }
    setUp() {
        var overviewButton = uIHandler.createButton("Overview Scenario", this.selectState);
        this.babylonObjects.push(overviewButton);
    }
    tearDown() {
    }
    showDashboard() {

    }
    hideDashboard() {

    }
}

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