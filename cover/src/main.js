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
renderer.outputEncoding = THREE.sRGBEncoding;
camera.position.setZ(30);
camera.position.setX(-3);

renderer.render(scene, camera);

// Lights
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);

const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);
// Background
const spaceTexture = new THREE.TextureLoader().load('images/castlenight.jpg');
scene.background = spaceTexture;

// Objects

// Torus
// const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
// const material = new THREE.MeshStandardMaterial({ color: 0xff6347 });
// const torus = new THREE.Mesh(geometry, material);
// scene.add(torus);

 //CircleGeometry
 //const circleGeometry = new THREE.CircleGeometry(0.7, 32);
 // // Add image as texture
 //const circleMaterial = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('src/Monster/xjp.png') });
 //const circle = new THREE.Mesh(circleGeometry, circleMaterial);
 //scene.add(circle);

 function addMonster() {
  // 随机选择一张怪物图片（pic1.png ~ pic6.png）
  const monsterIndex = Math.floor(Math.random() * 6) + 1;
  const texturePath = `src/game/Monster/pic${monsterIndex}.png`;
  const texture = new THREE.TextureLoader().load(texturePath);
  
  // 建立精灵材质，开启透明（如果图片有透明部分）
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const monster = new THREE.Sprite(material);
  
  // ★ 调整怪物大小，数值可根据实际需求修改
  monster.scale.set(5, 5, 1);
  
  // 设置一个随机位置（这里使用的范围可根据需要调整）
  monster.position.set(
      THREE.MathUtils.randFloatSpread(100),
      THREE.MathUtils.randFloatSpread(100),
      THREE.MathUtils.randFloatSpread(100)
  );
  monster.userData.velocity = new THREE.Vector3(
    THREE.MathUtils.randFloat(-0.1, 0.1),
    THREE.MathUtils.randFloat(-0.1, 0.1),
    THREE.MathUtils.randFloat(-0.1, 0.1)
  );
  scene.add(monster);
  return monster;
}
const monsters = Array(20).fill().map(addMonster);


// Load the GLTF model
const loader = new GLTFLoader();

let model; // Variable to hold the loaded model

// Callback function to handle the loaded model
function onmodelLoad(gltf) {
    model = gltf.scene;
    model.scale.set(0.5, 0.5, 0.5);
    model.rotation.set(0.5, 0.75, 0.25);
    model.position.set(0, 0, 0); // Adjust the scale of the model as needed
    scene.add(model);

    // Position the model after it's loaded

    model.traverse(child => {
      if (child.isMesh) {
          // 如果是单面渲染，尝试改为双面渲染
          child.material.side = THREE.DoubleSide;
          
          child.material.needsUpdate = true;
      }
  });
}

// Initiate the model loading
loader.load(
    '../models/road_runner/scene.gltf',
    onmodelLoad);

// Scroll Animation
const axis = new THREE.Vector3(0, 0.5, 0).normalize();
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
        //model.rotation.x += 0.03;
        model.rotateOnAxis(axis, 0.02);
        //model.rotation.z += 0.03;

        // Check if model.position is defined before accessing its properties
        //if (model.position && model.position.x !== undefined && model.position.z !== undefined) {
            // camera.position.z = t * -0.01;
            // camera.position.x = t * -0.0002;
            // camera.rotation.y = t * -0.0002;
        //}
    }
}

document.body.onscroll = moveCamera;
moveCamera();

// Animation Loop

function animate() {
    requestAnimationFrame(animate);
    const boundary = 50; // 可根据实际场景调整边界值
    monsters.forEach(monster => {
        // 根据当前速度更新位置
        monster.position.add(monster.userData.velocity);
        
        // 检查 x 轴边界
        if (monster.position.x > boundary || monster.position.x < -boundary) {
            monster.userData.velocity.x = -monster.userData.velocity.x;
        }
        // 检查 y 轴边界
        if (monster.position.y > boundary || monster.position.y < -boundary) {
            monster.userData.velocity.y = -monster.userData.velocity.y;
        }
        // 检查 z 轴边界
        if (monster.position.z > boundary || monster.position.z < -boundary) {
            monster.userData.velocity.z = -monster.userData.velocity.z;
        }
        
        // 同时给怪物添加轻微的随机旋转
        monster.rotation.z += (Math.random() - 0.5) * 0.02;
    });

    renderer.render(scene, camera);
}

animate();
