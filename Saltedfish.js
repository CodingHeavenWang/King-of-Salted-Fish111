/********************
 * 全局变量和配置
 ********************/
const gameContainer = document.getElementById('gameContainer');
const containerWidth = 400;
const containerHeight = 600;

// 主角
const hero = {
  element: null,
  x: containerWidth / 2 - 25, // 初始居中 (50px宽的一半)
  y: containerHeight - 60,    // 在底部
  width: 50,
  height: 50,
  speed: 5,
  isAlive: true
};

// 子弹
const bullets = [];
let bulletSpeed = 6;           // 子弹向上移动速度
let bulletDamage = 30;         // 子弹伤害
let bulletSpawnRate = 10;      // 子弹发射频率(帧数间隔越小，发射越快)
let bulletSpawnCounter = 0;    // 统计距离上次发射子弹的帧数

// 怪物
const monsters = [];
const monsterWidth = 50;
const monsterHeight = 50;
const monsterSpeed = 2;
const monsterHP = 200;
let monsterSpawnRate = 60;     // 怪物生成频率(帧)
let monsterSpawnCounter = 0;   // 计数帧

// 增益(击杀怪物后掉落)
const powerups = [];
const powerupSpeed = 2;        // 增益下落速度

// “门”功能：每隔15s生成，玩家可左右移动选择其中一个增益
let doors = [];
let doorSpawnRate = 900;       // 约15s（在60帧每秒情况下）
let doorSpawnCounter = 0;      // 计帧

// 游戏控制
let leftPressed = false;
let rightPressed = false;
let isGameOver = false;

// 帧循环
let frameId = null;

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
  const bulletX = hero.x + hero.width / 2 - 5; // 5 是子弹宽度的一半
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
  monsterDiv.className = 'monster';

  // 为怪物血量文字单独创建一个元素
  const hpDiv = document.createElement('div');
  hpDiv.className = 'monsterHP';

  // 怪物随机 x 坐标
  const randomX = Math.random() * (containerWidth - monsterWidth);

  const monsterObj = {
    element: monsterDiv,
    hpElement: hpDiv,
    x: randomX,
    y: -monsterHeight, // 从画面上方出现
    width: monsterWidth,
    height: monsterHeight,
    hp: monsterHP
  };

  monsters.push(monsterObj);
  gameContainer.appendChild(monsterDiv);
  gameContainer.appendChild(hpDiv); // 将血量文字也加入容器
  updateMonster(monsterObj);
}

/********************
 * 更新怪物位置、血量显示
 ********************/
function updateMonster(monster) {
  // 更新怪物本体位置
  updatePosition(monster);

  // 更新血量文字位置 (在怪物顶部稍微往上)
  if (monster.hpElement) {
    monster.hpElement.style.left = monster.x + 'px';
    monster.hpElement.style.top = (monster.y - 20) + 'px';
    monster.hpElement.textContent = monster.hp;  // 显示当前血量
  }
}

/********************
 * 怪物死亡 -> 掉落增益
 ********************/
