// ============================================
// BLAST NETWORK — REFERRAL SYSTEM
// Progressive Level-Based Incentives
// Rewards from burn pool (deflationary redirect)
// ============================================
// Creator: Yozy Matmo Chigkito
// Email: yozymatmo@blast.network
// ============================================

const crypto = require('crypto');

// ────────────────────────────────────────────
// CONFIGURATION
// ────────────────────────────────────────────

const REFERRAL_CONFIG = {
    // Minimum BLAST purchase to activate referral reward
    MIN_PURCHASE_AMOUNT: 10, // 10 BLAST minimum

    // % of the burn pool redirected to referrals (from the 1% protocol fee)
    BURN_REDIRECT_RATE: 0.003, // 0.3% of transaction goes to referral pool

    // Maximum referral tree depth (for multi-level bonuses)
    MAX_DEPTH: 3,

    // Referral code length
    CODE_LENGTH: 8,

    // Progressive levels
    LEVELS: {
        1: {
            name: 'BRONZE',
            emoji: '🥉',
            requiredReferrals: 0,
            rewardPercent: 5,     // 5% of referred user's first purchase
            bonusPercent: 0,      // No extra bonus
            color: '#CD7F32'
        },
        2: {
            name: 'SILVER',
            emoji: '🥈',
            requiredReferrals: 5,
            rewardPercent: 8,     // 8% of referred user's first purchase
            bonusPercent: 2,      // +2% retroactive bonus on all past referrals
            color: '#C0C0C0'
        },
        3: {
            name: 'GOLD',
            emoji: '🥇',
            requiredReferrals: 15,
            rewardPercent: 12,    // 12% of referred user's first purchase
            bonusPercent: 5,      // +5% bonus
            color: '#FFD700'
        },
        4: {
            name: 'PLATINUM',
            emoji: '💎',
            requiredReferrals: 50,
            rewardPercent: 18,    // 18% of referred user's first purchase
            bonusPercent: 10,     // +10% bonus
            color: '#E5E4E2'
        },
        5: {
            name: 'DIAMOND',
            emoji: '👑',
            requiredReferrals: 100,
            rewardPercent: 25,    // 25% of referred user's first purchase
            bonusPercent: 15,     // +15% bonus
            color: '#B9F2FF'
        }
    }
};

// ────────────────────────────────────────────
// REFERRAL ENGINE CLASS
// ────────────────────────────────────────────

class BlastReferralSystem {
    constructor() {
        // referralCode -> referrer wallet address
        this.codes = new Map();

        // wallet -> { code, referredBy, referrals[], level, totalRewards, pendingRewards, activatedReferrals, joinedAt }
        this.users = new Map();

        // All referral events log
        this.events = [];

        // Total rewards distributed
        this.totalDistributed = 0;

        // Burn pool balance (accumulated from tx fees)
        this.burnPool = 0;
    }

    // ─── Generate Referral Code ──────────────────
    generateCode(walletAddress) {
        if (!walletAddress) throw new Error('Wallet address required');

        // Check if user already has a code
        const existing = this.users.get(walletAddress);
        if (existing && existing.code) {
            return {
                success: true,
                code: existing.code,
                link: `https://blast.network/?ref=${existing.code}`,
                message: 'Existing code returned'
            };
        }

        // Generate unique code
        const code = this._generateUniqueCode();

        // Initialize user profile
        const profile = {
            wallet: walletAddress,
            code: code,
            referredBy: null,
            referrals: [],           // wallets of referred users
            activatedReferrals: [],  // referrals that completed min purchase
            level: 1,
            totalRewards: 0,
            pendingRewards: 0,
            claimedRewards: 0,
            joinedAt: Date.now()
        };

        this.codes.set(code, walletAddress);
        this.users.set(walletAddress, profile);

        this._logEvent('CODE_GENERATED', { wallet: walletAddress, code });

        return {
            success: true,
            code: code,
            link: `https://blast.network/?ref=${code}`,
            level: REFERRAL_CONFIG.LEVELS[1]
        };
    }

