import React, { useState } from 'react';
import { calculateVlsm, VlsmRequirement, VlsmResult } from '@ip-intel/networking';

export const VlsmCalculator: React.FC = () => {
  const [parentCidr, setParentCidr] = useState('192.168.1.0/24');
  const [requirements, setRequirements] = useState<VlsmRequirement[]>([
    { name: 'Engineering', requiredHosts: 120 },
    { name: 'Marketing', requiredHosts: 30 },
    { name: 'IT Support', requiredHosts: 14 },
    { name: 'IoT Devices', requiredHosts: 5 }
  ]);
  const [isAws, setIsAws] = useState(false);

  const [newDeptName, setNewDeptName] = useState('');
  const [newHostCount, setNewHostCount] = useState<number | ''>('');

  const [results, setResults] = useState<VlsmResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newHostCount) return;
    setRequirements([
      ...requirements,
      { name: newDeptName.trim(), requiredHosts: Number(newHostCount) }
    ]);
    setNewDeptName('');
    setNewHostCount('');
  };

  const handleRemoveRequirement = (idx: number) => {
    setRequirements(requirements.filter((_, i) => i !== idx));
  };

  const handleCalculate = () => {
    try {
      setError(null);
      if (requirements.length === 0) {
        throw new Error("Add at least one requirement.");
      }
      const res = calculateVlsm(parentCidr, requirements, isAws);
      setResults(res);
    } catch (err: any) {
      setError(err.message || 'VLSM allocation failed.');
      setResults(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Explanation Box */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-800">VLSM Subnet Calculator</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-700">What is this?</p>
            <p>Variable Length Subnet Masking (VLSM) splits a parent network into subnets of different sizes to fit exact host requirements.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">What is the use?</p>
            <p>To pack multiple subnets as tightly as possible into a parent block, minimizing the number of wasted, unused IP addresses.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">When to use?</p>
            <p>When different departments require drastically different numbers of host machines (e.g. one needs 120 hosts, another needs only 5).</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">How the calculations happen? (Simple Arithmetic)</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Step 1:</strong> Sort subnets by size, largest first.</li>
              <li><strong>Step 2:</strong> Find the smallest power of 2 to fit requirements + 2 (for network and broadcast).
                <ul className="list-disc pl-4">
                  <li>For 120 hosts: $120 + 2 = 122$. Smallest power of 2 is 128 ($2^7$). We need 7 host bits, which gives a /25 prefix.</li>
                  <li>For 30 hosts: $30 + 2 = 32$. Smallest power of 2 is 32 ($2^5$). We need 5 host bits, which gives a /27 prefix.</li>
                </ul>
              </li>
              <li><strong>Step 3:</strong> Allocate sequentially:
                <ul className="list-disc pl-4">
                  <li>IT gets: 192.168.1.0 to 127 (/25). Next free is .128.</li>
                  <li>Marketing gets: 192.168.1.128 to 159 (/27).</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Parent & Add Panel */}
        <div className="space-y-4 lg:col-span-1">
          <div className="glass-panel rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">
              Allocation Scope
            </h3>

            <div className="flex flex-col space-y-1.5 text-xs">
              <label className="text-slate-500 font-medium">Parent IP Block</label>
              <input
                type="text"
                value={parentCidr}
                onChange={(e) => setParentCidr(e.target.value)}
                className="bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
                placeholder="e.g. 192.168.1.0/24"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAws(!isAws)}
              className={`w-full py-2 border rounded flex items-center justify-center gap-2 transition-all text-xs font-semibold ${isAws ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'}`}
            >
              <span>{isAws ? 'AWS Rules (-5 Reserved)' : 'Standard Rules (-2 Reserved)'}</span>
            </button>
          </div>

          {/* Add Requirements Form */}
          <div className="glass-panel rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">Add Subnet Target</h3>

            <form onSubmit={handleAddRequirement} className="space-y-3.5 text-xs">
              <div className="flex flex-col space-y-1">
                <label className="text-slate-500 font-medium">Department/Label</label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Finance, DB-Cluster"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-slate-500 font-medium">Hosts Needed</label>
                <input
                  type="number"
                  value={newHostCount}
                  onChange={(e) => setNewHostCount(e.target.value !== '' ? Number(e.target.value) : '')}
                  className="bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  min="1"
                  placeholder="e.g. 50"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-100 border border-slate-200 hover:bg-slate-200 text-blue-600 font-bold py-2 rounded flex items-center justify-center transition-colors"
              >
                Add Subnet
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: List of Requirements */}
        <div className="lg:col-span-2 glass-panel rounded-lg p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">Required Allocations</h3>
            
            {requirements.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No subnet targets added yet. Use the add panel to begin.</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs">
                {requirements.map((req, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="bg-white border border-slate-200 text-[10px] px-2 py-0.5 rounded text-slate-550 font-mono font-bold">#{idx+1}</span>
                      <span className="font-bold text-slate-800">{req.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600 font-semibold">{req.requiredHosts.toLocaleString()} hosts</span>
                      <button
                        onClick={() => handleRemoveRequirement(idx)}
                        className="text-rose-600 hover:text-rose-500 font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleCalculate}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-xs font-bold py-2.5 rounded text-white transition-colors"
          >
            Run VLSM Allocator
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {/* Visual Address Bar Space Allocation Chart */}
          <div className="glass-panel rounded-lg p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-700">Block Space Allocation Map</h3>
            <div className="w-full bg-slate-100 h-10 rounded-lg overflow-hidden flex border border-slate-200">
              {results.allocations.map((alloc, idx) => {
                // Determine percentage of parent address space
                const parentSize = results.allocations.reduce((sum, a) => sum + a.totalAddresses, 0) + 
                  results.remainingCidrs.reduce((sum, c) => sum + Math.pow(2, 32 - Number(c.split('/')[1])), 0);
                const percent = (alloc.totalAddresses / parentSize) * 100;
                
                const colors = ['bg-blue-100 text-blue-800 border-blue-200', 'bg-emerald-100 text-emerald-800 border-emerald-200', 'bg-purple-100 text-purple-800 border-purple-200', 'bg-amber-100 text-amber-800 border-amber-200'];
                const colClass = colors[idx % colors.length];

                return (
                  <div
                    key={idx}
                    className={`h-full border-r last:border-0 flex flex-col justify-center items-center text-[10px] font-bold overflow-hidden px-1 transition-all relative cursor-pointer ${colClass}`}
                    style={{ width: `${percent}%` }}
                    title={`${alloc.name}: ${alloc.allocatedCidr} (${alloc.totalAddresses} IPs)`}
                  >
                    <span className="truncate">{alloc.name}</span>
                    <span className="text-[8px] opacity-75 font-mono">/{alloc.prefixLength}</span>
                  </div>
                );
              })}
              
              {/* Remaining space */}
              {results.remainingCidrs.map((cidr, idx) => {
                const prefix = Number(cidr.split('/')[1]);
                const size = Math.pow(2, 32 - prefix);
                const parentSize = results.allocations.reduce((sum, a) => sum + a.totalAddresses, 0) + 
                  results.remainingCidrs.reduce((sum, c) => sum + Math.pow(2, 32 - Number(c.split('/')[1])), 0);
                const percent = (size / parentSize) * 100;

                return (
                  <div
                    key={idx}
                    className="h-full bg-slate-200 text-slate-500 border-r border-slate-350 last:border-0 flex flex-col justify-center items-center text-[9px] overflow-hidden px-1 cursor-pointer"
                    style={{ width: `${percent}%` }}
                    title={`Free Space: ${cidr}`}
                  >
                    <span className="truncate font-semibold">Free</span>
                    <span className="text-[8px] font-mono">/{prefix}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Allocation Details Table */}
          <div className="glass-panel rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xs font-bold text-slate-700">VLSM Allocation Output</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] text-left text-slate-700">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Subnet Label</th>
                    <th className="py-2.5 px-4 font-bold">Hosts Req.</th>
                    <th className="py-2.5 px-4 font-bold">Allocated CIDR</th>
                    <th className="py-2.5 px-4 font-bold">Usable Hosts</th>
                    <th className="py-2.5 px-4 font-bold">Subnet Mask</th>
                    <th className="py-2.5 px-4 font-bold">Gateway Recommendation</th>
                    <th className="py-2.5 px-4 font-bold">First / Last Usable Host</th>
                    <th className="py-2.5 px-4 font-bold text-center">Wastage %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {results.allocations.map((alloc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-800">{alloc.name}</td>
                      <td className="py-2.5 px-4 text-slate-600 font-semibold">{alloc.requiredHosts}</td>
                      <td className="py-2.5 px-4 text-blue-600 font-mono font-bold select-all">{alloc.allocatedCidr}</td>
                      <td className="py-2.5 px-4 text-emerald-600 font-bold">{alloc.usableAddresses}</td>
                      <td className="py-2.5 px-4 text-slate-700 font-mono">{alloc.subnetMask}</td>
                      <td className="py-2.5 px-4 text-amber-600 font-mono">{alloc.gateway}</td>
                      <td className="py-2.5 px-4 text-slate-500 font-mono">{alloc.firstHost} - {alloc.lastHost}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${alloc.wastePercentage > 50 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                          {alloc.wastePercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remaining CIDRs (Future Capacity) */}
          <div className="glass-panel rounded-lg p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-700">Remaining Address space (Available for future expansion)</h3>
            {results.remainingCidrs.length === 0 ? (
              <p className="text-xs text-slate-500">None. Parent IP Block is completely allocated.</p>
            ) : (
              <div className="flex flex-wrap gap-2 text-xs">
                {results.remainingCidrs.map((cidr, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded flex items-center gap-2">
                    <span className="font-bold text-slate-700 font-mono">{cidr}</span>
                    <span className="text-slate-400 font-bold">»</span>
                    <span className="text-[10px] text-emerald-650 font-bold">{Math.pow(2, 32 - Number(cidr.split('/')[1])).toLocaleString()} IPs</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
