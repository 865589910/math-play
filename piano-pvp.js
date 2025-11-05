// 数学钢琴块 - 双人对战模式

// 游戏状态
const gameState = {
    isPlaying: false,
    speed: 0.8,
    spawnInterval: 2000, // 初始生成间隔（毫秒）
    minSpawnInterval: 800,
    gameMode: 'add-sub', // 'add-sub' 或 'multiply'
    
    player1: {
        score: 0,
        lives: 3,
        tiles: [],
        lastSpawnTime: 0,
        isAlive: true
    },
    
    player2: {
        score: 0,
        lives: 3,
        tiles: [],
        lastSpawnTime: 0,
        isAlive: true
    },
    
    gameInterval: null,
    spawnInterval1: null,
    spawnInterval2: null
};

// 更新速度显示
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');

speedSlider.addEventListener('input', (e) => {
    speedValue.textContent = parseFloat(e.target.value).toFixed(1);
});

// 选择游戏模式
function selectMode(mode) {
    gameState.gameMode = mode;
    
    // 更新按钮状态
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (mode === 'add-sub') {
        document.querySelector('.mode-btn:nth-child(1)').classList.add('active');
    } else {
        document.querySelector('.mode-btn:nth-child(2)').classList.add('active');
    }
}

// 检测设备类型
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// 开始游戏
function startPVPGame() {
    // 获取速度设置
    gameState.speed = parseFloat(speedSlider.value);
    
    // 初始化游戏状态
    gameState.isPlaying = true;
    gameState.player1 = { score: 0, lives: 3, tiles: [], lastSpawnTime: 0, isAlive: true };
    gameState.player2 = { score: 0, lives: 3, tiles: [], lastSpawnTime: 0, isAlive: true };
    
    // 切换界面
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    
    // 更新UI
    updatePlayerUI(1);
    updatePlayerUI(2);
    
    // 清空容器
    document.getElementById('tiles-p1').innerHTML = '';
    document.getElementById('tiles-p2').innerHTML = '';
    
    // 开始游戏循环
    gameState.gameInterval = setInterval(() => {
        updateGame();
    }, 1000 / 60); // 60 FPS
    
    // 开始生成钢琴块
    gameState.spawnInterval1 = setInterval(() => {
        spawnTile(1);
    }, gameState.spawnInterval);
    
    gameState.spawnInterval2 = setInterval(() => {
        spawnTile(2);
    }, gameState.spawnInterval);
    
    // 为移动端添加触摸事件支持
    if (isTouchDevice()) {
        setupTouchControls();
    }
}

// 为移动端设置触摸控制
function setupTouchControls() {
    const tilesContainer1 = document.getElementById('tiles-p1');
    const tilesContainer2 = document.getElementById('tiles-p2');
    
    // 玩家1触摸事件
    tilesContainer1.addEventListener('touchstart', function(e) {
        e.preventDefault();
        handleTouch(e, 1);
    }, { passive: false });
    
    // 玩家2触摸事件
    tilesContainer2.addEventListener('touchstart', function(e) {
        e.preventDefault();
        handleTouch(e, 2);
    }, { passive: false });
}

// 处理触摸事件
function handleTouch(e, playerNum) {
    if (!gameState.isPlaying) return;
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && element.classList.contains('piano-tile')) {
        // 获取算式信息
        const equation = element.textContent;
        const isCorrect = element.dataset.isCorrect === 'true';
        
        // 触发点击事件
        handleTileClick(playerNum, element, isCorrect);
    }
}

