import React, { useState, useEffect } from 'react';
import { analyzeCidr, CidrAnalysis } from '@ip-intel/networking';
import { ipv4ToString, parseIpv4 } from '@ip-intel/networking';

export const CidrCalculator: React.FC = () => {
  const [cidrInput, setCidrInput] = useState('192.168.10.20/27');
  const [analysis, setAnalysis] = useState<CidrAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bit representation state
  const [bits, setBits] = useState<number[]>(Array(32).fill(0));
  const [prefix, setPrefix] = useState<number>(24);

  useEffect(() => {
    handleCalculate();
  }, []);

  useEffect(() => {
    if (analysis && analysis.version === 4) {
      // Sync bit state from calculations
      const ipNum = parseIpv4(analysis.networkAddress);
      if (ipNum !== null) {
        const binStr = ipNum.toString(2).padStart(32, '0');
        setBits(binStr.split('').map(b => Number(b)));
        setPrefix(analysis.prefixLength);
      }
    }
  }, [analysis]);

  const handleCalculate = (customInput?: string) => {
    try {
      setError(null);
      const val = customInput || cidrInput;
      const res = analyzeCidr(val);
      setAnalysis(res);
    } catch (err: any) {
      setError(err.message || 'Invalid CIDR format.');
      setAnalysis(null);
    }
  };

  const handleBitClick = (index: number) => {
    if (!analysis || analysis.version !== 4) return;
    const newBits = [...bits];
    newBits[index] = newBits[index] === 0 ? 1 : 0;
    setBits(newBits);

    // Compute new IP
    let ipNum = 0;
    for (let i = 0; i < 32; i++) {
      ipNum = (ipNum << 1) | newBits[i];
    }
    ipNum = ipNum >>> 0;
    const newIpStr = ipv4ToString(ipNum);
    const newCidr = `${newIpStr}/${prefix}`;
    setCidrInput(newCidr);
    handleCalculate(newCidr);
  };

  const handlePrefixChange = (newP: number) => {
    if (newP < 0 || newP > 32) return;
    setPrefix(newP);
    if (!analysis || analysis.version !== 4) return;
    const ipPart = cidrInput.split('/')[0];
    const newCidr = `${ipPart}/${newP}`;
    setCidrInput(newCidr);
    handleCalculate(newCidr);
  };

  return (
    <div className="space-y-6">
      {/* Explanation Box */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-800">CIDR Subnet Calculator</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-700">What is this?</p>
            <p>A tool that calculates network boundaries from a network block (like 192.168.1.0/24).</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">What is the use?</p>
            <p>To determine the subnet mask, network base address, broadcast address, and host ranges for network routing setup.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">When to use?</p>
            <p>When setting up new subnets in your local lab or cloud environment, and you need to assign IP boundaries to your systems.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">How the calculations happen? (Simple Arithmetic)</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>An IPv4 address has 32 bits. A CIDR prefix like /24 means the first 24 bits are Network Bits.</li>
              <li><strong>Host Bits:</strong> Calculate: 32 minus Prefix Length. For /24: 32 - 24 = 8 host bits.</li>
              <li><strong>Total IP Addresses:</strong> Multiply 2 by itself for every host bit. For 8 host bits: 2 to the power of 8 (2^8) = 256 addresses.</li>
              <li><strong>Usable Hosts:</strong> Subtract 2 from the Total IP addresses (one for Network, one for Broadcast). So 256 - 2 = 254 usable hosts.</li>
              <li><strong>Subnet Mask:</strong> A /24 mask has 24 ones and 8 zeros, translating to 255.255.255.0.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Input row */}
      <div className="flex gap-3 bg-slate-100 p-3 rounded-lg border border-slate-200">
        <div className="relative flex-1">
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            placeholder="Enter CIDR Block (e.g. 192.168.10.0/24 or 2001:db8::/64)"
            value={cidrInput}
            onChange={(e) => setCidrInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
          />
        </div>
        <button
          onClick={() => handleCalculate()}
          className="bg-blue-600 hover:bg-blue-500 text-xs font-semibold px-5 py-2 rounded text-white transition-colors"
        >
          Calculate
        </button>
      </div>

      {error && (
        <div className="bg-rose-55 text-rose-700 border border-rose-200 text-xs p-3 rounded-lg">
          {error}
        </div>
      )}

      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Properties Panel */}
          <div className="lg:col-span-2 glass-panel rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">CIDR Subnet Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-2 rounded">
                <span className="text-slate-500">Network Address</span>
                <span className="font-mono font-bold text-blue-600 select-all">{analysis.networkAddress}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-2 rounded">
                <span className="text-slate-500">Broadcast Address</span>
                <span className="font-mono font-bold text-rose-600 select-all">{analysis.broadcastAddress}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-2 rounded">
                <span className="text-slate-500">Subnet Mask</span>
                <span className="font-mono font-semibold text-slate-700 select-all">{analysis.subnetMask}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-2 rounded">
                <span className="text-slate-500">Wildcard Mask</span>
                <span className="font-mono font-semibold text-slate-700 select-all">{analysis.wildcardMask}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-2 rounded">
                <span className="text-slate-500">First Usable Host</span>
                <span className="font-mono font-semibold text-emerald-600 select-all">{analysis.firstHost}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-2 rounded">
                <span className="text-slate-500">Last Usable Host</span>
                <span className="font-mono font-semibold text-emerald-600 select-all">{analysis.lastHost}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-2 rounded">
                <span className="text-slate-500">Gateway Recommendation</span>
                <span className="font-mono font-semibold text-amber-600 select-all">{analysis.gateway}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-2 rounded">
                <span className="text-slate-500">Hex Representation</span>
                <span className="font-mono font-semibold text-purple-600 select-all">{analysis.hexMask}</span>
              </div>
            </div>
          </div>

          {/* Sizing Statistics */}
          <div className="glass-panel rounded-lg p-5 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2 mb-4">Capacity</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Total IP Addresses</span>
                    <span className="font-bold text-slate-800">{Number(analysis.totalAddresses).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Usable Host IPs</span>
                    <span className="font-bold text-emerald-600">{Number(analysis.usableAddresses).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-1.5 rounded-full" 
                      style={{ 
                         width: analysis.totalAddresses === '0' 
                          ? '0%' 
                          : `${(Number(analysis.usableAddresses) / Number(analysis.totalAddresses) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between text-xs pt-2 border-t border-slate-250">
                  <span className="text-slate-500">Reserved IPs</span>
                  <span className="font-bold text-slate-700">{analysis.reservedAddresses}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 p-2.5 rounded border border-slate-200 text-[10px] text-slate-600">
              Standard networking reserves the network address (.0) and broadcast address (.255). AWS reserves 3 additional IPs (.1 router, .2 DNS, .3 internal routing).
            </div>
          </div>

          {/* Interactive Bit editor & Bit Boundary (IPv4 Only) */}
          {analysis.version === 4 && (
            <div className="lg:col-span-3 glass-panel rounded-lg p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-700">
                  Interactive 32-Bit Binary boundary editor
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">Prefix Length: /{prefix}</span>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    value={prefix}
                    onChange={(e) => handlePrefixChange(Number(e.target.value))}
                    className="w-24 h-1.5 bg-slate-350 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-8 md:grid-cols-32 gap-1.5 pt-2">
                  {bits.map((bit, idx) => {
                    const isNetwork = idx < prefix;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleBitClick(idx)}
                        className={`
                          h-9 rounded font-mono text-sm font-black transition-all flex flex-col items-center justify-center relative select-none
                          ${isNetwork 
                            ? 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100' 
                            : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'}
                        `}
                      >
                        <span>{bit}</span>
                        {/* Underline separating octets */}
                        {(idx + 1) % 8 === 0 && idx !== 31 && (
                          <div className="absolute right-[-6px] top-[15%] bottom-[15%] w-[1px] bg-slate-300 hidden md:block" />
                        )}
                        {/* Highlight boundary line */}
                        {idx === prefix - 1 && (
                          <div className="absolute right-[-4px] top-0 bottom-0 w-[2px] bg-amber-500 shadow shadow-amber-500 z-10 hidden md:block" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded" />
                    <span>Network Bits (bits 1 - {prefix})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-emerald-50 border border-emerald-250 rounded" />
                    <span>Host Bits (bits {prefix + 1} - 32)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-3 bg-amber-500 rounded" />
                    <span>Bit Boundary Divider</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
