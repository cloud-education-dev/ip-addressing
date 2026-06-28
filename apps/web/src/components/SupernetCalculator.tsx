import React, { useState } from 'react';
import { calculateSupernet, SupernetResult } from '@ip-intel/networking';

export const SupernetCalculator: React.FC = () => {
  const [cidrList, setCidrList] = useState<string[]>([
    '192.168.8.0/24',
    '192.168.9.0/24',
    '192.168.10.0/24',
    '192.168.11.0/24'
  ]);
  const [newCidr, setNewCidr] = useState('');
  
  const [results, setResults] = useState<SupernetResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddCidr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCidr.trim()) return;
    setCidrList([...cidrList, newCidr.trim()]);
    setNewCidr('');
  };

  const handleRemoveCidr = (idx: number) => {
    setCidrList(cidrList.filter((_, i) => i !== idx));
  };

  const handleAggregate = () => {
    try {
      setError(null);
      if (cidrList.length === 0) {
        throw new Error("Add at least one CIDR block to aggregate.");
      }
      const res = calculateSupernet(cidrList);
      setResults(res);
    } catch (err: any) {
      setError(err.message || 'Route aggregation failed.');
      setResults(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Explanation Box */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-800">Supernet Route Summarization</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-700">What is this?</p>
            <p>A tool that combines multiple smaller IP subnet blocks into a single, larger network block (a supernet).</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">What is the use?</p>
            <p>To reduce routing table sizes, saving router CPU and memory by advertising one single summary route instead of multiple paths.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">When to use?</p>
            <p>When you have adjacent, contiguous subnets and want to summarize them together to simplify traffic routing rules.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">How the calculations happen? (Simple Arithmetic)</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Step 1:</strong> Convert starting IP addresses of all subnets to binary (0s and 1s).</li>
              <li><strong>Step 2:</strong> Match the binary digits from left to right across all addresses.</li>
              <li><strong>Step 3:</strong> Count the number of bits that are identical. This count is your new supernet prefix length.</li>
              <li><strong>Step 4:</strong> Write the identical bits and fill the rest with 0s. Convert back to decimal to get the supernet address.</li>
              <li>E.g., 192.168.8.0/24 & 192.168.9.0/24 share the first 22 bits, so the supernet is 192.168.8.0/22.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Input Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">
              Aggregate CIDRs
            </h3>

            <form onSubmit={handleAddCidr} className="space-y-3 text-xs">
              <div className="flex flex-col space-y-1">
                <label className="text-slate-500 font-medium">Network Block to Aggregate</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCidr}
                    onChange={(e) => setNewCidr(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="e.g. 192.168.12.0/24"
                  />
                  <button
                    type="submit"
                    className="bg-slate-100 border border-slate-200 hover:bg-slate-200 text-blue-600 px-3 rounded flex items-center justify-center font-bold text-[10px]"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 text-[10px] text-slate-600">
            Supernetting works by identifying matching binary prefixes. It aggregates routes to minimize router table size. Ensure all inputted subnets are contiguous for clean results.
          </div>
        </div>

        {/* Right Active Blocks Panel */}
        <div className="lg:col-span-2 glass-panel rounded-lg p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">Active CIDR Blocks</h3>

            {cidrList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No networks added. Use the left panel to insert routes.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {cidrList.map((cidr, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200 font-mono">
                    <span className="font-bold text-slate-700">{cidr}</span>
                    <button
                      onClick={() => handleRemoveCidr(idx)}
                      className="text-rose-600 hover:text-rose-500 font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleAggregate}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-xs font-bold py-2.5 rounded text-white transition-colors"
          >
            Compute Supernet Aggregation
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg">
          {error}
        </div>
      )}

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Summary Route Card */}
          <div className="md:col-span-1 glass-panel rounded-lg p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">Summary Route</h3>
              
              <div className="bg-slate-50 p-4 rounded border border-blue-200 text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Aggregated CIDR</span>
                <p className="text-xl font-black text-blue-600 mt-1.5 font-mono select-all">{results.summaryRoute}</p>
              </div>

              <div className="text-[11px] space-y-1.5 pt-2">
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Total Host IPs:</span>
                  <span className="font-bold font-mono">{results.totalAggregatedAddresses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Matching Bits:</span>
                  <span className="font-bold text-emerald-650">{results.commonBits} bits</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 p-2.5 rounded border border-slate-200 text-[9px] text-slate-600">
              Summary Route includes all subnets and any free gaps between the minimum and maximum boundaries.
            </div>
          </div>

          {/* Binary Comparison Matrix Visual */}
          <div className="md:col-span-2 glass-panel rounded-lg p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">Binary Aggregation breakdown</h3>
            
            <div className="space-y-2 font-mono text-[10px] text-slate-700">
              {results.binaryComparison.map((comp, idx) => {
                const isSummary = comp.ip.startsWith('SUMMARY');
                
                // Partition binary by the matched common bits boundary
                const cleanBin = comp.binary.replace(/\./g, '');
                const matchPart = cleanBin.slice(0, results.commonBits);
                const diffPart = cleanBin.slice(results.commonBits);

                // Add octet formatting back
                const formatWithDots = (bits: string, offset: number) => {
                  let formatted = '';
                  for (let i = 0; i < bits.length; i++) {
                    const absIndex = offset + i;
                    if (absIndex > 0 && absIndex % 8 === 0) {
                      formatted += '.';
                    }
                    formatted += bits[i];
                  }
                  return formatted;
                };

                const matchFormatted = formatWithDots(matchPart, 0);
                const diffFormatted = formatWithDots(diffPart, results.commonBits);

                return (
                  <div key={idx} className={`p-2.5 rounded flex flex-col md:flex-row justify-between items-start md:items-center border ${isSummary ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`font-bold w-40 truncate ${isSummary ? 'text-blue-600' : 'text-slate-600'}`}>{comp.ip}</span>
                    <div className="text-[11px] tracking-wider mt-1 md:mt-0 font-semibold">
                      <span className="text-blue-600 font-bold">{matchFormatted}</span>
                      <span className="text-slate-400 font-semibold">{diffFormatted}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
