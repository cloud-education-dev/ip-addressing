import { parseIpv4 } from './ip';
import { parseCidr } from './cidr';

export interface Route {
  destination: string; // e.g. "10.0.0.0/16", "0.0.0.0/0"
  target: string;      // e.g. "local", "igw-123", "nat-123", "vgw-123"
  priority?: number;   // default 100
}

export interface RouteTable {
  id: string;
  name: string;
  routes: Route[];
}

export interface NaclRule {
  ruleNumber: number;
  isIngress: boolean;
  protocol: "TCP" | "UDP" | "ICMP" | "ALL";
  portRange: string;  // e.g. "80", "1-65535", "ALL"
  cidrBlock: string;  // e.g. "0.0.0.0/0"
  action: "ALLOW" | "DENY";
}

export interface Nacl {
  id: string;
  name: string;
  rules: NaclRule[];
}

export interface SgRule {
  isIngress: boolean;
  protocol: "TCP" | "UDP" | "ICMP" | "ALL";
  portRange: string;  // e.g. "22", "ALL"
  cidrBlock?: string;  // e.g. "10.0.0.0/16"
  sourceGroupId?: string; // security group referencing
}

export interface SecurityGroup {
  id: string;
  name: string;
  rules: SgRule[];
}

export interface Packet {
  srcIp: string;
  dstIp: string;
  protocol: "TCP" | "UDP" | "ICMP";
  srcPort: number;
  dstPort: number;
}

export interface SimNode {
  id: string;
  name: string;
  type: "SUBNET" | "EC2_INSTANCE" | "NAT_GATEWAY" | "INTERNET_GATEWAY" | "TRANSIT_GATEWAY" | "ROUTER" | "INTERNET";
  cidrBlock?: string;
  subnetId?: string;
  routeTableId?: string;
  naclId?: string;
  securityGroupId?: string;
  ip?: string;
  vpcId?: string;
}

export interface SimEdge {
  id: string;
  source: string;
  target: string;
}

export interface HopTrace {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: "PASSED" | "BLOCKED" | "REDIRECTED";
  actionTaken: string;
  details: string;
}

export interface SimulationResult {
  status: "SUCCESS" | "FAILED";
  failureReason?: string;
  failureNodeId?: string;
  trace: HopTrace[];
}

// Check if IP is in CIDR range
export function isIpInCidr(ip: string, cidr: string): boolean {
  const ipNum = parseIpv4(ip);
  if (ipNum === null) return false;

  const parsed = parseCidr(cidr);
  if (!parsed) return false;

  const cidrIpNum = parseIpv4(parsed.ip);
  if (cidrIpNum === null) return false;

  const mask = parsed.prefix === 0 ? 0 : (~0 << (32 - parsed.prefix)) >>> 0;
  return (ipNum & mask) === (cidrIpNum & mask);
}

// Helper to match port range
export function matchPort(port: number, range: string): boolean {
  if (range.toUpperCase() === "ALL") return true;
  if (range.includes("-")) {
    const parts = range.split("-");
    const start = Number(parts[0]);
    const end = Number(parts[1]);
    return port >= start && port <= end;
  }
  return port === Number(range);
}

// Helper to match protocol
export function matchProtocol(packetProto: string, ruleProto: string): boolean {
  if (ruleProto.toUpperCase() === "ALL") return true;
  return packetProto.toUpperCase() === ruleProto.toUpperCase();
}

// Perform Longest Prefix Match lookup
export function lookupRoute(dstIp: string, routes: Route[]): Route | null {
  let bestMatch: Route | null = null;
  let maxPrefix = -1;
  let bestPriority = 9999;

  for (const route of routes) {
    if (isIpInCidr(dstIp, route.destination)) {
      const parsed = parseCidr(route.destination);
      if (parsed) {
        if (parsed.prefix > maxPrefix) {
          maxPrefix = parsed.prefix;
          bestMatch = route;
          bestPriority = route.priority || 100;
        } else if (parsed.prefix === maxPrefix) {
          const rPrio = route.priority || 100;
          if (rPrio < bestPriority) {
            bestMatch = route;
            bestPriority = rPrio;
          }
        }
      }
    }
  }

  return bestMatch;
}

