/********************
 * 全局变量和配置
 ********************/
const gameContainer = document.getElementById('gameContainer');
const containerWidth = 400;
const containerHeight = 600;

const bgm = document.getElementById('bgm'); // 背景音乐
const hitSound = document.getElementById('hitSound'); // 音效
const hitSounds = {
  default: new Audio('Sound_Effect/fire_effect.MP3'),
  ice: new Audio('Sound_Effect/LedasLuzta.ogg'),
  explode: new Audio('Sound_Effect/explode.flac'),
  // 添加更多音效...
};

let level2Bubble = null;
let bubbleDisplayTime = 0;

const openingScreen = document.createElement('div');
openingScreen.id = 'openingScreen';



// 创建一个图片元素
const img = document.createElement('img');

// 将图片添加到 openingScreen 中
openingScreen.appendChild(img);

// 将 openingScreen 添加到 body 中
document.body.appendChild(openingScreen);


const scoreElement = document.getElementById('scoreBoard'); // 计分板（HTML 中应有 <div id="scoreBoard"></div>）
//在全局变量中添加Boss战斗音乐
const bossBgm = new Audio('BGM/jiangjun.mp3'); // 假设Boss战斗音乐路径
bossBgm.loop = true;

// timecount：用于控制怪物生成频率和血量等随时间变化
let timecount = 0;
// 新增技能相关变量
let isSkillActive = false; // 技能是否激活
let skillCooldown = 600; // 技能冷却时间（10秒）
let lastSkillTime = 0; // 上次使用技能的时间
let weapontype = 0;
// 主角
const hero = {
  element: null,
  x: containerWidth / 2 - 25, // 初始居中 (50px 宽的一半)
  y: containerHeight - 70,    // 在底部
  width: 30,
  height: 60,
  speed: 1.5,
  isAlive: true,
  element: document.createElement('div'),
  isFlipped: false,
  lastDirection: 'right' // 初始默认方向
};

// 分数
let score = 0;

// 子弹
const bullets = [];
let bulletSpeed = 5;       // 子弹向上移动速度
let bulletAttack = 25;     // 子弹伤害
let bulletSpawnRate = 60;  // 子弹发射频率(帧数间隔越小越快)
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
const powerupSpeed = 3;       // 增益下落速度

// “门”功能：每隔 15 秒生成，占据整行 (400px)，左右两个选项
const doors = [];
const doorSpeed = 1;          // 门下落速度
let doorSpawnRate = 900;      // 约15秒(60帧/秒)
let doorSpawnCounter = 0;     

const boss = {
  element: null,
  x: containerWidth / 2 - 50, // 居中
  y: 50,                      // 在顶部
  width: 100,
  height: 100,
  hp: 100000,                   // Boss的血量
  initialhp: 100000,
  isAlive: false,             // Boss是否存活
  bulletSpawnRate: 60,        // Boss发射弹幕的频率
  bulletSpawnCounter: 0,      // Boss弹幕发射计数器
  speed: 1,  
  slowRemain: 0,                 // Boss移动速度
  direction: 1                // Boss移动方向：1 表示向右，-1 表示向左
};
let bossPhase = 1; // 1: 第一阶段, 2: 第二阶段, 3: 第三阶段
//boss 血量
const bossHPElement = document.createElement('div');


// 玩家血量
let playerHP = 100;
let playerHPinitial=100;
const playerHPElement = document.createElement('div'); // 显示玩家血量的元素
// 玩家血量显示
//playerHPElement.style.position = 'absolute';
//playerHPElement.style.top = '40px'; 
//playerHPElement.style.right = '10px';
//playerHPElement.style.color = 'white';
//playerHPElement.style.fontSize = '24px';
//playerHPElement.style.textShadow = '2px 2px 2px black';
//gameContainer.appendChild(playerHPElement);

// Boss弹幕
const bossBullets = [];
const bossBulletSpeed = 5; // Boss弹幕速度

// 游戏控制
let leftPressed = false;
let rightPressed = false;
let isGameOver = false;
let frameId = null;

/********************
 * 可选的门增益选项
 ********************/
const possibleDoorEffects = [
  { label: 'Attack ++',    effect: { type: 'Attack', value: 10 } },
  { label: 'Player Speed ++',  effect: { type: 'speed', value: 0.5 } },
  { label: 'Shoot frequency +', effect: { type: 'freq',  value: -3 } },
  { label: 'Attack +',     effect: { type: 'Attack', value: 5 } },
  { label: 'Shoot frequency ++', effect: { type: 'freq',  value: -5 } },
  { label: 'Player Speed +', effect: { type: 'speed', value: 0.25 } },
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

  // 初始化血条
  const heroHPBar = document.getElementById('heroHPBar');
  heroHPBar.style.width = '50px'; // 初始血条宽度
  heroHPBar.style.left = `${hero.x + 30}px`; // 血条位置与主角一致
  heroHPBar.style.top = `${hero.y + 10 }px`; // 血条位于主角上方
}

