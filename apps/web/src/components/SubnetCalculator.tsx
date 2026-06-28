import React, { useState } from 'react';
import { calculateEqualSubnets, SubnetResult } from '@ip-intel/networking';

export const SubnetCalculator: React.FC = () => {
  const [parentCidr, setParentCidr] = useState('10.0.0.0/16');
  const [splitBy, setSplitBy] = useState<'count' | 'hosts'>('count');
  const [subnetCount, setSubnetCount] = useState(4);
  const [hostCount, setHostCount] = useState(100);
  const [isAws, setIsAws] = useState(false);

  const [results, setResults] = useState<SubnetResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSplit = () => {
    try {
      setError(null);
      const res = calculateEqualSubnets({
        parentCidr,
        isAws,
        subnetCount: splitBy === 'count' ? subnetCount : undefined,
        hostCount: splitBy === 'hosts' ? hostCount : undefined
      });
      setResults(res);
    } catch (err: any) {
      setError(err.message || 'Failed to split subnet.');
      setResults(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Explanation Box */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-800">Equal Subnetting Calculator</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-700">What is this?</p>
            <p>A tool to divide a large parent network block (like 10.0.0.0/16) into multiple smaller, equal-sized subnets.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">What is the use?</p>
            <p>To divide a single big pool of IP addresses evenly among several departments, offices, or zones without overlaps.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">When to use?</p>
            <p>When you are allocated a single network range and need to partition it into standard, equal parts.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">How the calculations happen? (Simple Arithmetic)</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Splitting by Subnet Count:</strong> To make N subnets, count how many times you multiply 2 to get N (this is B). For example, for 4 subnets: 2 * 2 = 4 (so B = 2). The new prefix length is Parent Prefix + B. For a /16 parent, subnets are /18 (16 + 2).</li>
              <li><strong>Splitting by Host Count:</strong> Find the smallest power of 2 that can hold your required hosts + 2. For example, for 100 hosts, we need 102 IPs. The nearest power of 2 is 128 (2^7), which needs 7 host bits. The new prefix is: 32 - 7 = 25. Each subnet is a /25 block.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Configuration Form Panel */}
      <div className="glass-panel rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">
          Subnet splitting configurations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
          {/* Parent CIDR */}
          <div className="md:col-span-4 flex flex-col space-y-1.5">
            <label className="text-slate-500 font-medium">Parent CIDR Block</label>
            <input
              type="text"
              value={parentCidr}
              onChange={(e) => setParentCidr(e.target.value)}
              className="bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
              placeholder="e.g. 10.0.0.0/16"
            />
          </div>

          {/* Splitting Mode */}
          <div className="md:col-span-3 flex flex-col space-y-1.5">
            <label className="text-slate-500 font-medium">Split Strategy</label>
            <div className="grid grid-cols-2 bg-white border border-slate-200 p-0.5 rounded">
              <button
                type="button"
                onClick={() => setSplitBy('count')}
                className={`py-1.5 rounded text-center transition-colors font-semibold ${splitBy === 'count' ? 'bg-blue-600 font-bold text-white' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Subnets
              </button>
              <button
                type="button"
                onClick={() => setSplitBy('hosts')}
                className={`py-1.5 rounded text-center transition-colors font-semibold ${splitBy === 'hosts' ? 'bg-blue-600 font-bold text-white' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Hosts
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div className="md:col-span-2 flex flex-col space-y-1.5">
            {splitBy === 'count' ? (
              <>
                <label className="text-slate-500 font-medium">Subnet Count</label>
                <select
                  value={subnetCount}
                  onChange={(e) => setSubnetCount(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {[2, 4, 8, 16, 32, 64, 128, 256].map(c => (
                    <option key={c} value={c}>{c} subnets</option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <label className="text-slate-500 font-medium">Required Hosts per Subnet</label>
                <input
                  type="number"
                  value={hostCount}
                  onChange={(e) => setHostCount(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  min="1"
                />
              </>
            )}
          </div>

          {/* Provider toggle */}
          <div className="md:col-span-3 flex flex-col justify-end">
            <button
              type="button"
              onClick={() => setIsAws(!isAws)}
              className={`w-full py-2 border rounded flex items-center justify-center gap-2 transition-all font-semibold ${isAws ? 'bg-orange-50 border-orange-250 text-orange-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'}`}
            >
              <span>{isAws ? 'AWS Reservations Enabled' : 'Standard Subnet Rules'}</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleSplit}
          className="w-full bg-blue-600 hover:bg-blue-500 text-xs font-bold py-2 rounded text-white transition-colors"
        >
          Compute Subnet Distribution
        </button>
      </div>

      {error && (
        <div className="bg-rose-55 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {/* Subnet Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-slate-500 font-semibold">New Prefix Length</span>
              <p className="text-lg font-black text-blue-600 mt-1">/{results.newPrefix}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-slate-500 font-semibold">Total Subnets Created</span>
              <p className="text-lg font-black text-slate-800 mt-1">{results.totalSubnetsCreated.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-slate-500 font-semibold">Usable Hosts per Subnet</span>
              <p className="text-lg font-black text-emerald-600 mt-1">{results.usableHostsPerSubnet.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-slate-500 font-semibold">Reserved IPs per Subnet</span>
              <p className="text-lg font-black text-amber-600 mt-1">{results.reservedHostsPerSubnet}</p>
            </div>
          </div>

          {/* Visual Address Space Division (Enhancement 1) */}
          <div className="glass-panel rounded-lg p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 tracking-widest uppercase">
              Visual Address Space Division
            </h3>
            <p className="text-xs text-slate-650 leading-relaxed font-semibold">
              The parent CIDR block is divided equally. Each block below represents an isolated subnet segment containing 1 / {results.totalSubnetsCreated} of the total address pool.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-2">
              {results.subnets.slice(0, 8).map((sub, idx) => {
                const fractionPercent = (100 / results.totalSubnetsCreated).toFixed(1);
                return (
                  <div 
                    key={idx} 
                    className="flex-1 min-w-[140px] bg-white border border-slate-200 p-3 rounded-lg text-center space-y-1.5 shadow-sm hover:border-blue-300 transition-colors"
                  >
                    <span className="text-[10px] font-bold text-slate-400">Subnet #{idx + 1}</span>
                    <div className="font-mono font-bold text-[11px] text-blue-600 truncate">{sub.cidr}</div>
                    <div className="text-[10px] text-emerald-700 font-bold">{sub.usableAddresses.toLocaleString()} Usable hosts</div>
                    <div className="text-[9px] text-slate-500 font-semibold bg-slate-50 border border-slate-150 rounded py-0.5">{fractionPercent}% of parent</div>
                  </div>
                );
              })}
              {results.totalSubnetsCreated > 8 && (
                <div className="flex-1 min-w-[140px] bg-slate-50 border border-dashed border-slate-350 p-3 rounded-lg flex flex-col items-center justify-center text-slate-500 text-[10px] font-bold">
                  <span>+ {results.totalSubnetsCreated - 8} more subnets</span>
                </div>
              )}
            </div>
          </div>

          {/* Allocation Table */}
          <div className="glass-panel rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700">Generated Allocation Table (Showing first 256 subnets)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] text-left text-slate-700">
                <thead className="bg-slate-100 text-slate-650 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Subnet Index</th>
                    <th className="py-2.5 px-4 font-bold">Subnet CIDR</th>
                    <th className="py-2.5 px-4 font-bold">Usable Ranges</th>
                    <th className="py-2.5 px-4 font-bold">Gateway</th>
                    <th className="py-2.5 px-4 font-bold">Broadcast Address</th>
                    <th className="py-2.5 px-4 font-bold text-center">Usable Hosts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {results.subnets.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 px-4 text-slate-550 font-mono">#{idx + 1}</td>
                      <td className="py-2 px-4 font-bold text-blue-600 font-mono select-all">{sub.cidr}</td>
                      <td className="py-2 px-4 text-slate-600 font-mono">{sub.firstHost} - {sub.lastHost}</td>
                      <td className="py-2 px-4 text-amber-600 font-mono">{sub.gateway}</td>
                      <td className="py-2 px-4 text-rose-600 font-mono">{sub.broadcastAddress}</td>
                      <td className="py-2 px-4 text-center font-bold text-emerald-600 font-mono">{sub.usableAddresses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