export function evaluateNacl(
  packet: Packet,
  isIngress: boolean,
  rules: NaclRule[]
): { action: "ALLOW" | "DENY"; ruleId?: number; reason: string } {
  // Sort rules by ruleNumber ascending
  const sortedRules = [...rules]
    .filter(r => r.isIngress === isIngress)
    .sort((a, b) => a.ruleNumber - b.ruleNumber);

  for (const rule of sortedRules) {
    const ipToCheck = isIngress ? packet.srcIp : packet.dstIp;
    if (isIpInCidr(ipToCheck, rule.cidrBlock)) {
      if (matchProtocol(packet.protocol, rule.protocol)) {
        if (matchPort(packet.dstPort, rule.portRange)) {
          return {
            action: rule.action,
            ruleId: rule.ruleNumber,
            reason: `Matched Rule #${rule.ruleNumber} (${rule.action})`
          };
        }
      }
    }
  }

  // Default Deny
  return {
    action: "DENY",
    reason: "No rules matched. Default deny rule applied."
  };
}

export function evaluateSecurityGroup(
  packet: Packet,
  isIngress: boolean,
  rules: SgRule[],
  srcSgId?: string
): { allowed: boolean; reason: string } {
  // Security Group is stateful. If we evaluate initial traffic, we scan positive allow rules.
  // There is no explicit DENY rule in SG. If no allow matches, it is denied.
  const filtered = rules.filter(r => r.isIngress === isIngress);
  if (filtered.length === 0) {
    return { allowed: false, reason: "No security group rules configured (Default Deny)." };
  }

  for (const rule of filtered) {
    if (matchProtocol(packet.protocol, rule.protocol)) {
      if (matchPort(packet.dstPort, rule.portRange)) {
        // Match source CIDR
        if (rule.cidrBlock && isIpInCidr(isIngress ? packet.srcIp : packet.dstIp, rule.cidrBlock)) {
          return { allowed: true, reason: `Matched Rule allowing CIDR ${rule.cidrBlock}` };
        }
        // Match source SG reference
        if (rule.sourceGroupId && srcSgId === rule.sourceGroupId) {
          return { allowed: true, reason: `Matched Rule allowing Security Group Reference ${rule.sourceGroupId}` };
        }
      }
    }
  }

  return { allowed: false, reason: "No matching ALLOW rule in Security Group." };
}

