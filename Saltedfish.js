/********************
 * 全局变量和配置
 ********************/
const gameContainer = document.getElementById('gameContainer');
const containerWidth = 400;
const containerHeight = 600;

const bgm = document.getElementById('bgm'); // 背景音乐

// 音效
const hitSound = document.getElementById('hitSound'); // 从 HTML 中获取音频标签

let timecount = 0;
// 主角
const hero = {
  element: null,
  x: containerWidth / 2 - 25, // 初始居中 (50px 宽的一半)
  y: containerHeight - 70,    // 在底部
  width: 50,
  height: 50,
  speed: 5,
  isAlive: true
};

// 子弹
const bullets = [];
let bulletSpeed = 3;        // 子弹向上移动速度
let bulletDamage = 30;      // 子弹伤害
let bulletSpawnRate = 30;   // 子弹发射频率(越小越快)，单位：帧
let bulletSpawnCounter = 0; // 用于统计当前帧距离上次子弹发射

// 怪物
const monsters = [];
const monsterWidth = 50;
const monsterHeight = 50;
const monsterSpeed = 1.5;
let monsterHP = 200;
let monsterSpawnRate = 120;    // 怪物生成频率(帧)
let monsterSpawnCounter = 0;  // 用于计数帧
let currentLevel = 1;
let levelTimer = 0;
const levelElement = document.getElementById('levelBoard');

// 增益
const powerups = [];
const powerupSpeed = 2;       // 增益下落速度

// “门”功能：每隔 15 秒生成，占据整行 (400px)，左右两个选项
const doors = [];
const doorSpeed = 2;          // 门下落速度
let doorSpawnRate = 900;      // 约 15s（60帧/秒）
let doorSpawnCounter = 0;     // 帧计数

// 游戏控制
let leftPressed = false;
let rightPressed = false;
let isGameOver = false;
let frameId = null;

let isWeaponChanged = false; // 是否已更换武器贴图

// 新增计分相关
let score = 0;
const scoreElement = document.getElementById('scoreBoard'); // 确保 HTML 已添加对应元素

/********************
 * 初始化主角
 ********************/
function initHero() {
  const heroDiv = document.createElement('div');
  heroDiv.className = 'hero';
  gameContainer.appendChild(heroDiv);
  hero.element = heroDiv;
  updatePosition(hero);
}

/********************
 * 生成子弹
 ********************/
function spawnBullet() {
  const bulletDiv = document.createElement('div');
  bulletDiv.className = 'bullet';
  
  // 根据武器状态选择贴图
  const bulletImg = isWeaponChanged 
    ? 'Bullet/icefire.png' 
    : 'Bullet/shot_fireball.png'; // [!code ++]
  
  bulletDiv.style.backgroundImage = `url('${bulletImg}')`; // [!code ++]

  // 子弹初始位置：主角正中上方
  const bulletX = hero.x + hero.width / 2 - 5;
  const bulletY = hero.y - 15;

  const bulletObj = {
    element: bulletDiv,
    x: bulletX,
    y: bulletY,
    width: 10,
    height: 15
  };
  bullets.push(bulletObj);
  gameContainer.appendChild(bulletDiv);
  updatePosition(bulletObj);
}

/********************
 * 生成怪物 (含血量条)
 ********************/
function spawnMonster() {
  const monsterDiv = document.createElement('div');
  monsterDiv.className = 'monster';

  // 创建血量文字
  const monsterHPDiv = document.createElement('div');
  monsterHPDiv.className = 'monsterHP';

  // 怪物随机 X 坐标
  const randomX = Math.random() * (containerWidth - monsterWidth);

  const monsterObj = {
    element: monsterDiv,
    hpElement: monsterHPDiv,
    x: randomX,
    y: -monsterHeight, // 从画面上方出现
    width: monsterWidth,
    height: monsterHeight,
    hp: monsterHP
  };

  monsters.push(monsterObj);
  gameContainer.appendChild(monsterDiv);
  gameContainer.appendChild(monsterHPDiv);

  updateMonster(monsterObj);
}

