import { parseCidr, calculateCidrv4, CidrAnalysis } from './cidr';
import { parseIpv4, ipv4ToString } from './ip';

export interface SupernetResult {
  summaryRoute: string;
  totalAggregatedAddresses: number;
  containedInputs: string[];
  binaryComparison: {
    ip: string;
    binary: string;
  }[];
  commonBits: number;
}

export function calculateSupernet(cidrList: string[]): SupernetResult {
  if (cidrList.length === 0) {
    throw new Error("CIDR list cannot be empty.");
  }

  const parsedBlocks = cidrList.map(c => {
    const parsed = parseCidr(c);
    if (!parsed) throw new Error(`Invalid CIDR block in list: ${c}`);
    const ipNum = parseIpv4(parsed.ip);
    if (ipNum === null) throw new Error(`Invalid IPv4 address in list: ${parsed.ip}`);
    
    // Mask to network address
    const mask = parsed.prefix === 0 ? 0 : (~0 << (32 - parsed.prefix)) >>> 0;
    const networkNum = (ipNum & mask) >>> 0;
    
    return {
      original: c,
      ipNum: networkNum,
      prefix: parsed.prefix,
      size: Math.pow(2, 32 - parsed.prefix)
    };
  });

  // Find min and max boundaries
  let minIp = parsedBlocks[0].ipNum;
  let maxIpEnd = parsedBlocks[0].ipNum + parsedBlocks[0].size - 1;

  for (let i = 1; i < parsedBlocks.length; i++) {
    const block = parsedBlocks[i];
    if (block.ipNum < minIp) {
      minIp = block.ipNum;
    }
    const end = block.ipNum + block.size - 1;
    if (end > maxIpEnd) {
      maxIpEnd = end;
    }
  }

  // Find the longest prefix that encloses [minIp, maxIpEnd]
  // We compare minIp and maxIpEnd.
  let commonBits = 0;
  for (let i = 31; i >= 0; i--) {
    const bitMin = (minIp >>> i) & 1;
    const bitMax = (maxIpEnd >>> i) & 1;
    if (bitMin === bitMax) {
      commonBits++;
    } else {
      break;
    }
  }

  const summaryMask = commonBits === 0 ? 0 : (~0 << (32 - commonBits)) >>> 0;
  const summaryNetworkNum = (minIp & summaryMask) >>> 0;
  const summaryRoute = `${ipv4ToString(summaryNetworkNum)}/${commonBits}`;
  const totalAggregated = Math.pow(2, 32 - commonBits);

  const binaryComparison = parsedBlocks.map(b => {
    const binStr = b.ipNum.toString(2).padStart(32, '0');
    const formatted = `${binStr.slice(0, 8)}.${binStr.slice(8, 16)}.${binStr.slice(16, 24)}.${binStr.slice(24, 32)}`;
    return {
      ip: b.original,
      binary: formatted
    };
  });

  // Also push the summary route representation to comparison
  const summaryBin = summaryNetworkNum.toString(2).padStart(32, '0');
  const summaryBinFormatted = `${summaryBin.slice(0, 8)}.${summaryBin.slice(8, 16)}.${summaryBin.slice(16, 24)}.${summaryBin.slice(24, 32)}`;
  binaryComparison.push({
    ip: `SUMMARY: ${summaryRoute}`,
    binary: summaryBinFormatted
  });

  return {
    summaryRoute,
    totalAggregatedAddresses: totalAggregated,
    containedInputs: cidrList,
    binaryComparison,
    commonBits
  };
}
