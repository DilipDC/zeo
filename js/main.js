/**
 * =================================================================
 * MAIN APPLICATION - Core Router & State Management
 * =================================================================
 * Main entry point that handles routing, rendering, and global state.
 */

// ========================================
// GLOBAL STATE
// ========================================

const Store = {
    balance: 0,
    user: 'Guest',
    portfolio: [],
    
    save() {
        localStorage.setItem('zeo_balance', this.balance);
        localStorage.setItem('zeo_portfolio', JSON.stringify(this.portfolio));
        updateGlobalUI();
    }
};

// Global variables
let currentRoute = 'home';
let chartInstance = null;
let priceInterval = null;

// ========================================
// ROUTER
// ========================================

/**
 * Router function - handles navigation between views
 * @param {string} route - Route name
 */
function router(route) {
    currentRoute = route;
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.route === route) {
            btn.classList.add('active');
        }
    });
    
    // Stop any running intervals
    clearInterval(priceInterval);
    GamesEngine.stopAllGames();
    
    // Render view
    const container = document.getElementById('app');
    if (!container) return;
    
    // Clear container with fade effect
    container.style.opacity = '0';
    
    setTimeout(() => {
        switch(route) {
            case 'home':
                renderHome(container);
                break;
            case 'trade':
                renderTrade(container);
                break;
            case 'games':
                renderGames(container);
                break;
            case 'wallet':
                Wallet.renderWallet(container);
                break;
            case 'profile':
                renderProfile(container);
                break;
            default:
                renderHome(container);
        }
        
        // Fade in
        container.style.opacity = '1';
    }, 150);
}

// Alias for backward compatibility
function renderView(route) {
    router(route);
}

// ========================================
// UI HELPERS
// ========================================

/**
 * Update global balance display
 */
function updateGlobalUI() {
    const balanceEl = document.getElementById('globalBalance');
    if (balanceEl) {
        // Get balance from wallet
        const mainBalance = parseFloat(localStorage.getItem('wallet_main')) || 0;
        const bonusBalance = parseFloat(localStorage.getItem('wallet_bonus')) || 0;
        const total = mainBalance + bonusBalance;
        
        // Animate number
        const current = parseFloat(balanceEl.textContent.replace(/,/g, '')) || 0;
        animateNumber(balanceEl, current, total);
    }
    
    // Also update user name if logged in
    const userData = localStorage.getItem('user_data');
    if (userData) {
        const user = JSON.parse(userData);
        const nameElements = document.querySelectorAll('.user-display-name');
        nameElements.forEach(el => {
            if (el) el.textContent = user.username || 'Trader';
        });
    }
}

/**
 * Animate number change
 */
