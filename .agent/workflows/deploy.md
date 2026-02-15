---
description: How to deploy and run the BLAST Ecosystem Server
---

# Deployment Workflow

This workflow guides you through the process of starting the BLAST Network Ecosystem server.

1. Ensure all environment variables are set in your `.env` file.
2. Verify that Node.js v20+ is installed.
3. Install project dependencies.

```bash
npm install
```

// turbo
4. Run the ecosystem server.

```bash
node src/network/completeEcosystem.js
```

5. Verify the server is running by accessing the status endpoint.

```bash
curl http://localhost:3000/api/status
```