// 生成钢琴块
function spawnTile(playerNum) {
    if (!gameState.isPlaying) return;
    
    const player = playerNum === 1 ? gameState.player1 : gameState.player2;
    const container = document.getElementById(`tiles-p${playerNum}`);
    
    // 检查玩家是否还有生命值
    if (!player.isAlive) return;
    
    // 检查当前钢琴块数量（最多4个）
    const activeTiles = player.tiles.filter(tile => tile.element.parentNode).length;
    if (activeTiles >= 4) return;
    
    // 随机选择列位置（5列布局）
    let column;
    let attempts = 0;
    const maxAttempts = 30;
    const minSafeDistance = 200; // 钢琴块之间的最小距离（调整为适应新高度）
    
    do {
        column = Math.floor(Math.random() * 5);
        attempts++;
        
        // 检查该列是否有钢琴块
        const tilesInColumn = player.tiles.filter(tile => tile.column === column);
        
        if (tilesInColumn.length === 0) {
            break;
        }
        
        // 检查距离
        let canSpawn = true;
        for (const existingTile of tilesInColumn) {
            if (existingTile.y < minSafeDistance) {
                canSpawn = false;
                break;
            }
        }
        
        if (canSpawn) break;
        
        if (attempts >= maxAttempts) return;
    } while (true);
    
    // 生成算式
    let equationData;
    if (gameState.gameMode === 'multiply') {
        equationData = generateMultiplicationEquation();
    } else {
        equationData = generateAddSubEquation();
    }
    
    const { equation, isCorrect } = equationData;
    
    // 创建钢琴块元素
    const tile = document.createElement('div');
    tile.className = 'piano-tile';
    tile.textContent = equation;
    tile.style.backgroundColor = '#00f2fe';
    tile.style.left = `${column * 20}%`;
    tile.style.top = '0px';
    
    // 为移动端添加数据属性
    tile.dataset.isCorrect = isCorrect;
    
    // 点击事件
    tile.addEventListener('click', () => handleTileClick(playerNum, tile, isCorrect));
    
    // 为移动端添加触摸事件
    if (isTouchDevice()) {
        tile.addEventListener('touchstart', function(e) {
            e.preventDefault();
            handleTileClick(playerNum, tile, isCorrect);
        }, { passive: false });
    }
    
    container.appendChild(tile);
    
    // 保存到状态
    player.tiles.push({
        element: tile,
        isCorrect: isCorrect,
        y: 0,
        column: column
    });
}

// 生成乘法算式（1-5的表内乘法）
function generateMultiplicationEquation() {
    // 随机选择1-5的数字
    const num1 = Math.floor(Math.random() * 5) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1; // 1-9
    const correctAnswer = num1 * num2;
    
    // 随机决定是否正确（50%概率）
    const isCorrect = Math.random() > 0.5;
    let displayAnswer;
    
    if (isCorrect) {
        displayAnswer = correctAnswer;
    } else {
        // 生成错误答案（相差1-10）
        const offset = Math.floor(Math.random() * 10) + 1;
        displayAnswer = correctAnswer + (Math.random() > 0.5 ? offset : -offset);
        // 确保答案不为负数且在合理范围内
        if (displayAnswer < 1) displayAnswer = correctAnswer + offset;
        if (displayAnswer > 81) displayAnswer = correctAnswer - offset;
        if (displayAnswer < 1) displayAnswer = 1;
    }
    
    const equation = `${num1} × ${num2} = ${displayAnswer}`;
    return { equation, isCorrect };
}

// 生成加减法算式（100以内）
function generateAddSubEquation() {
    let num1, num2, operator, correctAnswer, displayAnswer;
    let attempts = 0;
    const maxAttempts = 50;
    const range = 100;
    
    do {
        num1 = Math.floor(Math.random() * range) + 1;
        num2 = Math.floor(Math.random() * range) + 1;
        operator = Math.random() > 0.5 ? '+' : '-';
        attempts++;
        
        if (operator === '+') {
            correctAnswer = num1 + num2;
            if (correctAnswer <= range) break;
        } else {
            if (num1 >= num2) {
                correctAnswer = num1 - num2;
                break;
            } else if (num2 > num1) {
                correctAnswer = num2 - num1;
                [num1, num2] = [num2, num1];
                break;
            }
        }
        
        if (attempts >= maxAttempts) {
            operator = '-';
            if (num1 < num2) [num1, num2] = [num2, num1];
            correctAnswer = num1 - num2;
            break;
        }
    } while (true);
    
    // 随机决定是否正确（50%概率）
    const isCorrect = Math.random() > 0.5;
    
    if (isCorrect) {
        displayAnswer = correctAnswer;
    } else {
        const offset = Math.floor(Math.random() * 5) + 1;
        displayAnswer = correctAnswer + (Math.random() > 0.5 ? offset : -offset);
        
        if (displayAnswer < 0) displayAnswer = correctAnswer + offset;
        if (displayAnswer > range) displayAnswer = correctAnswer - offset;
        if (displayAnswer < 0) displayAnswer = 1;
    }
    
    const equation = `${num1} ${operator} ${num2} = ${displayAnswer}`;
    
    return { equation, isCorrect };
}

