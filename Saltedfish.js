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
  speed: 5,          // 主角左右移动速度
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

// “门”功能：每隔15s生成从上往下掉落，玩家可左右移动选择其一
const doors = [];
const doorSpeed = 2;           // 门下落速度
let doorSpawnRate = 900;       // 约15s（在60帧每秒情况下）
let doorSpawnCounter = 0;      // 计帧

// 游戏控制
let leftPressed = false;
let rightPressed = false;
let isGameOver = false;

/********************
 * 启动游戏循环
 ********************/
let frameId = null;
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

  // 血量文字元素
  const hpDiv = document.createElement('div');
  hpDiv.className = 'monsterHP';

  // 随机 x 坐标
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
 * 更新怪物信息（位置、血量）
 ********************/
function updateMonster(monster) {
  // 更新怪物本体
  updatePosition(monster);

  // 更新血量文字位置
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

  // 随机决定增益类型（增加射击频率 or 增加子弹伤害）
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
 * 生成“门”（2 个选项）从上方落下
 ********************/
function spawnDoor() {
  // 两个选项
  const doorOptionA = document.createElement('div');
  doorOptionA.className = 'doorOption';
  doorOptionA.textContent = '+10伤害';
  
  const doorOptionB = document.createElement('div');
  doorOptionB.className = 'doorOption';
  doorOptionB.textContent = '+2速度';

  // 让门出现时，保证它俩在可见范围内
  // 两个选项合起来总宽度 120px，所以随机 x 取 0 ~ (400 - 120)
  const randomX = Math.random() * (containerWidth - 120);

  // 共享组ID，方便一次性移除
  const groupId = Date.now();

  // 选项A
  const doorAObj = {
    element: doorOptionA,
    x: randomX,
    y: -60, // 从画面顶部掉落
    width: 60,
    height: 60,
    effect: { type: 'damage', value: 10 },  // 增加子弹伤害
    groupId: groupId
  };
  // 选项B
  const doorBObj = {
    element: doorOptionB,
    x: randomX + 60,
    y: -60,
    width: 60,
    height: 60,
    effect: { type: 'speed', value: 2 },   // 增加主角移动速度
    groupId: groupId
  };

  doors.push(doorAObj, doorBObj);
  gameContainer.appendChild(doorOptionA);
  gameContainer.appendChild(doorOptionB);
  updatePosition(doorAObj);
  updatePosition(doorBObj);
}

/********************
 * 更新“门”下落并检测碰撞
 ********************/
function updateDoors() {
  for (let i = 0; i < doors.length; i++) {
    const d = doors[i];
    // 门下落
    d.y += doorSpeed;
    updatePosition(d);

    // 离开屏幕移除
    if (d.y > containerHeight) {
      removeGameObject(doors, i);
      i--;
      continue;
    }

    // 检测与主角碰撞
    if (isCollision(hero, d)) {
      // 应用其增益效果
      applyDoorEffect(d.effect);
      // 移除同一组ID的门选项
      removeDoorGroup(d.groupId);
      break;
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
 * 一次性移除同一组ID的门
 ********************/
function removeDoorGroup(groupId) {
  for (let i = doors.length - 1; i >= 0; i--) {
    if (doors[i].groupId === groupId) {
      removeGameObject(doors, i);
    }
  }
}

/********************
 * 每帧更新
 ********************/
function updateAll() {
  // 计数器：门的生成
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
 * 更新怪物
 ********************/
function updateMonstersAll() {
  // 生成怪物
  monsterSpawnCounter++;
  if (monsterSpawnCounter >= monsterSpawnRate) {
    spawnMonster();
    monsterSpawnCounter = 0;
  }

  // 移动怪物
  for (let i = 0; i < monsters.length; i++) {
    const m = monsters[i];
    m.y += monsterSpeed;
    updateMonster(m);

    // 怪物离开画面
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
 * 移除怪物(包括血量文字)
 ********************/
function removeMonster(arr, index) {
  if (arr[index].hpElement && arr[index].hpElement.parentNode) {
    arr[index].hpElement.parentNode.removeChild(arr[index].hpElement);
  }
  removeGameObject(arr, index);
}

/********************
 * 更新子弹
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
      continue;
    }

    // 检测与怪物碰撞
    for (let j = 0; j < monsters.length; j++) {
      const m = monsters[j];
      if (isCollision(b, m)) {
        // 子弹造成伤害
        m.hp -= bulletDamage;
        // 移除子弹
        removeGameObject(bullets, i);
        i--;

        // 怪物死亡？
        if (m.hp <= 0) {
          // 掉落增益
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
      continue;
    }

    // 检测与主角碰撞
    if (isCollision(hero, p)) {
      if (p.type === 'freq') {
        // 提高子弹发射频率（减小 bulletSpawnRate）
        bulletSpawnRate = Math.max(2, bulletSpawnRate - 3);
      } else if (p.type === 'damage') {
        // 提高子弹伤害
        bulletDamage += 10;
      }
      removeGameObject(powerups, i);
      i--;
    }
  }
}

/********************
 * 工具函数：碰撞检测（矩形）
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
 * 工具函数：更新DOM元素坐标
 ********************/
function updatePosition(obj) {
  if (!obj.element) return;
  obj.element.style.left = obj.x + 'px';
  obj.element.style.top = obj.y + 'px';
}

/********************
 * 工具函数：移除DOM对象并从数组删除
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
 * 开始游戏（入口）
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

  // 重置一些帧计数器
  bulletSpawnCounter = 0;
  monsterSpawnCounter = 0;
  doorSpawnCounter = 0;

  // 初始化主角
  initHero();

  // 启动游戏循环
  frameId = requestAnimationFrame(gameLoop);
}

/********************
 * 监听“开始游戏”按钮
 ********************/
document.getElementById('startButton').addEventListener('click', startGame);
