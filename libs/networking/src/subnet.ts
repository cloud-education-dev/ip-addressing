import { parseCidr, calculateCidrv4, CidrAnalysis } from './cidr';
import { parseIpv4, ipv4ToString } from './ip';

export interface SubnetConfig {
  parentCidr: string;
  isAws?: boolean;
  subnetCount?: number;
  hostCount?: number;
}

export interface SubnetResult {
  subnets: CidrAnalysis[];
  newPrefix: number;
  totalSubnetsCreated: number;
  usableHostsPerSubnet: number;
  reservedHostsPerSubnet: number;
}

export function calculateEqualSubnets(config: SubnetConfig): SubnetResult {
  const parsed = parseCidr(config.parentCidr);
  if (!parsed) {
    throw new Error("Invalid parent CIDR format.");
  }

  const { ip, prefix } = parsed;
  const isV4 = ip.includes('.');
  if (!isV4) {
    throw new Error("Equal subnet splitting currently supports IPv4 only in this version.");
  }

  const ipNum = parseIpv4(ip);
  if (ipNum === null) {
    throw new Error("Invalid IPv4 address in parent CIDR.");
  }

  let newPrefix = prefix;

  if (config.subnetCount !== undefined && config.subnetCount > 0) {
    const bitsNeeded = Math.ceil(Math.log2(config.subnetCount));
    newPrefix = prefix + bitsNeeded;
  } else if (config.hostCount !== undefined && config.hostCount > 0) {
    // In standard networking: 2^h - 2 >= hostCount
    // In AWS: 2^h - 5 >= hostCount
    const reservationCount = config.isAws ? 5 : 2;
    let h = 2;
    while (Math.pow(2, h) - reservationCount < config.hostCount) {
      h++;
      if (h > 32) break;
    }
    newPrefix = 32 - h;
  } else {
    throw new Error("Must specify either subnetCount or hostCount.");
  }

  if (newPrefix < prefix) {
    throw new Error("Cannot allocate: requested hosts per subnet requires a network size larger than the parent CIDR block.");
  }
  if (newPrefix > 32) {
    throw new Error("Cannot allocate: subnetting exceeds maximum prefix length of 32.");
  }

  const totalSubnets = Math.pow(2, newPrefix - prefix);
  const step = Math.pow(2, 32 - newPrefix);
  const parentNetworkNum = (ipNum & (prefix === 0 ? 0 : (~0 << (32 - prefix)))) >>> 0;

  const subnets: CidrAnalysis[] = [];
  // Cap subnets generation to prevent browser hangs for huge splits (e.g. splitting /8 into /30)
  const maxToGenerate = Math.min(totalSubnets, 256);

  for (let i = 0; i < maxToGenerate; i++) {
    const subnetIpNum = (parentNetworkNum + i * step) >>> 0;
    const analysis = calculateCidrv4(ipv4ToString(subnetIpNum), newPrefix);

    // If AWS mode, adjust usable and reserved counts
    if (config.isAws) {
      const total = Number(analysis.totalAddresses);
      const usable = total >= 8 ? total - 5 : 0;
      const reserved = total >= 8 ? 5 : total;
      
      // AWS reserves:
      // 1. Network Address
      // 2. Gateway (.1)
      // 3. DNS (.2)
      // 4. Amazon internal routing (.3)
      // 5. Broadcast Address
      analysis.usableAddresses = usable.toString();
      analysis.reservedAddresses = reserved;
      if (total >= 8) {
        analysis.firstHost = ipv4ToString(subnetIpNum + 4);
        analysis.lastHost = ipv4ToString(subnetIpNum + total - 2);
        analysis.gateway = ipv4ToString(subnetIpNum + 1);
      } else {
        analysis.firstHost = 'N/A';
        analysis.lastHost = 'N/A';
        analysis.gateway = 'N/A';
      }
    }
    subnets.push(analysis);
  }

  const sampleTotal = Math.pow(2, 32 - newPrefix);
  const sampleUsable = config.isAws 
    ? (sampleTotal >= 8 ? sampleTotal - 5 : 0)
    : (newPrefix >= 31 ? 0 : sampleTotal - 2);
  const sampleReserved = config.isAws
    ? (sampleTotal >= 8 ? 5 : sampleTotal)
    : (newPrefix >= 31 ? sampleTotal : 2);

  return {
    subnets,
    newPrefix,
    totalSubnetsCreated: totalSubnets,
    usableHostsPerSubnet: sampleUsable,
    reservedHostsPerSubnet: sampleReserved
  };
}
