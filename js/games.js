/**
 * =================================================================
 * GAMES MODULE - Crash & Multiplier Games
 * =================================================================
 * Contains game logic for crash-style games and prediction games.
 * All games use virtual currency only.
 */

const GamesEngine = {
    // Game states
    activeGame: null,
    gameInterval: null,
    crashPoint: 0,
    currentMultiplier: 1.00,
    betAmount: 100,
    isPlaying: false,
    hasCashedOut: false,
    
    // Game history
    crashHistory: [],
    binaryHistory: [],
    
    // Canvas for crash game
    crashCanvas: null,
    crashCtx: null,
    animationFrame: null,

    /**
     * Initialize games engine
     */
    init() {
        // Load game history from localStorage
        const savedHistory = localStorage.getItem('crash_history');
        if (savedHistory) {
            this.crashHistory = JSON.parse(savedHistory);
        }
        
        console.log('[Games] Engine initialized');
    },

    // ========================================
    // CRASH GAME
    // ========================================

    /**
     * Start crash game
     * @param {HTMLElement} container - Container element
     */
    startCrashGame(container) {
        this.stopAllGames();
        
        this.activeGame = 'crash';
        this.currentMultiplier = 1.00;
        this.isPlaying = false;
        this.hasCashedOut = false;
        
        container.innerHTML = this.renderCrashGame();
        
        // Initialize canvas
        this.crashCanvas = document.getElementById('crashCanvas');
        this.crashCtx = this.crashCanvas?.getContext('2d');
        
        if (this.crashCanvas) {
            this.crashCanvas.width = this.crashCanvas.offsetWidth;
            this.crashCanvas.height = this.crashCanvas.offsetHeight;
        }
        
        // Start animation loop
        this.animateCrash();
        
        console.log('[Games] Crash game started');
    },

    /**
     * Render crash game HTML
     */
    renderCrashGame() {
        const historyHTML = this.crashHistory.slice(0, 8).map(item => {
            const isSafe = item >= 2;
            return `<span class="crash-history-item ${isSafe ? 'safe' : 'crash'}">${item.toFixed(2)}x</span>`;
        }).join('');

        return `
            <div class="crash-game-container">
                <div class="crash-header">
                    <div class="crash-title">
                        <i class="fa-solid fa-rocket"></i> CRASH
                    </div>
                    <div class="crash-history">${historyHTML}</div>
                </div>
                
                <div class="crash-canvas-wrap">
                    <canvas id="crashCanvas"></canvas>
                    <div class="crash-multiplier" id="crashMultiplier">1.00x</div>
                </div>
                
                <div class="game-controls">
                    <div class="input-label">Bet Amount</div>
                    <div class="game-bet-input">
                        <div class="input-with-icon" style="flex:1;">
                            <i class="fa-solid fa-indian-rupee-sign"></i>
                            <input type="number" id="crashBetAmount" class="input-field" value="${this.betAmount}" min="10" step="10">
                        </div>
                    </div>
                    
                    <div class="quick-bet-btns">
                        <button class="quick-bet-btn" onclick="GamesEngine.setQuickBet(50)">+50</button>
                        <button class="quick-bet-btn" onclick="GamesEngine.setQuickBet(100)">+100</button>
                        <button class="quick-bet-btn" onclick="GamesEngine.setQuickBet(500)">+500</button>
                        <button class="quick-bet-btn" onclick="GamesEngine.setQuickBet(1000)">+1K</button>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                        <button id="crashBetBtn" class="btn btn-primary" onclick="GamesEngine.placeCrashBet()">
                            <i class="fa-solid fa-play"></i> BET
                        </button>
                        <button id="crashCashOutBtn" class="btn btn-green" onclick="GamesEngine.cashOutCrash()" disabled>
                            <i class="fa-solid fa-hand-holding-dollar"></i> CASH OUT
                        </button>
                    </div>
                    
                    <div id="crashResult" class="text-center" style="margin-top:15px; font-weight:600;"></div>
                </div>
                
                <div class="disclaimer-box" style="margin-top:20px;">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    This is a simulation game using virtual currency. No real money involved.
                </div>
            </div>
        `;
    },

    /**
     * Set quick bet amount
     * @param {number} amount - Amount to add
     */
    setQuickBet(amount) {
        const input = document.getElementById('crashBetAmount');
        if (input) {
            input.value = Math.max(10, parseInt(input.value || 0) + amount);
            this.betAmount = parseInt(input.value);
        }
    },

    /**
     * Place bet and start crash game
     */
    async placeCrashBet() {
        const betInput = document.getElementById('crashBetAmount');
        const betAmount = parseFloat(betInput?.value || 0);
        
        if (!betAmount || betAmount < 10) {
            this.showMessage('Minimum bet is ₹10', 'error');
            return;
        }
        
        if (Store.balance < betAmount) {
            this.showMessage('Insufficient balance', 'error');
            return;
        }
        
        if (this.isPlaying) return;
        
        // Deduct bet from balance
        Store.balance -= betAmount;
        Store.save();
        updateGlobalUI();
        
        this.isPlaying = true;
        this.hasCashedOut = false;
        this.betAmount = betAmount;
        this.currentMultiplier = 1.00;
        
        // Generate crash point using seeded logic
        // More likely to crash early, but occasional high multipliers
        const rand = Math.random();
        if (rand < 0.3) {
            this.crashPoint = 1 + Math.random() * 1.5; // 1x - 2.5x
        } else if (rand < 0.6) {
            this.crashPoint = 1.5 + Math.random() * 2; // 1.5x - 3.5x
        } else if (rand < 0.85) {
            this.crashPoint = 2 + Math.random() * 3; // 2x - 5x
        } else if (rand < 0.95) {
            this.crashPoint = 3 + Math.random() * 7; // 3x - 10x
        } else {
            this.crashPoint = 5 + Math.random() * 20; // Rare high multiplier
        }
        
        // Update UI
        const betBtn = document.getElementById('crashBetBtn');
        const cashOutBtn = document.getElementById('crashCashOutBtn');
        
        if (betBtn) {
            betBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> PLAYING...';
            betBtn.disabled = true;
            betBtn.classList.add('opacity-50');
        }
        
        if (cashOutBtn) {
            cashOutBtn.disabled = false;
            cashOutBtn.classList.remove('opacity-50');
        }
        
        const resultDiv = document.getElementById('crashResult');
        if (resultDiv) resultDiv.innerHTML = '';
        
        console.log('[Games] Crash started, crash point:', this.crashPoint.toFixed(2));
    },

    /**
     * Cash out from crash game
     */
    cashOutCrash() {
        if (!this.isPlaying || this.hasCashedOut) return;
        
        this.hasCashedOut = true;
        
        const winnings = this.betAmount * this.currentMultiplier;
        const profit = winnings - this.betAmount;
        
        Store.balance += winnings;
        Store.save();
        updateGlobalUI();
        
        // Update UI
        const cashOutBtn = document.getElementById('crashCashOutBtn');
        if (cashOutBtn) {
            cashOutBtn.disabled = true;
            cashOutBtn.innerHTML = `<i class="fa-solid fa-check"></i> CASHED @ ${this.currentMultiplier.toFixed(2)}x`;
        }
        
        const resultDiv = document.getElementById('crashResult');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="text-green" style="font-size:18px;">
                    <i class="fa-solid fa-trophy"></i> YOU WON ₹${winnings.toFixed(2)}
                </div>
                <div class="text-muted">Profit: ₹${profit.toFixed(2)}</div>
            `;
        }
        
        console.log('[Games] Cashed out at', this.currentMultiplier.toFixed(2), 'x');
    },

    /**
     * Animate crash game
     */
    animateCrash() {
        if (!this.crashCtx || this.activeGame !== 'crash') return;
        
        const canvas = this.crashCanvas;
        const ctx = this.crashCtx;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.isPlaying && !this.hasCashedOut) {
            // Increase multiplier
            this.currentMultiplier += 0.01 + (this.currentMultiplier * 0.005);
            
            // Update multiplier display
            const multDisplay = document.getElementById('crashMultiplier');
            if (multDisplay) {
                multDisplay.textContent = this.currentMultiplier.toFixed(2) + 'x';
                multDisplay.style.color = this.currentMultiplier >= 2 ? 'var(--green)' : 'white';
            }
            
            // Draw multiplier curve
            this.drawCrashCurve();
            
            // Check for crash
            if (this.currentMultiplier >= this.crashPoint) {
                this.handleCrash();
                return;
            }
        }
        
        this.animationFrame = requestAnimationFrame(() => this.animateCrash());
    },

    /**
     * Draw crash curve on canvas
     */
    drawCrashCurve() {
        const ctx = this.crashCtx;
        const canvas = this.crashCanvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // Background grid
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < w; i += 30) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, h);
            ctx.stroke();
        }
        
        for (let i = 0; i < h; i += 30) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(w, i);
            ctx.stroke();
        }
        
        // Draw multiplier line
        const progress = Math.min(this.currentMultiplier / 10, 1);
        const y = h - (progress * h * 0.8) - 20;
        
        ctx.beginPath();
        ctx.arc(w / 2, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = this.currentMultiplier >= 2 ? '#10b981' : '#ffffff';
        ctx.fill();
        
        // Glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.currentMultiplier >= 2 ? '#10b981' : '#ffffff';
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Draw line to point
        ctx.beginPath();
        ctx.moveTo(w / 2, h);
        ctx.lineTo(w / 2, y);
        ctx.strokeStyle = this.currentMultiplier >= 2 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();
    },

    /**
     * Handle crash event
     */
    handleCrash() {
        this.isPlaying = false;
        
        // Add to history
        this.crashHistory.unshift(this.crashPoint);
        if (this.crashHistory.length > 50) this.crashHistory.pop();
        localStorage.setItem('crash_history', JSON.stringify(this.crashHistory));
        
        // Update multiplier display
        const multDisplay = document.getElementById('crashMultiplier');
        if (multDisplay) {
            multDisplay.textContent = '💥 CRASHED @ ' + this.crashPoint.toFixed(2) + 'x';
            multDisplay.style.color = 'var(--red)';
        }
        
        // Update buttons
        const betBtn = document.getElementById('crashBetBtn');
        const cashOutBtn = document.getElementById('crashCashOutBtn');
        
        if (betBtn) {
            betBtn.disabled = false;
            betBtn.classList.remove('opacity-50');
            betBtn.innerHTML = '<i class="fa-solid fa-play"></i> BET';
        }
        
        if (cashOutBtn) {
            cashOutBtn.disabled = true;
            cashOutBtn.innerHTML = '<i class="fa-solid fa-hand-holding-dollar"></i> CASH OUT';
        }
        
        // Show result if didn't cash out
        if (!this.hasCashedOut) {
            const resultDiv = document.getElementById('crashResult');
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <div class="text-red" style="font-size:18px;">
                        <i class="fa-solid fa-skull"></i> CRASHED!
                    </div>
                    <div class="text-muted">Lost: ₹${this.betAmount.toFixed(2)}</div>
                `;
            }
        }
        
        console.log('[Games] Crashed at', this.crashPoint.toFixed(2), 'x');
        
        // Restart animation for history display
        setTimeout(() => {
            this.animateCrash();
        }, 2000);
    },

    // ========================================
    // HIGH/LOW GAME
    // ========================================

    /**
     * Start high/low prediction game
     * @param {HTMLElement} container - Container element
     */
    startHighLowGame(container) {
        this.stopAllGames();
        this.activeGame = 'highlow';
        
        container.innerHTML = this.renderHighLowGame();
        
        // Start price updates
        this.highLowPrice = MarketEngine.getPrice('ZEO');
        this.highLowInterval = setInterval(() => {
            this.highLowPrice = MarketEngine.getPrice('ZEO');
            const display = document.getElementById('highLowPrice');
            if (display) {
                display.textContent = this.highLowPrice.toFixed(2);
            }
        }, 500);
        
        console.log('[Games] High/Low game started');
    },

    /**
     * Render high/low game HTML
     */
    renderHighLowGame() {
        return `
            <div class="card">
                <div class="text-center">
                    <h3 style="margin-bottom:10px;"><i class="fa-solid fa-arrow-up-down"></i> HIGH / LOW</h3>
                    <p class="text-muted">Predict if the price will go HIGHER or LOWER in 5 seconds</p>
                    <p class="text-green font-semibold">1.85x Payout</p>
                </div>
                
                <div style="text-align:center; margin: 25px 0;">
                    <div class="text-muted text-sm">Current Price</div>
                    <div id="highLowPrice" class="text-3xl font-bold" style="color:var(--primary);">
                        ${(MarketEngine.getPrice('ZEO') || 150).toFixed(2)}
                    </div>
                </div>
                
                <div class="input-group">
                    <label class="input-label">Bet Amount</label>
                    <div class="input-with-icon">
                        <i class="fa-solid fa-indian-rupee-sign"></i>
                        <input type="number" id="highLowBet" class="input-field" value="100" min="10">
                    </div>
                </div>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    <button class="btn btn-green" onclick="GamesEngine.playHighLow('high')">
                        <i class="fa-solid fa-arrow-up"></i> HIGHER
                    </button>
                    <button class="btn btn-red" onclick="GamesEngine.playHighLow('low')">
                        <i class="fa-solid fa-arrow-down"></i> LOWER
                    </button>
                </div>
                
                <div id="highLowResult" class="text-center" style="margin-top:20px;"></div>
            </div>
            
            <div class="disclaimer-box">
                <i class="fa-solid fa-circle-exclamation"></i>
                This is a simulation game using virtual currency.
            </div>
        `;
    },

    /**
     * Play high/low game
     * @param {string} choice - 'high' or 'low'
     */
    async playHighLow(choice) {
        const betInput = document.getElementById('highLowBet');
        const bet = parseFloat(betInput?.value || 0);
        
        if (!bet || bet < 10) {
            this.showMessage('Minimum bet is ₹10', 'error');
            return;
        }
        
        if (Store.balance < bet) {
            this.showMessage('Insufficient balance', 'error');
            return;
        }
        
        const startPrice = this.highLowPrice;
        
        // Lock in bet
        Store.balance -= bet;
        Store.save();
        updateGlobalUI();
        
        // Show countdown
        const resultDiv = document.getElementById('highLowResult');
        resultDiv.innerHTML = `
            <div class="text-lg font-semibold">
                <i class="fa-solid fa-lock"></i> Locked at ${startPrice.toFixed(2)}
            </div>
            <div class="text-muted">Waiting for result...</div>
        `;
        
        // Wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const endPrice = this.highLowPrice;
        const isWin = (choice === 'high' && endPrice > startPrice) || 
                      (choice === 'low' && endPrice < startPrice);
        
        if (isWin) {
            const payout = bet * 1.85;
            Store.balance += payout;
            Store.save();
            updateGlobalUI();
            
            resultDiv.innerHTML = `
                <div class="text-green text-xl font-bold">
                    <i class="fa-solid fa-trophy"></i> YOU WON!
                </div>
                <div>Payout: ₹${payout.toFixed(2)} (Profit: ₹${(payout - bet).toFixed(2)})</div>
                <div class="text-muted text-sm">Start: ${startPrice.toFixed(2)} → End: ${endPrice.toFixed(2)}</div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="text-red text-xl font-bold">
                    <i class="fa-solid fa-xmark"></i> YOU LOST
                </div>
                <div class="text-muted text-sm">Start: ${startPrice.toFixed(2)} → End: ${endPrice.toFixed(2)}</div>
            `;
        }
    },

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    /**
     * Stop all active games
     */
    stopAllGames() {
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        
        if (this.highLowInterval) {
            clearInterval(this.highLowInterval);
            this.highLowInterval = null;
        }
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        this.activeGame = null;
        this.isPlaying = false;
    },

    /**
     * Show message to user
     * @param {string} message - Message text
     * @param {string} type - Message type (success/error/info)
     */
    showMessage(message, type = 'info') {
        // Simple alert for now - can be replaced with toast notifications
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: type,
                title: message,
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            alert(message);
        }
    }
};

// Initialize
GamesEngine.init();

// Export
window.GamesEngine = GamesEngine;
