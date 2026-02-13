/**
 * =================================================================
 * MARKET ENGINE - Real-time Price Simulation
 * =================================================================
 * Simulates live market prices with realistic volatility patterns.
 * Uses seeded random for predictable but varied price movements.
 */

const MarketEngine = {
    // Market state
    markets: {},
    priceHistory: {},
    listeners: [],
    intervalId: null,
    
    // Market configuration
    config: {
        updateInterval: 1000, // ms between price updates
        historyLength: 60,     // number of price points to keep
        volatilityScale: {
            high: 0.5,
            medium: 0.2,
            low: 0.05
        }
    },

    /**
     * Initialize market with default assets
     */
    init() {
        // Load initial market data
        const defaultMarkets = [
            { symbol: 'BTC', name: 'Bitcoin', price: 42500, volatility: 'high', trend: 0.02, icon: 'fa-brands fa-bitcoin', color: '#f7931a' },
            { symbol: 'ETH', name: 'Ethereum', price: 2250, volatility: 'high', trend: -0.01, icon: 'fa-brands fa-ethereum', color: '#627eea' },
            { symbol: 'SOL', name: 'Solana', price: 98, volatility: 'high', trend: 0.05, icon: 'fa-brands fa-solana', color: '#00ffa3' },
            { symbol: 'ZEO', name: 'ZEO Token', price: 150, volatility: 'medium', trend: 0.01, icon: 'fa-solid fa-layer-group', color: '#3b82f6' },
            { symbol: 'AAPL', name: 'Apple Inc', price: 185, volatility: 'low', trend: 0.005, icon: 'fa-brands fa-apple', color: '#555555' },
            { symbol: 'TSLA', name: 'Tesla Inc', price: 245, volatility: 'high', trend: 0.03, icon: 'fa-brands fa-tesla', color: '#cc0000' },
            { symbol: 'GOLD', name: 'Gold Spot', price: 2025, volatility: 'low', trend: 0.002, icon: 'fa-solid fa-coins', color: '#ffd700' },
            { symbol: 'OIL', name: 'Crude Oil', price: 78, volatility: 'medium', trend: -0.01, icon: 'fa-solid fa-droplet', color: '#8b5cf6' }
        ];

        defaultMarkets.forEach(market => {
            this.markets[market.symbol] = { ...market, previousPrice: market.price };
            this.priceHistory[market.symbol] = Array(this.config.historyLength).fill(market.price);
        });

        console.log('[Market] Engine initialized');
    },

    /**
     * Start real-time price updates
     */
    start() {
        if (this.intervalId) return;
        
        this.intervalId = setInterval(() => {
            this.updatePrices();
        }, this.config.updateInterval);
        
        console.log('[Market] Real-time updates started');
    },

    /**
     * Stop price updates
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('[Market] Real-time updates stopped');
        }
    },

    /**
     * Update all market prices
     */
    updatePrices() {
        Object.keys(this.markets).forEach(symbol => {
            const market = this.markets[symbol];
            const volatility = this.config.volatilityScale[market.volatility];
            
            // Generate random price movement
            const randomFactor = (Math.random() - 0.5) * 2;
            const trendFactor = market.trend;
            const change = (randomFactor * volatility) + (trendFactor * volatility);
            
            // Update price
            market.previousPrice = market.price;
            market.price = Math.max(0.01, market.price * (1 + change / 100));
            
            // Update change percentage
            market.change = ((market.price - market.previousPrice) / market.previousPrice) * 100;
            
            // Update price history
            this.priceHistory[symbol].push(market.price);
            if (this.priceHistory[symbol].length > this.config.historyLength) {
                this.priceHistory[symbol].shift();
            }
        });

        // Notify listeners
        this.notifyListeners();
    },

    /**
     * Subscribe to price updates
     * @param {function} callback - Function to call on update
     * @returns {function} Unsubscribe function
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    },

    /**
     * Notify all subscribers of price update
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            callback(this.markets, this.priceHistory);
        });
    },

    /**
     * Get current price for a symbol
     * @param {string} symbol - Asset symbol
     * @returns {number|null}
     */
    getPrice(symbol) {
        return this.markets[symbol]?.price || null;
    },

    /**
     * Get market data for a symbol
     * @param {string} symbol - Asset symbol
     * @returns {object|null}
     */
    getMarket(symbol) {
        return this.markets[symbol] || null;
    },

    /**
     * Get all markets
     * @returns {array}
     */
    getAllMarkets() {
        return Object.values(this.markets);
    },

    /**
     * Get price history for a symbol
     * @param {string} symbol - Asset symbol
     * @returns {array}
     */
    getPriceHistory(symbol) {
        return this.priceHistory[symbol] || [];
    },

    /**
     * Set market trend (for special events)
     * @param {string} symbol - Asset symbol
     * @param {number} trend - New trend value
     */
    setTrend(symbol, trend) {
        if (this.markets[symbol]) {
            this.markets[symbol].trend = trend;
        }
    },

    /**
     * Simulate market event (bull/bear)
     * @param {string} type - 'bull' or 'bear'
     * @param {number} intensity - Event intensity (0-1)
     */
    simulateEvent(type, intensity = 0.5) {
        const trend = type === 'bull' ? intensity : -intensity;
        
        Object.keys(this.markets).forEach(symbol => {
            // Skip some markets randomly for variety
            if (Math.random() > 0.7) return;
            this.markets[symbol].trend = trend * (Math.random() * 0.5 + 0.5);
        });
        
        // Reset trends after event
        setTimeout(() => {
            Object.keys(this.markets).forEach(symbol => {
                this.markets[symbol].trend = (Math.random() - 0.5) * 0.1;
            });
        }, 5000 + Math.random() * 5000);
    },

    /**
     * Format price for display
     * @param {number} price - Price value
     * @param {string} currency - Currency symbol
     * @returns {string}
     */
    formatPrice(price, currency = '₹') {
        if (price >= 1000) {
            return currency + price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (price >= 1) {
            return currency + price.toFixed(2);
        } else {
            return currency + price.toFixed(4);
        }
    },

    /**
     * Format change percentage
     * @param {number} change - Change value
     * @returns {string}
     */
    formatChange(change) {
        const sign = change >= 0 ? '+' : '';
        return sign + change.toFixed(2) + '%';
    }
};

// Initialize on load
MarketEngine.init();

// Export
window.MarketEngine = MarketEngine;