// 在预加载阶段添加优先级提示
function preloadImages(images) {
  images.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
  });
}

// 图片路径数组（根据你的实际路径修改）
const openingImages = [
  'Opening/Opening1.png',
  'Opening/Opening2.png',
  'Opening/Opening3.png',
  'Opening/Opening4.png',
  'Opening/Opening5.png',
];

function playOpeningAnimation() {
  const openingScreen = document.getElementById('openingScreen');
  let currentIndex = 0;
  let animationSkipped = false;

  // 创建图片容器
  const img = document.createElement('img');
  openingScreen.appendChild(img);

  // 预加载图片
  preloadImages(openingImages);


  
  // 显示首屏
  openingScreen.style.display = 'flex';
  
  const showNextImage = () => {
      if (currentIndex >= openingImages.length || animationSkipped) {
          // 动画结束
          openingScreen.style.opacity = '0';
          setTimeout(() => {
              openingScreen.style.display = 'none';
              startGame();
          }, 500);
          return;
      }

      // 更新图片源
      img.src = openingImages[currentIndex];
      openingScreen.style.opacity = '1';

      // 设置定时切换
      setTimeout(() => {
          if (animationSkipped) return;
          openingScreen.style.opacity = '0';
          setTimeout(() => {
              currentIndex++;
              showNextImage();
          }, 500); // 淡出动画时间
      }, 5000); // 每张图片显示时间
  };

  // 开始播放序列
  setTimeout(showNextImage, 100);

  // 跳过动画逻辑
  const skipAnimation = (event) => {
      if (event.keyCode === 32) { // 空格键
          event.preventDefault();
          if (!animationSkipped) {
              animationSkipped = true;
              openingScreen.style.opacity = '0';
              setTimeout(() => {
                  openingScreen.style.display = 'none';
                  startGame();
                  window.removeEventListener('keydown', skipAnimation);
              }, 500);
          }
      }
  };
  window.addEventListener('keydown', skipAnimation);
}

/********************
 * 生成子弹
 ********************/
