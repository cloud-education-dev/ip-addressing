export interface IpAnalysis {
  ip: string;
  version: 4 | 6;
  decimal: string;
  binary: string;
  hex: string;
  octal: string;
  class: string;
  addressType: string;
  isPrivate: boolean;
  rfcInfo: string;
  isReserved: boolean;
  isUsable: boolean;
}

export function parseIpv4(ip: string): number | null {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map(p => Number(p));
  for (const n of nums) {
    if (isNaN(n) || n < 0 || n > 255) return null;
  }
  return (nums[0] << 24) >>> 0 | (nums[1] << 16) | (nums[2] << 8) | nums[3];
}

export function ipv4ToString(ipNum: number): string {
  return [
    (ipNum >>> 24) & 255,
    (ipNum >>> 16) & 255,
    (ipNum >>> 8) & 255,
    ipNum & 255
  ].join('.');
}

export function parseIpv6(ip: string): bigint | null {
  try {
    const clean = ip.trim();
    if (!clean.includes(':')) return null;

    const doubleColons = clean.split('::');
    if (doubleColons.length > 2) return null;

    const leftParts = doubleColons[0] ? doubleColons[0].split(':') : [];
    const rightParts = doubleColons[1] ? doubleColons[1].split(':') : [];

    const totalSegments = leftParts.length + rightParts.length;
    if (totalSegments > 8) return null;

    const middleZeros = 8 - totalSegments;
    const segments: string[] = [];

    for (const p of leftParts) {
      if (p === '') return null;
      segments.push(p);
    }

    for (let i = 0; i < middleZeros; i++) {
      segments.push('0');
    }

    for (const p of rightParts) {
      if (p === '') return null;
      segments.push(p);
    }

    if (segments.length !== 8) return null;

    let res = 0n;
    for (let i = 0; i < 8; i++) {
      const val = parseInt(segments[i], 16);
      if (isNaN(val) || val < 0 || val > 0xffff) return null;
      res = (res << 16n) + BigInt(val);
    }
    return res;
  } catch {
    return null;
  }
}

export function ipv6ToString(ipBig: bigint): string {
  const parts: string[] = [];
  let temp = ipBig;
  for (let i = 0; i < 8; i++) {
    const val = temp & 0xffffn;
    parts.unshift(val.toString(16));
    temp = temp >> 16n;
  }
  // compress zeros
  const full = parts.join(':');
  return full.replace(/(^|:)0(:0)+(:|$)/, '::');
}

export function analyzeIp(ipStr: string): IpAnalysis {
  const clean = ipStr.trim();

  // Try IPv4
  const ipv4Num = parseIpv4(clean);
  if (ipv4Num !== null) {
    return analyzeIpv4Num(ipv4Num, clean);
  }

  // Try IPv6
  const ipv6Num = parseIpv6(clean);
  if (ipv6Num !== null) {
    return analyzeIpv6Num(ipv6Num, clean);
  }

  throw new Error("Invalid IP address format. Must be a valid IPv4 or IPv6 address.");
}

