import React, { useState, useEffect } from 'react';

interface IpamIp {
  ip: string;
  status: 'ALLOCATED' | 'RESERVED' | 'LOCKED';
  device?: string;
  subnet: string;
  notes?: string;
}

export const IpamDashboard: React.FC = () => {
  const [ips, setIps] = useState<IpamIp[]>([
    { ip: '10.0.1.1', status: 'RESERVED', device: 'VPC Router/Gateway', subnet: 'sub-public (10.0.1.0/24)', notes: 'AWS System reserved' },
    { ip: '10.0.1.2', status: 'RESERVED', device: 'DNS Server', subnet: 'sub-public (10.0.1.0/24)', notes: 'AWS System reserved' },
    { ip: '10.0.1.3', status: 'RESERVED', device: 'Amazon Internal Routing', subnet: 'sub-public (10.0.1.0/24)', notes: 'AWS System reserved' },
    { ip: '10.0.1.10', status: 'ALLOCATED', device: 'Web-Server-A', subnet: 'sub-public (10.0.1.0/24)', notes: 'Primary ENI' },
    { ip: '10.0.1.50', status: 'ALLOCATED', device: 'NAT Gateway', subnet: 'sub-public (10.0.1.0/24)', notes: 'NAT instance interface' },
    { ip: '10.0.2.1', status: 'RESERVED', device: 'VPC Router/Gateway', subnet: 'sub-private (10.0.2.0/24)', notes: 'AWS System reserved' },
    { ip: '10.0.2.20', status: 'ALLOCATED', device: 'Database-B', subnet: 'sub-private (10.0.2.0/24)', notes: 'DB master' }
  ]);

  const [inputIp, setInputIp] = useState('');
  const [inputDevice, setInputDevice] = useState('');
  const [inputSubnet, setInputSubnet] = useState('sub-public (10.0.1.0/24)');
  const [inputStatus, setInputStatus] = useState<'ALLOCATED' | 'RESERVED' | 'LOCKED'>('ALLOCATED');

  const [error, setError] = useState<string | null>(null);

  // Load IPAM inventory on mount
  useEffect(() => {
    try {
      const savedIps = localStorage.getItem('ip-intel-ipam-ips');
      if (savedIps) {
        setIps(JSON.parse(savedIps));
      }
    } catch (e) {
      console.error("Failed to load IPAM inventory from local storage", e);
    }
  }, []);

  // Sync inventory changes
  useEffect(() => {
    localStorage.setItem('ip-intel-ipam-ips', JSON.stringify(ips));
  }, [ips]);

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!inputIp.trim()) return;

    // Check for duplicate IPs
    const exists = ips.find(item => item.ip.trim() === inputIp.trim());
    if (exists) {
      setError(`IP Conflict Detected! Address ${inputIp} is already allocated to '${exists.device || 'Reserved pool'}'.`);
      return;
    }

    const newItem: IpamIp = {
      ip: inputIp.trim(),
      status: inputStatus,
      device: inputDevice.trim() || undefined,
      subnet: inputSubnet
    };

    setIps([...ips, newItem]);
    setInputIp('');
    setInputDevice('');
  };

  const handleToggleLock = (ipStr: string) => {
    setIps(ips.map(item => {
      if (item.ip === ipStr) {
        const nextStatus = item.status === 'LOCKED' ? 'ALLOCATED' : 'LOCKED';
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const handleRelease = (ipStr: string) => {
    setIps(ips.filter(item => item.ip !== ipStr));
  };

  return (
    <div className="space-y-6">
      {/* Explanation Box */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-800">IP Address Management (IPAM)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-700">What is this?</p>
            <p>An IP address tracker that records allocations and monitors duplicate conflicts within subnet blocks.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">What is the use?</p>
            <p>To inventory your network layout, lock critical nodes (like database servers), and guarantee no two systems share the same IP.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">When to use?</p>
            <p>When spinning up virtual systems in your cloud subnets and you need to register their static addresses.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">How the calculations happen? (Simple Arithmetic)</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Conflict Detection:</strong> Checks if the input IP address exists in the current list. If it matches, it triggers a Conflict Alert.</li>
              <li><strong>Heatmap Utilization:</strong> Renders a visual grid representing the IP block (.1 to .64). Color is computed by mapping status (Active, Reserved, Locked, Free).</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Side Allocate IPs Panel */}
        <div className="xl:col-span-1 glass-panel rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">
            Allocate IP Address
          </h3>

          <form onSubmit={handleAllocate} className="space-y-3.5 text-xs bg-white p-3 rounded-lg border border-slate-200">
            <div className="flex flex-col space-y-1">
              <label className="text-slate-500">Target IP Address</label>
              <input
                type="text"
                value={inputIp}
                onChange={(e) => setInputIp(e.target.value)}
                className="bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 placeholder-slate-400 font-mono focus:outline-none focus:border-blue-500"
                placeholder="e.g. 10.0.1.15"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-slate-500">Device/Resource Label</label>
              <input
                type="text"
                value={inputDevice}
                onChange={(e) => setInputDevice(e.target.value)}
                className="bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                placeholder="e.g. Web-Proxy-01"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-slate-500">Parent Subnet</label>
              <select
                value={inputSubnet}
                onChange={(e) => setInputSubnet(e.target.value)}
                className="bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
              >
                <option value="sub-public (10.0.1.0/24)">sub-public (10.0.1.0/24)</option>
                <option value="sub-private (10.0.2.0/24)">sub-private (10.0.2.0/24)</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-slate-500">Allocation Status</label>
              <select
                value={inputStatus}
                onChange={(e) => setInputStatus(e.target.value as any)}
                className="bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
              >
                <option value="ALLOCATED">Active Allocation</option>
                <option value="RESERVED">Reserved Space</option>
                <option value="LOCKED">Locked IP</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-xs font-bold py-2 rounded text-white transition-colors"
            >
              Allocate IP
            </button>
          </form>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-750 p-3 rounded-lg text-xs space-y-1">
              <div className="font-bold">
                <span>Allocation Error</span>
              </div>
              <p className="text-[10px] text-rose-650 leading-relaxed">{error}</p>
            </div>
          )}
        </div>

        {/* Right Side: Active Allocations Table */}
        <div className="xl:col-span-2 glass-panel rounded-lg p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">IPAM Inventory</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] text-left text-slate-700">
                <thead className="bg-slate-100 text-slate-650 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">IP Address</th>
                    <th className="py-2.5 px-4 font-bold">Status</th>
                    <th className="py-2.5 px-4 font-bold">Device/Endpoint</th>
                    <th className="py-2.5 px-4 font-bold">Subnet Range</th>
                    <th className="py-2.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white font-mono">
                  {ips.map((item, idx) => {
                    const isLocked = item.status === 'LOCKED';
                    
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2 px-4 font-bold text-blue-600 select-all">{item.ip}</td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                            item.status === 'LOCKED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            item.status === 'RESERVED' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-slate-800 font-sans">{item.device || 'N/A'}</td>
                        <td className="py-2 px-4 text-slate-600">{item.subnet}</td>
                        <td className="py-2 px-4 text-right space-x-2 font-sans font-semibold">
                          <button
                            onClick={() => handleToggleLock(item.ip)}
                            className="text-slate-600 hover:text-amber-600 transition-colors text-[9px] border border-slate-200 px-1.5 py-0.5 rounded"
                          >
                            {isLocked ? 'Unlock' : 'Lock'}
                          </button>
                          <button
                            onClick={() => handleRelease(item.ip)}
                            className="text-slate-600 hover:text-rose-600 transition-colors text-[9px] border border-slate-200 px-1.5 py-0.5 rounded"
                          >
                            Release
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Heat Map grid representation */}
        <div className="xl:col-span-3 glass-panel rounded-lg p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
            IP Address Utilization Heatmap (10.0.1.0/24 Subnet)
          </h3>
          
          <div className="grid grid-cols-16 gap-1 pt-2">
            {Array(64).fill(0).map((_, idx) => {
              const ipNum = idx + 1;
              const ipStr = `10.0.1.${ipNum}`;
              const allocatedItem = ips.find(item => item.ip === ipStr);
              
              let bg = 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200';
              if (allocatedItem) {
                if (allocatedItem.status === 'LOCKED') bg = 'bg-amber-100 border-amber-200 text-amber-800';
                else if (allocatedItem.status === 'RESERVED') bg = 'bg-purple-100 border-purple-200 text-purple-800';
                else bg = 'bg-emerald-100 border-emerald-250 text-emerald-800';
              }

              return (
                <div
                  key={idx}
                  className={`h-7 rounded border font-mono text-[9px] font-black flex items-center justify-center cursor-pointer select-none transition-all hover:scale-105 ${bg}`}
                  title={`${ipStr} ${allocatedItem ? `(${allocatedItem.status} - ${allocatedItem.device || 'Reserved'})` : '(Available)'}`}
                >
                  .{ipNum}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 px-1 pt-1 font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-emerald-100 border border-emerald-200 rounded" />
              <span>Active Allocation (.10, .50)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-purple-100 border border-purple-200 rounded" />
              <span>AWS System Reserved (.1 - .3)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-amber-100 border border-amber-200 rounded" />
              <span>Locked Address (None)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-slate-100 border border-slate-200 rounded" />
              <span>Available Addresses (.4 - .9, etc.)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
