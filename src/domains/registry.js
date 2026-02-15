const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DOMAIN_COST = {
    '3': 100,
    '4': 50,
    '5': 25,
    'default': 10
};

class DomainRegistry {
    constructor() {
        this.domains = new Map();
        this.bids = new Map();
        this.resolutions = new Map();
        this.loadDomains();
    }

    loadDomains() {
        const domainsFile = path.join(__dirname, '../../data/domains.json');
        if (fs.existsSync(domainsFile)) {
            const data = JSON.parse(fs.readFileSync(domainsFile, 'utf8'));
            data.domains.forEach(d => this.domains.set(d.name, d));
        }
    }

    saveDomains() {
        const dataDir = path.join(__dirname, '../../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const domainsFile = path.join(dataDir, 'domains.json');
        fs.writeFileSync(domainsFile, JSON.stringify({
            domains: Array.from(this.domains.values())
        }, null, 2));
    }

    getDomainLength(name) {
        const baseName = name.replace('.blast', '').replace('.BLAST', '');
        return baseName.length;
    }

    getDomainPrice(name) {
        const length = this.getDomainLength(name);
        
        if (DOMAIN_COST[length.toString()]) {
            return DOMAIN_COST[length.toString()];
        }
        
        return DOMAIN_COST['default'];
    }

    registerDomain(name, owner, contentHash = '', resolver = '') {
        const normalizedName = name.toLowerCase();
        
        if (!normalizedName.endsWith('.blast')) {
            throw new Error('El dominio debe terminar en .blast');
        }
        
        if (this.domains.has(normalizedName)) {
            throw new Error('El dominio ya está registrado');
        }
        
        if (!/^[a-z0-9]+$/.test(normalizedName.replace('.blast', ''))) {
            throw new Error('El nombre del dominio solo puede contener letras minúsculas y números');
        }
        
        const domain = {
            name: normalizedName,
            owner: owner,
            contentHash: contentHash,
            resolver: resolver || owner,
            registrationDate: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            price: this.getDomainPrice(normalizedName),
            records: {
                ETH: owner,
                BTC: '',
                LTC: '',
                email: '',
                url: '',
                avatar: ''
            }
        };
        
        this.domains.set(normalizedName, domain);
        this.saveDomains();
        
        return domain;
    }

    renewDomain(name, years = 1) {
        const normalizedName = name.toLowerCase();
        const domain = this.domains.get(normalizedName);
        
        if (!domain) {
            throw new Error('Dominio no encontrado');
        }
        
        const currentExp = new Date(domain.expirationDate);
        const newExp = new Date(currentExp.getTime() + years * 365 * 24 * 60 * 60 * 1000);
        domain.expirationDate = newExp.toISOString();
        
        this.saveDomains();
        
        return domain;
    }

    transferDomain(name, newOwner) {
        const normalizedName = name.toLowerCase();
        const domain = this.domains.get(normalizedName);
        
        if (!domain) {
            throw new Error('Dominio no encontrado');
        }
        
        domain.owner = newOwner;
        domain.resolver = newOwner;
        this.saveDomains();
        
        return domain;
    }

    setDomainRecord(name, recordType, value) {
        const normalizedName = name.toLowerCase();
        const domain = this.domains.get(normalizedName);
        
        if (!domain) {
            throw new Error('Dominio no encontrado');
        }
        
        domain.records[recordType] = value;
        this.saveDomains();
        
        return domain;
    }

    setContentHash(name, contentHash) {
        const normalizedName = name.toLowerCase();
        const domain = this.domains.get(normalizedName);
        
        if (!domain) {
            throw new Error('Dominio no encontrado');
        }
        
        domain.contentHash = contentHash;
        this.saveDomains();
        
        return domain;
    }

    resolveDomain(name) {
        const normalizedName = name.toLowerCase();
        return this.domains.get(normalizedName) || null;
    }

    getDomainInfo(name) {
        const normalizedName = name.toLowerCase();
        return this.domains.get(normalizedName) || null;
    }

    getAllDomains() {
        return Array.from(this.domains.values());
    }

    searchDomains(query) {
        const results = [];
        const normalizedQuery = query.toLowerCase();
        
        this.domains.forEach(domain => {
            if (domain.name.includes(normalizedQuery)) {
                results.push(domain);
            }
        });
        
        return results;
    }

    getExpiredDomains() {
        const now = new Date();
        const expired = [];
        
        this.domains.forEach(domain => {
            if (new Date(domain.expirationDate) < now) {
                expired.push(domain);
            }
        });
        
        return expired;
    }

    startAuction(name) {
        const normalizedName = name.toLowerCase();
        
        if (this.domains.has(normalizedName)) {
            throw new Error('El dominio ya está registrado');
        }
        
        const auction = {
            name: normalizedName,
            startTime: Date.now(),
            endTime: Date.now() + 3 * 24 * 60 * 60 * 1000,
            highestBid: 0,
            highestBidder: '',
            bids: []
        };
        
        this.bids.set(normalizedName, auction);
        
        return auction;
    }

    placeBid(name, bidder, amount) {
        const normalizedName = name.toLowerCase();
        const auction = this.bids.get(normalizedName);
        
        if (!auction) {
            throw new Error('No hay subasta activa para este dominio');
        }
        
        if (Date.now() > auction.endTime) {
            throw new Error('La subasta ha terminado');
        }
        
        if (amount <= auction.highestBid) {
            throw new Error('La puja debe ser mayor a la actual');
        }
        
        auction.highestBid = amount;
        auction.highestBidder = bidder;
        auction.bids.push({
            bidder: bidder,
            amount: amount,
            time: Date.now()
        });
        
        return auction;
    }

    finalizeAuction(name) {
        const normalizedName = name.toLowerCase();
        const auction = this.bids.get(normalizedName);
        
        if (!auction) {
            throw new Error('No hay subasta activa para este dominio');
        }
        
        if (auction.highestBidder) {
            this.registerDomain(
                name,
                auction.highestBidder,
                '',
                auction.highestBidder
            );
        }
        
        this.bids.delete(normalizedName);
        
        return this.domains.get(normalizedName);
    }
}

function generateDomainHash(name) {
    return crypto.createHash('sha256')
        .update(name.toLowerCase())
        .digest('hex');
}

function validateDomainName(name) {
    const normalized = name.toLowerCase();
    
    if (!normalized.endsWith('.blast')) {
        return { valid: false, error: 'Debe terminar en .blast' };
    }
    
    const baseName = normalized.replace('.blast', '');
    
    if (baseName.length < 3) {
        return { valid: false, error: 'Mínimo 3 caracteres' };
    }
    
    if (baseName.length > 64) {
        return { valid: false, error: 'Máximo 64 caracteres' };
    }
    
    if (!/^[a-z0-9]+$/.test(baseName)) {
        return { valid: false, error: 'Solo letras minúsculas y números' };
    }
    
    return { valid: true, name: normalized };
}

module.exports = {
    DomainRegistry,
    generateDomainHash,
    validateDomainName,
    DOMAIN_COST
};