/********************
 * 更新怪物位置、血量
 ********************/
function updateMonster(m) {
  updatePosition(m);
  // 更新血量文字位置(在怪物上方)
  if (m.hpElement) {
    m.hpElement.style.left = m.x + 'px';
    m.hpElement.style.top = (m.y - 18) + 'px';
    m.hpElement.textContent = m.hp;
  }
}

/********************
 * 生成增益
 ********************/
function spawnPowerup(x, y) {
  const powerupDiv = document.createElement('div');
  powerupDiv.className = 'powerup';

  // 随机决定增益类型
  const type = Math.random() < 0.5 ? 'freq' : 'damage';

  const powerupObj = {
    element: powerupDiv,
    x: x,
    y: y,
    width: 20,
    height: 20,
    type: type
  };
  powerups.push(powerupObj);
  gameContainer.appendChild(powerupDiv);
  updatePosition(powerupObj);
}

/********************
 * 生成“门” (整宽 400px)，里面两个选项
 ********************/
function spawnDoor() {
  // 整个门容器
  const doorRowDiv = document.createElement('div');
  doorRowDiv.className = 'doorRow';

  // 两侧选项
  const leftOptionDiv = document.createElement('div');
  leftOptionDiv.className = 'doorOption';
  leftOptionDiv.textContent = '+10 子弹伤害';

  const rightOptionDiv = document.createElement('div');
  rightOptionDiv.className = 'doorOption';
  rightOptionDiv.textContent = '+2 移动速度';

  // 将选项放入门容器
  doorRowDiv.appendChild(leftOptionDiv);
  doorRowDiv.appendChild(rightOptionDiv);

  // “门”对象：整个一行
  // 为了碰撞检测，我们将把左右选项当作两个碰撞区
  const groupId = Date.now(); // 用时间戳识别它们是一组
  const doorObjLeft = {
    element: leftOptionDiv,
    x: 0,
    y: -60,   // 从上方出现
    width: 200,
    height: 60,
    effect: { type: 'damage', value: 10 },
    groupId: groupId,
    parent: doorRowDiv  // 父容器
  };
  const doorObjRight = {
    element: rightOptionDiv,
    x: 200,
    y: -60,
    width: 200,
    height: 60,
    effect: { type: 'speed', value: 2 },
    groupId: groupId,
    parent: doorRowDiv
  };

  // 同时要让 doorRowDiv 自身也具有坐标（0, -60），宽 400，高 60
  doorRowDiv.style.left = '0px';
  doorRowDiv.style.top = '-60px';
  doorRowDiv.style.width = '400px';  // 占满整行
  doorRowDiv.style.height = '60px';
  gameContainer.appendChild(doorRowDiv);

  // 加入 doors 数组
  doors.push(doorObjLeft, doorObjRight);
}

/********************
 * 更新“门”下落 + 碰撞
 ********************/
function updateDoors() {
  for (let i = 0; i < doors.length; i++) {
    const d = doors[i];
    // 下落
    d.y += doorSpeed;
    // 更新位置
    d.element.style.left = d.x + 'px';
    d.element.style.top = d.y + 'px';

    // 同时更新父容器的位置 (整行门)
    if (d.parent) {
      d.parent.style.top = d.y + 'px';
    }

    // 超出底部则移除
    if (d.y > containerHeight) {
      removeDoorGroup(d.groupId);
      break;
    }

    // 检测主角是否碰到该门选项
    if (isCollision(hero, d)) {
      // 应用增益
      applyDoorEffect(d.effect);
      // 一次性移除两侧选项(同组ID)
      removeDoorGroup(d.groupId);
      break;
    }
  }
}

/********************
 * 统一门效果处理逻辑
 ********************/