function animateNumber(element, from, to) {
    const duration = 500;
    const start = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = from + (to - from) * easeOut;
        
        element.textContent = current.toFixed(2);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ========================================
// HOME VIEW
// ========================================

/**
 * Render home/dashboard view
 */
function renderHome(container) {
    const userData = localStorage.getItem('user_data');
    const username = userData ? JSON.parse(userData).username : 'Trader';
    const mainBalance = parseFloat(localStorage.getItem('wallet_main')) || 0;
    const bonusBalance = parseFloat(localStorage.getItem('wallet_bonus')) || 0;
    const totalBalance = mainBalance + bonusBalance;
    
    container.innerHTML = `
        <div class="hero-section">
            <!-- Balance Card -->
            <div class="hero-card bounce-in">
                <div class="hero-label">Total Balance</div>
                <div class="hero-balance">₹<span id="homeBalance">${totalBalance.toFixed(2)}</span></div>
                <div class="hero-actions">
                    <button class="hero-btn" onclick="router('wallet')">
                        <i class="fa-solid fa-plus"></i> Deposit
                    </button>
                    <button class="hero-btn" onclick="router('wallet')">
                        <i class="fa-solid fa-arrow-down"></i> Withdraw
                    </button>
                </div>
            </div>
            
            <!-- Welcome -->
            <div class="flex-between" style="margin-top:20px;">
                <div>
                    <div class="text-muted text-sm">Welcome back,</div>
                    <div class="text-xl font-bold user-display-name">${username}</div>
                </div>
                <button class="notification-btn" onclick="router('profile')">
                    <i class="fa-regular fa-bell"></i>
                    <span class="notification-dot"></span>
                </button>
            </div>
        </div>
        
        <!-- Ticker -->
        <div class="ticker-wrap fade-in">
            <div class="ticker" id="marketTicker">
                ${generateTickerItems()}
            </div>
        </div>
        
        <!-- Quick Stats -->
        <div class="card fade-in" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; text-align:center;">
            <div class="stat-box">
                <div class="text-green font-bold">₹${totalBalance.toFixed(0)}</div>
                <div class="text-muted text-sm">Balance</div>
            </div>
            <div class="stat-box">
                <div class="text-accent font-bold">${Store.portfolio.length || 0}</div>
                <div class="text-muted text-sm">Positions</div>
            </div>
            <div class="stat-box">
                <div class="text-yellow font-bold">₹0</div>
                <div class="text-muted text-sm">Profit</div>
            </div>
        </div>
        
        <!-- Market Section -->
        <div class="section-header fade-in">
            <h3><i class="fa-solid fa-chart-line text-blue"></i> Markets</h3>
            <span class="see-all" onclick="router('trade')">Trade <i class="fa-solid fa-arrow-right"></i></span>
        </div>
        
        <div class="market-scroll fade-in" id="marketCards">
            ${generateMarketCards()}
        </div>
        
        <!-- Games Section -->
        <div class="section-header fade-in">
            <h3><i class="fa-solid fa-gamepad text-accent"></i> Popular Games</h3>
            <span class="see-all" onclick="router('games')">All Games <i class="fa-solid fa-arrow-right"></i></span>
        </div>
        
        <div class="games-grid fade-in">
            <div class="game-card card-hover" onclick="router('games'); setTimeout(() => GamesEngine.startCrashGame(document.getElementById('gameContainer')), 200)">
                <div class="game-img" style="background: linear-gradient(135deg, #8b5cf6, #3b82f6);">
                    <div class="game-overlay"></div>
                    <span class="hot-badge">HOT</span>
                </div>
                <div class="game-info">
                    <span class="game-title">Crash</span>
                    <span class="game-sub">Multiplier Game</span>
                    <span class="game-payout">Up to 100x</span>
                </div>
            </div>
            
            <div class="game-card card-hover" onclick="router('games')">
                <div class="game-img" style="background: linear-gradient(135deg, #10b981, #059669);">
                    <div class="game-overlay"></div>
                    <span class="live-badge">1.85x</span>
                </div>
                <div class="game-info">
                    <span class="game-title">High/Low</span>
                    <span class="game-sub">Price Prediction</span>
                    <span class="game-payout">1.85x Payout</span>
                </div>
            </div>
            
            <div class="game-card card-hover" onclick="router('trade')">
                <div class="game-img" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
                    <div class="game-overlay"></div>
                </div>
                <div class="game-info">
                    <span class="game-title">Trade</span>
                    <span class="game-sub">Buy & Sell</span>
                    <span class="game-payout">Real-time</span>
                </div>
            </div>
            
            <div class="game-card card-hover" onclick="router('wallet')">
                <div class="game-img" style="background: linear-gradient(135deg, #ec4899, #be185d);">
                    <div class="game-overlay"></div>
                </div>
                <div class="game-info">
                    <span class="game-title">Wallet</span>
                    <span class="game-sub">Deposit/Withdraw</span>
                    <span class="game-payout">Instant</span>
                </div>
            </div>
        </div>
        
        <!-- Disclaimer -->
        <div class="disclaimer-box fade-in">
            <i class="fa-solid fa-circle-exclamation"></i>
            <strong>Simulation Only:</strong> This platform uses virtual currency. No real money involved. Trading carries risk.
        </div>
    `;
    
    // Start real-time market updates for home
    startMarketUpdates();
}

/**
 * Generate ticker items
 */
function generateTickerItems() {
    const markets = MarketEngine.getAllMarkets();
    let html = '';
    
    markets.slice(0, 6).forEach(m => {
        const color = m.change >= 0 ? 'text-green' : 'text-red';
        const icon = m.change >= 0 ? 'fa-caret-up' : 'fa-caret-down';
        html += `
            <div class="ticker-item">
                <i class="${m.icon}" style="color:${m.color}"></i>
                <span>${m.symbol}</span>
                <span class="${color}"><i class="fa-solid ${icon}"></i> ${Math.abs(m.change).toFixed(1)}%</span>
            </div>
        `;
    });
    
    // Duplicate for seamless scroll
    html += html;
    
    return html;
}

/**
 * Generate market cards
 */
function generateMarketCards() {
    const markets = MarketEngine.getAllMarkets();
    
    return markets.slice(0, 5).map(m => {
        const color = m.change >= 0 ? 'var(--green)' : 'var(--red)';
        const bg = m.change >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        
        return `
            <div class="market-card" onclick="selectMarket('${m.symbol}')">
                <div class="market-card-header">
                    <div class="market-icon" style="background:${bg}; color:${color};">
                        <i class="${m.icon}"></i>
                    </div>
                    <div class="market-name">${m.symbol}</div>
                </div>
                <div class="market-price">₹${m.price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                <div class="market-change" style="color:${color};">${m.change >= 0 ? '+' : ''}${m.change.toFixed(2)}%</div>
            </div>
        `;
    }).join('');
}

// ========================================
// TRADE VIEW
// ========================================

/**
 * Render trade view
 */
function renderTrade(container) {
    container.innerHTML = `
        <div class="card">
            <div class="trade-header">
                <div class="trade-pair">
                    <div class="trade-pair-name">
                        <i class="fa-solid fa-layer-group" style="color:var(--primary);"></i>
                        ZEO/USD
                    </div>
                    <span class="trade-status"><span class="live-dot"></span> MARKET OPEN</span>
                </div>
                <div class="trade-price">
                    <div class="trade-price-current" id="livePrice">₹150.00</div>
                    <div class="trade-price-change" id="priceChange">+0.00%</div>
                </div>
            </div>
            
            <div class="chart-container">
                <canvas id="tradingChart"></canvas>
            </div>
        </div>
        
        <div class="card">
            <div class="flex-between" style="margin-bottom:15px;">
                <span class="text-muted">Available: <span class="text-green font-semibold">₹${Store.balance.toFixed(2)}</span></span>
            </div>
            
            <div class="order-inputs">
                <div class="input-row">
                    <div class="input-with-icon" style="flex:1;">
                        <i class="fa-solid fa-layer-group"></i>
                        <input type="number" id="tradeQty" class="input-field" placeholder="Quantity" value="1" min="1">
                    </div>
                    <div class="leverage-badge">5x</div>
                </div>
            </div>
            
            <div class="order-panel">
                <button class="btn btn-green" onclick="executeTrade('buy')">
                    <i class="fa-solid fa-arrow-up"></i> BUY
                </button>
                <button class="btn btn-red" onclick="executeTrade('sell')">
                    <i class="fa-solid fa-arrow-down"></i> SELL
                </button>
            </div>
            
            <div class="flex-between text-muted text-sm" style="margin-top:10px;">
                <span>Est. Cost: <span id="estCost">₹150.00</span></span>
                <span>Est. Value: <span id="estValue">₹0.00</span></span>
            </div>
        </div>
        
        <!-- Positions -->
        <div class="card">
            <div class="section-header">
                <h3><i class="fa-solid fa-briefcase text-accent"></i> Open Positions</h3>
                <span class="badge" style="background:var(--bg-dark); padding:4px 8px; border-radius:4px; font-size:11px;">${Store.portfolio.length}</span>
            </div>
            <div class="positions-list" id="positionsList">
                ${renderPositions()}
            </div>
        </div>
        
        <!-- Asset List -->
        <div class="card">
            <div class="section-header">
                <h3><i class="fa-solid fa-list text-muted"></i> Other Assets</h3>
            </div>
            <div class="asset-list">
                ${generateAssetList()}
            </div>
        </div>
    `;
    
    // Initialize chart
    initChart();
    
    // Start price updates
    startTradeUpdates();
    
    // Update estimated cost on quantity change
    document.getElementById('tradeQty')?.addEventListener('input', updateEstCost);
}

/**
 * Generate asset list for trade view
 */
function generateAssetList() {
    const markets = MarketEngine.getAllMarkets().slice(1);
    
    return markets.map(m => {
        const color = m.change >= 0 ? 'var(--green)' : 'var(--red)';
        return `
            <div class="asset-card" onclick="selectMarket('${m.symbol}')">
                <div class="asset-icon" style="padding:0;">
                    <i class="${m.icon}" style="font-size:24px; color:${m.color};"></i>
                </div>
                <div class="asset-details">
                    <div class="asset-name">
                        ${m.name}
                        <span class="badge-vol">${m.volatility}</span>
                    </div>
                    <div class="asset-sub">${m.symbol}/USD</div>
                </div>
                <div class="asset-price">
                    <div class="asset-current">₹${m.price.toFixed(2)}</div>
                    <div class="asset-change" style="color:${color};">${m.change >= 0 ? '+' : ''}${m.change.toFixed(2)}%</div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render positions list
 */
function renderPositions() {
    if (Store.portfolio.length === 0) {
        return `
            <div class="text-center text-muted" style="padding:30px;">
                <i class="fa-solid fa-briefcase" style="font-size:32px; margin-bottom:10px; opacity:0.5;"></i>
                <div>No open positions</div>
                <div class="text-sm">Start trading to see your positions here</div>
            </div>
        `;
    }
    
    return Store.portfolio.map((pos, index) => {
        const currentPrice = MarketEngine.getPrice(pos.symbol) || pos.entry;
        let pnl = 0;
        
        if (pos.type === 'buy') {
            pnl = (currentPrice - pos.entry) * pos.qty;
        } else {
            pnl = (pos.entry - currentPrice) * pos.qty;
        }
        
        const pnlPercent = ((pnl / (pos.entry * pos.qty)) * 100).toFixed(2);
        const pnlClass = pnl >= 0 ? 'text-green' : 'text-red';
        
        return `
            <div class="position-item">
                <div class="position-info">
                    <div class="position-symbol">
                        ${pos.symbol}
                        <span class="position-type ${pos.type}">${pos.type.toUpperCase()}</span>
                    </div>
                    <div class="position-entry">Entry: ₹${pos.entry.toFixed(2)} | Qty: ${pos.qty}</div>
                </div>
                <div class="position-pnl">
                    <div class="position-pnl-value ${pnlClass}">${pnl >= 0 ? '+' : ''}₹${pnl.toFixed(2)}</div>
                    <div class="position-pnl-percent ${pnlClass}">${pnlPercent}%</div>
                    <button class="btn-sm btn-outline" style="margin-top:5px; padding:4px 8px;" onclick="closePosition(${index})">Close</button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Update estimated cost display
 */
function updateEstCost() {
    const qty = parseInt(document.getElementById('tradeQty')?.value || 0);
    const price = MarketEngine.getPrice('ZEO') || 150;
    const cost = qty * price;
    const leverage = 5;
    
    document.getElementById('estCost').textContent = '₹' + cost.toFixed(2);
    document.getElementById('estValue').textContent = '₹' + (cost * leverage).toFixed(2);
}

/**
 * Execute trade
 */
function executeTrade(type) {
    const qty = parseInt(document.getElementById('tradeQty')?.value || 0);
    const price = MarketEngine.getPrice('ZEO') || 150;
    const cost = qty * price;
    const mainBalance = parseFloat(localStorage.getItem('wallet_main')) || 0;
    
    if (qty <= 0) {
        alert('Please enter a valid quantity');
        return;
    }
    
    if (mainBalance < cost) {
        alert('Insufficient balance!');
        return;
    }
    
    // Deduct from balance
    const newBalance = mainBalance - cost;
    localStorage.setItem('wallet_main', newBalance.toString());
    Store.balance = newBalance;
    
    // Add to portfolio
    Store.portfolio.push({
        symbol: 'ZEO',
        entry: price,
        qty: qty,
        type: type,
        timestamp: Date.now()
    });
    
    Store.save();
    updateGlobalUI();
    
    // Update positions display
    document.getElementById('positionsList').innerHTML = renderPositions();
    updateEstCost();
    
    // Show success
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: type.toUpperCase() + ' Order Executed',
            text: `${qty} ZEO @ ₹${price.toFixed(2)}`,
            timer: 2000,
            showConfirmButton: false
        });
    }
}

/**
 * Close position
 */
function closePosition(index) {
    const pos = Store.portfolio[index];
    const currentPrice = MarketEngine.getPrice(pos.symbol) || pos.entry;
    let pnl = 0;
    
    if (pos.type === 'buy') {
        pnl = (currentPrice - pos.entry) * pos.qty;
    } else {
        pnl = (pos.entry - currentPrice) * pos.qty;
    }
    
    // Return principal + pnl
    const mainBalance = parseFloat(localStorage.getItem('wallet_main')) || 0;
    const totalReturn = (pos.entry * pos.qty) + pnl;
    
    localStorage.setItem('wallet_main', (mainBalance + totalReturn).toString());
    Store.balance = mainBalance + totalReturn;
    
    // Remove from portfolio
    Store.portfolio.splice(index, 1);
    Store.save();
    updateGlobalUI();
    
    // Update display
    document.getElementById('positionsList').innerHTML = renderPositions();
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: pnl >= 0 ? 'success' : 'warning',
            title: pnl >= 0 ? 'Position Closed +' + pnl.toFixed(2) : 'Position Closed ' + pnl.toFixed(2),
            text: `Returned: ₹${totalReturn.toFixed(2)}`,
            timer: 2000,
            showConfirmButton: false
        });
    }
}

