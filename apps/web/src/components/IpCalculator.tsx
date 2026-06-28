import React, { useState, useEffect } from 'react';
import { analyzeIp, IpAnalysis } from '@ip-intel/networking';

export const IpCalculator: React.FC = () => {
  const [ipInput, setIpInput] = useState('192.168.1.50');
  const [analysis, setAnalysis] = useState<IpAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCalculate();
  }, []);

  const handleCalculate = () => {
    try {
      setError(null);
      const res = analyzeIp(ipInput);
      setAnalysis(res);
    } catch (err: any) {
      setError(err.message || 'Invalid IP address.');
      setAnalysis(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Explanation Box */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-800">IP Calculator & Properties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-700">What is this?</p>
            <p>A tool that reads a single IP address (like 192.168.1.50) and analyzes its format, class, scope, and numeric representations.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">What is the use?</p>
            <p>To verify if an IP address is valid, private or public, usable for hosts, and see how a computer stores it in different mathematical bases.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">When to use?</p>
            <p>When troubleshooting network connections or verifying if an IP address can be assigned to a local router or server.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">How the calculations happen? (Simple Arithmetic)</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>An IPv4 address has 4 numbers (octets) separated by dots, each from 0 to 255.</li>
              <li><strong>Decimal Value:</strong> Take the 4 numbers (A, B, C, D) and compute: (A * 16777216) + (B * 65536) + (C * 256) + D.</li>
              <li>For 192.168.1.50: (192 * 16777216) + (168 * 65536) + (1 * 256) + 50 = 3232235826.</li>
              <li><strong>Classes:</strong> Look at the 1st number: Class A (1-126), Class B (128-191), Class C (192-223).</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex gap-3 bg-slate-100 p-3 rounded-lg border border-slate-200">
        <div className="relative flex-1">
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            placeholder="Enter IP Address (e.g. 192.168.10.1 or 2001:db8::1)"
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
          />
        </div>
        <button
          onClick={handleCalculate}
          className="bg-blue-600 hover:bg-blue-500 text-xs font-semibold px-5 py-2 rounded text-white transition-colors"
        >
          Analyze IP
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg">
          {error}
        </div>
      )}

      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Panel: Primary Properties */}
          <div className="glass-panel rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">Properties</h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="text-slate-500">IP Version</span>
                <p className="text-base font-bold text-blue-600 mt-1">IPv{analysis.version}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="text-slate-500">Address Class</span>
                <p className="text-base font-bold text-emerald-600 mt-1">{analysis.class}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="text-slate-500">Scope Type</span>
                <p className={`text-base font-bold mt-1 ${analysis.isPrivate ? 'text-amber-600' : 'text-purple-600'}`}>
                  {analysis.isPrivate ? 'Private' : 'Public'}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="text-slate-500">Usable by Host?</span>
                <p className={`text-base font-bold mt-1 ${analysis.isUsable ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {analysis.isUsable ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded border border-slate-100">
                <span className="text-slate-500">Address Type:</span>
                <span className="font-semibold text-slate-700">{analysis.addressType}</span>
              </div>
              <div className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded border border-slate-100">
                <span className="text-slate-500">RFC Info:</span>
                <span className="font-semibold text-blue-600">{analysis.rfcInfo}</span>
              </div>
              <div className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded border border-slate-100">
                <span className="text-slate-500">Reserved Status:</span>
                <span className={`font-semibold ${analysis.isReserved ? 'text-rose-600' : 'text-slate-600'}`}>
                  {analysis.isReserved ? 'Reserved' : 'Not Reserved'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel: Alternative Representations */}
          <div className="glass-panel rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">Representations</h3>

            <div className="space-y-3.5">
              <div>
                <span className="text-xs text-slate-500">Decimal Integer</span>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 mt-1 font-mono text-xs select-all overflow-x-auto text-blue-650 font-semibold">
                  {analysis.decimal}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500">Hexadecimal</span>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 mt-1 font-mono text-xs select-all overflow-x-auto text-emerald-650 font-semibold">
                  {analysis.hex}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500">Octal</span>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 mt-1 font-mono text-xs select-all overflow-x-auto text-amber-650 font-semibold">
                  {analysis.octal}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500">Binary Bit Layout</span>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 mt-1 font-mono text-xs select-all overflow-x-auto text-purple-650 tracking-wider font-semibold">
                  {analysis.binary}
                </div>
              </div>
            </div>
          </div>

          {/* Octet Visualizer (for IPv4) */}
          {analysis.version === 4 && (
            <div className="md:col-span-2 glass-panel rounded-lg p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">32-Bit Octet Breakdown</h3>
              <div className="grid grid-cols-4 gap-4 pt-2 text-center">
                {ipInput.split('.').map((octet, idx) => {
                  const num = Number(octet);
                  if (isNaN(num)) return null;
                  const bin = num.toString(2).padStart(8, '0');
                  const hex = num.toString(16).toUpperCase().padStart(2, '0');
                  return (
                    <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="text-xs font-bold text-slate-500 mb-1">Octet {idx + 1}</div>
                      <div className="text-2xl font-black text-blue-600">{octet}</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-1.5 font-semibold">Bin: {bin}</div>
                      <div className="text-[10px] font-mono text-slate-500 font-semibold font-semibold">Hex: 0x{hex}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