function spawnBullet() {
  const bulletDiv = document.createElement('div');
  bulletDiv.className = 'bullet';

  let bulletimg='Bullet/smallfireball.gif';

    if(weapontype==1){
        bulletimg = 'Bullet/icefire.png';
    }else if (weapontype == 2) {
         bulletimg = 'Bullet/baozha.png'; // 爆炸弹贴图
    }

    bulletDiv.style.backgroundImage = `url('${bulletimg}')`;
  // 子弹初始位置：主角正中上方
  const bulletX = hero.x;
  const bulletY = hero.y - 15;
  let effectiveDamage = bulletAttack;
    if (weapontype === 2) {
        effectiveDamage = bulletAttack * 1.5; // 爆炸弹伤害=300%
    }
  const bulletObj = {
    element: bulletDiv,
    x: bulletX,
    y: bulletY,
    width: 25,
    height: 25,
    weaponTypeAtFire: weapontype,
    hasHit: false,
    stayFrames: 0,
    isExploded: false,
    damage: effectiveDamage
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
    isFrozen: false, // 初始状态为未冻结
    level: currentLevel,
    slowRemain: 0,
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
function spawnPowerup(x, y, level=1) {
  const powerupDiv = document.createElement('div');
  powerupDiv.className = `powerup level${level}`;

  // 这里也可随机决定增益类型
  const type = Math.random() < 0.5 ? 'freq' : 'Attack';

  const timeScale = Math.floor(timecount / 600); 
  let baseValue;
  let finalValue;
  if (type === 'freq') {
    baseValue = -2; 
    finalValue = baseValue - timeScale*0.5;
  } else {
    baseValue = 5;
    finalValue = baseValue + timeScale*5; 
  }


  const powerupObj = {
    element: powerupDiv,
    x: x,
    y: y,
    width: 30,
    height: 30,
    type: type,
    value: finalValue
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

let valuel = 0;
let valuer = 0;

const doorTimeScale = Math.floor(timecount / 600);

if (
  leftChoice.label === 'Attack ++'
) {
  valuel = doorTimeScale * 20;
} else if (
  leftChoice.label === 'Player Speed +'
) {
  valuel = 0;
} else if (
  leftChoice.label === 'Shoot frequency ++'
) {
  valuel = -doorTimeScale * 2;
}else if (
  leftChoice.label === 'Attack +'
) {
  valuel = doorTimeScale * 10; // 或随时间变化
} else if (
  leftChoice.label === 'Shoot frequency +'
) {
  valuel = -doorTimeScale *1;
}else if (
  leftChoice.label === 'Player Speed ++'
) {
  valuel = 0
} else if (
  leftChoice.label === 'Weapon type +'
) {
  valuel = 0;
}

if (
  rightChoice.label === 'Attack ++'
) {
  valuer = doorTimeScale * 20;
} else if (
  rightChoice.label === 'Player Speed +'
) {
  valuer = 0;
} else if (
  rightChoice.label === 'Shoot frequency ++'
) {
  valuer = -doorTimeScale * 2;
}else if (
  rightChoice.label === 'Attack +'
) {
  valuer = doorTimeScale * 10; // 或随时间变化
} else if (
  rightChoice.label === 'Shoot frequency +'
) {
  valuer = -doorTimeScale *1;
}else if (
  rightChoice.label === 'Player Speed ++'
) {
  valuer = 0
} else if (
  rightChoice.label === 'Weapon type +'
) {
  valuer = 0;
}

let leftEffectValue = leftChoice.effect.value + valuel;
let rightEffectValue = rightChoice.effect.value + valuer;

let leftLabel = leftChoice.label + leftEffectValue;
let rightLabel = rightChoice.label + rightEffectValue;

if(leftChoice.effect.type === 'freq'){
  leftLabel = leftChoice.label + (-leftEffectValue);
}
if(rightChoice.effect.type === 'freq'){
  rightLabel = rightChoice.label + (-rightEffectValue);
}
  // 创建左、右选项
  const leftOptionDiv = document.createElement('div');
  leftOptionDiv.className = 'doorOption';
  leftOptionDiv.textContent = leftLabel;

  const rightOptionDiv = document.createElement('div');
  rightOptionDiv.className = 'doorOption';
  rightOptionDiv.textContent = rightLabel;

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
    effect: { ...leftChoice.effect, value: leftEffectValue },
    groupId: groupId,
    parent: doorRowDiv
  };
  const doorObjRight = {
    element: rightOptionDiv,
    x: 200,
    y: -60,
    width: 200,
    height: 60,
    effect: { ...rightChoice.effect, value: rightEffectValue },
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
    if (isheroCollision(hero, d)) {
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
    case 'Attack':
      bulletAttack += effect.value;
      break;
    case 'speed':
      hero.speed += effect.value;
      break;
    case 'freq':
      bulletSpawnRate = Math.max(10, bulletSpawnRate + effect.value);
      break;
    case 'weapon':
      if (weapontype == 0)
      {
      weapontype += 1;
      bullets.forEach(bullet => {
        bullet.element.style.backgroundImage = 'url("Bullet/icefire.png")';
      });
      break;
      }
      else
      {
        break;
      }
  }
  // 更新属性栏
  updateHeroStats();
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
 * 新增对话相关变量
 ********************/
const bossDialogue = [
  "Sun: Needy Yan, Woody Tsu, CSRMMZZYGAG...... ",
  "Salted Fish: For the survival of the kingdom, I must stop you!",
  "Sun: Vansoi!",
  "Hint: Avoid the bullet barrage! Attack the core weak point!"
];
let currentDialogueIndex = 0;
let isInDialogue = false;


/********************
 * 修改 initBoss 函数
 ********************/
function initBoss() {
  // 暂停游戏
  isInDialogue = true;
  
  // 显示对话框
  const dialogueBox = document.getElementById('boss-dialogue');
  dialogueBox.style.display = 'block';
  currentDialogueIndex = 0;
  updateDialogue();
  
  // 绑定空格键事件
  document.addEventListener('keydown', handleDialogueKey);
}

/********************
 * 新增对话处理函数
 ********************/
function updateDialogue() {
  const textElement = document.getElementById('dialogue-text');
  if (currentDialogueIndex < bossDialogue.length) {
    textElement.textContent = bossDialogue[currentDialogueIndex];
    currentDialogueIndex++;
  } else {
    // 对话结束
    const dialogueBox = document.getElementById('boss-dialogue');
    dialogueBox.style.display = 'none';
    isInDialogue = false;
    
    // 解除按键监听
    document.removeEventListener('keydown', handleDialogueKey);
    
    // 正式启动Boss战
    startRealBossFight();
  }
}

/********************
 * 修改后的真正Boss战启动函数
 ********************/
function startRealBossFight() {
  // 原有initBoss的内容
  boss.originalBulletSpawnRate = boss.bulletSpawnRate; 
  bgm.pause();
  bossBgm.currentTime = 0;
  bossBgm.play();
  removeAllMonstersNoReward();
  gameContainer.appendChild(bossHPElement);

  const bossDiv = document.createElement('div');
  bossDiv.className = 'boss';
  bossDiv.style.backgroundImage = 'url("monster/bigsun.jpg")';
  bossDiv.style.backgroundSize = 'cover';
  gameContainer.appendChild(bossDiv);
  boss.element = bossDiv;
  updatePosition(boss);
  boss.isAlive = true;

  bossHPElement.id = 'bossHP';
  gameContainer.appendChild(bossHPElement);
  updateBossHP();
  
  // 恢复游戏循环
  if (!frameId) gameLoop();
}

function handleDialogueKey(e) {
  if (e.code === 'Space') {
    e.preventDefault();
    updateDialogue();
  }
}


function removeAllMonstersNoReward() {
  for (let i = monsters.length - 1; i >= 0; i--) {
    if (monsters[i].hpElement && monsters[i].hpElement.parentNode) {
      monsters[i].hpElement.parentNode.removeChild(monsters[i].hpElement);
    }
    removeGameObject(monsters, i);
  }
}

function spawnBossBullet(angle, speed = bossBulletSpeed) {
  const bulletDiv = document.createElement('div');
  bulletDiv.className = 'bossBullet';
  bulletDiv.style.backgroundSize = 'cover';
  if (boss.slowRemain > 0) {
    // 让该弹幕添加 hue-rotate 滤镜
    bulletDiv.classList.add('bossBulletFrozen');
  } else {
    // 否则保持原样
    bulletDiv.style.filter = 'none';
  }
  const bulletObj = {
    element: bulletDiv,
    x: boss.x + boss.width / 2 - 10, // 从Boss中心发射
    y: boss.y + boss.height / 2 - 10,
    width: 20,
    height: 20,
    angle: angle, // 弹幕的角度
    speed: speed // 弹幕的速度
  };
  bossBullets.push(bulletObj);
  gameContainer.appendChild(bulletDiv);
  updatePosition(bulletObj);
}

function spawnBossBulletSpiral(angle, speed = bossBulletSpeed) {
  const bulletDiv = document.createElement('div');
  bulletDiv.className = 'spiral';
  bulletDiv.style.backgroundSize = 'cover';

  const bulletObj = {
    element: bulletDiv,
    x: boss.x + boss.width / 2 - 10, // 从Boss中心发射
    y: boss.y + boss.height / 2 - 10,
    width: 42,
    height: 14,
    angle: angle, // 弹幕的角度
    speed: speed // 弹幕的速度
  };
  bossBullets.push(bulletObj);
  gameContainer.appendChild(bulletDiv);
  updatePosition(bulletObj);
}

function spawnBossBulletHoming(angle, speed = bossBulletSpeed) {
  const bulletDiv = document.createElement('div');
  bulletDiv.className = 'homing';
  bulletDiv.style.backgroundSize = 'cover';

  const bulletObj = {
    element: bulletDiv,
    x: boss.x + boss.width / 2 - 10, // 从Boss中心发射
    y: boss.y + boss.height / 2 - 10,
    width: 42,
    height: 14,
    angle: angle, // 弹幕的角度
    speed: speed // 弹幕的速度
  };
  bossBullets.push(bulletObj);
  gameContainer.appendChild(bulletDiv);
  updatePosition(bulletObj);
}

// 第一阶段弹幕：简单的放射状弹幕
function spawnBossBulletsPhase1() {
  for (let i = 0; i < 8; i++) {
    spawnBossBullet((Math.PI * 2 / 8) * i); // 8个方向的弹幕
  }
}

// 第二阶段弹幕：螺旋弹幕 + 追踪弹幕
function spawnBossBulletsPhase2() {
  // 螺旋弹幕
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 / 12) * i + (boss.bulletSpawnCounter * 0.1); // 角度随时间变化
    spawnBossBulletSpiral(angle, 2); // 速度稍快
  }

  // 追踪弹幕
  const angleToHero = Math.atan2(hero.y - boss.y, hero.x - boss.x);
  spawnBossBulletHoming(angleToHero, 3); // 速度更快
}

// 第三阶段弹幕：更复杂的弹幕炼狱
function spawnBossBulletsPhase3() {
  // 放射状弹幕
  for (let i = 0; i < 16; i++) {
    spawnBossBullet((Math.PI * 2 / 16) * i); // 16个方向的弹幕
  }

  // 螺旋弹幕
  for (let i = 0; i < 24; i++) {
    const angle = (Math.PI * 2 / 24) * i + (boss.bulletSpawnCounter * 0.2); // 角度随时间变化
    spawnBossBulletSpiral(angle, 3); // 速度更快
  }

  // 追踪弹幕
  const angleToHero = Math.atan2(hero.y - boss.y, hero.x - boss.x);
  spawnBossBulletHoming(angleToHero, 4); // 速度更快
}

/********************
 * 修改游戏循环
 ********************/
function gameLoop() {
  if (isGameOver || isInDialogue) { // 添加对话状态判断
    clearTimeout(frameId);
    if (!isGameOver) frameId = setTimeout(gameLoop, 1000 / 60);
    return;
  }
  updateAll();
  frameId = setTimeout(gameLoop, 1000 / 60);
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

  if (doorSpawnCounter >= doorSpawnRate && !boss.isAlive) {
    spawnDoor();
    doorSpawnCounter = 0;
  }
  if (monsterSpawnCounter >= monsterSpawnRate && !boss.isAlive) {
    spawnMonster();
    monsterSpawnCounter = 0;
  }
  // 根据 timecount 动态调整怪物生成、怪物血量
  if (timecount <= 3000) {
    switch (timecount) {
      case 1:
        monsterSpawnRate = 120;
        monsterHP = 100;   // 例：怪物血量变为 200
        break;
      case 600:
        monsterSpawnRate = 120;
        monsterHP = 200;   // 例：怪物血量变为 250
        currentLevel++;   // 例：怪物血量变为 250
        console.log("Enter Level 2"); // 添加日志确认代码执行
        if (!level2Bubble) {
          createLevelBubble();
        }
        break;
      case 1200:
        monsterSpawnRate = 110;
        monsterHP = 400;   // 例：怪物血量变为 300
        currentLevel++;    // 例：怪物血量变为 300
        break;
      case 1800:
        monsterSpawnRate = 110;
        monsterHP = 600;   // 例：怪物血量变为 400
        currentLevel++;   // 例：怪物血量变为 400
        break;
      case 2400:
        monsterSpawnRate = 100;
        monsterHP = 800;   // 例：怪物血量变为 500
        currentLevel++;   // 例：怪物血量变为 500
        break;
      
    }
  } else {
    currentLevel=6; 
    monsterSpawnRate = 90;
    monsterHP = Math.floor(-300 + timecount*0.5);
  }
  levelElement.textContent = "Level: " + currentLevel;
  if (timecount>=4800 &&!boss.isAlive) {
    initBoss();
  }
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'o' || e.key === 'O') && !boss.isAlive) {
      initBoss();
    }
  }
  );
  document.addEventListener('keydown', (e) => {
    if ((e.key === '0' )) {
      weapontype = 0;
    }
  }
  )
  document.addEventListener('keydown', (e) => {
    if ((e.key === '1' )) {
      weapontype = 1;
    }
  }
  )
  document.addEventListener('keydown', (e) => {
    if ((e.key === '2')) {
      weapontype = 2;
    }
  }
  )
  updateHero();
  updateBullets();
  updateMonstersAll();
  updatePowerups();
  updateDoors();
  updateBoss();
  updateBossBullets();
  updateHeroHPBar();
  updateHeroStats()
  if (level2Bubble) {
    bubbleDisplayTime++;
    if (bubbleDisplayTime >= 240) { // 60帧/秒 * 4秒
      removeBubble();
    }
  }
}

