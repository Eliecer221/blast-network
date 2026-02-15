# BLAST Network

Blockchain Layer 1 con PoW + PoS Híbrido

## Especificaciones

| Parámetro | Valor |
|-----------|-------|
| Chain ID | 8888 |
| Símbolo | BLAST |
| Decimales | 18 |
| Suministro Máximo | 42,000,000 BLAST |
| Block Time | 15 segundos |
| Algoritmo | BlastHash |
| Consenso | PoW + PoS Híbrido |

## Instalación

```bash
npm install
```

## Comandos

### Iniciar Nodo RPC

```bash
npm run rpc
```

### Crear Wallet

```bash
npm run wallet
```

### Iniciar Minero

```bash
npm run miner -- --wallet TU_DIRECCION --threads 8
```

### Iniciar Explorador

```bash
npm run explorer
```

## Estructura del Proyecto

```
src/
├── blockchain/     # Núcleo de la blockchain
├── wallet/        # Sistema de wallet CLI
├── miner/         # Software de minería
├── rpc/           # Servidor RPC
├── explorer/      # Explorador de bloques
├── contracts/     # Smart contracts
├── domains/      # Sistema de dominios .BLAST
└── utils/        # Utilidades
```

## Configuración de Red

### Metamask

- Network Name: BLAST Network
- RPC URL: <http://localhost:8545>
- Chain ID: 8888
- Symbol: BLAST

## Author

Yozy Matmo Chigkito