function applyDoorEffect(effect) {
  if (!effect) return;
  switch (effect.type) {
    case 'damage':
      bulletDamage += effect.value;
      break;
    case 'speed':
      hero.speed += effect.value;
      break;
    case 'weapon': // [!code focus]
      bulletDamage = 50; // 新武器伤害
      isWeaponChanged = true;
      bullets.forEach(bullet => {
        bullet.element.style.backgroundImage = 'url("Bullet/icefire.png")';
      });
      break;
    case 'bullet': // [!code focus]
      bulletSpawnRate = Math.max(2, bulletSpawnRate - effect.value); 
      break;
  }
}

/********************
 * 移除同组门 (左右选项一起)
 ********************/
function removeDoorGroup(groupId) {
  for (let i = doors.length - 1; i >= 0; i--) {
    if (doors[i].groupId === groupId) {
      // 移除父容器（只需要一次，但我们循环也没问题）
      if (doors[i].parent && doors[i].parent.parentNode) {
        doors[i].parent.parentNode.removeChild(doors[i].parent);
      }
      removeGameObject(doors, i);
    }
  }
}

/********************
 * 游戏循环
 ********************/
function gameLoop() {
  if (isGameOver) {
    cancelAnimationFrame(frameId);
    showGameOver();
    return;
  }
  updateAll();
  frameId = requestAnimationFrame(gameLoop);
}

/********************
 * 每帧更新
 ********************/
function updateAll() {
  // 合并门生成逻辑
  doorSpawnCounter++;
  door10sCounter++;

  // 常规门（15秒）
  if (doorSpawnCounter >= doorSpawnRate) {
    spawnDoor();
    doorSpawnCounter = 0;
  }

  // 特殊门（10秒）
  if (door10sCounter >= 600 && !door10sSpawned) { 
    spawn10sDoor();
    door10sCounter = 0;       // [!code ++] 重置计数器
    door10sSpawned = true;    // [!code ++]
  }
}
/********************
 * 更新主角
 ********************/
function updateHero() {
  // 左右移动
  if (leftPressed) {
    hero.x -= hero.speed;
    if (hero.x < 0) hero.x = 0;
  }
  if (rightPressed) {
    hero.x += hero.speed;
    if (hero.x + hero.width > containerWidth) {
      hero.x = containerWidth - hero.width;
    }
  }
  updatePosition(hero);

  // 子弹发射（根据 bulletSpawnRate）
  bulletSpawnCounter++;
  if (bulletSpawnCounter >= bulletSpawnRate) {
    spawnBullet();
    bulletSpawnCounter = 0;
  }
}

/********************
 * 更新怪物
 ********************/
function updateMonstersAll() {
  monsterSpawnCounter++;
  if (monsterSpawnCounter >= monsterSpawnRate) {
    spawnMonster();
    monsterSpawnCounter = 0;
  }

  for (let i = 0; i < monsters.length; i++) {
    const m = monsters[i];
    m.y += monsterSpeed*Math.random();
    updateMonster(m);

    // 越出屏幕
    if (m.y > containerHeight) {
      removeMonster(monsters, i);
      i--;
      continue;
    }

    // 怪物与主角碰撞
    if (isCollision(hero, m)) {
      isGameOver = true;
      break;
    }
  }
}

/********************
 * 更新子弹
 ********************/
function updateBullets() {
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    b.y -= bulletSpeed;
    updatePosition(b);

    // 超出屏幕
    if (b.y + b.height < 0) {
      removeGameObject(bullets, i);
      i--;
      continue;
    }

    // 检测子弹与怪物碰撞
    for (let j = 0; j < monsters.length; j++) {
      const m = monsters[j];
      if (isCollision(b, m)) {
        // 播放命中音效
        hitSound.currentTime = 0; 
        hitSound.play();

        // 子弹伤害
        m.hp -= bulletDamage;
        // 移除子弹
        removeGameObject(bullets, i);
        i--;

        // 怪物死亡？
        if (m.hp <= 0) {
        score += 5;  // 新增：击杀加5分
        scoreElement.textContent = `Score: ${score}`; // 新增：更新显示
        spawnPowerup(m.x + m.width / 2, m.y + m.height / 2);
        removeMonster(monsters, j);
      }
        break;
      }
    }
  }
}

