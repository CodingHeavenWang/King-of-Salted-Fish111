/********************
 * 全局变量和配置
 ********************/
const gameContainer = document.getElementById('gameContainer');
const containerWidth = 400;
const containerHeight = 600;

const bgm = document.getElementById('bgm'); // 背景音乐
const hitSound = document.getElementById('hitSound'); // 音效
const scoreElement = document.getElementById('scoreBoard'); // 计分板（HTML 中应有 <div id="scoreBoard"></div>）

// timecount：用于控制怪物生成频率和血量等随时间变化
let timecount = 0;
// 新增技能相关变量
let isSkillActive = false; // 技能是否激活
let skillCooldown = 10000; // 技能冷却时间（10秒）
let lastSkillTime = 0; // 上次使用技能的时间

// 主角
const hero = {
  element: null,
  x: containerWidth / 2 - 25, // 初始居中 (50px 宽的一半)
  y: containerHeight - 70,    // 在底部
  width: 25,
  height: 25,
  speed: 3,
  isAlive: true
};

// 分数
let score = 0;

// 子弹
const bullets = [];
let bulletSpeed = 3;       // 子弹向上移动速度
let bulletDamage = 25;     // 子弹伤害
let bulletSpawnRate = 125;  // 子弹发射频率(帧数间隔越小越快)
let bulletSpawnCounter = 0;

// 怪物
const monsters = [];

const monsterWidth = 40;
const monsterHeight = 40;
const monsterSpeed = 1;
let monsterHP = 200;
let monsterSpawnRate = 750;    // 怪物生成频率(帧)
let monsterSpawnCounter = 0;  // 用于计数帧
let currentLevel = 1;
let levelTimer = 0;
const levelElement = document.getElementById('levelBoard');

// 增益
const powerups = [];
const powerupSpeed = 1;       // 增益下落速度

// “门”功能：每隔 15 秒生成，占据整行 (400px)，左右两个选项
const doors = [];
const doorSpeed = 1;          // 门下落速度
let doorSpawnRate = 2500;      // 约15秒(60帧/秒)
let doorSpawnCounter = 0;     

// 游戏控制
let leftPressed = false;
let rightPressed = false;
let isGameOver = false;
let frameId = null;

/********************
 * 可选的门增益选项
 ********************/
const possibleDoorEffects = [
  { label: 'Damage +10',    effect: { type: 'damage', value: 10 } },
  { label: 'Player Speed +0.5',  effect: { type: 'speed', value: 0.5 } },
  { label: 'Shoot frequency + 2', effect: { type: 'freq',  value: -2 } },
  { label: 'Damage +5',     effect: { type: 'damage', value: 5 } },
  { label: 'Shoot frequency + 1', effect: { type: 'freq',  value: -1 } },
  { label: 'Player Speed +0.25', effect: { type: 'speed', value: 0.25 } }
];

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
 * 生成怪物
 ********************/