// 处理钢琴块点击
function handleTileClick(playerNum, tileElement, isCorrect) {
    if (!gameState.isPlaying) return;
    
    const player = playerNum === 1 ? gameState.player1 : gameState.player2;
    const tileIndex = player.tiles.findIndex(t => t.element === tileElement);
    
    if (tileIndex === -1) return;
    
    if (isCorrect) {
        // 点击正确：+2分
        player.score += 2;
        tileElement.style.backgroundColor = '#4caf50';
        tileElement.innerHTML = '✓';
        
        // 每10分增加速度
        if (player.score % 10 === 0 && player.score > 0) {
            gameState.speed += 0.05;
            
            // 减少生成间隔
            gameState.spawnInterval = Math.max(
                gameState.minSpawnInterval,
                gameState.spawnInterval - 100
            );
            
            // 重新设置生成间隔
            if (playerNum === 1 && gameState.spawnInterval1) {
                clearInterval(gameState.spawnInterval1);
                gameState.spawnInterval1 = setInterval(() => spawnTile(1), gameState.spawnInterval);
            } else if (playerNum === 2 && gameState.spawnInterval2) {
                clearInterval(gameState.spawnInterval2);
                gameState.spawnInterval2 = setInterval(() => spawnTile(2), gameState.spawnInterval);
            }
        }
    } else {
        // 点击错误：扣1条命
        player.lives--;
        tileElement.style.backgroundColor = '#f44336';
        tileElement.innerHTML = '✗';
        
        // 检查是否还有生命值
        if (player.lives <= 0) {
            player.lives = 0; // 确保生命值不为负数
            player.isAlive = false;
            updatePlayerUI(playerNum); // 立即更新UI显示生命值为0
            // 检查是否应该结束游戏
            checkGameEndCondition();
            return;
        }
        // 更新UI显示剩余生命值
        updatePlayerUI(playerNum);
    }
    
    // 移除钢琴块
    setTimeout(() => {
        if (tileElement.parentNode) {
            tileElement.parentNode.removeChild(tileElement);
        }
    }, 200);
    
    player.tiles.splice(tileIndex, 1);
}

// 检查游戏结束条件
function checkGameEndCondition() {
    const p1Alive = gameState.player1.isAlive;
    const p2Alive = gameState.player2.isAlive;
    const p1Score = gameState.player1.score;
    const p2Score = gameState.player2.score;
    
    // 如果双方都无生命值，游戏结束
    if (!p1Alive && !p2Alive) {
        endGame();
        return;
    }
    
    // 如果玩家1无生命值但玩家2有生命值
    if (!p1Alive && p2Alive) {
        // 如果玩家2的分数超过玩家1，游戏结束
        if (p2Score > p1Score) {
            endGame();
            return;
        }
    }
    
    // 如果玩家2无生命值但玩家1有生命值
    if (!p2Alive && p1Alive) {
        // 如果玩家1的分数超过玩家2，游戏结束
        if (p1Score > p2Score) {
            endGame();
            return;
        }
    }
}

// 更新游戏状态
function updateGame() {
    if (!gameState.isPlaying) return;
    
    // 更新玩家1的钢琴块
    updatePlayerTiles(1);
    
    // 更新玩家2的钢琴块
    updatePlayerTiles(2);
}

// 更新玩家钢琴块位置
function updatePlayerTiles(playerNum) {
    const player = playerNum === 1 ? gameState.player1 : gameState.player2;
    const container = document.getElementById(`tiles-p${playerNum}`);
    const containerHeight = container.offsetHeight;
    
    // 如果玩家无生命值，不再生成新的钢琴块
    if (!player.isAlive) return;
    
    for (let i = player.tiles.length - 1; i >= 0; i--) {
        const tile = player.tiles[i];
        
        // 更新位置
        tile.y += gameState.speed;
        tile.element.style.top = `${tile.y}px`;
        
        // 检查是否掉落到底部（调整为适应新高度160px）
        if (tile.y > containerHeight - 160) {
            // 如果是正确的钢琴块掉落，扣除生命值
            if (tile.isCorrect) {
                player.lives--;
                tile.element.style.backgroundColor = '#ff9800';
                tile.element.innerHTML = '↓';
                
                // 检查是否还有生命值
                if (player.lives <= 0) {
                    player.lives = 0; // 确保生命值不为负数
                    player.isAlive = false;
                    updatePlayerUI(playerNum); // 立即更新UI显示生命值为0
                    // 检查是否应该结束游戏
                    checkGameEndCondition();
                } else {
                    updatePlayerUI(playerNum);
                }
            } else {
                // 如果是错误的钢琴块掉落，算作正确处理
                player.score += 2;
                tile.element.style.backgroundColor = '#4caf50';
                tile.element.innerHTML = '✓';
                
                // 每10分增加速度
                if (player.score % 10 === 0 && player.score > 0) {
                    gameState.speed += 0.05;
                    
                    gameState.spawnInterval = Math.max(
                        gameState.minSpawnInterval,
                        gameState.spawnInterval - 100
                    );
                    
                    if (playerNum === 1 && gameState.spawnInterval1) {
                        clearInterval(gameState.spawnInterval1);
                        gameState.spawnInterval1 = setInterval(() => spawnTile(1), gameState.spawnInterval);
                    } else if (playerNum === 2 && gameState.spawnInterval2) {
                        clearInterval(gameState.spawnInterval2);
                        gameState.spawnInterval2 = setInterval(() => spawnTile(2), gameState.spawnInterval);
                    }
                }
                
                updatePlayerUI(playerNum);
                
                // 检查游戏结束条件
                checkGameEndCondition();
            }
            
            // 移除钢琴块
            if (tile.element.parentNode) {
                tile.element.parentNode.removeChild(tile.element);
            }
            player.tiles.splice(i, 1);
        }
    }
}