    // ─── Register New User via Referral ──────────
    registerReferral(newUserWallet, referralCode) {
        if (!newUserWallet || !referralCode) {
            throw new Error('Wallet and referral code required');
        }

        // Validate referral code exists
        const referrerWallet = this.codes.get(referralCode.toUpperCase());
        if (!referrerWallet) {
            return { success: false, error: 'Invalid referral code' };
        }

        // Can't refer yourself
        if (referrerWallet === newUserWallet) {
            return { success: false, error: 'Cannot use your own referral code' };
        }

        // Check if new user already registered
        const existingUser = this.users.get(newUserWallet);
        if (existingUser && existingUser.referredBy) {
            return { success: false, error: 'User already registered with a referral' };
        }

        // Get or create profile for new user
        let newUserProfile = existingUser || {
            wallet: newUserWallet,
            code: null,
            referredBy: null,
            referrals: [],
            activatedReferrals: [],
            level: 1,
            totalRewards: 0,
            pendingRewards: 0,
            claimedRewards: 0,
            joinedAt: Date.now()
        };

        // Link referral
        newUserProfile.referredBy = referrerWallet;
        this.users.set(newUserWallet, newUserProfile);

        // Add to referrer's referral list
        const referrerProfile = this.users.get(referrerWallet);
        if (referrerProfile && !referrerProfile.referrals.includes(newUserWallet)) {
            referrerProfile.referrals.push(newUserWallet);
        }

        this._logEvent('REFERRAL_REGISTERED', {
            newUser: newUserWallet,
            referrer: referrerWallet,
            code: referralCode
        });

        return {
            success: true,
            message: 'Referral registered. Reward will be sent when minimum purchase is completed.',
            referrer: referrerWallet,
            minPurchase: REFERRAL_CONFIG.MIN_PURCHASE_AMOUNT
        };
    }

    // ─── Process Purchase (triggers referral reward) ──────
    processPurchase(buyerWallet, purchaseAmount) {
        if (!buyerWallet || purchaseAmount <= 0) return null;

        const buyer = this.users.get(buyerWallet);
        if (!buyer || !buyer.referredBy) return null;

        // Check minimum purchase
        if (purchaseAmount < REFERRAL_CONFIG.MIN_PURCHASE_AMOUNT) {
            return {
                success: false,
                message: `Minimum purchase of ${REFERRAL_CONFIG.MIN_PURCHASE_AMOUNT} BLAST required to activate referral reward`
            };
        }

        const referrerWallet = buyer.referredBy;
        const referrer = this.users.get(referrerWallet);
        if (!referrer) return null;

        // Check if already activated
        if (referrer.activatedReferrals.includes(buyerWallet)) {
            return { success: false, message: 'Referral reward already claimed for this user' };
        }

        // Calculate reward based on referrer's level
        const level = referrer.level;
        const levelConfig = REFERRAL_CONFIG.LEVELS[level];
        const rewardAmount = (purchaseAmount * levelConfig.rewardPercent) / 100;

        // Check if burn pool has enough
        const actualReward = Math.min(rewardAmount, this.burnPool);

        if (actualReward <= 0) {
            return { success: false, message: 'Burn pool depleted, reward pending' };
        }

        // Distribute reward to referrer
        referrer.pendingRewards += actualReward;
        referrer.activatedReferrals.push(buyerWallet);
        this.burnPool -= actualReward;
        this.totalDistributed += actualReward;

        // Check for level up
        const levelUpResult = this._checkLevelUp(referrerWallet);

        // Multi-level: reward up the chain (depth 2 and 3 get smaller cuts)
        this._processMultiLevel(referrerWallet, purchaseAmount, 1);

        this._logEvent('REWARD_GENERATED', {
            referrer: referrerWallet,
            buyer: buyerWallet,
            purchaseAmount,
            reward: actualReward,
            level: level,
            levelName: levelConfig.name
        });

        return {
            success: true,
            reward: actualReward,
            referrer: referrerWallet,
            level: levelConfig.name,
            levelUp: levelUpResult,
            message: `${levelConfig.emoji} ${actualReward.toFixed(4)} BLAST reward generated for ${referrerWallet}`
        };
    }