function spawnPowerup(x, y) {
  const powerupDiv = document.createElement('div');
  powerupDiv.className = 'powerup';

  // 在这里随机决定增益类型（增加射击频率 or 增加子弹伤害）
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
 * 生成“选择门”（2 个选项）
 ********************/
function spawnDoor() {
  // 我们生成两个选项，分别放在底部左右位置
  // A 在左侧，B 在右侧
  const doorOptionA = document.createElement('div');
  doorOptionA.className = 'doorOption';
  doorOptionA.textContent = '+ 10 伤害';  // 仅作示例
  const doorOptionB = document.createElement('div');
  doorOptionB.className = 'doorOption';
  doorOptionB.textContent = '+ 2 速度';

  // 我们把它们的碰撞数据也记录下来
  const doorAObj = {
    element: doorOptionA,
    x: 50,
    y: hero.y,    // 与主角同一y，方便左右移动选择
    width: 60,
    height: 60,
    effect: { type: 'damage', value: 10 }, // 选A提升子弹伤害
    groupId: Date.now()  // 用时间戳当作组ID
  };
  const doorBObj = {
    element: doorOptionB,
    x: 300,
    y: hero.y,
    width: 60,
    height: 60,
    effect: { type: 'speed', value: 2 },   // 选B增加主角移动速度
    groupId: doorAObj.groupId // 同一组ID
  };

  // 将它们加入doors数组
  doors.push(doorAObj, doorBObj);

  // 添加到DOM
  gameContainer.appendChild(doorOptionA);
  gameContainer.appendChild(doorOptionB);
  updatePosition(doorAObj);
  updatePosition(doorBObj);
}

/********************
 * 更新“选择门”逻辑
 ********************/
function updateDoors() {
  // 由于门不需要移动，这里只做碰撞检测
  for (let i = 0; i < doors.length; i++) {
    const d = doors[i];
    // 若主角碰到某个门选项
    if (isCollision(hero, d)) {
      // 应用其增益效果
      applyDoorEffect(d.effect);
      // 移除同一组ID的所有门选项（只允许选一个）
      removeDoorGroup(d.groupId);
      break; // 结束本次检测
    }
  }
}

/********************
 * 应用门的增益效果
 ********************/
function applyDoorEffect(effect) {
  switch (effect.type) {
    case 'damage':
      bulletDamage += effect.value; 
      break;
    case 'speed':
      hero.speed += effect.value;
      break;
    default:
      break;
  }
}

/********************
 * 移除同一组ID的门选项
 ********************/
function removeDoorGroup(groupId) {
  for (let i = doors.length - 1; i >= 0; i--) {
    if (doors[i].groupId === groupId) {
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

  // 1) 更新逻辑
  updateHero();
  updateBullets();
  updateMonstersAll();
  updatePowerups();
  updateDoors(); // 更新并检测门碰撞

  // 2) 继续下一帧
  frameId = requestAnimationFrame(gameLoop);
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

  // 子弹发射（根据 bulletSpawnRate 控制）
  bulletSpawnCounter++;
  if (bulletSpawnCounter >= bulletSpawnRate) {
    spawnBullet();
    bulletSpawnCounter = 0;
  }
}

/********************
 * 更新全部怪物
 ********************/
function updateMonstersAll() {
  monsterSpawnCounter++;
  if (monsterSpawnCounter >= monsterSpawnRate) {
    spawnMonster();
    monsterSpawnCounter = 0;
  }

  // 移动怪物
  for (let i = 0; i < monsters.length; i++) {
    const m = monsters[i];
    m.y += monsterSpeed;
    updateMonster(m); // 同时更新位置和血量显示

    // 怪物超出画面，则移除
    if (m.y > containerHeight) {
      removeMonster(monsters, i);
      i--;
    }
    // 怪物与主角碰撞
    else if (isCollision(hero, m)) {
      // 主角死亡，游戏结束
      isGameOver = true;
      break;
    }
  }
}

/********************
 * 移除怪物(含血量文字)
 ********************/
function removeMonster(arr, index) {
  // 移除怪物的血量显示
  if (arr[index].hpElement && arr[index].hpElement.parentNode) {
    arr[index].hpElement.parentNode.removeChild(arr[index].hpElement);
  }
  // 移除怪物本体
  removeGameObject(arr, index);
}

/********************
 * 更新子弹
 ********************/
function updateBullets() {
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    b.y -= bulletSpeed; // 子弹向上移动
    updatePosition(b);

    // 超出画面则移除
    if (b.y + b.height < 0) {
      removeGameObject(bullets, i);
      i--;
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

    // 超出画面则移除
    if (p.y > containerHeight) {
      removeGameObject(powerups, i);
      i--;
    }
    else {
      // 检测与主角碰撞
      if (isCollision(hero, p)) {
        if (p.type === 'freq') {
          // 提高子弹发射频率（减小 bulletSpawnRate 数值）
          bulletSpawnRate = Math.max(2, bulletSpawnRate - 3);
        } else if (p.type === 'damage') {
          // 提高子弹伤害
          bulletDamage += 10;
        }
        // 拾取后移除增益
        removeGameObject(powerups, i);
        i--;
      }
    }
  }
}

/********************
 * 子弹与怪物碰撞检测
 ********************/
function checkBulletMonsterCollision(b, m) {
  if (isCollision(b, m)) {
    // 子弹造成伤害
    m.hp -= bulletDamage;
    // 移除子弹
    return true; // 表示有碰撞
  }
  return false;
}

/********************
 * 在子弹更新后，处理子弹与怪物碰撞
 * (此逻辑可放在 updateBullets 里，也可独立；此处简化放在 updateBullets 里比较好)
 ********************/
function handleBulletMonsterCollisions() {
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    for (let j = 0; j < monsters.length; j++) {
      const m = monsters[j];
      if (checkBulletMonsterCollision(b, m)) {
        // 移除子弹
        removeGameObject(bullets, i);
        i--;

        // 怪物死亡？
        if (m.hp <= 0) {
          // 在怪物当前位置生成增益
          spawnPowerup(m.x + m.width / 2, m.y + m.height / 2);
          // 移除怪物
          removeMonster(monsters, j);
        }
        break;
      }
    }
  }
}

/********************
 * 原先的子弹更新，可在最后加一次碰撞检测
 ********************/
function updateBullets() {
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    b.y -= bulletSpeed;
    updatePosition(b);

    // 超出画面则移除
    if (b.y + b.height < 0) {
      removeGameObject(bullets, i);
      i--;
    }
  }
  // 全部子弹移动完后，再统一检测碰撞
  handleBulletMonsterCollisions();
}

/********************
 * 碰撞检测（矩形）
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
 * 移除DOM对象并从数组删除
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

  // 重置游戏状态
  isGameOver = false;
  hero.isAlive = true;
  bullets.length = 0;
  monsters.length = 0;
  powerups.length = 0;
  doors.length = 0;

  // 重置统计器
  bulletSpawnCounter = 0;
  monsterSpawnCounter = 0;
  doorSpawnCounter = 0;

  // 初始化主角
  initHero();

  // 启动游戏循环
  function internalGameLoop() {
    if (isGameOver) {
      showGameOver();
      return;
    }
    updateAll();
    requestAnimationFrame(internalGameLoop);
  }
  internalGameLoop();
}

/********************
 * 每帧需要更新的东西
 ********************/
function updateAll() {
  // 计数器递增
  doorSpawnCounter++;
  if (doorSpawnCounter >= doorSpawnRate) {
    spawnDoor();
    doorSpawnCounter = 0;
  }

  updateHero();
  updateBullets();
  updateMonstersAll();
  updatePowerups();
  updateDoors(); // 检测门
}

/********************
 * 监听“开始游戏”按钮
 ********************/
document.getElementById('startButton').addEventListener('click', startGame);