/********************
 * 更新增益
 ********************/
function updatePowerups() {
  for (let i = 0; i < powerups.length; i++) {
    const p = powerups[i];
    p.y += powerupSpeed;
    updatePosition(p);

    // 越出屏幕
    if (p.y > containerHeight) {
      removeGameObject(powerups, i);
      i--;
      continue;
    }

    // 检测主角拾取增益
    if (isCollision(hero, p)) {
      if (p.type === 'freq') {
        bulletSpawnRate = Math.max(2, bulletSpawnRate - 3);
      } else if (p.type === 'damage') {
        bulletDamage += 10;
      }
      removeGameObject(powerups, i);
      i--;
    }
  }
}

/********************
 * 移除怪物(含血量文字)
 ********************/
function removeMonster(arr, index) {
  if (arr[index].hpElement && arr[index].hpElement.parentNode) {
    arr[index].hpElement.parentNode.removeChild(arr[index].hpElement);
  }
  removeGameObject(arr, index);
}

/********************
 * 碰撞检测(矩形)
 ********************/
function isCollision(a, b) {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

/********************
 * 更新DOM元素坐标
 ********************/
function updatePosition(obj) {
  if (!obj.element) return;
  obj.element.style.left = obj.x + 'px';
  obj.element.style.top = obj.y + 'px';
}

/********************
 * 从数组中移除并删DOM
 ********************/
function removeGameObject(arr, index) {
  if (arr[index].element && arr[index].element.parentNode) {
    arr[index].element.parentNode.removeChild(arr[index].element);
  }
  arr.splice(index, 1);
}

/********************
 * 显示游戏结束
 ********************/
function showGameOver() {
  const gameoverDiv = document.createElement('div');
  gameoverDiv.className = 'gameover';
  gameoverDiv.innerText = '游戏结束';
  gameContainer.appendChild(gameoverDiv);

  // 停止背景音乐
  bgm.pause();
}

/********************
 * 键盘事件监听
 ********************/
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    leftPressed = true;
  } else if (e.key === 'ArrowRight') {
    rightPressed = true;
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') {
    leftPressed = false;
  } else if (e.key === 'ArrowRight') {
    rightPressed = false;
  }
});

/********************
 * 启动游戏
 ********************/
function startGame() {
  // 隐藏主界面
  document.getElementById('mainMenu').style.display = 'none';
  // 显示游戏容器
  gameContainer.style.display = 'block';

  preloadWeaponAssets();

  // 重置游戏状态
  isGameOver = false;
  hero.isAlive = true;
  hero.x = containerWidth / 2 - 25;
  hero.y = containerHeight - 70;

  bullets.length = 0;
  monsters.length = 0;
  powerups.length = 0;
  doors.length = 0;

   // 新增：重置分数
   score = 0;
   scoreElement.textContent = `Score: 0`;

  // 重置计数器
  bulletSpawnCounter = 0;
  monsterSpawnCounter = 0;
  doorSpawnCounter = 0;

    // 启动背景音乐（需用户点击后触发）
    bgm.currentTime = 0;
    bgm.play().catch(e => console.log("音乐播放需要用户交互"));

  // 初始化主角
  initHero();

  // 启动游戏循环
  frameId = requestAnimationFrame(gameLoop);
}

/********************
 * 监听开始按钮
 ********************/
document.getElementById('startButton').addEventListener('click', startGame);

//第10s的特殊门
let door10sCounter = 0; // 计时器，用于跟踪时间
let door10sSpawned = false; // 用来防止门多次生成