// ========================================
// GAMES VIEW
// ========================================

/**
 * Render games view
 */
function renderGames(container) {
    container.innerHTML = `
        <div class="section-header">
            <h3><i class="fa-solid fa-rocket text-accent"></i> Crash Games</h3>
        </div>
        
        <div class="games-grid">
            <div class="game-card card-hover" onclick="startCrashInView()">
                <div class="game-img" style="background: linear-gradient(135deg, #8b5cf6, #3b82f6);">
                    <div class="game-overlay"></div>
                    <span class="hot-badge">HOT</span>
                </div>
                <div class="game-info">
                    <span class="game-title">ZEO Crash</span>
                    <span class="game-sub">Cash out before crash!</span>
                    <span class="game-payout">Up to 100x</span>
                </div>
            </div>
            
            <div class="game-card card-hover" onclick="startHighLowInView()">
                <div class="game-img" style="background: linear-gradient(135deg, #10b981, #059669);">
                    <div class="game-overlay"></div>
                    <span class="live-badge">1.85x</span>
                </div>
                <div class="game-info">
                    <span class="game-title">High / Low</span>
                    <span class="game-sub">Predict price direction</span>
                    <span class="game-payout">1.85x Payout</span>
                </div>
            </div>
        </div>
        
        <!-- Active Game Container -->
        <div id="gameContainer"></div>
        
        <!-- Disclaimer -->
        <div class="disclaimer-box">
            <i class="fa-solid fa-circle-exclamation"></i>
            These are simulation games using virtual currency only.
        </div>
    `;
}

