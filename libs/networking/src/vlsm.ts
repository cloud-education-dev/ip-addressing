import { parseCidr, calculateCidrv4, CidrAnalysis } from './cidr';
import { parseIpv4, ipv4ToString } from './ip';

export interface VlsmRequirement {
  name: string;
  requiredHosts: number;
}

export interface VlsmAllocation {
  name: string;
  requiredHosts: number;
  allocatedCidr: string;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  prefixLength: number;
  totalAddresses: number;
  usableAddresses: number;
  wastePercentage: number;
  firstHost: string;
  lastHost: string;
  gateway: string;
}

export interface VlsmResult {
  allocations: VlsmAllocation[];
  remainingCidrs: string[];
  totalAllocatedHosts: number;
  totalUsableAllocated: number;
  overallWastePercentage: number;
}

export function calculateVlsm(
  parentCidr: string,
  requirements: VlsmRequirement[],
  isAws = false
): VlsmResult {
  const parsed = parseCidr(parentCidr);
  if (!parsed) {
    throw new Error("Invalid parent CIDR format.");
  }

  const { ip, prefix } = parsed;
  const isV4 = ip.includes('.');
  if (!isV4) {
    throw new Error("VLSM currently supports IPv4 only in this version.");
  }

  const parentIpNum = parseIpv4(ip);
  if (parentIpNum === null) {
    throw new Error("Invalid IPv4 address in parent CIDR.");
  }

  const parentMask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const parentNetworkNum = (parentIpNum & parentMask) >>> 0;
  const parentSize = Math.pow(2, 32 - prefix);
  const parentEndNum = parentNetworkNum + parentSize;

  // Sort requirements descending by requiredHosts
  const sortedReqs = [...requirements].sort((a, b) => b.requiredHosts - a.requiredHosts);

  const allocations: VlsmAllocation[] = [];
  let currentPtr = parentNetworkNum;
  const reservations = isAws ? 5 : 2;

  for (const req of sortedReqs) {
    if (req.requiredHosts <= 0) {
      throw new Error(`Requirement '${req.name}' must request at least 1 host.`);
    }

    // Find host bits h such that 2^h >= req.requiredHosts + reservations
    let h = 2;
    while (Math.pow(2, h) - reservations < req.requiredHosts) {
      h++;
      if (h > 32) break;
    }
    const subnetSize = Math.pow(2, h);
    const subnetPrefix = 32 - h;

    // Align current pointer to the next multiple of subnetSize
    if (currentPtr % subnetSize !== 0) {
      currentPtr = (Math.floor(currentPtr / subnetSize) + 1) * subnetSize;
    }

    if (currentPtr + subnetSize > parentEndNum) {
      throw new Error(`Insufficient address space in parent CIDR ${parentCidr} to allocate ${req.requiredHosts} hosts for '${req.name}'.`);
    }

    const netStr = ipv4ToString(currentPtr);
    const analysis = calculateCidrv4(netStr, subnetPrefix);

    // Apply AWS adjustments
    if (isAws) {
      const total = Number(analysis.totalAddresses);
      const usable = total >= 8 ? total - 5 : 0;
      analysis.usableAddresses = usable.toString();
      analysis.reservedAddresses = total >= 8 ? 5 : total;
      if (total >= 8) {
        analysis.firstHost = ipv4ToString(currentPtr + 4);
        analysis.lastHost = ipv4ToString(currentPtr + total - 2);
        analysis.gateway = ipv4ToString(currentPtr + 1);
      } else {
        analysis.firstHost = 'N/A';
        analysis.lastHost = 'N/A';
        analysis.gateway = 'N/A';
      }
    }

    const usableHosts = Number(analysis.usableAddresses);
    const wastePercent = usableHosts > 0 
      ? Number(((usableHosts - req.requiredHosts) / usableHosts * 100).toFixed(2))
      : 100;

    allocations.push({
      name: req.name,
      requiredHosts: req.requiredHosts,
      allocatedCidr: analysis.cidr,
      networkAddress: analysis.networkAddress,
      broadcastAddress: analysis.broadcastAddress,
      subnetMask: analysis.subnetMask,
      prefixLength: analysis.prefixLength,
      totalAddresses: Number(analysis.totalAddresses),
      usableAddresses: usableHosts,
      wastePercentage: wastePercent,
      firstHost: analysis.firstHost,
      lastHost: analysis.lastHost,
      gateway: analysis.gateway
    });

    currentPtr += subnetSize;
  }

  // Calculate remaining CIDRs
  const remainingCidrs: string[] = [];
  let tempPtr = currentPtr;
  while (tempPtr < parentEndNum) {
    const distance = parentEndNum - tempPtr;
    // Find the largest power of 2 that divides tempPtr and is <= distance
    let maxPower = 32;
    while (maxPower > 0) {
      const size = Math.pow(2, 32 - maxPower);
      if (tempPtr % size === 0 && size <= distance) {
        break;
      }
      maxPower--;
    }
    const size = Math.pow(2, 32 - maxPower);
    remainingCidrs.push(`${ipv4ToString(tempPtr)}/${maxPower}`);
    tempPtr += size;
  }

  const totalAllocatedHosts = requirements.reduce((sum, r) => sum + r.requiredHosts, 0);
  const totalUsableAllocated = allocations.reduce((sum, a) => sum + a.usableAddresses, 0);
  const overallWaste = totalUsableAllocated > 0
    ? Number(((totalUsableAllocated - totalAllocatedHosts) / totalUsableAllocated * 100).toFixed(2))
    : 0;

  return {
    allocations,
    remainingCidrs,
    totalAllocatedHosts,
    totalUsableAllocated,
    overallWastePercentage: overallWaste
  };
}
