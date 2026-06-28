# Walkthrough: IP Intelligence Platform

I have designed and implemented the **IP Intelligence Platform** as a production-ready monorepo workspace.

Here is a summary of the architectural components, calculators, simulators, and DevOps configs created:

---

## 1. Codebase Architecture

I established a monorepo structure in `d:\Aws-Project\Normal-Network`:
- [package.json](file:///d:/Aws-Project/Normal-Network/package.json): Root configuration enabling workspaces for client apps and shared libs.
- [tsconfig.json](file:///d:/Aws-Project/Normal-Network/tsconfig.json): Compiler rules resolving `@ip-intel/networking` locally.
- [jest.config.js](file:///d:/Aws-Project/Normal-Network/jest.config.js): Custom testing config using `ts-jest` for type compilation.

---

## 2. Core Calculation Library (`libs/networking`)

All complex calculations, firewall configurations, and packet tracers are defined in pure, type-safe TypeScript:
- [ip.ts](file:///d:/Aws-Project/Normal-Network/libs/networking/src/ip.ts): IPv4/IPv6 parsing, conversions (Decimal, Hex, Octal, Binary), and RFC lookups (RFC 1918, RFC 4193, etc.).
- [cidr.ts](file:///d:/Aws-Project/Normal-Network/libs/networking/src/cidr.ts): Subnet masking, unusable limits, Usable Host Ranges, and recommended gateways.
- [subnet.ts](file:///d:/Aws-Project/Normal-Network/libs/networking/src/subnet.ts): Splitting parent prefixes into equal subnets by host count or subnet count.
- [vlsm.ts](file:///d:/Aws-Project/Normal-Network/libs/networking/src/vlsm.ts): Greedy bin packing algorithm sorting requests descending to fit subnets on power-of-two boundaries, detailing waste.
- [supernet.ts](file:///d:/Aws-Project/Normal-Network/libs/networking/src/supernet.ts): Route aggregation matching common binary prefix bits to yield summary blocks.
- [simulator.ts](file:///d:/Aws-Project/Normal-Network/libs/networking/src/simulator.ts): Longest Prefix Match (LPM) router, stateful Security Groups (connection-tracked rules), stateless rule-ordered NACLs, and an automated Network Troubleshooter diagnostic engine.

---

## 3. Next.js Frontend Dashboard (`apps/web`)

The Next.js 15 client provides a tabbed dashboard with a glassmorphism style:
- [page.tsx](file:///d:/Aws-Project/Normal-Network/apps/web/src/app/page.tsx): The primary UI grid containing tools navigation, content panels, and the synced theory sidebar.
- [EducationSidebar.tsx](file:///d:/Aws-Project/Normal-Network/apps/web/src/components/EducationSidebar.tsx): Syncs theory notes, AWS equivalents, Cisco/Linux commands, and interview QA.
- [IpCalculator.tsx](file:///d:/Aws-Project/Normal-Network/apps/web/src/components/IpCalculator.tsx): Displays version, decimal, hex, and binary layouts with octet cards.
- [CidrCalculator.tsx](file:///d:/Aws-Project/Normal-Network/apps/web/src/components/CidrCalculator.tsx): Interactive 32-bit clickable binary grid where flipping bits recalculates CIDR masks instantly.
- [SubnetCalculator.tsx](file:///d:/Aws-Project/Normal-Network/apps/web/src/components/SubnetCalculator.tsx): Subnet splits.
- [VlsmCalculator.tsx](file:///d:/Aws-Project/Normal-Network/apps/web/src/components/VlsmCalculator.tsx): Dynamic departments manager with a segmented visual space allocation bar chart.
- [SupernetCalculator.tsx](file:///d:/Aws-Project/Normal-Network/apps/web/src/components/SupernetCalculator.tsx): Merges ranges and highlights the matched binary prefix in bold blue and mismatch in grey.
- [VpcDesigner.tsx](file:///d:/Aws-Project/Normal-Network/apps/web/src/components/VpcDesigner.tsx): Drag-and-drop AWS VPC builder. Includes real-time subnet overlap warnings, routing configurations, firewall rules edit table, and path animations.
- [IpamDashboard.tsx](file:///d:/Aws-Project/Normal-Network/apps/web/src/components/IpamDashboard.tsx): Dynamic allocation, lock, and release manager showing an IP Utilization Heatmap grid.
- [ExportPanel.tsx](file:///d:/Aws-Project/Normal-Network/apps/web/src/components/ExportPanel.tsx): Code block generating Terraform, CloudFormation, AWS CDK, and Containerlab configs.
- [AiAssistant.tsx](file:///d:/Aws-Project/Normal-Network/apps/web/src/components/AiAssistant.tsx): AI Copilot interface offering sub-planning assistance and practice labs.

---

## 4. NestJS API Server (`apps/server`)

- [main.ts](file:///d:/Aws-Project/Normal-Network/apps/server/src/main.ts) & [app.module.ts](file:///d:/Aws-Project/Normal-Network/apps/server/src/app.module.ts): Server bootstrap and module setups.
- [app.controller.ts](file:///d:/Aws-Project/Normal-Network/apps/server/src/app.controller.ts): Routes REST queries for all core calculation modules.
- [schema.prisma](file:///d:/Aws-Project/Normal-Network/apps/server/prisma/schema.prisma): Multi-tenant database modeling projects, VPCs, route tables, subnets, NACLs, SGs, IP Pools, and host devices.

---

## 5. DevOps & Containerization Configurations

- [docker-compose.yml](file:///d:/Aws-Project/Normal-Network/docker-compose.yml): Deploys NextJS, NestJS, Postgres, and Redis.
- [k8s.yaml](file:///d:/Aws-Project/Normal-Network/k8s.yaml): Deployment manifests for cloud/Kubernetes scaling.
- [Dockerfile (web)](file:///d:/Aws-Project/Normal-Network/apps/web/Dockerfile) & [Dockerfile (server)](file:///d:/Aws-Project/Normal-Network/apps/server/Dockerfile): Production docker images using multi-stage builds.
