/**
 * =================================================================
 * WALLET MODULE - Deposit & Withdraw System
 * =================================================================
 * Handles virtual wallet operations with transaction history.
 * All operations are simulated - ready for backend integration.
 */

const Wallet = {
    // Wallet state
    balance: {
        main: 0,
        bonus: 0,
        pending: 0
    },
    
    // Transaction history
    transactions: [],
    
    // Supported payment methods
    depositMethods: [
        { id: 'upi', name: 'UPI', icon: 'fa-solid fa-mobile-screen', min: 100, max: 50000 },
        { id: 'bank', name: 'Bank Transfer', icon: 'fa-solid fa-building-columns', min: 500, max: 100000 },
        { id: 'card', name: 'Debit/Credit Card', icon: 'fa-regular fa-credit-card', min: 100, max: 25000 },
        { id: 'crypto', name: 'Crypto (USDT)', icon: 'fa-brands fa-bitcoin', min: 500, max: 500000 }
    ],
    
    withdrawMethods: [
        { id: 'upi', name: 'UPI', icon: 'fa-solid fa-mobile-screen', min: 200, max: 25000 },
        { id: 'bank', name: 'Bank Transfer', icon: 'fa-solid fa-building-columns', min: 500, max: 100000 },
        { id: 'crypto', name: 'Crypto (USDT)', icon: 'fa-brands fa-bitcoin', min: 500, max: 500000 }
    ],

    /**
     * Initialize wallet
     */
    async init() {
        await this.loadBalance();
        await this.loadTransactions();
        console.log('[Wallet] Initialized');
    },

    /**
     * Load wallet balance from API
     */
    async loadBalance() {
        try {
            const response = await API.getWalletBalance();
            if (response.success) {
                this.balance = response.balance;
            }
        } catch (error) {
            console.error('[Wallet] Error loading balance:', error);
            // Fallback to localStorage
            this.balance.main = parseFloat(localStorage.getItem('wallet_main')) || 10000;
            this.balance.bonus = parseFloat(localStorage.getItem('wallet_bonus')) || 500;
        }
        
        // Update UI
        this.updateBalanceUI();
    },

    /**
     * Load transaction history
     */
    async loadTransactions() {
        try {
            const response = await API.getTransactionHistory();
            if (response.success) {
                this.transactions = response.transactions;
            }
        } catch (error) {
            console.error('[Wallet] Error loading transactions:', error);
            this.transactions = JSON.parse(localStorage.getItem('wallet_transactions')) || [];
        }
    },

    /**
     * Update balance display in UI
     */
    updateBalanceUI() {
        const mainEl = document.getElementById('walletMainBalance');
        const bonusEl = document.getElementById('walletBonusBalance');
        const pendingEl = document.getElementById('walletPendingBalance');
        
        if (mainEl) mainEl.textContent = this.balance.main.toFixed(2);
        if (bonusEl) bonusEl.textContent = this.balance.bonus.toFixed(2);
        if (pendingEl) pendingEl.textContent = this.balance.pending.toFixed(2);
        
        // Also update global header balance
        const globalBalance = document.getElementById('globalBalance');
        if (globalBalance) {
            globalBalance.textContent = (this.balance.main + this.balance.bonus).toFixed(2);
        }
    },

    /**
     * Render wallet view
     * @param {HTMLElement} container - Container element
     */
    renderWallet(container) {
        container.innerHTML = `
            <div class="hero-section">
                <!-- Balance Card -->
                <div class="hero-card">
                    <div class="hero-label">Total Balance</div>
                    <div class="hero-balance">₹<span id="walletTotalBalance">${(this.balance.main + this.balance.bonus).toFixed(2)}</span></div>
                    <div class="hero-actions">
                        <button class="hero-btn" onclick="Wallet.showDepositModal()">
                            <i class="fa-solid fa-plus"></i> Deposit
                        </button>
                        <button class="hero-btn" onclick="Wallet.showWithdrawModal()">
                            <i class="fa-solid fa-arrow-down"></i> Withdraw
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Balance Stats -->
            <div class="wallet-stats">
                <div class="wallet-stat-card">
                    <div class="wallet-stat-label">Main Balance</div>
                    <div class="wallet-stat-value text-green">₹<span id="walletMainBalance">${this.balance.main.toFixed(2)}</span></div>
                </div>
                <div class="wallet-stat-card">
                    <div class="wallet-stat-label">Bonus</div>
                    <div class="wallet-stat-value text-accent">₹<span id="walletBonusBalance">${this.balance.bonus.toFixed(2)}</span></div>
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="card">
                <div class="section-header">
                    <h3><i class="fa-solid fa-bolt text-yellow"></i> Quick Actions</h3>
                </div>
                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; text-align:center;">
                    <div onclick="Wallet.addDemoFunds(500)" style="cursor:pointer; padding:15px; background:var(--bg-dark); border-radius:var(--radius-md);">
                        <i class="fa-solid fa-plus text-green"></i>
                        <div class="text-sm text-muted" style="margin-top:5px;">+₹500</div>
                    </div>
                    <div onclick="Wallet.addDemoFunds(1000)" style="cursor:pointer; padding:15px; background:var(--bg-dark); border-radius:var(--radius-md);">
                        <i class="fa-solid fa-plus text-green"></i>
                        <div class="text-sm text-muted" style="margin-top:5px;">+₹1K</div>
                    </div>
                    <div onclick="Wallet.addDemoFunds(5000)" style="cursor:pointer; padding:15px; background:var(--bg-dark); border-radius:var(--radius-md);">
                        <i class="fa-solid fa-plus text-green"></i>
                        <div class="text-sm text-muted" style="margin-top:5px;">+₹5K</div>
                    </div>
                    <div onclick="Wallet.resetBalance()" style="cursor:pointer; padding:15px; background:var(--bg-dark); border-radius:var(--radius-md);">
                        <i class="fa-solid fa-rotate-left text-red"></i>
                        <div class="text-sm text-muted" style="margin-top:5px;">Reset</div>
                    </div>
                </div>
            </div>
            
            <!-- Transaction History -->
            <div class="card">
                <div class="section-header">
                    <h3><i class="fa-solid fa-receipt text-muted"></i> Recent Transactions</h3>
                    <span class="see-all" onclick="Wallet.showAllTransactions()">View All</span>
                </div>
                <div id="transactionList">
                    ${this.renderTransactionList()}
                </div>
            </div>
            
            <div class="disclaimer-box">
                <i class="fa-solid fa-circle-exclamation"></i>
                This is a simulation platform. All transactions are virtual.
            </div>
        `;
    },

    /**
     * Render transaction list
     */
    renderTransactionList() {
        if (this.transactions.length === 0) {
            return `
                <div class="text-center text-muted" style="padding:30px;">
                    <i class="fa-solid fa-inbox" style="font-size:32px; margin-bottom:10px; opacity:0.5;"></i>
                    <div>No transactions yet</div>
                </div>
            `;
        }
        
        return this.transactions.slice(0, 5).map(txn => this.renderTransactionItem(txn)).join('');
    },

    /**
     * Render single transaction item
     */
    renderTransactionItem(txn) {
        const isDeposit = txn.type === 'deposit';
        const amountColor = isDeposit ? 'text-green' : 'text-red';
        const amountPrefix = isDeposit ? '+' : '-';
        
        return `
            <div class="wallet-transaction">
                <div class="transaction-icon ${txn.type}">
                    <i class="fa-solid ${isDeposit ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                </div>
                <div class="transaction-info">
                    <div class="transaction-type">${txn.type === 'deposit' ? 'Deposit' : 'Withdrawal'}</div>
                    <div class="transaction-date">${this.formatDate(txn.createdAt)}</div>
                </div>
                <div style="text-align:right;">
                    <div class="transaction-amount ${amountColor}">${amountPrefix}₹${txn.amount.toFixed(2)}</div>
                    <div class="transaction-status ${txn.status}">${txn.status}</div>
                </div>
            </div>
        `;
    },

    /**
     * Format date
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' min ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' hours ago';
        if (diff < 604800000) return Math.floor(diff / 86400000) + ' days ago';
        
        return date.toLocaleDateString('en-IN');
    },

    /**
     * Show deposit modal
     */
    showDepositModal() {
        const modal = document.getElementById('modalOverlay');
        if (!modal) return;
        
        const methodsHTML = this.depositMethods.map(m => `
            <div class="deposit-method" onclick="Wallet.selectDepositMethod('${m.id}')" data-method="${m.id}">
                <div class="deposit-method-icon">
                    <i class="fa-solid ${m.icon}"></i>
                </div>
                <div class="deposit-method-info">
                    <div class="deposit-method-name">${m.name}</div>
                    <div class="deposit-method-limits">₹${m.min} - ₹${m.max.toLocaleString()}</div>
                </div>
            </div>
        `).join('');

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title"><i class="fa-solid fa-plus-circle text-green"></i> Deposit Funds</div>
                    <button class="modal-close" onclick="Wallet.closeModal()">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <label class="input-label">Select Payment Method</label>
                        <div id="depositMethods" style="display:flex; flex-direction:column; gap:10px;">
                            ${methodsHTML}
                        </div>
                    </div>
                    <div id="depositForm" class="hidden">
                        <div class="input-group">
                            <label class="input-label">Amount</label>
                            <div class="input-with-icon">
                                <i class="fa-solid fa-indian-rupee-sign"></i>
                                <input type="number" id="depositAmount" class="input-field" placeholder="Enter amount" min="100">
                            </div>
                        </div>
                        <div class="input-group">
                            <label class="input-label" id="paymentDetailsLabel">Account Details</label>
                            <input type="text" id="paymentDetails" class="input-field" placeholder="Enter details">
                        </div>
                        <button class="btn btn-green" onclick="Wallet.processDeposit()">
                            <i class="fa-solid fa-check"></i> Submit Request
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
        // Add styles for deposit method
        const style = document.createElement('style');
        style.textContent = `
            .deposit-method { display:flex; align-items:center; gap:12px; padding:14px; background:var(--bg-dark); border:1px solid var(--border); border-radius:var(--radius-md); cursor:pointer; transition:0.3s; }
            .deposit-method:hover { border-color:var(--primary); background:rgba(59,130,246,0.1); }
            .deposit-method.selected { border-color:var(--green); background:rgba(16,185,129,0.1); }
            .deposit-method-icon { width:44px; height:44px; background:var(--bg-panel); border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; font-size:18px; color:var(--primary); }
            .deposit-method-info { flex:1; }
            .deposit-method-name { font-weight:600; }
            .deposit-method-limits { font-size:11px; color:var(--text-muted); }
        `;
        document.head.appendChild(style);
    },

    /**
     * Select deposit method
     */
    selectDepositMethod(methodId) {
        // Update UI
        document.querySelectorAll('.deposit-method').forEach(el => el.classList.remove('selected'));
        document.querySelector(`[data-method="${methodId}"]`)?.classList.add('selected');
        
        // Show form
        const form = document.getElementById('depositForm');
        const label = document.getElementById('paymentDetailsLabel');
        
        if (methodId === 'upi') {
            label.textContent = 'UPI ID (e.g., mobile@upi)';
        } else if (methodId === 'bank') {
            label.textContent = 'Bank Account Number';
        } else if (methodId === 'card') {
            label.textContent = 'Card Last 4 Digits';
        } else if (methodId === 'crypto') {
            label.textContent = 'USDT Wallet Address';
        }
        
        form.classList.remove('hidden');
        this.selectedMethod = methodId;
    },

    /**
     * Process deposit request
     */
    async processDeposit() {
        const amount = parseFloat(document.getElementById('depositAmount')?.value || 0);
        const details = document.getElementById('paymentDetails')?.value;
        
        if (!amount || amount < 100) {
            alert('Minimum deposit is ₹100');
            return;
        }
        
        // Call API
        try {
            const response = await API.submitDepositRequest(amount, this.selectedMethod);
            
            if (response.success) {
                // Add to local transactions
                this.transactions.unshift(response.transaction);
                
                this.closeModal();
                
                // Show success
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deposit Request Submitted!',
                        text: `Your request for ₹${amount} has been submitted for processing.`,
                        confirmButtonColor: 'var(--primary)'
                    });
                }
                
                // Update wallet view
                renderView('wallet');
            }
        } catch (error) {
            console.error('[Wallet] Deposit error:', error);
            alert('Error processing deposit. Please try again.');
        }
    },

    /**
     * Show withdraw modal
     */
    showWithdrawModal() {
        const modal = document.getElementById('modalOverlay');
        if (!modal) return;
        
        const available = this.balance.main;
        
        const methodsHTML = this.withdrawMethods.map(m => `
            <div class="deposit-method" onclick="Wallet.selectWithdrawMethod('${m.id}')" data-method="${m.id}">
                <div class="deposit-method-icon">
                    <i class="fa-solid ${m.icon}"></i>
                </div>
                <div class="deposit-method-info">
                    <div class="deposit-method-name">${m.name}</div>
                    <div class="deposit-method-limits">₹${m.min} - ₹${Math.min(m.max, available).toLocaleString()}</div>
                </div>
            </div>
        `).join('');

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title"><i class="fa-solid fa-arrow-down-circle text-red"></i> Withdraw Funds</div>
                    <button class="modal-close" onclick="Wallet.closeModal()">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="background:var(--bg-dark); padding:12px; border-radius:var(--radius-md); margin-bottom:15px;">
                        <div class="text-muted text-sm">Available Balance</div>
                        <div class="text-xl font-bold text-green">₹${available.toFixed(2)}</div>
                    </div>
                    
                    <div class="input-group">
                        <label class="input-label">Select Withdrawal Method</label>
                        <div id="withdrawMethods" style="display:flex; flex-direction:column; gap:10px;">
                            ${methodsHTML}
                        </div>
                    </div>
                    
                    <div id="withdrawForm" class="hidden">
                        <div class="input-group">
                            <label class="input-label">Amount</label>
                            <div class="input-with-icon">
                                <i class="fa-solid fa-indian-rupee-sign"></i>
                                <input type="number" id="withdrawAmount" class="input-field" placeholder="Enter amount" min="200" max="${available}">
                            </div>
                        </div>
                        <div class="input-group">
                            <label class="input-label" id="withdrawDetailsLabel">Account Details</label>
                            <input type="text" id="withdrawDetails" class="input-field" placeholder="Enter details">
                        </div>
                        <button class="btn btn-red" onclick="Wallet.processWithdraw()">
                            <i class="fa-solid fa-paper-plane"></i> Submit Request
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .deposit-method { display:flex; align-items:center; gap:12px; padding:14px; background:var(--bg-dark); border:1px solid var(--border); border-radius:var(--radius-md); cursor:pointer; transition:0.3s; }
            .deposit-method:hover { border-color:var(--primary); background:rgba(59,130,246,0.1); }
            .deposit-method.selected { border-color:var(--red); background:rgba(239,68,68,0.1); }
            .deposit-method-icon { width:44px; height:44px; background:var(--bg-panel); border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; font-size:18px; color:var(--primary); }
            .deposit-method-info { flex:1; }
            .deposit-method-name { font-weight:600; }
            .deposit-method-limits { font-size:11px; color:var(--text-muted); }
        `;
        document.head.appendChild(style);
    },

    /**
     * Select withdraw method
     */
    selectWithdrawMethod(methodId) {
        document.querySelectorAll('.deposit-method').forEach(el => el.classList.remove('selected'));
        document.querySelector(`[data-method="${methodId}"]`)?.classList.add('selected');
        
        const form = document.getElementById('withdrawForm');
        const label = document.getElementById('withdrawDetailsLabel');
        
        if (methodId === 'upi') {
            label.textContent = 'UPI ID';
        } else if (methodId === 'bank') {
            label.textContent = 'Bank Account Number';
        } else if (methodId === 'crypto') {
            label.textContent = 'USDT TRC20 Address';
        }
        
        form.classList.remove('hidden');
        this.selectedMethod = methodId;
    },

    /**
     * Process withdraw request
     */
    async processWithdraw() {
        const amount = parseFloat(document.getElementById('withdrawAmount')?.value || 0);
        const details = document.getElementById('withdrawDetails')?.value;
        
        if (!amount || amount < 200) {
            alert('Minimum withdrawal is ₹200');
            return;
        }
        
        if (amount > this.balance.main) {
            alert('Insufficient balance');
            return;
        }
        
        try {
            const response = await API.submitWithdrawRequest(amount, this.selectedMethod, details);
            
            if (response.success) {
                // Deduct from balance
                this.balance.main -= amount;
                localStorage.setItem('wallet_main', this.balance.main);
                
                // Add to transactions
                this.transactions.unshift(response.transaction);
                
                this.closeModal();
                
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Withdrawal Request Submitted!',
                        text: `Your request for ₹${amount} is being processed.`,
                        confirmButtonColor: 'var(--primary)'
                    });
                }
                
                renderView('wallet');
            }
        } catch (error) {
            console.error('[Wallet] Withdraw error:', error);
            alert('Error processing withdrawal. Please try again.');
        }
    },

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('modalOverlay');
        if (modal) modal.classList.remove('active');
    },

    /**
     * Add demo funds (for testing)
     */
    addDemoFunds(amount) {
        this.balance.main += amount;
        localStorage.setItem('wallet_main', this.balance.main);
        
        // Add transaction
        this.transactions.unshift({
            id: 'txn_' + Date.now(),
            type: 'deposit',
            amount: amount,
            status: 'approved',
            method: 'demo',
            createdAt: new Date().toISOString()
        });
        
        this.updateBalanceUI();
        
        // Re-render wallet view
        const container = document.getElementById('app');
        if (container) {
            this.renderWallet(container);
        }
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'Funds Added!',
                text: `₹${amount} added to your wallet`,
                timer: 1500,
                showConfirmButton: false
            });
        }
    },

    /**
     * Reset balance to default
     */
    resetBalance() {
        if (confirm('Reset your balance to default ₹10,000?')) {
            this.balance.main = 10000;
            this.balance.bonus = 500;
            localStorage.setItem('wallet_main', '10000');
            localStorage.setItem('wallet_bonus', '500');
            
            this.updateBalanceUI();
            
            const container = document.getElementById('app');
            if (container) {
                this.renderWallet(container);
            }
        }
    },

    /**
     * Show all transactions
     */
    showAllTransactions() {
        const modal = document.getElementById('modalOverlay');
        if (!modal) return;
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width:500px;">
                <div class="modal-header">
                    <div class="modal-title">All Transactions</div>
                    <button class="modal-close" onclick="Wallet.closeModal()">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="modal-body" style="max-height:400px; overflow-y:auto;">
                    ${this.renderTransactionList()}
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }
};

// Initialize wallet
Wallet.init();

// Export
window.Wallet = Wallet;