function analyzeIpv4Num(num: number, original: string): IpAnalysis {
  const binary = num.toString(2).padStart(32, '0');
  const binaryFormatted = `${binary.slice(0, 8)}.${binary.slice(8, 16)}.${binary.slice(16, 24)}.${binary.slice(24, 32)}`;
  const hex = '0x' + num.toString(16).toUpperCase().padStart(8, '0');
  const octal = '0' + num.toString(8);

  // Network class
  let ipClass = 'N/A';
  const firstOctet = (num >>> 24) & 255;
  if (firstOctet >= 1 && firstOctet <= 127) ipClass = 'A';
  else if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'B';
  else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'C';
  else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'D (Multicast)';
  else if (firstOctet >= 240 && firstOctet <= 255) ipClass = 'E (Experimental)';

  // Checks
  const isPrivate = 
    (firstOctet === 10) || 
    (firstOctet === 172 && ((num >>> 16) & 255) >= 16 && ((num >>> 16) & 255) <= 31) ||
    (firstOctet === 192 && ((num >>> 16) & 255) === 168);

  const isLoopback = (firstOctet === 127);
  const isLinkLocal = (firstOctet === 169 && ((num >>> 16) & 255) === 254);
  const isCgNat = (firstOctet === 100 && (((num >>> 16) & 255) & 0xc0) === 64); // 100.64.0.0/10
  const isMulticast = (firstOctet >= 224 && firstOctet <= 239);
  const isBroadcast = num === 0xffffffff;
  const isReserved = isMulticast || isBroadcast || (firstOctet >= 240) || (firstOctet === 0);

  let addressType = "Unicast (Public)";
  let rfcInfo = "RFC 791 (Standard)";
  let isUsable = true;

  if (isPrivate) {
    addressType = "Private Unicast";
    rfcInfo = "RFC 1918 (Private Address Allocation)";
  } else if (isLoopback) {
    addressType = "Loopback";
    rfcInfo = "RFC 1122 (Host Requirements)";
    isUsable = false;
  } else if (isLinkLocal) {
    addressType = "Link-Local";
    rfcInfo = "RFC 3927 (Dynamic Configuration)";
    isUsable = false;
  } else if (isCgNat) {
    addressType = "Carrier-Grade NAT";
    rfcInfo = "RFC 6598 (Shared Address Space)";
    isUsable = false;
  } else if (isMulticast) {
    addressType = "Multicast";
    rfcInfo = "RFC 5771 (IANA Multicast Allocations)";
    isUsable = false;
  } else if (isBroadcast) {
    addressType = "Broadcast";
    rfcInfo = "RFC 919 (Broadcasting Internet Datagrams)";
    isUsable = false;
  } else if (firstOctet >= 240) {
    addressType = "Reserved/Experimental";
    rfcInfo = "RFC 1112 (Reserved Range)";
    isUsable = false;
  } else if (firstOctet === 192 && ((num >>> 16) & 255) === 0 && ((num >>> 8) & 255) === 2) {
    addressType = "Documentation (TEST-NET-1)";
    rfcInfo = "RFC 5737";
    isUsable = false;
  } else if (firstOctet === 198 && ((num >>> 16) & 255) === 51 && ((num >>> 8) & 255) === 100) {
    addressType = "Documentation (TEST-NET-2)";
    rfcInfo = "RFC 5737";
    isUsable = false;
  } else if (firstOctet === 203 && ((num >>> 16) & 255) === 0 && ((num >>> 8) & 255) === 113) {
    addressType = "Documentation (TEST-NET-3)";
    rfcInfo = "RFC 5737";
    isUsable = false;
  }

  return {
    ip: original,
    version: 4,
    decimal: num.toString(),
    binary: binaryFormatted,
    hex,
    octal,
    class: ipClass,
    addressType,
    isPrivate,
    rfcInfo,
    isReserved,
    isUsable
  };
}

function analyzeIpv6Num(num: bigint, original: string): IpAnalysis {
  const binary = num.toString(2).padStart(128, '0');
  const binaryFormatted = binary.match(/.{16}/g)!.join(':');
  const hex = '0x' + num.toString(16).toUpperCase().padStart(32, '0');
  const octal = '0' + num.toString(8);

  const isMulticast = (num >> 120n) === 0xffn;
  const isLoopback = num === 1n;
  const isLinkLocal = (num >> 118n) === 0x3e0n; // fe80::/10
  const isUla = (num >> 121n) === 0x7en; // fc00::/7 (fc00::/8, fd00::/8)
  const isDocumentation = (num >> 96n) === 0x20010db8n; // 2001:db8::/32

  let addressType = "Global Unicast (Public)";
  let rfcInfo = "RFC 4291 (IPv6 Architecture)";
  let isPrivate = false;
  let isReserved = false;
  let isUsable = true;

  if (isMulticast) {
    addressType = "Multicast";
    rfcInfo = "RFC 4291";
    isUsable = false;
    isReserved = true;
  } else if (isLoopback) {
    addressType = "Loopback";
    rfcInfo = "RFC 4291";
    isUsable = false;
  } else if (isLinkLocal) {
    addressType = "Link-Local Unicast";
    rfcInfo = "RFC 4291";
    isUsable = false;
  } else if (isUla) {
    addressType = "Unique Local Unicast (ULA)";
    rfcInfo = "RFC 4193 (Private Local IPv6)";
    isPrivate = true;
  } else if (isDocumentation) {
    addressType = "Documentation";
    rfcInfo = "RFC 3849";
    isUsable = false;
  }

  return {
    ip: original,
    version: 6,
    decimal: num.toString(),
    binary: binaryFormatted,
    hex,
    octal,
    class: 'N/A (IPv6)',
    addressType,
    isPrivate,
    rfcInfo,
    isReserved,
    isUsable
  };
}
