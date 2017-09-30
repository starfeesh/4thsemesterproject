var scene, canvas, engine;
var library = {};
var globeCamera, laneCamera;
var tubePath;
document.addEventListener("DOMContentLoaded", function () {
    if (BABYLON.Engine.isSupported){
        var stage = new Stage();
        stage.Setup();
    }
});
window.addEventListener("click", function () {
    var clickResult = scene.pick(scene.pointerX, scene.pointerY);
    var input = new InputHandler();
    input.ClickAction(clickResult);
});
class Stage {
    LoadJson(callback){
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', 'data/locations.json', true); // Replace 'my_data' with the path to your file
        xobj.onreadystatechange = function () {
            if (xobj.readyState === 4 && xobj.status == "200") {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                callback(xobj.responseText);
            }
        };
        xobj.send(null);
    }
    Setup() {
        canvas = document.getElementById("renderCanvas");
        engine = new BABYLON.Engine(canvas, true);
        scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3(0.2, 0.2, 0.2);

        var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.5;
        var loader = new BABYLON.AssetsManager(scene);
        var globe = loader.addMeshTask("globe", "", "scenes/", "globe7.babylon");
        var innerGlobe = loader.addMeshTask("outer", "", "scenes/", "inner.babylon");
        var datacenter = loader.addMeshTask("dc", "", "scenes/", "datacenter.babylon");

        var highlight = new BABYLON.HighlightLayer("hl", scene);
        this.MakeCameras();
        this.MakeSkybox();
        this.MakeGUI();

        // Move the light with the camera
        scene.registerBeforeRender(function () {
            light.position = globeCamera.position;
        });
        globe.onSuccess = function (task) {
            library['globe'] = task.loadedMeshes[0];
            highlight.addMesh(library['globe'], new BABYLON.Color3.FromHexString("#315d28"));
            highlight.innerGlow = false;
            highlight.blurHorizontalSize = 1;
            highlight.blurVerticalSize = 1;

            this.LoadJson(function (response) {
                var json = JSON.parse(response);
                this.MakeCityConnections(json);
            }.bind(this));
        }.bind(this);

        datacenter.onSuccess = function (task) {
            library['dc'] = task.loadedMeshes[0];
            library['dc'].position = new BABYLON.Vector3(500, 990, -55);
            library['dc'].rotation.z = -50;
            library['dc'].scaling = new BABYLON.Vector3(30, 40, 30);

            var DCMat = new BABYLON.StandardMaterial("texture", scene);
            DCMat.useAlphaFromDiffuseTexture = false;
            DCMat.diffuseTexture = new BABYLON.Texture("img/datacenter.png", scene);
            DCMat.diffuseTexture.hasAlpha = true;
            DCMat.diffuseTexture.uScale = 1;
            DCMat.diffuseTexture.vScale = 1;

            library['dc'].material = DCMat;
        };

        this.particle = new ParticleManager();

        this.MakeLaneConnections();

        this.anim = new AnimationManager();

        loader.onFinish = function (tasks) {
            engine.runRenderLoop(function () {
                scene.render();
                this.anim.Update();
                globeCamera.alpha += 0.0005;
            }.bind(this))
        }.bind(this);

        loader.load();
        return scene;
    }
    MakeCameras(){
        globeCamera = new BABYLON.ArcRotateCamera("globeCamera", 0,0,0, BABYLON.Vector3.Zero(), scene);
        globeCamera.setPosition(new BABYLON.Vector3(-100, 100, -100));
        globeCamera.attachControl(canvas, true);

        globeCamera.keysUp = [87]; // W
        globeCamera.keysDown = [83]; // A
        globeCamera.keysLeft = [65]; // S
        globeCamera.keysRight = [68]; // D

        laneCamera = new BABYLON.FollowCamera("followcam", new BABYLON.Vector3(-500, 1000, 7.5), scene);
       // laneCamera.setPosition(new BABYLON.Vector3(0, 0, 0));
        laneCamera.attachControl(canvas, true);

        laneCamera.radius = 5; // how far from the object to follow
        laneCamera.heightOffset = 8; // how high above the object to place the camera
        //laneCamera.rotationOffset = 180; // the viewing angle
        laneCamera.cameraAcceleration = 0.01 // how fast to move
        laneCamera.maxCameraSpeed = 20 // speed limit


    }
    MakeSkybox(){
        var mainSkybox = BABYLON.MeshBuilder.CreateBox("mainSkyBox", {size:1000.0}, scene);
        var mainSkyboxMat = new BABYLON.StandardMaterial("mainSkyBox", scene);
        mainSkyboxMat.backFaceCulling = false;
        mainSkyboxMat.reflectionTexture = new BABYLON.CubeTexture("img/skybox/skybox_blank", scene);
        mainSkyboxMat.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        mainSkyboxMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
        mainSkyboxMat.specularColor = new BABYLON.Color3(0, 0, 0);
        mainSkybox.material = mainSkyboxMat;

        var upperSkybox = BABYLON.MeshBuilder.CreateBox("upperSkybox", {size:1400.0}, scene);
        upperSkybox.position = new BABYLON.Vector3(0,1000,0);
        var upperSkyboxMat = new BABYLON.StandardMaterial("upperSkybox", scene);
        upperSkyboxMat.backFaceCulling = false;
        upperSkyboxMat.reflectionTexture = new BABYLON.CubeTexture("img/skybox/skybox_blank", scene);
        upperSkyboxMat.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        upperSkyboxMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
        upperSkyboxMat.specularColor = new BABYLON.Color3(0, 0, 0);
        upperSkybox.material = upperSkyboxMat;
    }
    MakeCityConnections(json) {
        this.citiesTouched = [];

        for (var i = 0; i < json.origin.length; i++) {
            var origin = new BABYLON.Vector3(json.origin[i].coordinates.x,json.origin[i].coordinates.y,json.origin[i].coordinates.z);
            var p1 = new BABYLON.Vector3(json.p1[i].x, json.p1[i].y, json.p1[i].z);
            var p2 = new BABYLON.Vector3(json.p2[i].x, json.p2[i].y, json.p2[i].z);
            var destination = new BABYLON.Vector3(json.destination[i].coordinates.x, json.destination[i].coordinates.y, json.destination[i].coordinates.z);

            var bezierVector = BABYLON.Curve3.CreateCubicBezier(
                origin,
                p1,
                p2,
                destination, 100);
            var path = bezierVector.getPoints();

            //var curve = BABYLON.Mesh.CreateLines("bezier", path, scene);
            //curve.color = new BABYLON.Color3(0,0.93,0.90);
/*

            var tube = BABYLON.MeshBuilder.CreateTube("tube", {path: path, sideOrientation: BABYLON.Mesh.DOUBLESIDE, updatable: true}, scene);
            tube = BABYLON.MeshBuilder.CreateTube("tube", {path: path, radius: 0.1, instance: tube} );
            var tubeMaterial = new BABYLON.StandardMaterial("tubeMat", scene);
            tubeMaterial.diffuseColor = new BABYLON.Color4(0, 0.93, 0.90, 1);
            tubeMaterial.alpha = 0.5;
            tubeMaterial.backFaceCulling = false;
            tube.material = tubeMaterial;

            var highlight = new BABYLON.HighlightLayer("hl", scene);
            highlight.addMesh(tube, new BABYLON.Color4(0, 0.93, 0.90, 1));
            highlight.blurHorizontalSize = 1;
            highlight.blurVerticalSize = 1;
*/

            this.particle.CityParticles(path);

            var originName = json.origin[i].location;
            var destinationName = json.destination[i].location;

            if (!this.citiesTouched.includes(originName)) {
                this.citiesTouched.push(originName);
                this.MakeTags(json, originName);
            }
            if (!this.citiesTouched.includes(destinationName)) {
                this.citiesTouched.push(destinationName);
                this.MakeTags(json, destinationName);
            }
        }

       //this.showWorldAxis(100);
    }