export function simulatePacketFlow(params: {
  nodes: SimNode[];
  edges: SimEdge[];
  routeTables: Record<string, RouteTable>;
  nacls: Record<string, Nacl>;
  securityGroups: Record<string, SecurityGroup>;
  packet: Packet;
}): SimulationResult {
  const { nodes, routeTables, nacls, securityGroups, packet } = params;
  const trace: HopTrace[] = [];

  // Find source instance
  const srcInstance = nodes.find(n => n.type === "EC2_INSTANCE" && n.ip === packet.srcIp);
  if (!srcInstance) {
    return {
      status: "FAILED",
      failureReason: `Source instance with IP ${packet.srcIp} not found in topology.`,
      trace
    };
  }

  trace.push({
    nodeId: srcInstance.id,
    nodeName: srcInstance.name,
    nodeType: "EC2_INSTANCE",
    status: "PASSED",
    actionTaken: "FORWARDED",
    details: `Packet generated on instance. Protocol: ${packet.protocol}, Source Port: ${packet.srcPort}, Destination Port: ${packet.dstPort}.`
  });

  // Evaluate outbound SG on source instance
  const srcSg = srcInstance.securityGroupId ? securityGroups[srcInstance.securityGroupId] : null;
  if (srcSg) {
    const sgEval = evaluateSecurityGroup(packet, false, srcSg.rules);
    if (!sgEval.allowed) {
      trace.push({
        nodeId: srcInstance.id,
        nodeName: srcInstance.name,
        nodeType: "EC2_INSTANCE",
        status: "BLOCKED",
        actionTaken: "DROPPED",
        details: `Outbound Security Group '${srcSg.name}' blocked traffic. Reason: ${sgEval.reason}`
      });
      return {
        status: "FAILED",
        failureReason: `Traffic blocked by Outbound Security Group on ${srcInstance.name}`,
        failureNodeId: srcInstance.id,
        trace
      };
    }
    trace.push({
      nodeId: srcInstance.id,
      nodeName: srcInstance.name,
      nodeType: "EC2_INSTANCE",
      status: "PASSED",
      actionTaken: "FORWARDED",
      details: `Security Group '${srcSg.name}' outbound check passed. Reason: ${sgEval.reason}`
    });
  }

  // Find source subnet
  const srcSubnet = nodes.find(n => n.type === "SUBNET" && n.id === srcInstance.subnetId);
  if (!srcSubnet) {
    return {
      status: "FAILED",
      failureReason: `Source subnet for instance ${srcInstance.name} not found in topology.`,
      trace
    };
  }

  trace.push({
    nodeId: srcSubnet.id,
    nodeName: srcSubnet.name,
    nodeType: "SUBNET",
    status: "PASSED",
    actionTaken: "FORWARDED",
    details: `Packet entered subnet ${srcSubnet.name} (${srcSubnet.cidrBlock}).`
  });

  // Evaluate Outbound NACL on source subnet
  const srcNacl = srcSubnet.naclId ? nacls[srcSubnet.naclId] : null;
  if (srcNacl) {
    const naclEval = evaluateNacl(packet, false, srcNacl.rules);
    if (naclEval.action === "DENY") {
      trace.push({
        nodeId: srcSubnet.id,
        nodeName: srcSubnet.name,
        nodeType: "SUBNET",
        status: "BLOCKED",
        actionTaken: "DROPPED",
        details: `Outbound Network ACL '${srcNacl.name}' blocked traffic. Reason: ${naclEval.reason}`
      });
      return {
        status: "FAILED",
        failureReason: `Traffic blocked by Outbound Network ACL on subnet ${srcSubnet.name}`,
        failureNodeId: srcSubnet.id,
        trace
      };
    }
    trace.push({
      nodeId: srcSubnet.id,
      nodeName: srcSubnet.name,
      nodeType: "SUBNET",
      status: "PASSED",
      actionTaken: "FORWARDED",
      details: `Network ACL '${srcNacl.name}' outbound check passed. Reason: ${naclEval.reason}`
    });
  }

  // Find routing table of subnet
  const rtId = srcSubnet.routeTableId;
  const rt = rtId ? routeTables[rtId] : null;
  if (!rt) {
    trace.push({
      nodeId: srcSubnet.id,
      nodeName: srcSubnet.name,
      nodeType: "SUBNET",
      status: "BLOCKED",
      actionTaken: "DROPPED",
      details: `No Route Table associated with subnet ${srcSubnet.name}.`
    });
    return {
      status: "FAILED",
      failureReason: `No Route Table associated with subnet ${srcSubnet.name}`,
      failureNodeId: srcSubnet.id,
      trace
    };
  }

  const routeMatch = lookupRoute(packet.dstIp, rt.routes);
  if (!routeMatch) {
    trace.push({
      nodeId: srcSubnet.id,
      nodeName: srcSubnet.name,
      nodeType: "SUBNET",
      status: "BLOCKED",
      actionTaken: "DROPPED",
      details: `No route matching destination IP ${packet.dstIp} in Route Table '${rt.name}'.`
    });
    return {
      status: "FAILED",
      failureReason: `No route to destination ${packet.dstIp} in Route Table '${rt.name}'`,
      failureNodeId: srcSubnet.id,
      trace
    };
  }

  trace.push({
    nodeId: srcSubnet.id,
    nodeName: srcSubnet.name,
    nodeType: "SUBNET",
    status: "PASSED",
    actionTaken: "FORWARDED",
    details: `Route lookup matched: Dest: ${routeMatch.destination} -> Target: ${routeMatch.target}.`
  });

  // Evaluate Routing Next Hop Target
  if (routeMatch.target.toLowerCase() === "local") {
    // Local destination within VPC
    const dstInstance = nodes.find(n => n.type === "EC2_INSTANCE" && n.ip === packet.dstIp);
    if (!dstInstance) {
      trace.push({
        nodeId: srcSubnet.id,
        nodeName: srcSubnet.name,
        nodeType: "SUBNET",
        status: "BLOCKED",
        actionTaken: "DROPPED",
        details: `Destination IP ${packet.dstIp} is local but no instance matches this IP.`
      });
      return {
        status: "FAILED",
        failureReason: `Destination host unreachable: ${packet.dstIp}`,
        failureNodeId: srcSubnet.id,
        trace
      };
    }

    const dstSubnet = nodes.find(n => n.type === "SUBNET" && n.id === dstInstance.subnetId);
    if (!dstSubnet) {
      return {
        status: "FAILED",
        failureReason: `Destination subnet for ${dstInstance.name} not found.`,
        trace
      };
    }

    // Evaluate Inbound NACL on destination subnet
    const dstNacl = dstSubnet.naclId ? nacls[dstSubnet.naclId] : null;
    if (dstNacl) {
      const naclEval = evaluateNacl(packet, true, dstNacl.rules);
      if (naclEval.action === "DENY") {
        trace.push({
          nodeId: dstSubnet.id,
          nodeName: dstSubnet.name,
          nodeType: "SUBNET",
          status: "BLOCKED",
          actionTaken: "DROPPED",
          details: `Inbound Network ACL '${dstNacl.name}' on target subnet blocked traffic. Reason: ${naclEval.reason}`
        });
        return {
          status: "FAILED",
          failureReason: `Traffic blocked by Inbound Network ACL on subnet ${dstSubnet.name}`,
          failureNodeId: dstSubnet.id,
          trace
        };
      }
      trace.push({
        nodeId: dstSubnet.id,
        nodeName: dstSubnet.name,
        nodeType: "SUBNET",
        status: "PASSED",
        actionTaken: "FORWARDED",
        details: `Network ACL '${dstNacl.name}' inbound check passed. Reason: ${naclEval.reason}`
      });
    }

    // Evaluate Inbound Security Group on destination instance
    const dstSg = dstInstance.securityGroupId ? securityGroups[dstInstance.securityGroupId] : null;
    if (dstSg) {
      const sgEval = evaluateSecurityGroup(packet, true, dstSg.rules, srcInstance.securityGroupId);
      if (!sgEval.allowed) {
        trace.push({
          nodeId: dstInstance.id,
          nodeName: dstInstance.name,
          nodeType: "EC2_INSTANCE",
          status: "BLOCKED",
          actionTaken: "DROPPED",
          details: `Inbound Security Group '${dstSg.name}' blocked traffic. Reason: ${sgEval.reason}`
        });
        return {
          status: "FAILED",
          failureReason: `Traffic blocked by Inbound Security Group on ${dstInstance.name}`,
          failureNodeId: dstInstance.id,
          trace
        };
      }
      trace.push({
        nodeId: dstInstance.id,
        nodeName: dstInstance.name,
        nodeType: "EC2_INSTANCE",
        status: "PASSED",
        actionTaken: "FORWARDED",
        details: `Security Group '${dstSg.name}' inbound check passed. Reason: ${sgEval.reason}`
      });
    }

    // Success Local Delivery
    trace.push({
      nodeId: dstInstance.id,
      nodeName: dstInstance.name,
      nodeType: "EC2_INSTANCE",
      status: "PASSED",
      actionTaken: "DELIVERED",
      details: `Packet successfully delivered to destination ${dstInstance.name} (${packet.dstIp}).`
    });

    return {
      status: "SUCCESS",
      trace
    };
  }

  // Handle Internet Gateway
  if (routeMatch.target.startsWith("igw-")) {
    const igwNode = nodes.find(n => n.id === routeMatch.target || n.name === routeMatch.target);
    if (!igwNode) {
      trace.push({
        nodeId: srcSubnet.id,
        nodeName: srcSubnet.name,
        nodeType: "SUBNET",
        status: "BLOCKED",
        actionTaken: "DROPPED",
        details: `Internet Gateway target '${routeMatch.target}' not found in topology.`
      });
      return {
        status: "FAILED",
        failureReason: `Internet Gateway ${routeMatch.target} not found`,
        failureNodeId: srcSubnet.id,
        trace
      };
    }

    // Verify if subnet has a public route (i.e. is public) and instance has a public IP (elastic IP, etc.).
    // For standard simulator, we'll forward to IGW and deliver to Internet.
    trace.push({
      nodeId: igwNode.id,
      nodeName: igwNode.name,
      nodeType: "INTERNET_GATEWAY",
      status: "PASSED",
      actionTaken: "FORWARDED",
      details: `Packet forwarded through Internet Gateway to outer internet.`
    });

    const internetNode = nodes.find(n => n.type === "INTERNET") || {
      id: "internet-node",
      name: "Internet",
      type: "INTERNET"
    };

    trace.push({
      nodeId: internetNode.id,
      nodeName: internetNode.name,
      nodeType: "INTERNET",
      status: "PASSED",
      actionTaken: "DELIVERED",
      details: `Packet delivered to public Internet destination ${packet.dstIp}.`
    });

    return {
      status: "SUCCESS",
      trace
    };
  }

  // Handle NAT Gateway
  if (routeMatch.target.startsWith("nat-")) {
    const natNode = nodes.find(n => n.id === routeMatch.target || n.name === routeMatch.target);
    if (!natNode) {
      return {
        status: "FAILED",
        failureReason: `NAT Gateway target '${routeMatch.target}' not found.`,
        trace
      };
    }

    trace.push({
      nodeId: natNode.id,
      nodeName: natNode.name,
      nodeType: "NAT_GATEWAY",
      status: "PASSED",
      actionTaken: "FORWARDED",
      details: `Packet translated by NAT Gateway. Source IP SNATed to ${natNode.ip || "NAT Public IP"}.`
    });

    // NAT needs a route table to reach the internet!
    const natSubnet = nodes.find(n => n.type === "SUBNET" && n.id === natNode.subnetId);
    if (!natSubnet) {
      return {
        status: "FAILED",
        failureReason: `Subnet for NAT Gateway ${natNode.name} not found.`,
        trace
      };
    }

    const natRt = natSubnet.routeTableId ? routeTables[natSubnet.routeTableId] : null;
    const natRouteMatch = natRt ? lookupRoute(packet.dstIp, natRt.routes) : null;

    if (!natRouteMatch || !natRouteMatch.target.startsWith("igw-")) {
      trace.push({
        nodeId: natNode.id,
        nodeName: natNode.name,
        nodeType: "NAT_GATEWAY",
        status: "BLOCKED",
        actionTaken: "DROPPED",
        details: `NAT Gateway subnet has no route to Internet Gateway. Packet blackholed.`
      });
      return {
        status: "FAILED",
        failureReason: `NAT Gateway subnet has no route to Internet Gateway`,
        failureNodeId: natNode.id,
        trace
      };
    }

    const igwNode = nodes.find(n => n.id === natRouteMatch.target || n.name === natRouteMatch.target);
    if (igwNode) {
      trace.push({
        nodeId: igwNode.id,
        nodeName: igwNode.name,
        nodeType: "INTERNET_GATEWAY",
        status: "PASSED",
        actionTaken: "FORWARDED",
        details: `NAT packet forwarded through Internet Gateway to outer internet.`
      });
    }

    const internetNode = nodes.find(n => n.type === "INTERNET") || {
      id: "internet-node",
      name: "Internet",
      type: "INTERNET"
    };

    trace.push({
      nodeId: internetNode.id,
      nodeName: internetNode.name,
      nodeType: "INTERNET",
      status: "PASSED",
      actionTaken: "DELIVERED",
      details: `Packet successfully delivered to Internet target ${packet.dstIp} via NAT.`
    });

    return {
      status: "SUCCESS",
      trace
    };
  }

  // Fallback failure
  return {
    status: "FAILED",
    failureReason: `Unhandled routing target: ${routeMatch.target}`,
    trace
  };
}

