# IP Intelligence Platform

An advanced educational and enterprise networking platform designed for learning, designing, simulating, and validating IP subnets, routing protocols, and cloud infrastructure architectures.

This platform goes far beyond a standard IP Calculator to offer:
- **Visual VPC Designer** (drag-and-drop cloud networking canvas)
- **Stateful Packet Flow Simulator** (evaluates routing, Security Groups, and NACLs)
- **Educational Mode** (synced side panels detailing theory, real-world analogies, Cisco configs, and Linux netns scripts)
- **Configuration Exporter** (compiles visual designs directly into Terraform, CloudFormation, or Containerlab topologies)

---

## Technical Stack

- **Monorepo Workspaces**: npm workspaces, TypeScript
- **Frontend**: Next.js 15 (React 19), Tailwind CSS, Framer Motion, Lucide Icons
- **Backend**: NodeJS, NestJS, Prisma ORM
- **Core Library**: `@ip-intel/networking` (pure TypeScript network logic)
- **Deployment**: Docker, Docker Compose, Kubernetes manifests

---

## Workspace Structure

```
.
├── apps/
│   ├── web/                    # Next.js 15 Frontend
│   │   ├── Dockerfile
│   │   ├── tailwind.config.js
│   │   └── src/
│   │       ├── app/            # Next.js App Router (layout, dashboard)
│   │       └── components/     # Interactive IP/CIDR/VLSM calculators, VPC canvas, AI Chat
│   └── server/                 # NestJS Backend API
│       ├── Dockerfile
│       ├── prisma/             # Prisma PostgreSQL schema models
│       └── src/                # NestJS Controllers and Module configurations
├── libs/
│   └── networking/             # Shared TypeScript Networking Engine
│       ├── src/
│       │   ├── ip.ts           # IP address formats (decimal, binary, hex, octal, RFCs)
│       │   ├── cidr.ts         # Subnet masking & prefix calculations
│       │   ├── subnet.ts       # Equal-split subnet calculator
│       │   ├── vlsm.ts         # Variable Length Subnet Masking (bin-packing)
│       │   ├── supernet.ts     # Route summarization (aggregation common binary matching)
│       │   └── simulator.ts    # Longest Prefix Match router, stateful SG & NACL engine
│       └── package.json
├── docker-compose.yml          # Container orchestration (Web, Server, Postgres, Redis)
├── k8s.yaml                    # Kubernetes Deployment & StatefulSet manifest
├── package.json                # Monorepo workspaces setup
└── tsconfig.json               # Shared compiler configurations
```

---

## Getting Started

### Prerequisites

Ensure you have **NodeJS (v18+)** and **npm** installed on your host system.

### 1. Installation

Install all workspace dependencies from the root directory:
```bash
npm install
```

### 2. Run Unit Tests

Execute Jest testing checks for the core calculation and routing algorithms:
```bash
npm run test:networking
```

### 3. Local Development

Start both frontend and backend development environments:

- **Launch Next.js App (Port 3000)**:
  ```bash
  npm run dev:web
  ```
- **Launch NestJS Server (Port 4000)**:
  ```bash
  npm run dev:server
  ```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Orchestrated Deployment

### Docker Compose

Build and spin up the complete platform including PostgreSQL database, Redis caching, Next.js web application, and NestJS server:
```bash
docker compose up --build
```
- Frontend will be mapped to `http://localhost:3000`
- NestJS API will be mapped to `http://localhost:4000/api/v1/network/health`

### Kubernetes

Apply resources to a local/cloud cluster:
```bash
kubectl apply -f k8s.yaml
```

---

## Production Readiness Checklist

1. [ ] **Secrets Management**: Replace PostgreSQL and database connection values in environments with secure Kubernetes Secrets or AWS Parameter Store keys.
2. [ ] **Database Migrations**: Run `npx prisma migrate deploy` in NestJS containers to execute PostgreSQL table creation.
3. [ ] **Rate Limiting**: Enable NestJS Throttler modules backed by Redis to control API route bursts.
4. [ ] **Horizontal Scaling**: Scale the `web` and `server` deployment replica sets as resource demand increases.
