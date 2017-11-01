const OVERVIEW_STATE = 0;
const PRIORITIZATION_STATE = 1;
const RESILIENCE_STATE = 2;
const AGGREGATION_STATE = 3;
var canvas, engine, scene, camera;
var stateManager;
var inputHandler;
var uIHandler;

class StateManager {
    constructor(){
        this.currentState = "";
        var stage = new Stage();
        this.selectState(OVERVIEW_STATE);
    }
    selectState(stateID){
        if (typeof this.currentState === 'object') {
            this.currentState.tearDown();
        }

        switch (stateID) {
            case OVERVIEW_STATE:
                this.currentState = new OverviewScenario(this);
                break;
            case PRIORITIZATION_STATE:
                this.currentState = new PrioritizationScenario(this);
                break;
        }
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
class OverviewScenario {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.babylonObjects = [];
        this.setUp();
    }
    setUp() {
        // Anytime anything is created, push to this.babylonObjects.
        var self = this;
        var selectState = function () {
            self.stateManager.selectState(PRIORITIZATION_STATE);
        };
        var prioritizationButton = uIHandler.createButton("Prioritization Scenario", selectState);
        this.babylonObjects.push(prioritizationButton);
    }
    tearDown() {
        // Iterate through this.babylonObjects and .dispose() of them.
        for (var i = this.babylonObjects.length - 1; i >= 0; i--){
            var objectToRemove = this.babylonObjects.splice(i, 1);
            objectToRemove[0].dispose();
            objectToRemove[0] = null;
        }
        console.log(this.babylonObjects);
        console.log(objectToRemove[0])
    }
    setDefaultMode() {
        // Default behavior of things in setUp.
    }
    setMimicMode() {

    }
}
class PrioritizationScenario {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.babylonObjects = [];
        this.setUp();
    }
    setUp() {
        // Anytime anything is created, push to this.babylonObjects.
        var self = this;
        var selectState = function () {
            self.stateManager.selectState(OVERVIEW_STATE);
        };
        var overviewButton = uIHandler.createButton("Overview Scenario", selectState);
        this.babylonObjects.push(overviewButton);
    }
    tearDown() {
        // Iterate through this.babylonObjects and .dispose() of them.
        for (var i = this.babylonObjects.length - 1; i >= 0; i--){
            var objectToRemove = this.babylonObjects.splice(i, 1);
            objectToRemove[0].dispose();
            objectToRemove[0] = null;
        }
        console.log(this.babylonObjects);
        console.log(objectToRemove[0])
    }
    setTopdownDefaultMode() {
        // Default behavior of things in setUp.
    }
    setTopdownMimicMode() {

    }
    setWipeoutDefaultMode() {

    }
    setWipeoutMimicMode() {

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
        stateManager = new StateManager();

    }
});