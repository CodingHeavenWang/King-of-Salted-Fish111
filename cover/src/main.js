import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader'; // Import GLTFLoader

// Setup
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, 1940 / 1080, 0.1, 1000); // Adjust the aspect ratio to match the desired canvas size

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(1940, 1080); // Set the canvas size to 1940x1080 pixels
camera.position.setZ(30);
camera.position.setX(-3);

renderer.render(scene, camera);

// Lights
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);

const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);

// Background
const spaceTexture = new THREE.TextureLoader().load('images/castlenight.jpg');
scene.background = spaceTexture;

// Objects

// Torus
// const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
// const material = new THREE.MeshStandardMaterial({ color: 0xff6347 });
// const torus = new THREE.Mesh(geometry, material);
// scene.add(torus);

// CircleGeometry
// const circleGeometry = new THREE.CircleGeometry(0.7, 32);
// // Add image as texture
// const circleMaterial = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/key.png') });
// const circle = new THREE.Mesh(circleGeometry, circleMaterial);
// scene.add(circle);

// Add multiple keys
function addKeys() {
    const geometry = new THREE.CircleGeometry(0.7, 32);
    const material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/key.png') });
    const circle = new THREE.Mesh(geometry, material);

    const [x, y, z] = Array(3)
        .fill()
        .map(() => THREE.MathUtils.randFloatSpread(100));

    circle.position.set(x, y, z);
    scene.add(circle);
    return circle;
}
const rotatingKeys = Array(200).fill().map(addKeys);

// Load the GLTF model
const loader = new GLTFLoader();

let model; // Variable to hold the loaded model

// Callback function to handle the loaded model
function onmodelLoad(gltf) {
    model = gltf.scene;
    model.scale.set(2, 2, 2); // Adjust the scale of the model as needed
    scene.add(model);

    // Position the model after it's loaded
    model.position.z = 10;
    model.position.x = 10;

    model.rotation.y = 2.5;
    model.rotation.x = 0.25;
}

// Initiate the model loading
loader.load(
    'models/road_runner/scene.gltf',
    onmodelLoad);

// Scroll Animation

function moveCamera() {
    const t = document.body.getBoundingClientRect().top;
    // Rotate all the keys continuously
    // if (rotatingKeys) {
    //     rotatingKeys.forEach(key => {
    //         key.rotation.x += 0.005;
    //         key.rotation.y += 0.005;
    //         key.rotation.z += 0.005;
    //     });
    // }


    // Check if the model has been loaded before rotating
    if (model) {
        model.rotation.y += 0.05;
        // model.rotation.z += 0.01;

        // Check if model.position is defined before accessing its properties
        if (model.position && model.position.x !== undefined && model.position.z !== undefined) {
            // camera.position.z = t * -0.01;
            // camera.position.x = t * -0.0002;
            // camera.rotation.y = t * -0.0002;
        }
    }
}

document.body.onscroll = moveCamera;
moveCamera();

// Animation Loop

function animate() {
    requestAnimationFrame(animate);

    // torus.rotation.x += 0.01;
    // torus.rotation.y += 0.005;
    // torus.rotation.z += 0.01;

    if (rotatingKeys) {
        rotatingKeys.forEach(key => {

            // Rotate the key on its own random path
            key.rotation.x += Math.random() * 0.01;
            key.rotation.y += Math.random() * 0.01;
            key.rotation.z += Math.random() * 0.01;

            // Update the position of each key on a random path
            key.position.x += Math.sin(key.rotation.x) * 0.02; // Adjust the factor to control the movement
            key.position.y += Math.sin(key.rotation.y) * 0.02; // Adjust the factor to control the movement
            key.position.z += Math.cos(key.rotation.z) * 0.02; // Adjust the factor to control the movement
        });
    }

    renderer.render(scene, camera);
}

animate();