export function troubleshootTopology(params: {
  nodes: SimNode[];
  edges: SimEdge[];
  routeTables: Record<string, RouteTable>;
  nacls: Record<string, Nacl>;
  securityGroups: Record<string, SecurityGroup>;
  packet: Packet;
}): { rootCause: string; suggestedFix: string; explanation: string } {
  const sim = simulatePacketFlow(params);
  if (sim.status === "SUCCESS") {
    return {
      rootCause: "None",
      suggestedFix: "None",
      explanation: "Traffic path is fully operational. Packets flow from source to destination according to routing policies, security groups, and NACLs."
    };
  }

  const lastHop = sim.trace[sim.trace.length - 1];
  const blockNode = sim.failureNodeId ? params.nodes.find(n => n.id === sim.failureNodeId) : null;

  if (lastHop && lastHop.status === "BLOCKED") {
    if (lastHop.details.includes("Security Group")) {
      return {
        rootCause: `Traffic blocked by Security Group rule on ${lastHop.nodeName}.`,
        suggestedFix: `Add an ALLOW rule in Security Group (inbound or outbound depending on hop direction) for protocol ${params.packet.protocol}, port ${params.packet.dstPort}, and source/destination IP.`,
        explanation: "Security Groups are stateful firewalls. When initiating outbound traffic, the outbound SG must allow the packet, and on the destination instance, the inbound SG must permit the packet. Since no rule matched, the security group implicitly dropped the packet."
      };
    }

    if (lastHop.details.includes("Network ACL")) {
      return {
        rootCause: `Traffic blocked by Network ACL on subnet ${lastHop.nodeName}.`,
        suggestedFix: `Modify Network ACL rules to insert a rule (with a lower rule number than any DENY rules) that ALLOWS protocol ${params.packet.protocol}, port ${params.packet.dstPort}, and target IP range. Remember that NACLs are stateless, so you must ensure both inbound and outbound rules allow the traffic.`,
        explanation: "Network ACLs are stateless, rule-ordered firewalls evaluated in ascending order. If a lower number rule blocks the range, or if the rule lists are missing explicit allow rules, traffic gets dropped. Since they are stateless, you must also allow return traffic explicitly."
      };
    }

    if (lastHop.details.includes("No route")) {
      return {
        rootCause: `Missing route in the route table for subnet ${lastHop.nodeName}.`,
        suggestedFix: `Add a route in the Route Table associated with subnet '${lastHop.nodeName}' mapping destination '${params.packet.dstIp}' or a default route '0.0.0.0/0' pointing to the appropriate gateway (e.g. Internet Gateway or NAT Gateway).`,
        explanation: "Routers perform Longest Prefix Match (LPM) to look up next hops. If the route table does not contain any matching entry for the destination IP, the packet is blackholed (dropped)."
      };
    }
  }

  // Fallback diagnostic
  return {
    rootCause: sim.failureReason || "Unknown network failure.",
    suggestedFix: "Check route tables, internet gateways, NAT gateways, and make sure IPs are correctly allocated.",
    explanation: "There is an inconsistency in the routing tables or visual nodes. Ensure route targets are linked correctly to existing gateways and endpoints in the topology."
  };
}