/********************
 * 更新主角
 ********************/
function updateHero() {
  // 检测当前移动方向
  let currentDirection = '';
  if (leftPressed && !rightPressed) {
    currentDirection = 'left';
    hero.x -= hero.speed;
    if (hero.x < 0) hero.x = 0;
  } else if (rightPressed && !leftPressed) {
    currentDirection = 'right';
    hero.x += hero.speed;
    if (hero.x + hero.width > containerWidth) {
      hero.x = containerWidth - hero.width;
    }
  }

  // 方向改变时执行翻转
  if (currentDirection && currentDirection !== hero.lastDirection) {
    // 使用CSS transform实现平滑翻转
    hero.element.style.transform = `scaleX(${currentDirection === 'left' ? -1 : 1})`;
    
    // 如果需要保持元素位置不变，添加偏移修正
    const flipOffset = currentDirection === 'left' ? hero.width : 0;
    hero.element.style.transform = `scaleX(${currentDirection === 'left' ? -1 : 1})`;
    // 更新状态记录
    hero.isFlipped = currentDirection === 'left';
    hero.lastDirection = currentDirection;
  }

  

  updatePosition(hero);
  let effectiveSpawnRate = bulletSpawnRate;
    if (weapontype === 2) {
        effectiveSpawnRate = bulletSpawnRate * 3; // 爆炸弹 => 发射间隔×3 => 攻速=1/3
    }
  // 子弹发射
  bulletSpawnCounter++;
  if (bulletSpawnCounter >= effectiveSpawnRate) {
    spawnBullet();
    bulletSpawnCounter = 0;
  }
}