/**
 * Start crash game in view
 */
function startCrashInView() {
    const container = document.getElementById('gameContainer');
    GamesEngine.startCrashGame(container);
    container?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Start high/low game in view
 */
function startHighLowInView() {
    const container = document.getElementById('gameContainer');
    GamesEngine.startHighLowGame(container);
    container?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ========================================
// PROFILE VIEW
// ========================================

/**
 * Render profile view
 */
function renderProfile(container) {
    const userData = localStorage.getItem('user_data');
    const user = userData ? JSON.parse(userData) : { username: 'Guest', email: 'guest@demo.com' };
    
    const mainBalance = parseFloat(localStorage.getItem('wallet_main')) || 0;
    const bonusBalance = parseFloat(localStorage.getItem('wallet_bonus')) || 0;
    const totalDeposited = 15000; // Mock
    
    container.innerHTML = `
        <div class="card" style="text-align:center;">
            <div class="profile-avatar" onclick="document.getElementById('avatarInput').click()">
                <i class="fa-solid fa-user"></i>
                <div class="profile-edit-badge">
                    <i class="fa-solid fa-camera"></i>
                </div>
                <input type="file" id="avatarInput" accept="image/*" class="hidden" onchange="updateAvatar(event)">
            </div>
            <h3 class="profile-name" id="profileName">${user.username}</h3>
            <p class="profile-id">UID: ZEO-${String(user.id || Math.random()).slice(-6).toUpperCase()}</p>
            <div class="profile-badges">
                <span class="profile-badge vip">VIP 1</span>
                <span class="profile-badge verified">Verified</span>
            </div>
        </div>
        
        <div class="profile-stats">
            <div class="profile-stat">
                <div class="profile-stat-value text-green">₹${mainBalance.toFixed(0)}</div>
                <div class="profile-stat-label">Balance</div>
            </div>
            <div class="profile-stat">
                <div class="profile-stat-value">₹${totalDeposited.toLocaleString()}</div>
                <div class="profile-stat-label">Deposited</div>
            </div>
            <div class="profile-stat">
                <div class="profile-stat-value text-accent">${Store.portfolio.length}</div>
                <div class="profile-stat-label">Trades</div>
            </div>
        </div>
        
        <div class="card">
            <div class="menu-item" onclick="editProfile()">
                <div class="menu-item-left">
                    <div class="menu-item-icon"><i class="fa-solid fa-pen"></i></div>
                    <div class="menu-item-text">Edit Profile</div>
                </div>
                <i class="fa-solid fa-chevron-right menu-item-arrow"></i>
            </div>
            
            <div class="menu-item" onclick="router('wallet')">
                <div class="menu-item-left">
                    <div class="menu-item-icon"><i class="fa-solid fa-wallet"></i></div>
                    <div class="menu-item-text">Wallet</div>
                </div>
                <i class="fa-solid fa-chevron-right menu-item-arrow"></i>
            </div>
            
            <div class="menu-item">
                <div class="menu-item-left">
                    <div class="menu-item-icon"><i class="fa-solid fa-bell"></i></div>
                    <div class="menu-item-text">Notifications</div>
                </div>
                <i class="fa-solid fa-chevron-right menu-item-arrow"></i>
            </div>
            
            <div class="menu-item">
                <div class="menu-item-left">
                    <div class="menu-item-icon"><i class="fa-solid fa-shield-halved"></i></div>
                    <div class="menu-item-text">Security</div>
                </div>
                <i class="fa-solid fa-chevron-right menu-item-arrow"></i>
            </div>
            
            <div class="menu-item">
                <div class="menu-item-left">
                    <div class="menu-item-icon"><i class="fa-solid fa-circle-question"></i></div>
                    <div class="menu-item-text">Help & Support</div>
                </div>
                <i class="fa-solid fa-chevron-right menu-item-arrow"></i>
            </div>
            
            <div class="menu-item danger" onclick="Auth.logout()">
                <div class="menu-item-left">
                    <div class="menu-item-icon"><i class="fa-solid fa-right-from-bracket"></i></div>
                    <div class="menu-item-text">Logout</div>
                </div>
                <i class="fa-solid fa-chevron-right menu-item-arrow"></i>
            </div>
        </div>
        
        <div class="disclaimer-box">
            <i class="fa-solid fa-info-circle"></i>
            ZEO Pro v1.0.0 | Simulation Platform
        </div>
    `;
}

/**
 * Edit profile
 */
function editProfile() {
    const userData = localStorage.getItem('user_data');
    const user = userData ? JSON.parse(userData) : { username: 'Guest' };
    
    const newName = prompt('Enter new display name:', user.username);
    
    if (newName && newName.trim()) {
        user.username = newName.trim();
        localStorage.setItem('user_data', JSON.stringify(user));
        
        document.getElementById('profileName').textContent = newName;
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'Profile Updated',
                timer: 1500,
                showConfirmButton: false
            });
        }
    }
}