function spawn10sDoor() {
  // 创建新的门容器
  const doorRowDiv = document.createElement('div');
  doorRowDiv.className = 'doorRow';

  // 创建门的选项
  const leftOptionDiv = document.createElement('div');
  leftOptionDiv.className = 'doorOption';
  leftOptionDiv.textContent = '换武器';

  const rightOptionDiv = document.createElement('div');
  rightOptionDiv.className = 'doorOption';
  rightOptionDiv.textContent = '加子弹';

  // 将选项放入门容器
  doorRowDiv.appendChild(leftOptionDiv);
  doorRowDiv.appendChild(rightOptionDiv);

  // “门”对象：整个一行
  const groupId = Date.now(); // 使用时间戳作为组ID
  const doorObjLeft = {
    element: leftOptionDiv,
    x: 0,
    y: -60,   // 从上方出现
    width: 200,
    height: 60,
    effect: { type: 'weapon', value: 'newWeapon' }, // 换武器
    groupId: groupId,
    parent: doorRowDiv
  };
  const doorObjRight = {
    element: rightOptionDiv,
    x: 200,
    y: -60,
    width: 200,
    height: 60,
    effect: { type: 'bullet', value: 10 }, // 加子弹
    groupId: groupId,
    parent: doorRowDiv
  };

  // 更新门容器的样式
  doorRowDiv.style.left = '0px';
  doorRowDiv.style.top = '-60px';
  doorRowDiv.style.width = '400px';  // 占满整行
  doorRowDiv.style.height = '60px';
  gameContainer.appendChild(doorRowDiv);

  // 加入 doors 数组
  doors.push(doorObjLeft, doorObjRight);
}

/********************
 * 修改游戏循环，添加 10秒计时的门
 ********************/
function updateAll() {
  timecount++;


  // 每30秒升级关卡
  //if (levelTimer >= 30 && currentLevel === 1) {
  //  currentLevel = 2;
   // levelElement.textContent = `关卡: ${currentLevel}`;
  // levelTimer = 0; // 重置计时器

    // 第二关增强
  //  monsterHP = 300;
   // monsterSpawnRate = 100;
  //}

  if (timecount <= 15000) {
    switch (timecount) {
      case 1:
        monsterSpawnRate = 750;
        monsterHP = 100;   // 例：怪物血量变为 200
        break;
      case 2500:
        monsterSpawnRate = 700;
        monsterHP = 150;   // 例：怪物血量变为 250
        monsterHP = 150;
        currentLevel++;   // 例：怪物血量变为 250
        break;
      case 5000:
        monsterSpawnRate = 650;
        monsterHP = 250;   // 例：怪物血量变为 300
        monsterHP = 250;
        currentLevel++;    // 例：怪物血量变为 300
        break;
      case 7500:
        monsterSpawnRate = 600;
        monsterHP = 375;   // 例：怪物血量变为 400
        monsterHP = 375; 
        currentLevel++;   // 例：怪物血量变为 400
        break;
      case 10000:
        monsterSpawnRate = 550;
        monsterHP = 475;   // 例：怪物血量变为 500
        monsterHP = 475; 
        currentLevel++;   // 例：怪物血量变为 500
        break;
      
    }
  } else {
    currentLevel++; 
    monsterSpawnRate = 400;
    monsterHP = 500 + Math.floor(Math.random() * 50) + timecount*0.002;
  }
  // 每10秒生成一次门
  door10sCounter++;
  if (door10sCounter >= 600 && !door10sSpawned) {  // 10秒 = 600帧 (假设60帧/秒)
    spawn10sDoor();
    door10sSpawned = true;  // 防止重复生成
  }

  doorSpawnCounter++;
  if (doorSpawnCounter >= doorSpawnRate) {
    spawnDoor();
    doorSpawnCounter = 0;
  }

  updateHero();
  updateBullets();
  updateMonstersAll();
  updatePowerups();
  updateDoors();
}


/********************
 * 新增：预加载贴图（在游戏开始时调用）
 ********************/
function preloadWeaponAssets() {
  new Image().src = 'Bullet/icefire.png'; // [!code ++]
}