    MakeLaneConnections() {
        var laneCount = 2;

        for (let i = 0; i < laneCount; i++){
            var origin = new BABYLON.Vector3(-500, 1000, 50 * i * 0.1);
            var p1 = new BABYLON.Vector3(-250, 1200, 50 * i * 0.1);
            var p2 = new BABYLON.Vector3(250, 1200, 50 * i * 0.1);
            var destination = new BABYLON.Vector3(500, 1000, 50 * i * 0.1);

            var bezierVector = BABYLON.Curve3.CreateCubicBezier(
                origin,
                p1,
                p2,
                destination, 50);
            var path = bezierVector.getPoints();

            //var line = BABYLON.Mesh.CreateLines("lines", path, scene);
            //line.color = new BABYLON.Color3(0,0.93,0.90);

            this.particle.AllowedLaneParticles(path);
        }

        var tubeOrigin = new BABYLON.Vector3(-500, 1000, 7.5);
        var tubeP1 = new BABYLON.Vector3(-250, 1200,7.5);
        var tubeP2 = new BABYLON.Vector3(250, 1200,7.5);
        var tubeDestination = new BABYLON.Vector3(500, 1000,7.5);

        var tubeBezierVector = BABYLON.Curve3.CreateCubicBezier(
            tubeOrigin,
            tubeP1,
            tubeP2,
            tubeDestination, 100);
        tubePath = tubeBezierVector.getPoints();

        var tube = BABYLON.MeshBuilder.CreateTube("tube", {path: tubePath, sideOrientation: BABYLON.Mesh.DOUBLESIDE, updatable: true}, scene);
        tube = BABYLON.MeshBuilder.CreateTube("tube", {path: tubePath, radius: 24, instance: tube} );

        var tubeMaterial = new BABYLON.StandardMaterial("tubeMat", scene);
        // tubeMaterial.emissiveTexture = new BABYLON.Texture("img/rings.png", scene);
        // tubeMaterial.emissiveTexture.hasAlpha = true;
        // tubeMaterial.uScale = 0.5;
        // tubeMaterial.vScale = 0.5;
        tubeMaterial.emissiveColor = new BABYLON.Color3.FromHexString("#39c930");
        tubeMaterial.alpha = 0.1;
        tubeMaterial.backFaceCulling = true;
        tube.material = tubeMaterial;

        var highlight = new BABYLON.HighlightLayer("hl", scene);
        //highlight.addMesh(tube, new BABYLON.Color3.FromHexString("#134210"));
        highlight.blurHorizontalSize = 1;
        highlight.blurVerticalSize = 1;



    }