    // ─── Multi-level chain rewards ───────────────
    _processMultiLevel(walletAddress, purchaseAmount, currentDepth) {
        if (currentDepth >= REFERRAL_CONFIG.MAX_DEPTH) return;

        const user = this.users.get(walletAddress);
        if (!user || !user.referredBy) return;

        const upline = this.users.get(user.referredBy);
        if (!upline) return;

        // Depth 2: 2% bonus, Depth 3: 1% bonus
        const depthBonus = currentDepth === 1 ? 2 : 1;
        const bonus = (purchaseAmount * depthBonus) / 100;
        const actualBonus = Math.min(bonus, this.burnPool);

        if (actualBonus > 0) {
            upline.pendingRewards += actualBonus;
            this.burnPool -= actualBonus;
            this.totalDistributed += actualBonus;

            this._logEvent('MULTILEVEL_BONUS', {
                beneficiary: user.referredBy,
                depth: currentDepth + 1,
                bonus: actualBonus
            });
        }

        // Continue up the chain
        this._processMultiLevel(user.referredBy, purchaseAmount, currentDepth + 1);
    }

    // ─── Check and Process Level Up ──────────────
    _checkLevelUp(walletAddress) {
        const user = this.users.get(walletAddress);
        if (!user) return null;

        const activatedCount = user.activatedReferrals.length;
        let newLevel = 1;

        // Determine highest qualifying level
        for (const [lvl, config] of Object.entries(REFERRAL_CONFIG.LEVELS)) {
            if (activatedCount >= config.requiredReferrals) {
                newLevel = parseInt(lvl);
            }
        }

        if (newLevel > user.level) {
            const oldLevel = user.level;
            user.level = newLevel;
            const levelConfig = REFERRAL_CONFIG.LEVELS[newLevel];

            // Apply retroactive bonus on level up
            if (levelConfig.bonusPercent > 0) {
                const retroBonus = (user.totalRewards * levelConfig.bonusPercent) / 100;
                const actualRetro = Math.min(retroBonus, this.burnPool);
                if (actualRetro > 0) {
                    user.pendingRewards += actualRetro;
                    this.burnPool -= actualRetro;
                    this.totalDistributed += actualRetro;
                }
            }

            this._logEvent('LEVEL_UP', {
                wallet: walletAddress,
                oldLevel,
                newLevel,
                levelName: levelConfig.name
            });

            return {
                leveled: true,
                from: REFERRAL_CONFIG.LEVELS[oldLevel].name,
                to: levelConfig.name,
                emoji: levelConfig.emoji
            };
        }

        return null;
    }

    // ─── Claim Rewards ───────────────────────────
    claimRewards(walletAddress) {
        const user = this.users.get(walletAddress);
        if (!user) return { success: false, error: 'User not found' };

        const amount = user.pendingRewards;
        if (amount <= 0) return { success: false, error: 'No pending rewards' };

        user.claimedRewards += amount;
        user.totalRewards += amount;
        user.pendingRewards = 0;

        this._logEvent('REWARDS_CLAIMED', { wallet: walletAddress, amount });

        return {
            success: true,
            amount,
            totalClaimed: user.claimedRewards,
            message: `✅ ${amount.toFixed(4)} BLAST sent to ${walletAddress}`
        };
    }

    // ─── Add to Burn Pool ────────────────────────
    addToBurnPool(amount) {
        if (amount > 0) {
            this.burnPool += amount;
            this._logEvent('BURN_POOL_FUNDED', { amount, newBalance: this.burnPool });
        }
    }