function updateHeroHPBar() {
  const heroHPBar = document.getElementById('heroHPBar');
  const hpPercentage = (playerHP / playerHPinitial) * 10; // 计算血量百分比
  heroHPBar.style.width = `${hpPercentage}%`; // 根据血量百分比调整血条宽度
  heroHPBar.style.left = `${hero.x + 18}px`; // 血条位置与主角一致
  heroHPBar.style.top = `${hero.y}px`; // 血条位于主角上方
}

/********************
 * 更新怪物
 ********************/
/********************
 * 更新怪物
 ********************/
function updateMonstersAll() {

  // 移动怪物
  for (let i = 0; i < monsters.length; i++) {
    const m = monsters[i];

    // 如果怪物没有被冻结，则更新位置
    if (!m.isFrozen) {
      if (m.slowRemain > 0) {
             m.slowRemain--;
             m.y += monsterSpeed * Math.random() * 0.5;
             if (m.slowRemain <= 0) {
               m.element.classList.remove('frozen');
             }
           } else {
              m.y += monsterSpeed * Math.random();
           }
        
      updateMonster(m);
    }

    // 离开屏幕
    if (m.y > containerHeight) {
      removeMonster(monsters, i);
      i--;
      continue;
    }

    // 碰撞主角
    if (isheroCollision(hero, m)) {
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
    if (!b.hasHit) {
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
          // //
          if (weapontype == 0)
          {
            hitSounds.default.currentTime = 0;
            hitSounds.default.play();
          }
          else if (weapontype == 1)
          {
            hitSounds.ice.currentTime = 0;
            hitSounds.ice.play();
          }
          else if (weapontype == 2)
            {
              hitSounds.explode.currentTime = 0;
              hitSounds.explode.play();
            }
          // //
          if (b.weaponTypeAtFire === 1) {
            m.slowRemain = 60;  // 重置/设置剩余帧
            m.element.classList.add('frozen'); 
            b.hasHit = true;
            b.stayFrames = 30;
            b.element.style.backgroundImage = 'url("Bullet/snowflake.png")';
            m.hp -= b.damage;
            } 
            else if(b.weaponTypeAtFire === 2){
              m.hp -= 2*b.damage;
              b.hasHit = true;
              b.isExploded = true;      // 标记已爆炸
              b.stayFrames = 32;        
              b.explosionFrameIndex = 1;
              b.width = 200;
              b.height = 200;
              b.element.classList.add("explosion");
              b.element.style.backgroundImage = 'url("Bullet/exp/exp1.png")';
              // 改成以碰撞点为中心(简单用 b.x,b.y)
              b.x = b.x  - 100; 
              b.y = b.y  - 100;
              updatePosition(b);
              
            }
            else {
              m.hp -= b.damage;
          removeGameObject(bullets, i);
          i--;
          }
          // //
          if (m.hp <= 0) {
            score += 5;  // 击杀加分
            scoreElement.textContent = `Score: ${score}`;
            spawnPowerup(m.x + m.width / 2, m.y + m.height / 2, m.level);
            removeMonster(monsters, j);
          }
          break;
        }
      }
    }
    else{
      b.stayFrames--;
      if (b.isExploded) {
        // 总帧=32, 每2帧播下一个
        const framesPassed = 32 - b.stayFrames; 
        if (framesPassed % 2 === 0) {
            b.explosionFrameIndex++;
            if (b.explosionFrameIndex <= 16) {
                b.element.style.backgroundImage =
                  'url("Bullet/exp/exp' + b.explosionFrameIndex + '.png")';
            }
        }
        if (b.stayFrames === 31) {
          applyExplosionDamage(b);
        }
      }
      if (b.stayFrames <= 0) {
        removeGameObject(bullets, i);
        i--;
      }
    }
  }
}

