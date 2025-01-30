/********************
 * 全局变量和配置
 ********************/
const gameContainer = document.getElementById('gameContainer');
const containerWidth = 400;
const containerHeight = 600;

// 音效
const hitSound = document.getElementById('hitSound'); // 直接获取音频标签

// 主角
const hero = {
  element: null,
  x: containerWidth / 2 - 15, // 初始居中 (30px宽的一半)
  y: containerHeight - 50,    // 在底部
  width: 30,
  height: 30,
  speed: 5,
  isAlive: true
};

// 子弹
const bullets = [];
let bulletSpeed = 6;
let bulletDamage = 30;        // 子弹伤害
let bulletSpawnRate = 10;     // 子弹发射频率(数值越小越快，指帧数间隔)
let bulletSpawnCounter = 0;   // 用于统计当前帧距离上次子弹发射经过了多少帧

// 怪物
const monsters = [];
const monsterWidth = 30;
const monsterHeight = 30;
const monsterSpeed = 2;
const monsterHP = 200;
let monsterSpawnRate = 60;    // 怪物生成频率(帧)
let monsterSpawnCounter = 0;  // 用于计数帧

// 增益
const powerups = [];
const powerupSpeed = 2;       // 增益下落速度

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
  const bulletX = hero.x + hero.width / 2 - 2.5; // 2.5是子弹宽度的一半
  const bulletY = hero.y - 10;

  const bulletObj = {
    element: bulletDiv,
    x: bulletX,
    y: bulletY,
    width: 5,
    height: 10
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
  // 怪物随机 x 坐标
  const randomX = Math.random() * (containerWidth - monsterWidth);

  const monsterObj = {
    element: monsterDiv,
    x: randomX,
    y: -monsterHeight, // 从画面上方出现
    width: monsterWidth,
    height: monsterHeight,
    hp: monsterHP
  };
  monsters.push(monsterObj);
  gameContainer.appendChild(monsterDiv);
  updatePosition(monsterObj);
}

/********************
 * 怪物死亡 -> 掉落增益
 ********************/
function spawnPowerup(x, y) {
  const powerupDiv = document.createElement('div');
  powerupDiv.className = 'powerup';

  // 可以在这里随机决定增益类型（增加射击频率 or 增加子弹伤害）
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
  updateMonsters();
  updatePowerups();

  // 2) 碰撞检测
  checkBulletMonsterCollision();
  checkMonsterHeroCollision();
  checkPowerupHeroCollision();

  // 3) 继续下一帧
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
 * 更新怪物
 ********************/
function updateMonsters() {
  monsterSpawnCounter++;
  if (monsterSpawnCounter >= monsterSpawnRate) {
    spawnMonster();
    monsterSpawnCounter = 0;
  }

  // 移动怪物
  for (let i = 0; i < monsters.length; i++) {
    const m = monsters[i];
    m.y += monsterSpeed;
    updatePosition(m);

    // 怪物超出画面，则移除
    if (m.y > containerHeight) {
      removeGameObject(monsters, i);
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
  }
}

/********************
 * 子弹与怪物碰撞检测
 ********************/
function checkBulletMonsterCollision() {
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    for (let j = 0; j < monsters.length; j++) {
      const m = monsters[j];
      if (isCollision(b, m)) {
        // 播放音效（关键代码！）
        hitSound.currentTime = 0; // 重置音频到开头，确保快速重复播放
        hitSound.play();

        // 子弹造成伤害
        m.hp -= bulletDamage;
        // 移除子弹
        removeGameObject(bullets, i);
        i--;

        // 若怪物死亡
        if (m.hp <= 0) {
          // 在怪物当前位置生成增益
          spawnPowerup(m.x + m.width / 2, m.y + m.height / 2);
          // 移除怪物
          removeGameObject(monsters, j);
        }
        break;
      }
    }
  }
}

/********************
 * 怪物与主角碰撞检测
 ********************/
function checkMonsterHeroCollision() {
  for (let i = 0; i < monsters.length; i++) {
    if (isCollision(hero, monsters[i])) {
      // 主角死亡，游戏结束
      isGameOver = true;
      break;
    }
  }
}

/********************
 * 增益与主角碰撞检测
 ********************/
function checkPowerupHeroCollision() {
  for (let i = 0; i < powerups.length; i++) {
    const p = powerups[i];
    if (isCollision(hero, p)) {
      // 根据增益类型，为主角赋能
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

  // 初始化主角
  initHero();

  // 启动游戏循环
  frameId = requestAnimationFrame(gameLoop);
}

/********************
 * 监听开始按钮点击事件
 ********************/
document.getElementById('startButton').addEventListener('click', startGame);