/**
 * Update avatar (preview only)
 */
function updateAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatar = document.querySelector('.profile-avatar');
            if (avatar) {
                avatar.innerHTML = `<img src="${e.target.result}" alt="Avatar">`;
                // Save to localStorage (base64)
                localStorage.setItem('user_avatar', e.target.result);
            }
        };
        reader.readAsDataURL(file);
    }
}

// ========================================
// CHART & MARKET UPDATES
// ========================================

/**
 * Initialize trading chart
 */
function initChart() {
    const ctx = document.getElementById('tradingChart');
    if (!ctx) return;
    
    const priceHistory = MarketEngine.getPriceHistory('ZEO');
    
    if (typeof Chart !== 'undefined') {
        chartInstance = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array(60).fill(''),
                datasets: [{
                    label: 'Price',
                    data: priceHistory.length > 0 ? priceHistory : Array(60).fill(150),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                plugins: {
                    legend: { display: false }
                },
                animation: { duration: 0 }
            }
        });
    }
}

/**
 * Start real-time market updates for home
 */
function startMarketUpdates() {
    // Subscribe to market updates
    MarketEngine.subscribe((markets, history) => {
        // Update ticker
        const ticker = document.getElementById('marketTicker');
        if (ticker) {
            ticker.innerHTML = generateTickerItems();
        }
        
        // Update market cards
        const marketCards = document.getElementById('marketCards');
        if (marketCards) {
            marketCards.innerHTML = generateMarketCards();
        }
    });
}