    MakeTags(json, cityName){
        var cityCoordinates;

        json.origin.forEach(function (o) {
            if (o.location === cityName) {
                cityCoordinates = o.coordinates;
            }
        });
        json.destination.forEach(function (d) {
            if (d.location === cityName) {
                cityCoordinates = d.coordinates;
            }
        });

        var textPlane = BABYLON.Mesh.CreatePlane("textPlane", 24, scene);
        textPlane.scaling = new BABYLON.Vector3(1, 1, 0.2);
        textPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

        textPlane.backFaceCulling = false;
        textPlane.position.x = cityCoordinates.x;
        textPlane.position.y = cityCoordinates.y + 5;
        textPlane.position.z = cityCoordinates.z;

        var advancedTextTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(textPlane, 512, 512);
        advancedTextTexture.idealHeight = 1080;
        advancedTextTexture.idealWidth = 1920;

        var text = new BABYLON.GUI.TextBlock();
        text.text = cityName;
        text.fontSize = 190;
        text.color = "#3fae2a";

        advancedTextTexture.addControl(text);

        var cloudPlane = BABYLON.Mesh.CreatePlane("cloudPlane", 24, scene);
        cloudPlane.scaling = new BABYLON.Vector3(0.2, 0.2, 0.5);
        cloudPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

        cloudPlane.backFaceCulling = true;
        cloudPlane.position.x = cityCoordinates.x;
        cloudPlane.position.y = cityCoordinates.y + 10;
        cloudPlane.position.z = cityCoordinates.z;

        var cloudMaterial = new BABYLON.StandardMaterial("texture", scene);
        cloudMaterial.useAlphaFromDiffuseTexture = false;
        cloudMaterial.diffuseTexture = new BABYLON.Texture("img/cloud.png", scene);
        cloudMaterial.diffuseTexture.hasAlpha = true;
        cloudMaterial.diffuseTexture.uScale = 0.95;
        cloudMaterial.diffuseTexture.vScale = 0.95;
        cloudMaterial.diffuseColor = new BABYLON.Color3.FromHexString("#3fae2a");
        cloudMaterial.emissiveColor = new BABYLON.Color3.FromHexString("#3fae2a");

        cloudPlane.material = cloudMaterial;
    }
    MakeGUI(){
        var fullscreenGUI = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("myUI");
        var button = BABYLON.GUI.Button.CreateSimpleButton("but", "Follow packet");
        button.width = 0.1;
        button.height = "40px";
        button.color = "white";
        button.left = "-40%";
        button.top = "-40%";
        button.background = "#00EFE8";
        button.onPointerUpObservable.add(function() {

            this.anim.Setup();
            this.anim.CameraJourneyAnimation(tubePath);

        }.bind(this));
        fullscreenGUI.addControl(button);
    }

    showWorldAxis(size) {
        var makeTextPlane = function(text, color, size) {
            var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
            dynamicTexture.hasAlpha = true;
            dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color , "transparent", true);
            var plane = BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
            plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
            plane.material.backFaceCulling = false;
            plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
            plane.material.diffuseTexture = dynamicTexture;
            return plane;
        };
        var axisX = BABYLON.Mesh.CreateLines("axisX", [
            BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
            new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
        ], scene);
        axisX.color = new BABYLON.Color3(1, 0, 0);
        var xChar = makeTextPlane("X", "red", size / 10);
        xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
        var axisY = BABYLON.Mesh.CreateLines("axisY", [
            BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3( -0.05 * size, size * 0.95, 0),
            new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3( 0.05 * size, size * 0.95, 0)
        ], scene);
        axisY.color = new BABYLON.Color3(0, 1, 0);
        var yChar = makeTextPlane("Y", "green", size / 10);
        yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
        var axisZ = BABYLON.Mesh.CreateLines("axisZ", [
            BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3( 0 , -0.05 * size, size * 0.95),
            new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3( 0, 0.05 * size, size * 0.95)
        ], scene);
        axisZ.color = new BABYLON.Color3(0, 0, 1);
        var zChar = makeTextPlane("Z", "blue", size / 10);
        zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
    };
}

class InputHandler {
    ClickAction(clickResult){
        if (clickResult.hit){
            console.log("x " + clickResult.pickedPoint.x + ", y " + clickResult.pickedPoint.y + ", z "
                + clickResult.pickedPoint.z);
        }
    }
}
