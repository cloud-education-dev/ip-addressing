import { parseIpv4, ipv4ToString, parseIpv6, ipv6ToString } from './ip';

export interface CidrAnalysis {
  cidr: string;
  version: 4 | 6;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  wildcardMask: string;
  prefixLength: number;
  totalAddresses: string;
  usableAddresses: string;
  reservedAddresses: number;
  firstHost: string;
  lastHost: string;
  gateway: string;
  binaryNetwork: string;
  binaryMask: string;
  hexMask: string;
  boundaryIndex: number;
}

export function parseCidr(cidrStr: string): { ip: string; prefix: number } | null {
  const parts = cidrStr.trim().split('/');
  if (parts.length !== 2) return null;
  const ip = parts[0];
  const prefix = Number(parts[1]);
  if (isNaN(prefix) || prefix < 0) return null;
  return { ip, prefix };
}

export function calculateCidrv4(ipStr: string, prefix: number): CidrAnalysis {
  if (prefix < 0 || prefix > 32) {
    throw new Error("IPv4 CIDR prefix must be between 0 and 32.");
  }
  const ipNum = parseIpv4(ipStr);
  if (ipNum === null) {
    throw new Error("Invalid IPv4 address.");
  }

  // Mask
  const maskNum = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const wildcardNum = ~maskNum >>> 0;

  // Network and Broadcast
  const networkNum = (ipNum & maskNum) >>> 0;
  const broadcastNum = (networkNum | wildcardNum) >>> 0;

  const total = Math.pow(2, 32 - prefix);
  const usable = prefix >= 31 ? 0 : total - 2;
  const reserved = prefix >= 31 ? total : 2;

  const firstHostNum = prefix >= 31 ? 0 : networkNum + 1;
  const lastHostNum = prefix >= 31 ? 0 : broadcastNum - 1;

  const binaryNetwork = networkNum.toString(2).padStart(32, '0');
  const binaryMask = maskNum.toString(2).padStart(32, '0');
  
  return {
    cidr: `${ipv4ToString(networkNum)}/${prefix}`,
    version: 4,
    networkAddress: ipv4ToString(networkNum),
    broadcastAddress: ipv4ToString(broadcastNum),
    subnetMask: ipv4ToString(maskNum),
    wildcardMask: ipv4ToString(wildcardNum),
    prefixLength: prefix,
    totalAddresses: total.toString(),
    usableAddresses: usable.toString(),
    reservedAddresses: reserved,
    firstHost: firstHostNum ? ipv4ToString(firstHostNum) : 'N/A',
    lastHost: lastHostNum ? ipv4ToString(lastHostNum) : 'N/A',
    gateway: firstHostNum ? ipv4ToString(firstHostNum) : 'N/A', // recommended gateway is first usable host
    binaryNetwork: `${binaryNetwork.slice(0, 8)}.${binaryNetwork.slice(8, 16)}.${binaryNetwork.slice(16, 24)}.${binaryNetwork.slice(24, 32)}`,
    binaryMask: `${binaryMask.slice(0, 8)}.${binaryMask.slice(8, 16)}.${binaryMask.slice(16, 24)}.${binaryMask.slice(24, 32)}`,
    hexMask: '0x' + maskNum.toString(16).toUpperCase().padStart(8, '0'),
    boundaryIndex: prefix
  };
}

export function calculateCidrv6(ipStr: string, prefix: number): CidrAnalysis {
  if (prefix < 0 || prefix > 128) {
    throw new Error("IPv6 CIDR prefix must be between 0 and 128.");
  }
  const ipBig = parseIpv6(ipStr);
  if (ipBig === null) {
    throw new Error("Invalid IPv6 address.");
  }

  // Mask representation
  let maskBig = 0n;
  for (let i = 0; i < prefix; i++) {
    maskBig = (maskBig << 1n) + 1n;
  }
  maskBig = maskBig << BigInt(128 - prefix);

  const wildcardBig = ~maskBig & ((1n << 128n) - 1n);

  const networkBig = ipBig & maskBig;
  const broadcastBig = networkBig | wildcardBig;

  const total = 1n << BigInt(128 - prefix);
  // IPv6 usually doesn't subtract 2 (network/broadcast addresses are usable), except for routing transit networks.
  // We will report total as usable in IPv6.
  const usable = total;
  const reserved = 0;

  const firstHostBig = networkBig;
  const lastHostBig = broadcastBig;

  const binaryNetwork = networkBig.toString(2).padStart(128, '0');
  const binaryMask = maskBig.toString(2).padStart(128, '0');

  // Format binary strings as colon separated 16-bit blocks
  const formatBinary128 = (b: string) => b.match(/.{16}/g)!.join(':');

  return {
    cidr: `${ipv6ToString(networkBig)}/${prefix}`,
    version: 6,
    networkAddress: ipv6ToString(networkBig),
    broadcastAddress: ipv6ToString(broadcastBig),
    subnetMask: ipv6ToString(maskBig),
    wildcardMask: ipv6ToString(wildcardBig),
    prefixLength: prefix,
    totalAddresses: total.toString(),
    usableAddresses: usable.toString(),
    reservedAddresses: reserved,
    firstHost: ipv6ToString(firstHostBig),
    lastHost: ipv6ToString(lastHostBig),
    gateway: ipv6ToString(firstHostBig + 1n), // recommended gateway
    binaryNetwork: formatBinary128(binaryNetwork),
    binaryMask: formatBinary128(binaryMask),
    hexMask: '0x' + maskBig.toString(16).toUpperCase().padStart(32, '0'),
    boundaryIndex: prefix
  };
}

export function analyzeCidr(cidrStr: string): CidrAnalysis {
  const parsed = parseCidr(cidrStr);
  if (!parsed) {
    throw new Error("Invalid CIDR format. Expected format: IP/Prefix (e.g. 192.168.10.0/24)");
  }

  const { ip, prefix } = parsed;

  const isV4 = ip.includes('.');
  if (isV4) {
    return calculateCidrv4(ip, prefix);
  } else {
    return calculateCidrv6(ip, prefix);
  }
}