/**
 * Start real-time trade updates
 */
function startTradeUpdates() {
    priceInterval = setInterval(() => {
        const price = MarketEngine.getPrice('ZEO');
        const priceEl = document.getElementById('livePrice');
        const changeEl = document.getElementById('priceChange');
        
        if (priceEl && price) {
            const change = ((price - 150) / 150) * 100;
            priceEl.textContent = '₹' + price.toFixed(2);
            priceEl.style.color = change >= 0 ? 'var(--green)' : 'var(--red)';
            
            if (changeEl) {
                changeEl.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
                changeEl.style.color = change >= 0 ? 'var(--green)' : 'var(--red)';
            }
            
            // Update chart
            if (chartInstance) {
                const history = MarketEngine.getPriceHistory('ZEO');
                chartInstance.data.datasets[0].data = history;
                chartInstance.data.datasets[0].borderColor = change >= 0 ? '#10b981' : '#ef4444';
                chartInstance.update('none');
            }
        }
        
        // Update positions
        const positionsList = document.getElementById('positionsList');
        if (positionsList && Store.portfolio.length > 0) {
            positionsList.innerHTML = renderPositions();
        }
        
        // Update est cost
        updateEstCost();
    }, 1000);
}

// ========================================
// NAVIGATION SETUP
// ========================================

// Setup navigation click handlers
document.addEventListener('DOMContentLoaded', () => {
    // Initialize navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const route = btn.dataset.route;
            if (route) router(route);
        });
    });
    
    // Initialize market engine
    MarketEngine.init();
    
    // Auth will handle initial routing
});

// Export for global use
window.router = router;
window.renderView = renderView;
window.updateGlobalUI = updateGlobalUI;
window.selectMarket = function(symbol) {
    // For now just go to trade
    router('trade');
};