// 更新玩家UI
function updatePlayerUI(playerNum) {
    const player = playerNum === 1 ? gameState.player1 : gameState.player2;
    
    // 更新得分
    document.getElementById(`score-p${playerNum}`).textContent = player.score;
    
    // 更新生命值
    const livesContainer = document.getElementById(`lives-p${playerNum}`);
    livesContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const heart = document.createElement('span');
        heart.className = 'life-heart';
        heart.textContent = '❤️';
        if (i < player.lives) {
            heart.classList.add('active');
        }
        livesContainer.appendChild(heart);
    }
    
    // 如果玩家无生命值，添加视觉效果
    const playerArea = document.querySelector(`.player-area.player-${playerNum === 1 ? 'left' : 'right'}`);
    if (!player.isAlive) {
        playerArea.style.opacity = '0.7';
        playerArea.style.filter = 'grayscale(50%)';
    } else {
        playerArea.style.opacity = '1';
        playerArea.style.filter = 'none';
    }
}

// 停止游戏
function stopGame() {
    gameState.isPlaying = false;
    
    if (gameState.gameInterval) {
        clearInterval(gameState.gameInterval);
        gameState.gameInterval = null;
    }
    
    if (gameState.spawnInterval1) {
        clearInterval(gameState.spawnInterval1);
        gameState.spawnInterval1 = null;
    }
    
    if (gameState.spawnInterval2) {
        clearInterval(gameState.spawnInterval2);
        gameState.spawnInterval2 = null;
    }
}

// 结束游戏
function endGame() {
    stopGame();
    
    // 切换到结束界面
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('end-screen').style.display = 'flex';
    
    // 显示最终得分
    document.getElementById('final-score-p1').textContent = gameState.player1.score;
    document.getElementById('final-score-p2').textContent = gameState.player2.score;
    
    // 判断胜负
    const p1Score = gameState.player1.score;
    const p2Score = gameState.player2.score;
    
    const badge1 = document.getElementById('badge-p1');
    const badge2 = document.getElementById('badge-p2');
    const resultMessage = document.getElementById('result-message');
    const resultTitle = document.getElementById('result-title');
    
    if (p1Score > p2Score) {
        resultTitle.textContent = '🎉 游戏结束';
        badge1.textContent = '🏆 胜利';
        badge1.className = 'result-badge badge-winner';
        badge2.textContent = '😢 失败';
        badge2.className = 'result-badge badge-loser';
        resultMessage.innerHTML = `
            <strong>恭喜玩家1获胜！</strong><br>
            玩家1得分：${p1Score} 分<br>
            玩家2得分：${p2Score} 分<br>
            分差：${p1Score - p2Score} 分
        `;
    } else if (p2Score > p1Score) {
        resultTitle.textContent = '🎉 游戏结束';
        badge1.textContent = '😢 失败';
        badge1.className = 'result-badge badge-loser';
        badge2.textContent = '🏆 胜利';
        badge2.className = 'result-badge badge-winner';
        resultMessage.innerHTML = `
            <strong>恭喜玩家2获胜！</strong><br>
            玩家1得分：${p1Score} 分<br>
            玩家2得分：${p2Score} 分<br>
            分差：${p2Score - p1Score} 分
        `;
    } else {
        resultTitle.textContent = '🤝 平局';
        badge1.textContent = '🤝 平局';
        badge1.className = 'result-badge badge-tie';
        badge2.textContent = '🤝 平局';
        badge2.className = 'result-badge badge-tie';
        resultMessage.innerHTML = `
            <strong>两位玩家实力相当！</strong><br>
            双方得分：${p1Score} 分<br>
            再来一局分出高下吧！
        `;
    }
}

// 重新开始游戏
function restartPVPGame() {
    document.getElementById('end-screen').style.display = 'none';
    startPVPGame();
}

// 返回开始界面
function backToStart() {
    document.getElementById('end-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
}