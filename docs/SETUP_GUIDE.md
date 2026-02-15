# BLAST Network Setup Guide

Comprehensive instructions for deploying a BLAST Network node and ecosystem services.

## 1. System Requirements

### Hardware Requirements

- **CPU**: 8+ cores (Intel Core i7/i9 or AMD Ryzen 7/9 recommended).
- **RAM**: 32 GB DDR4/DDR5.
- **Storage**: 2 TB NVMe SSD (minimum 500 GB for initial sync).
- **Network**: 1 Gbps symmetric fiber connection.

### Software Requirements

- **OS**: Ubuntu 22.04 LTS (Recommended) or Windows 10/11 with WSL2.
- **Node.js**: v20.x or higher.
- **Go**: v1.21 or higher (for blockchain core).
- **Python**: v3.11 or higher.
- **Docker**: Latest stable version with Docker Compose.

## 2. Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/blast-network/blast-node
cd blast-node
```

### Step 2: Install Dependencies

```bash
# Node.js dependencies
npm install

# System dependencies (Ubuntu)
sudo apt update && sudo apt install -y build-essential libssl-dev
```

### Step 3: Initialize Genesis Block

```bash
./blast-node init --genesis docs/genesis.json
```

### Step 4: Configure Node

Edit `config.toml` with your specific parameters:

```toml
[network]
chain_id = 8888
listen_addr = "0.0.0.0:30303"

[rpc]
enabled = true
listen_addr = "0.0.0.0:8545"
```

## 3. Running the Ecosystem

To start the ecosystem services (Domains, Hosting, Security, Governance):

```bash
node src/network/completeEcosystem.js
```

## 4. Verification

Check the status of your node:

```bash
curl -X GET http://localhost:8545/api/status
```
