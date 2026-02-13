/**
 * =================================================================
 * AUTH MODULE - Authentication & Profile
 * =================================================================
 * Handles user authentication and profile management.
 * Ready for backend integration.
 */

const Auth = {
    // Current user
    user: null,
    isLoggedIn: false,

    /**
     * Initialize auth
     */
    init() {
        this.checkAuthStatus();
        console.log('[Auth] Module initialized');
    },

    /**
     * Check if user is logged in
     */
    async checkAuthStatus() {
        const savedUser = localStorage.getItem('user_data');
        const token = localStorage.getItem('auth_token');
        
        if (savedUser && token) {
            this.user = JSON.parse(savedUser);
            this.isLoggedIn = true;
            
            // Verify with backend in real implementation
            try {
                const response = await API.getProfile();
                if (response.success) {
                    this.user = response.user;
                }
            } catch (e) {
                // Use saved data
            }
        } else {
            // Not logged in - show login page
            this.showLoginPage();
        }
        
        return this.isLoggedIn;
    },

    /**
     * Show login page
     */
    showLoginPage() {
        const app = document.getElementById('app');
        const nav = document.getElementById('mainNav');
        
        if (nav) nav.style.display = 'none';
        
        app.innerHTML = `
            <div class="login-page">
                <div class="login-container bounce-in">
                    <div class="login-logo">
                        <div class="brand" style="font-size:52px;"><i class="fa-solid fa-layer-group"></i> ZEO</div>
                        <p>Ultimate Trading Ecosystem</p>
                    </div>
                    
                    <div class="login-card">
                        <div class="login-tabs">
                            <button class="login-tab active" onclick="Auth.switchLoginTab('login')">Login</button>
                            <button class="login-tab" onclick="Auth.switchLoginTab('register')">Register</button>
                        </div>
                        
                        <!-- Login Form -->
                        <div id="loginForm">
                            <div class="input-group">
                                <label class="input-label">Email</label>
                                <div class="input-with-icon">
                                    <i class="fa-regular fa-envelope"></i>
                                    <input type="email" id="loginEmail" class="input-field" placeholder="Enter your email">
                                </div>
                            </div>
                            <div class="input-group">
                                <label class="input-label">Password</label>
                                <div class="input-with-icon">
                                    <i class="fa-solid fa-lock"></i>
                                    <input type="password" id="loginPassword" class="input-field" placeholder="Enter password">
                                </div>
                            </div>
                            <button class="btn btn-primary btn-lg" onclick="Auth.login()">
                                <i class="fa-solid fa-sign-in-alt"></i> Login
                            </button>
                        </div>
                        
                        <!-- Register Form (Hidden by default) -->
                        <div id="registerForm" class="hidden">
                            <div class="input-group">
                                <label class="input-label">Username</label>
                                <div class="input-with-icon">
                                    <i class="fa-regular fa-user"></i>
                                    <input type="text" id="registerUsername" class="input-field" placeholder="Choose a username">
                                </div>
                            </div>
                            <div class="input-group">
                                <label class="input-label">Email</label>
                                <div class="input-with-icon">
                                    <i class="fa-regular fa-envelope"></i>
                                    <input type="email" id="registerEmail" class="input-field" placeholder="Enter your email">
                                </div>
                            </div>
                            <div class="input-group">
                                <label class="input-label">Password</label>
                                <div class="input-with-icon">
                                    <i class="fa-solid fa-lock"></i>
                                    <input type="password" id="registerPassword" class="input-field" placeholder="Create password">
                                </div>
                            </div>
                            <button class="btn btn-primary btn-lg" onclick="Auth.register()">
                                <i class="fa-solid fa-user-plus"></i> Create Account
                            </button>
                        </div>
                        
                        <div class="login-divider">or continue with</div>
                        
                        <div class="social-login">
                            <button class="social-btn" onclick="Auth.socialLogin('google')" title="Google">
                                <i class="fa-brands fa-google"></i>
                            </button>
                            <button class="social-btn" onclick="Auth.socialLogin('apple')" title="Apple">
                                <i class="fa-brands fa-apple"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="login-footer">
                        <p>By continuing, you agree to our <a href="#">Terms</a> & <a href="#">Privacy Policy</a></p>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Switch between login and register tabs
     */
    switchLoginTab(tab) {
        const tabs = document.querySelectorAll('.login-tab');
        tabs.forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        
        if (tab === 'login') {
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('registerForm').classList.add('hidden');
        } else {
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('registerForm').classList.remove('hidden');
        }
    },

    /**
     * Perform login
     */
    async login() {
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        
        if (!email || !password) {
            this.showError('Please enter email and password');
            return;
        }
        
        // Show loading
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Logging in...';
        btn.disabled = true;
        
        try {
            const response = await API.login(email, password);
            
            if (response.success) {
                this.user = response.user;
                this.isLoggedIn = true;
                
                // Save user data
                localStorage.setItem('user_data', JSON.stringify(response.user));
                localStorage.setItem('auth_token', response.token);
                
                // Initialize wallet with default balance if new user
                if (!localStorage.getItem('wallet_main')) {
                    localStorage.setItem('wallet_main', '10000');
                    localStorage.setItem('wallet_bonus', '500');
                }
                
                // Initialize store
                Store.user = response.user.username;
                Store.balance = parseFloat(localStorage.getItem('wallet_main')) || 10000;
                
                // Show success and redirect
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Welcome back!',
                        text: `Logged in as ${response.user.username}`,
                        timer: 1500,
                        showConfirmButton: false
                    });
                }
                
                // Load main app
                this.loadMainApp();
            } else {
                this.showError(response.message || 'Login failed');
            }
        } catch (error) {
            console.error('[Auth] Login error:', error);
            this.showError('Login failed. Please try again.');
        }
        
        btn.innerHTML = originalText;
        btn.disabled = false;
    },

    /**
     * Perform registration
     */
    async register() {
        const username = document.getElementById('registerUsername')?.value;
        const email = document.getElementById('registerEmail')?.value;
        const password = document.getElementById('registerPassword')?.value;
        
        if (!username || !email || !password) {
            this.showError('Please fill all fields');
            return;
        }
        
        if (password.length < 4) {
            this.showError('Password must be at least 4 characters');
            return;
        }
        
        // Show loading
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Creating account...';
        btn.disabled = true;
        
        try {
            const response = await API.register(email, password, username);
            
            if (response.success) {
                this.user = response.user;
                this.isLoggedIn = true;
                
                // Save user data
                localStorage.setItem('user_data', JSON.stringify(response.user));
                localStorage.setItem('auth_token', response.token);
                
                // Initialize wallet
                localStorage.setItem('wallet_main', '10000');
                localStorage.setItem('wallet_bonus', '500');
                
                Store.user = username;
                Store.balance = 10000;
                
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Account Created!',
                        text: 'Welcome to ZEO Pro!',
                        timer: 1500,
                        showConfirmButton: false
                    });
                }
                
                this.loadMainApp();
            } else {
                this.showError(response.message || 'Registration failed');
            }
        } catch (error) {
            console.error('[Auth] Register error:', error);
            this.showError('Registration failed. Please try again.');
        }
        
        btn.innerHTML = originalText;
        btn.disabled = false;
    },

    /**
     * Social login (mock)
     */
    async socialLogin(provider) {
        // Mock social login
        const mockUser = {
            id: 'usr_' + provider + '_' + Date.now(),
            username: provider + '_user',
            email: 'user@' + provider + '.com',
            provider: provider
        };
        
        this.user = mockUser;
        this.isLoggedIn = true;
        
        localStorage.setItem('user_data', JSON.stringify(mockUser));
        localStorage.setItem('auth_token', 'social_token_' + Date.now());
        
        if (!localStorage.getItem('wallet_main')) {
            localStorage.setItem('wallet_main', '10000');
            localStorage.setItem('wallet_bonus', '500');
        }
        
        Store.user = mockUser.username;
        Store.balance = parseFloat(localStorage.getItem('wallet_main')) || 10000;
        
        this.loadMainApp();
    },

    /**
     * Logout
     */
    async logout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                await API.logout();
            } catch (e) {}
            
            this.user = null;
            this.isLoggedIn = false;
            
            localStorage.removeItem('user_data');
            localStorage.removeItem('auth_token');
            
            this.showLoginPage();
        }
    },

    /**
     * Load main application
     */
    loadMainApp() {
        const nav = document.getElementById('mainNav');
        if (nav) nav.style.display = 'flex';
        
        // Load home view
        renderView('home');
        
        // Start market updates
        MarketEngine.start();
    },

    /**
     * Show error message
     */
    showError(message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: message
            });
        } else {
            alert(message);
        }
    }
};

// Initialize
Auth.init();

// Export
window.Auth = Auth;