function applyExplosionDamage(bullet) {
  // bullet.x, bullet.y, bullet.width=100, bullet.height=100
  // 计算范围 bounding box
  const left = bullet.x;
  const right = bullet.x + bullet.width;
  const top = bullet.y;
  const bottom = bullet.y + bullet.height;

  // 对所有怪物遍历
  for (let i = monsters.length - 1; i >= 0; i--) {
    const m = monsters[i];
    // 怪物中心 or bounding box? 这里使用 bounding box 相交即可
    const mxLeft = m.x, mxRight = m.x + m.width;
    const myTop = m.y, myBottom = m.y + m.height;
    const distance = Math.sqrt(Math.pow(left-mxLeft,2)+Math.pow(top-myTop,2));
    // 判断是否相交
    const notCollide = (mxRight < left) || (mxLeft > right) || (myBottom < top) || (myTop > bottom);
    let explodedamage = 2*bullet.damage;
    if (!notCollide) {
      if(distance>1&&distance<=100*Math.sqrt(5)){
        explodedamage = (100*Math.sqrt(5)-distance)*explodedamage/(100*Math.sqrt(5)-1);
      }
      m.hp -= explodedamage;
      m.hp = Math.floor(m.hp) ;// 同样伤害
      // 若死亡
      if (m.hp <= 0) {
        score += 5;
        scoreElement.textContent = `Score: ${score}`;
        spawnPowerup(m.x + m.width / 2, m.y + m.height / 2, m.level);
        removeMonster(monsters, i);
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
    if (isheroCollision(hero, p)) {
      if (p.type === 'freq') {
        // 每次 -1 或 -2，保证最小10
        bulletSpawnRate = Math.max(10, bulletSpawnRate + p.value);
      } else if (p.type === 'Attack') {
        bulletAttack += p.value;
      }
      removeGameObject(powerups, i);
      i--;
      // 更新属性栏
      updateHeroStats();
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

function isheroCollision(a, b) {
  return !(
    a.x + a.width + 20 < b.x || // 让 a 的碰撞箱左移 10px
    a.x + 20 > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

function updateBoss() {
  if (!boss.isAlive) return;

  // 更新Boss血条
  updateBossHP();

  // Boss移动逻辑
  if (boss.slowRemain > 0) {
       boss.slowRemain--;
       boss.x += boss.speed * 0.7 * boss.direction;
       if (boss.slowRemain <= 0) {
        boss.element.classList.remove('frozen');
        boss.bulletSpawnRate = boss.originalBulletSpawnRate;
      }
     } 
     else {
        boss.x += boss.speed * boss.direction;
     }
  if (boss.x + boss.width > containerWidth || boss.x < 0) {
    boss.direction *= -1; // 反转方向
  }

  // 更新Boss位置
  updatePosition(boss);

  // 根据Boss血量调整背景音乐音量
  if (boss.hp <= 0.1 * boss.initialhp) {
    // 当Boss血量低于50%时，逐渐减小背景音乐音量
    const volume = (boss.hp / (0.1 * boss.initialhp)) * 0.1; // 音量从50%逐渐减小到0
    bgm.volume = Math.max(0, volume); // 确保音量不小于0
  }

  // 根据Boss血量切换阶段
  if (boss.hp <= 0.8 * boss.initialhp && bossPhase === 1) {
    bossPhase = 2;
    console.log("Boss进入第二阶段");
    boss.element.style.backgroundImage = 'url("monster/secondsun.jpg")'; // 更换Boss外观
    boss.element.classList.add('boss-phase-transition'); // 添加转阶段动画
    setTimeout(() => {
      boss.element.classList.remove('boss-phase-transition'); // 动画结束后移除类
    }, 1000); // 动画持续1秒
  } else if (boss.hp <= 0.5 * boss.initialhp && bossPhase === 2) {
    bossPhase = 3;
    console.log("Boss进入第三阶段");
    boss.element.style.backgroundImage = 'url("monster/thirdsun.jpg")'; // 更换Boss外观
    boss.element.classList.add('boss-phase-transition'); // 添加转阶段动画
    setTimeout(() => {
      boss.element.classList.remove('boss-phase-transition'); // 动画结束后移除类
    }, 1000); // 动画持续1秒
  }

  // Boss发射弹幕
  boss.bulletSpawnCounter++;
  if (boss.bulletSpawnCounter >= boss.bulletSpawnRate) {
    switch (bossPhase) {
      case 1:
        spawnBossBulletsPhase1(); // 第一阶段弹幕
        break;
      case 2:
        spawnBossBulletsPhase2(); // 第二阶段弹幕
        break;
      case 3:
        spawnBossBulletsPhase3(); // 第三阶段弹幕
        break;
    }
    boss.bulletSpawnCounter = 0;
  }

  // 检测玩家子弹与Boss碰撞
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    if (isCollision(b, boss)&&!b.hasHit) {
      if(b.weaponTypeAtFire === 1){
        hitSounds.ice.currentTime = 0;
        hitSounds.ice.play();
        boss.hp -= b.damage;
        boss.slowRemain = 60;
        boss.bulletSpawnRate = 90; 
        boss.element.classList.add('frozen');
        b.hasHit = true;
        b.stayFrames = 30;    
        b.element.style.backgroundImage = 'url("Bullet/snowflake.jpg")';
        if (boss.hp <= 0) {
        boss.isAlive = false;
        removeGameObject([boss], 0); // 移除Boss
        score += 100; // 击败Boss加100分
        scoreElement.textContent = `Score: ${score}`;
        isGameOver = true;

        // 隐藏Boss血条
        bossHPElement.style.display = 'none';
        updateBossHP(); // 更新Boss血条

        // 播放胜利视频
        playVictoryVideo();
       }
      }
      else if(b.weaponTypeAtFire === 0){
        boss.hp -= b.damage;
            hitSounds.default.currentTime = 0;
            hitSounds.default.play();
        removeGameObject(bullets, i);
        i--;
        if (boss.hp <= 0) {
          boss.isAlive = false;
          removeGameObject([boss], 0); // 移除Boss
          score += 100; // 击败Boss加100分
          scoreElement.textContent = `Score: ${score}`;
          isGameOver = true;

          // 隐藏Boss血条
          bossHPElement.style.display = 'none';
          updateBossHP(); // 更新Boss血条

          // 播放胜利视频
          playVictoryVideo();
      }
      }
      else if (b.weaponTypeAtFire === 2) {
           // 爆炸弹
           boss.hp -= b.damage;
           hitSounds.explode.currentTime = 0;
           hitSounds.explode.play();
           b.hasHit = true;
           b.isExploded = true;
           b.stayFrames = 32;
           b.explosionFrameIndex = 1;
           b.width = 200;
           b.height = 200;
           b.x = b.x  - 100; 
           b.y = b.y  - 100;
           b.element.classList.add("explosion");
           b.element.style.backgroundImage = 'url("Bullet/exp/exp1.png")';
            updatePosition(b);
            if (boss.hp <= 0) {
            boss.isAlive = false;
            removeGameObject([boss], 0); // 移除Boss
            score += 100; // 击败Boss加100分
            scoreElement.textContent = `Score: ${score}`;
            isGameOver = true;
  
            // 隐藏Boss血条
            bossHPElement.style.display = 'none';
            updateBossHP(); // 更新Boss血条
  
            // 播放胜利视频
            playVictoryVideo();
           }
         }
    }
  }
}


// 播放胜利视频
function playVictoryVideo() {
  const videoContainer = document.getElementById('videoContainer');
  const videoPlayer = document.getElementById('videoPlayer');

  // 显示视频容器
  videoContainer.style.display = 'block';

  // 播放视频
  videoPlayer.play();

  // 视频播放结束后隐藏视频容器
  videoPlayer.addEventListener('ended', () => {
    videoContainer.style.display = 'none';
    // 可以在这里添加其他逻辑，比如返回主菜单或重新开始游戏
  });
}

function updateBossBullets() {
  for (let i = 0; i < bossBullets.length; i++) {
    const b = bossBullets[i];
    // 根据角度移动弹幕
    b.x += b.speed * Math.cos(b.angle);
    b.y += b.speed * Math.sin(b.angle);
    updatePosition(b);

    // 超出屏幕则移除
    if (b.x < 0 || b.x > containerWidth || b.y < 0 || b.y > containerHeight) {
      removeGameObject(bossBullets, i);
      i--;
      continue;
    }

    // 检测弹幕与玩家碰撞
    if (isheroCollision(hero, b)) {
      playerHP -= 10; // 玩家扣血
      playerHPElement.textContent = `HP: ${playerHP}`;
      if (playerHP <= 0) {
        isGameOver = true;
      }
      removeGameObject(bossBullets, i);
      i--;
    }
  }
}


// 更新Boss血条
function updateBossHP() {
  const hpPercentage = (boss.hp / boss.initialhp) * 100; // 计算血量百分比
  bossHPElement.style.setProperty('--hp-width', `${hpPercentage}%`); // 根据血量百分比调整血条宽度
  bossHPElement.setAttribute('data-hp', `${Math.round(hpPercentage)}%`); // 更新血量百分比显示
}
//更新属性栏
function updateHeroStats() {
  document.getElementById('heroAttack').textContent = bulletAttack;
  document.getElementById('heroAttackSpeed').textContent = bulletSpawnRate;
  document.getElementById('heroMoveSpeed').textContent = hero.speed; // 更新移动速度
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
  gameoverDiv.innerText = 'Game Over!';
  gameContainer.appendChild(gameoverDiv);

  // 停止背景音乐
  bgm.pause();
  bossBgm.pause();
  bossHPElement.style.display = 'none';
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
  //显示bat
  document.body.classList.add('game-active');
  // 重置游戏状态
  isGameOver = false;
  hero.isAlive = true;
  hero.x = containerWidth / 2 - 25;
  hero.y = containerHeight - 95;

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

  // 初始化人物属性栏
  updateHeroStats();

  // 启动背景音乐
  bgm.currentTime = 0;
  bgm.play().catch(e => console.log("音乐播放需要用户交互"));

  // 初始化主角
  initHero();

  // 启动游戏循环
  gameLoop();
}
/********************
 * 监听“开始游戏”按钮
 ********************/
document.getElementById('startButton').addEventListener('click', (event) => {
  event.preventDefault(); // 防止按钮触发默认行为
  document.getElementById('mainMenu').style.display = 'none'; // 隐藏主菜单
  playOpeningAnimation(); // 播放动画
});


function createLevelBubble() {
  level2Bubble = document.createElement('div');
  level2Bubble.className = 'level-bubble';

  // 获取游戏容器的位置（相对于视口）
  const gameRect = gameContainer.getBoundingClientRect();
  
  // 计算气泡位置（左侧偏移262px + 20px间距）
  const bubbleX = gameRect.left - 262 - 20; 
  // 根据主角的Y坐标（需转换为页面坐标）
  const bubbleY = gameRect.top + hero.y - 100; 

  // 设置样式
  level2Bubble.style.cssText = `
    position: fixed;
    width: 205px;
    height: 222px;
    background-image: url('Others/Chatbox1.png'); // 测试用占位图
    background-size: cover;
    left: ${bubbleX + 30}px;
    top: ${bubbleY - 370}px;
    opacity: 1; // 暂时关闭淡入，直接显示
    z-index: 9999; // 确保层级最高
    pointer-events: none;
  `;

  document.body.appendChild(level2Bubble);
}

function removeBubble() {
  if (level2Bubble) {
    level2Bubble.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(level2Bubble);
      level2Bubble = null;
      bubbleDisplayTime = 0;
    }, 500);
  }
}