    // ─── Get User Stats ──────────────────────────
    getStats(walletAddress) {
        const user = this.users.get(walletAddress);
        if (!user) return { success: false, error: 'User not found' };

        const levelConfig = REFERRAL_CONFIG.LEVELS[user.level];
        const nextLevel = REFERRAL_CONFIG.LEVELS[user.level + 1];
        const activatedCount = user.activatedReferrals.length;

        return {
            success: true,
            wallet: walletAddress,
            code: user.code,
            link: user.code ? `https://blast.network/?ref=${user.code}` : null,
            referredBy: user.referredBy,
            level: {
                current: user.level,
                name: levelConfig.name,
                emoji: levelConfig.emoji,
                color: levelConfig.color,
                rewardPercent: levelConfig.rewardPercent
            },
            nextLevel: nextLevel ? {
                name: nextLevel.name,
                emoji: nextLevel.emoji,
                requiredReferrals: nextLevel.requiredReferrals,
                remaining: Math.max(0, nextLevel.requiredReferrals - activatedCount),
                rewardPercent: nextLevel.rewardPercent
            } : null,
            referrals: {
                total: user.referrals.length,
                activated: activatedCount,
                pending: user.referrals.length - activatedCount
            },
            rewards: {
                pending: user.pendingRewards,
                claimed: user.claimedRewards,
                total: user.totalRewards + user.pendingRewards
            },
            joinedAt: user.joinedAt
        };
    }

    // ─── Get Leaderboard ─────────────────────────
    getLeaderboard(limit = 10) {
        const users = Array.from(this.users.values())
            .filter(u => u.activatedReferrals.length > 0)
            .sort((a, b) => {
                // Sort by level first, then by activated referrals
                if (b.level !== a.level) return b.level - a.level;
                return b.activatedReferrals.length - a.activatedReferrals.length;
            })
            .slice(0, limit);

        return {
            success: true,
            leaderboard: users.map((u, i) => ({
                rank: i + 1,
                wallet: u.wallet.substring(0, 10) + '...' + u.wallet.substring(u.wallet.length - 6),
                level: REFERRAL_CONFIG.LEVELS[u.level].name,
                emoji: REFERRAL_CONFIG.LEVELS[u.level].emoji,
                referrals: u.activatedReferrals.length,
                totalRewards: (u.totalRewards + u.pendingRewards).toFixed(4)
            })),
            totalUsers: this.users.size,
            totalDistributed: this.totalDistributed.toFixed(4),
            burnPoolBalance: this.burnPool.toFixed(4)
        };
    }

    // ─── Get Referral Tree (visual) ──────────────
    getReferralTree(walletAddress, depth = 0) {
        if (depth >= REFERRAL_CONFIG.MAX_DEPTH) return null;

        const user = this.users.get(walletAddress);
        if (!user) return null;

        return {
            wallet: walletAddress.substring(0, 10) + '...',
            level: REFERRAL_CONFIG.LEVELS[user.level].name,
            referrals: user.referrals.map(ref => {
                const child = this.getReferralTree(ref, depth + 1);
                const refUser = this.users.get(ref);
                return child || {
                    wallet: ref.substring(0, 10) + '...',
                    level: refUser ? REFERRAL_CONFIG.LEVELS[refUser.level].name : 'BRONZE',
                    activated: refUser ? refUser.activatedReferrals.length > 0 : false,
                    referrals: []
                };
            })
        };
    }

    // ─── Get All Levels Info ─────────────────────
    getLevels() {
        return {
            success: true,
            levels: Object.entries(REFERRAL_CONFIG.LEVELS).map(([lvl, config]) => ({
                level: parseInt(lvl),
                ...config
            })),
            minPurchase: REFERRAL_CONFIG.MIN_PURCHASE_AMOUNT,
            burnRedirectRate: REFERRAL_CONFIG.BURN_REDIRECT_RATE * 100 + '%'
        };
    }

    // ─── Private Helpers ─────────────────────────
    _generateUniqueCode() {
        let code;
        do {
            code = crypto.randomBytes(4)
                .toString('hex')
                .toUpperCase()
                .substring(0, REFERRAL_CONFIG.CODE_LENGTH);
        } while (this.codes.has(code));
        return code;
    }

    _logEvent(type, details) {
        this.events.push({
            timestamp: Date.now(),
            type,
            details
        });
    }
}

module.exports = { BlastReferralSystem, REFERRAL_CONFIG };