function spawnMonster() {
  const monsterDiv = document.createElement('div');
  // 动态绑定关卡类名，例如 level1 或 level2
  monsterDiv.className = `monster level${currentLevel}`;

  // 血量文字
  const monsterHPDiv = document.createElement('div');
  monsterHPDiv.className = 'monsterHP';

  // 随机 X 坐标
  const randomX = Math.random() * (containerWidth - monsterWidth);

  const monsterObj = {
    element: monsterDiv,
    hpElement: monsterHPDiv,
    x: randomX,
    y: -monsterHeight,
    width: monsterWidth,
    height: monsterHeight,
    hp: monsterHP,
    isFrozen: false // 初始状态为未冻结
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

  // 这里也可随机决定增益类型
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
 * 生成“门”，随机抽取两种增益
 ********************/
function spawnDoor() {
  // 整个门容器
  const doorRowDiv = document.createElement('div');
  doorRowDiv.className = 'doorRow';

  // 随机抽取两种不同的增益选项
  const indices = pickTwoDistinctIndices(possibleDoorEffects.length);
  const leftChoice = possibleDoorEffects[indices[0]];
  const rightChoice = possibleDoorEffects[indices[1]];

  // 创建左、右选项
  const leftOptionDiv = document.createElement('div');
  leftOptionDiv.className = 'doorOption';
  leftOptionDiv.textContent = leftChoice.label;

  const rightOptionDiv = document.createElement('div');
  rightOptionDiv.className = 'doorOption';
  rightOptionDiv.textContent = rightChoice.label;

  // 将选项放入门容器
  doorRowDiv.appendChild(leftOptionDiv);
  doorRowDiv.appendChild(rightOptionDiv);

  // groupId 用于一次性移除
  const groupId = Date.now();
  const doorObjLeft = {
    element: leftOptionDiv,
    x: 0,
    y: -60,
    width: 200,
    height: 60,
    effect: leftChoice.effect,
    groupId: groupId,
    parent: doorRowDiv
  };
  const doorObjRight = {
    element: rightOptionDiv,
    x: 200,
    y: -60,
    width: 200,
    height: 60,
    effect: rightChoice.effect,
    groupId: groupId,
    parent: doorRowDiv
  };

  doorRowDiv.style.left = '0px';
  doorRowDiv.style.top = '-60px';
  doorRowDiv.style.width = '400px';
  doorRowDiv.style.height = '60px';
  gameContainer.appendChild(doorRowDiv);

  doors.push(doorObjLeft, doorObjRight);
}

/********************
 * 从 n 个选项里随机选取 2 个不重复的索引
 ********************/
function pickTwoDistinctIndices(n) {
  // 若 n < 2，应自行处理
  if (n < 2) return [0, 0];
  let i1 = Math.floor(Math.random() * n);
  let i2 = Math.floor(Math.random() * n);
  while (i2 === i1) {
    i2 = Math.floor(Math.random() * n);
  }
  return [i1, i2];
}

/********************
 * 更新“门”下落 + 碰撞
 ********************/
function updateDoors() {
  for (let i = 0; i < doors.length; i++) {
    const d = doors[i];
    // 门下落
    d.y += doorSpeed;

    // 更新门选项位置
    d.element.style.left = d.x + 'px';
    d.element.style.top = d.y + 'px';

    // 如果有父容器（整行门DIV），一起移动
    if (d.parent) {
      d.parent.style.top = d.y + 'px';
    }

    // 超出画面则移除
    if (d.y > containerHeight) {
      removeDoorGroup(d.groupId);
      break;
    }

    // 检测主角碰撞
    if (isCollision(hero, d)) {
      // 应用门增益
      applyDoorEffect(d.effect);
      // 移除同组
      removeDoorGroup(d.groupId);
      break;
    }
  }
}

/********************
 * 应用门增益效果
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
    case 'freq':
      // freq 的 value 为负数 => 减少发射间隔
      // 确保最小是 10
      bulletSpawnRate = Math.max(10, bulletSpawnRate + effect.value);
      break;
  }
}

/********************
 * 移除同组的门选项
 ********************/
function removeDoorGroup(groupId) {
  for (let i = doors.length - 1; i >= 0; i--) {
    if (doors[i].groupId === groupId) {
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
  timecount++;         // 时间计数（帧数）
  doorSpawnCounter++;  // 门生成计数
  monsterSpawnCounter++;

  // 门计数器
  doorSpawnCounter++;

  if (doorSpawnCounter >= doorSpawnRate) {
    spawnDoor();
    doorSpawnCounter = 0;
  }
  if (monsterSpawnCounter >= monsterSpawnRate) {
    spawnMonster();
    monsterSpawnCounter = 0;
  }
  // 根据 timecount 动态调整怪物生成、怪物血量
  if (timecount <= 15000) {
    switch (timecount) {
      case 1:
        monsterSpawnRate = 750;
        monsterHP = 100;   // 例：怪物血量变为 200
        break;
      case 2500:
        monsterSpawnRate = 700;
        monsterHP = 150;   // 例：怪物血量变为 250
        break;
      case 5000:
        monsterSpawnRate = 650;
        monsterHP = 250;   // 例：怪物血量变为 300
        break;
      case 7500:
        monsterSpawnRate = 600;
        monsterHP = 375;   // 例：怪物血量变为 400
        break;
      case 10000:
        monsterSpawnRate = 550;
        monsterHP = 475;   // 例：怪物血量变为 500
        break;
      
    }
  } else {
    monsterSpawnRate = 400;
    monsterHP = 500 + Math.floor(Math.random() * 50) + timecount*0.002;
  }
  updateHero();
  updateBullets();
  updateMonstersAll();
  updatePowerups();
  updateDoors();
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

  // 子弹发射
  bulletSpawnCounter++;
  if (bulletSpawnCounter >= bulletSpawnRate) {
    spawnBullet();
    bulletSpawnCounter = 0;
  }
}

/********************
 * 更新怪物
 ********************/
/********************
 * 更新怪物
 ********************/
function updateMonstersAll() {
  //monsterSpawnCounter++;
  // 满足条件则生成怪物
  //if (monsterSpawnCounter >= monsterSpawnRate) {
  //  spawnMonster();
  //  monsterSpawnCounter = 0;
  //}

  // 移动怪物
  for (let i = 0; i < monsters.length; i++) {
    const m = monsters[i];

    // 如果怪物没有被冻结，则更新位置
    if (!m.isFrozen) {
      m.y += monsterSpeed * Math.random();
      updateMonster(m);
    }

    // 离开屏幕
    if (m.y > containerHeight) {
      removeMonster(monsters, i);
      i--;
      continue;
    }

    // 碰撞主角
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

    // 离开屏幕
    if (b.y + b.height < 0) {
      removeGameObject(bullets, i);
      i--;
      continue;
    }

    // 检测子弹和怪物碰撞
    for (let j = 0; j < monsters.length; j++) {
      const m = monsters[j];
      if (isCollision(b, m)) {
        // 命中音效
        hitSound.currentTime = 0;
        hitSound.play();

        m.hp -= bulletDamage;
        removeGameObject(bullets, i);
        i--;

        // 击杀怪物
        if (m.hp <= 0) {
          score += 5;  // 击杀加分
          scoreElement.textContent = `Score: ${score}`;
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

    // 离开屏幕
    if (p.y > containerHeight) {
      removeGameObject(powerups, i);
      i--;
      continue;
    }

    // 主角拾取增益
    if (isCollision(hero, p)) {
      if (p.type === 'freq') {
        // 每次 -1 或 -2，保证最小10
        bulletSpawnRate = Math.max(10, bulletSpawnRate - 1);
      } else if (p.type === 'damage') {
        bulletDamage += 5;
      }
      removeGameObject(powerups, i);
      i--;
    }
  }
}

/********************
 * 移除怪物 (包括血量文本)
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
 * 从数组中移除并删除DOM
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

// 暂停所有怪物的移动
function freezeMonsters() {
  for (let i = 0; i < monsters.length; i++) {
    monsters[i].isFrozen = true; // 标记怪物为冻结状态
  }
}

// 恢复所有怪物的移动
function unfreezeMonsters() {
  for (let i = 0; i < monsters.length; i++) {
    monsters[i].isFrozen = false; // 取消怪物的冻结状态
  }
}

// 使用技能
function useSkill() {
  const currentTime = Date.now();
  if (currentTime - lastSkillTime < skillCooldown) {
    console.log("技能还在冷却中");
    return;
  }

  // 激活技能
  isSkillActive = true;
  lastSkillTime = currentTime;

  // 冻结怪物
  freezeMonsters();

  // 更新冷却时间显示
  updateCooldownDisplay();

  // 2秒后恢复怪物移动
  setTimeout(() => {
    unfreezeMonsters();
    isSkillActive = false;
  }, 2000);
}

// 更新冷却时间显示
function updateCooldownDisplay() {
  const cooldownDisplay = document.getElementById('skillCooldownDisplay');
  let remainingCooldown = skillCooldown / 1000;

  const interval = setInterval(() => {
    remainingCooldown -= 1;
    if (remainingCooldown <= 0) {
      clearInterval(interval);
      cooldownDisplay.textContent = "Stop!:ready";
    } else {
      cooldownDisplay.textContent = `Stop!: ${remainingCooldown}s`;
    }
  }, 1000);
}

// 监听键盘事件（按 Q 触发技能）
document.addEventListener('keydown', (e) => {
  if (e.key === 'q' || e.key === 'Q') {
    useSkill();
  }
});


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

  // 重置游戏状态
  isGameOver = false;
  hero.isAlive = true;
  hero.x = containerWidth / 2 - 25;
  hero.y = containerHeight - 70;

  bullets.length = 0;
  monsters.length = 0;
  powerups.length = 0;
  doors.length = 0;

  // 重置计数器
  timecount = 0;
  bulletSpawnCounter = 0;
  monsterSpawnCounter = 0;
  doorSpawnCounter = 0;

  // 重置分数
  score = 0;
  scoreElement.textContent = 'Score: 0';

  // 重置怪物血量和出生频率
  monsterHP = 200;
  monsterSpawnRate = 210;

  // 启动背景音乐
  bgm.currentTime = 0;
  bgm.play().catch(e => console.log("音乐播放需要用户交互"));

  // 初始化主角
  initHero();

  // 启动游戏循环
  frameId = requestAnimationFrame(gameLoop);
}

/********************
 * 监听“开始游戏”按钮
 ********************/
document.getElementById('startButton').addEventListener('click', startGame);
