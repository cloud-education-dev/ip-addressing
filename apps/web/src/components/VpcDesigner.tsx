import React, { useState, useEffect } from 'react';
import { 
  simulatePacketFlow, 
  troubleshootTopology, 
  isIpInCidr,
  Packet,
  SimNode,
  SimEdge,
  RouteTable,
  Nacl,
  SecurityGroup
} from '@ip-intel/networking';
import { motion, AnimatePresence } from 'framer-motion';

export const VpcDesigner: React.FC = () => {
  // 1. Initial Topology State
  const [nodes, setNodes] = useState<SimNode[]>([
    { id: 'vpc-main', name: 'Primary VPC', type: 'ROUTER', cidrBlock: '10.0.0.0/16' },
    { id: 'sub-public', name: 'Public Subnet (Web)', type: 'SUBNET', cidrBlock: '10.0.1.0/24', routeTableId: 'rt-public', naclId: 'nacl-main', vpcId: 'vpc-main' },
    { id: 'sub-private', name: 'Private Subnet (DB)', type: 'SUBNET', cidrBlock: '10.0.2.0/24', routeTableId: 'rt-private', naclId: 'nacl-main', vpcId: 'vpc-main' },
    { id: 'ec2-web', name: 'Web-Server-A', type: 'EC2_INSTANCE', ip: '10.0.1.10', subnetId: 'sub-public', securityGroupId: 'sg-web' },
    { id: 'ec2-db', name: 'Database-B', type: 'EC2_INSTANCE', ip: '10.0.2.20', subnetId: 'sub-private', securityGroupId: 'sg-db' },
    { id: 'igw-main', name: 'VPC Internet Gateway', type: 'INTERNET_GATEWAY', vpcId: 'vpc-main' },
    { id: 'nat-main', name: 'NAT Gateway', type: 'NAT_GATEWAY', ip: '10.0.1.50', subnetId: 'sub-public' }
  ]);

  const [routeTables, setRouteTables] = useState<Record<string, RouteTable>>({
    'rt-public': {
      id: 'rt-public',
      name: 'Public Routing Table',
      routes: [
        { destination: '10.0.0.0/16', target: 'local', priority: 100 },
        { destination: '0.0.0.0/0', target: 'igw-main', priority: 100 }
      ]
    },
    'rt-private': {
      id: 'rt-private',
      name: 'Private Routing Table',
      routes: [
        { destination: '10.0.0.0/16', target: 'local', priority: 100 },
        { destination: '0.0.0.0/0', target: 'nat-main', priority: 100 }
      ]
    }
  });

  const [nacls, setNacls] = useState<Record<string, Nacl>>({
    'nacl-main': {
      id: 'nacl-main',
      name: 'VPC Default Network ACL',
      rules: [
        { ruleNumber: 100, isIngress: true, protocol: 'ALL', portRange: 'ALL', cidrBlock: '0.0.0.0/0', action: 'ALLOW' },
        { ruleNumber: 100, isIngress: false, protocol: 'ALL', portRange: 'ALL', cidrBlock: '0.0.0.0/0', action: 'ALLOW' }
      ]
    }
  });

  const [securityGroups, setSecurityGroups] = useState<Record<string, SecurityGroup>>({
    'sg-web': {
      id: 'sg-web',
      name: 'Web Security Group',
      rules: [
        { isIngress: true, protocol: 'TCP', portRange: '80', cidrBlock: '0.0.0.0/0' },
        { isIngress: true, protocol: 'TCP', portRange: '443', cidrBlock: '0.0.0.0/0' },
        { isIngress: false, protocol: 'ALL', portRange: 'ALL', cidrBlock: '0.0.0.0/0' }
      ]
    },
    'sg-db': {
      id: 'sg-db',
      name: 'Database Security Group',
      rules: [
        { isIngress: true, protocol: 'TCP', portRange: '3306', cidrBlock: '10.0.1.0/24' }, // Allow mysql from public subnet
        { isIngress: false, protocol: 'ALL', portRange: 'ALL', cidrBlock: '0.0.0.0/0' }
      ]
    }
  });

  // 2. Interactive simulation controls state
  const [packet, setPacket] = useState<Packet>({
    srcIp: '10.0.1.10',
    dstIp: '10.0.2.20',
    protocol: 'TCP',
    srcPort: 54320,
    dstPort: 3306
  });

  const [simRunning, setSimRunning] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [diagnostics, setDiagnostics] = useState<any | null>(null);
  const [overlaps, setOverlaps] = useState<string[]>([]);

  // 3. Modals and editor controls
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editCidr, setEditCidr] = useState('');
  const [editName, setEditName] = useState('');
  const [selectedConfigNode, setSelectedConfigNode] = useState<string>('sg-web');

  // LPM Evaluator state (Enhancement 3)
  const [lpmDestIp, setLpmDestIp] = useState('10.0.1.25');
  const [lpmRtId, setLpmRtId] = useState('rt-public');

  // Load saved topology on mount
  useEffect(() => {
    try {
      const savedNodes = localStorage.getItem('ip-intel-nodes');
      const savedRt = localStorage.getItem('ip-intel-rt');
      const savedNacls = localStorage.getItem('ip-intel-nacls');
      const savedSg = localStorage.getItem('ip-intel-sg');
      
      if (savedNodes) setNodes(JSON.parse(savedNodes));
      if (savedRt) setRouteTables(JSON.parse(savedRt));
      if (savedNacls) setNacls(JSON.parse(savedNacls));
      if (savedSg) setSecurityGroups(JSON.parse(savedSg));
    } catch (e) {
      console.error("Failed to load saved state", e);
    }
  }, []);

  // Save topology changes
  useEffect(() => {
    localStorage.setItem('ip-intel-nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('ip-intel-rt', JSON.stringify(routeTables));
  }, [routeTables]);

  useEffect(() => {
    localStorage.setItem('ip-intel-nacls', JSON.stringify(nacls));
  }, [nacls]);

  useEffect(() => {
    localStorage.setItem('ip-intel-sg', JSON.stringify(securityGroups));
  }, [securityGroups]);

  useEffect(() => {
    runOverlapDetection();
  }, [nodes]);

  // Dynamic overlap check
  const runOverlapDetection = () => {
    const subnets = nodes.filter(n => n.type === 'SUBNET');
    const conflicts: string[] = [];

    for (let i = 0; i < subnets.length; i++) {
      for (let j = i + 1; j < subnets.length; j++) {
        const subA = subnets[i];
        const subB = subnets[j];
        if (subA.cidrBlock && subB.cidrBlock) {
          const ipA = subA.cidrBlock.split('/')[0];
          const ipB = subB.cidrBlock.split('/')[0];
          if (isIpInCidr(ipA, subB.cidrBlock) || isIpInCidr(ipB, subA.cidrBlock)) {
            conflicts.push(subA.id);
            conflicts.push(subB.id);
          }
        }
      }
    }
    setOverlaps(Array.from(new Set(conflicts)));
  };

  const handleRunSimulation = () => {
    setSimRunning(true);
    setSimResult(null);
    setDiagnostics(null);

    setTimeout(() => {
      const edges: SimEdge[] = []; // simulation calculates hop graph dynamically
      const params = {
        nodes,
        edges,
        routeTables,
        nacls,
        securityGroups,
        packet
      };

      const result = simulatePacketFlow(params);
      const diag = troubleshootTopology(params);

      setSimResult(result);
      setDiagnostics(diag);
      setSimRunning(false);
    }, 1500);
  };

  const handleUpdateNodeCidr = () => {
    if (!editingNodeId) return;
    setNodes(nodes.map(n => n.id === editingNodeId ? { ...n, name: editName, cidrBlock: editCidr } : n));
    setEditingNodeId(null);
  };

  const handleAddSubnet = () => {
    const nextIdx = nodes.filter(n => n.type === 'SUBNET').length + 1;
    const newId = `sub-custom-${nextIdx}`;
    const newSub: SimNode = {
      id: newId,
      name: `Custom Subnet ${nextIdx}`,
      type: 'SUBNET',
      cidrBlock: `10.0.${10 + nextIdx}.0/24`,
      routeTableId: 'rt-public',
      naclId: 'nacl-main',
      vpcId: 'vpc-main'
    };
    setNodes([...nodes, newSub]);
  };

  const handleDeleteNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  // Compute active LPM route
  let winningDest = '0.0.0.0/0';
  let maxPrefix = -1;
  let matchedRouteTarget = 'igw-main';

  const routes = routeTables[lpmRtId]?.routes || [];
  routes.forEach(route => {
    let isMatch = false;
    try {
      isMatch = isIpInCidr(lpmDestIp, route.destination) || route.destination === '0.0.0.0/0';
    } catch(e) {}
    if (isMatch) {
      const prefixLength = parseInt(route.destination.split('/')[1]) || 0;
      if (prefixLength > maxPrefix) {
        maxPrefix = prefixLength;
        winningDest = route.destination;
        matchedRouteTarget = route.target;
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Explanation Box */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-800">VPC Designer & Stateful Simulator</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-700">What is this?</p>
            <p>A drag-and-drop cloud networking canvas to design AWS VPC subnets, routing routes, and firewall rules, and run a packets path simulation.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">What is the use?</p>
            <p>To verify if virtual machines can communicate under current routes, NACL boundaries, and Security Groups configuration without leaving the web browser.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">When to use?</p>
            <p>When modeling secure cloud environments and testing security access rules before launching real machines.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">How the calculations happen? (Simple Arithmetic)</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Overlap check:</strong> Compares subnet base IPs. If a base IP falls within another subnet's calculated block size, it flags a conflict.</li>
              <li><strong>Routing (Longest Prefix Match):</strong> Compares destination IP with all routes. The route with the highest prefix matches (e.g. /24 match beats a /16 match) is chosen.</li>
              <li><strong>Stateful SG:</strong> If packet outbound is allowed, inbound return flow is automatically permitted.</li>
              <li><strong>Stateless NACL:</strong> Sequentially evaluates rules (lowest number first). A match immediately drops or allows the packet.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Control Board: Packet Builder */}
        <div className="xl:col-span-1 glass-panel rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">
            Packet Flow Tracer
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Source instance */}
            <div className="flex flex-col space-y-1">
              <label className="text-slate-500">Source Instance IP</label>
              <select
                value={packet.srcIp}
                onChange={(e) => setPacket({ ...packet, srcIp: e.target.value })}
                className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
              >
                {nodes.filter(n => n.type === 'EC2_INSTANCE').map(n => (
                  <option key={n.id} value={n.ip}>{n.name} ({n.ip})</option>
                ))}
              </select>
            </div>

            {/* Destination Selector */}
            <div className="flex flex-col space-y-1">
              <label className="text-slate-500">Destination IP</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={packet.dstIp}
                  onChange={(e) => setPacket({ ...packet, dstIp: e.target.value })}
                  className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-mono"
                  placeholder="e.g. 10.0.2.20 or 8.8.8.8"
                />
                <select
                  value={packet.dstIp}
                  onChange={(e) => setPacket({ ...packet, dstIp: e.target.value })}
                  className="bg-white border border-slate-200 rounded px-1 py-1.5 text-slate-550 text-[10px]"
                >
                  <option value="10.0.2.20">DB Instance</option>
                  <option value="8.8.8.8">Internet (Google DNS)</option>
                </select>
              </div>
            </div>

            {/* Protocol */}
            <div className="flex flex-col space-y-1">
              <label className="text-slate-500">Protocol</label>
              <div className="grid grid-cols-3 bg-white border border-slate-200 p-0.5 rounded text-center">
                {['TCP', 'UDP', 'ICMP'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPacket({ ...packet, protocol: p as any })}
                    className={`py-1 rounded text-[10px] font-semibold ${packet.protocol === p ? 'bg-blue-600 font-bold text-white shadow-sm' : 'text-slate-600 hover:text-slate-850'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Port */}
            {packet.protocol !== 'ICMP' && (
              <div className="flex flex-col space-y-1">
                <label className="text-slate-500">Destination Port</label>
                <input
                  type="number"
                  value={packet.dstPort}
                  onChange={(e) => setPacket({ ...packet, dstPort: Number(e.target.value) })}
                  className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-mono"
                  min="1"
                  max="65535"
                />
              </div>
            )}

            <button
              onClick={handleRunSimulation}
              disabled={simRunning}
              className={`w-full py-2.5 rounded font-bold transition-all text-xs text-center ${simRunning ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'}`}
            >
              {simRunning ? 'Simulating...' : 'Trace Connection Path'}
            </button>
          </div>

          {/* Overlap warnings alert box */}
          {overlaps.length > 0 && (
            <div className="bg-rose-55 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>CIDR Overlap Detected!</span>
              </div>
              <p className="text-[10px] text-rose-650 leading-relaxed font-semibold">
                The subnets highlighted in red have overlapping address space ranges. Routing collisions will occur.
              </p>
            </div>
          )}
        </div>

        {/* Center: AWS Architecture Visual Canvas */}
        <div className="xl:col-span-3 space-y-4">
          <div className="glass-panel rounded-lg p-5 min-h-[350px] relative flex flex-col justify-between border-slate-200">
            <div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Software-Defined AWS VPC Canvas
                </h3>
                <button
                  onClick={handleAddSubnet}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-blue-600 px-2.5 py-1 rounded text-[10px] font-bold"
                >
                  Add Subnet
                </button>
              </div>

              {/* Visual Nodes representation */}
              <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200 min-h-[250px] flex flex-col justify-center relative overflow-hidden">
                
                {/* Visual pulse line simulation overlays */}
                {simRunning && (
                  <motion.div 
                    className="absolute inset-0 bg-blue-500/5 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                )}

                {/* VPC Container */}
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 space-y-4 bg-white shadow-sm">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span className="font-bold text-slate-655 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Primary VPC: 10.0.0.0/16</span>
                    <span className="text-[9px] text-amber-600 font-semibold font-sans">AWS Security Boundaries</span>
                  </div>

                  {/* Subnets layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {nodes.filter(n => n.type === 'SUBNET').map(sub => {
                      const isConflicting = overlaps.includes(sub.id);
                      
                      return (
                        <div 
                          key={sub.id} 
                          className={`rounded-lg p-3.5 border transition-all ${isConflicting ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <div className="flex justify-between items-start mb-3 border-b border-slate-200 pb-1.5">
                            <div>
                              <h4 className="text-xs font-bold text-slate-800">{sub.name}</h4>
                              <span className="font-mono text-[9px] text-blue-600">{sub.cidrBlock}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-sans font-semibold text-[9px]">
                              <button 
                                onClick={() => {
                                  setEditingNodeId(sub.id);
                                  setEditName(sub.name);
                                  setEditCidr(sub.cidrBlock || '');
                                }} 
                                className="text-slate-500 hover:text-blue-600 transition-colors"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteNode(sub.id)} 
                                className="text-slate-500 hover:text-rose-600 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Instances inside subnet */}
                          <div className="space-y-2">
                            {nodes.filter(inst => inst.type === 'EC2_INSTANCE' && inst.subnetId === sub.id).map(inst => (
                              <div key={inst.id} className="bg-white p-2.5 rounded border border-slate-200 flex justify-between items-center shadow-sm">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-700">{inst.name}</p>
                                    <span className="text-[8px] text-slate-500 font-mono">{inst.ip}</span>
                                  </div>
                                </div>
                                <span className="bg-blue-50 text-blue-700 border border-blue-150 text-[8px] px-1.5 py-0.5 rounded font-bold font-mono">
                                  {inst.securityGroupId}
                                </span>
                              </div>
                            ))}

                            {/* NAT Gateway node inside public subnet */}
                            {nodes.filter(nat => nat.type === 'NAT_GATEWAY' && nat.subnetId === sub.id).map(nat => (
                              <div key={nat.id} className="bg-amber-50 border border-amber-250 p-2 rounded flex justify-between items-center text-[10px]">
                                <span className="font-bold text-amber-700">
                                  {nat.name}
                                </span>
                                <span className="font-mono text-[9px] text-slate-500">{nat.ip}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gateways outside VPC */}
                <div className="flex gap-4 justify-center items-center mt-3 pt-3 border-t border-slate-200">
                  {nodes.filter(n => n.type === 'INTERNET_GATEWAY').map(igw => (
                    <div key={igw.id} className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] text-slate-750 font-bold font-mono shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>{igw.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Subnet Modal/Bar Overlay */}
      <AnimatePresence>
        {editingNodeId && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="glass-panel p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center justify-between text-xs"
          >
            <div className="flex flex-col gap-1 w-full md:w-1/3">
              <label className="text-slate-500">Subnet Label</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 font-bold"
              />
            </div>
            <div className="flex flex-col gap-1 w-full md:w-1/3">
              <label className="text-slate-500">Subnet CIDR Block</label>
              <input
                type="text"
                value={editCidr}
                onChange={(e) => setEditCidr(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 font-mono"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto md:pt-4">
              <button
                onClick={handleUpdateNodeCidr}
                className="bg-blue-600 text-white font-bold px-4 py-1.5 rounded shadow-sm hover:bg-blue-500"
              >
                Apply Changes
              </button>
              <button
                onClick={() => setEditingNodeId(null)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-1.5 rounded font-semibold"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulation Result stepper panel */}
      {simResult && diagnostics && (
        <div className="glass-panel rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
            <h3 className="text-sm font-bold text-slate-800">
              Connection Path Status: {simResult.status === 'SUCCESS' ? 'Delivered successfully' : 'Packet dropped'}
            </h3>
          </div>

          {/* Hop by Hop stepper list */}
          <div className="relative pl-6 border-l border-slate-200 space-y-5 text-xs">
            {simResult.trace.map((hop: any, idx: number) => {
              const isBlocked = hop.status === 'BLOCKED';
              
              return (
                <div key={idx} className="relative">
                  {/* Step indicator dot */}
                  <div className={`absolute left-[-29px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold z-10 ${isBlocked ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-850">{hop.nodeName}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.2 rounded uppercase font-semibold">
                        {hop.nodeType}
                      </span>
                    </div>
                    <p className={`text-[11px] mt-1 ${isBlocked ? 'text-rose-650 font-bold' : 'text-slate-655'}`}>
                      {hop.details}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Diagnostic Box for failed connections */}
          {simResult.status === 'FAILED' && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-xs space-y-3 pt-3">
              <div>
                <span className="text-[10px] text-rose-700 uppercase tracking-widest font-black">Root Cause</span>
                <p className="text-slate-800 font-bold mt-0.5">{diagnostics.rootCause}</p>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 uppercase tracking-widest font-black">Suggested Fix</span>
                <p className="text-slate-700 mt-0.5 font-semibold">{diagnostics.suggestedFix}</p>
              </div>
              <div className="border-t border-slate-200 pt-2.5">
                <span className="text-[10px] text-blue-600 uppercase tracking-widest font-black">Educational context</span>
                <p className="text-slate-650 leading-relaxed text-[11px] mt-0.5 font-semibold">{diagnostics.explanation}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Longest Prefix Match (LPM) Route Evaluator (Enhancement 3) */}
      <div className="glass-panel rounded-lg p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <h3 className="text-sm font-bold text-slate-700">
            Longest Prefix Match (LPM) Route Visualizer
          </h3>
        </div>
        <p className="text-xs text-slate-650 leading-relaxed font-semibold">
          When a packet is routed, the router compares the destination IP against all destinations in the Route Table. It selects the route with the largest prefix length (most bits matched).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex flex-col space-y-1">
            <label className="text-slate-600 font-bold">Test Destination IP</label>
            <input
              type="text"
              value={lpmDestIp}
              onChange={(e) => setLpmDestIp(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
              placeholder="e.g. 10.0.1.25"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-slate-600 font-bold">Select Route Table</label>
            <select
              value={lpmRtId}
              onChange={(e) => setLpmRtId(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none"
            >
              <option value="rt-public">Public Subnet Table (rt-public)</option>
              <option value="rt-private">Private Subnet Table (rt-private)</option>
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <div className="bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-650 font-semibold">
              Selected Route Target: <strong className="text-blue-600 font-black">{matchedRouteTarget}</strong>
            </div>
          </div>
        </div>

        {/* LPM Routing Table Comparison */}
        <div className="overflow-x-auto text-[11px]">
          <table className="w-full text-left text-slate-750 border-collapse">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Route Destination</th>
                <th className="py-2 px-3">Gateway Target</th>
                <th className="py-2 px-3">Prefix Length</th>
                <th className="py-2 px-3">Match Status</th>
                <th className="py-2 px-3 text-center">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white font-mono">
              {routeTables[lpmRtId]?.routes.map((route, idx) => {
                let isMatch = false;
                try {
                  isMatch = isIpInCidr(lpmDestIp, route.destination) || route.destination === '0.0.0.0/0';
                } catch(e) {}
                const prefixLength = parseInt(route.destination.split('/')[1]) || 0;
                const isWinner = isMatch && route.destination === winningDest;

                return (
                  <tr key={idx} className={`hover:bg-slate-50/50 ${isWinner ? 'bg-emerald-50/55 font-bold' : ''}`}>
                    <td className="py-2.5 px-3 text-slate-750 font-bold">{route.destination}</td>
                    <td className="py-2.5 px-3 text-blue-600">{route.target}</td>
                    <td className="py-2.5 px-3 text-slate-600">{prefixLength} bits</td>
                    <td className="py-2.5 px-3">
                      {isMatch ? (
                        <span className="text-emerald-700 font-bold">MATCHED</span>
                      ) : (
                        <span className="text-rose-650 font-bold">NO MATCH</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isWinner ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-250 px-2 py-0.5 rounded font-black text-[9px]">
                          ACTIVE WINNER (LPM)
                        </span>
                      ) : isMatch ? (
                        <span className="text-slate-500">Overridden by longer prefix</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rules Editor Dashboard (Stateful Security Groups and Stateless NACLs) */}
      <div className="glass-panel rounded-lg p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <h3 className="text-sm font-bold text-slate-700">
            VPC Firewalls Policy Editor
          </h3>
          
          <select
            value={selectedConfigNode}
            onChange={(e) => setSelectedConfigNode(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 text-xs focus:outline-none"
          >
            <option value="sg-web">Security Group: sg-web</option>
            <option value="sg-db">Security Group: sg-db</option>
            <option value="nacl-main">Subnet Network ACL: nacl-main</option>
          </select>
        </div>

        {/* Dynamic Rules table displays */}
        <div className="overflow-x-auto text-[11px]">
          {selectedConfigNode.startsWith('sg-') ? (
            <table className="w-full text-left text-slate-750 border-collapse">
              <thead className="bg-slate-100 text-slate-655 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Direction</th>
                  <th className="py-2 px-3">Protocol</th>
                  <th className="py-2 px-3">Port Range</th>
                  <th className="py-2 px-3">Source/Dest CIDR</th>
                  <th className="py-2 px-3 text-center">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white font-mono">
                {securityGroups[selectedConfigNode].rules.map((rule, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-500 font-bold">{rule.isIngress ? 'Inbound' : 'Outbound'}</td>
                    <td className="py-2.5 px-3 text-blue-600 font-bold">{rule.protocol}</td>
                    <td className="py-2.5 px-3 text-emerald-650 font-bold">{rule.portRange}</td>
                    <td className="py-2.5 px-3 text-slate-700">{rule.cidrBlock || rule.sourceGroupId}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 font-black">ALLOW</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-slate-750 border-collapse">
              <thead className="bg-slate-100 text-slate-655 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Rule #</th>
                  <th className="py-2 px-3">Direction</th>
                  <th className="py-2 px-3">Protocol</th>
                  <th className="py-2 px-3">Port Range</th>
                  <th className="py-2 px-3">Source/Dest CIDR</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white font-mono">
                {nacls[selectedConfigNode].rules.map((rule, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-400">#{rule.ruleNumber}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-bold">{rule.isIngress ? 'Inbound' : 'Outbound'}</td>
                    <td className="py-2.5 px-3 text-blue-600 font-bold">{rule.protocol}</td>
                    <td className="py-2.5 px-3 text-emerald-650 font-bold">{rule.portRange}</td>
                    <td className="py-2.5 px-3 text-slate-750">{rule.cidrBlock}</td>
                    <td className={`py-2.5 px-3 text-center font-black ${rule.action === 'ALLOW' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {rule.action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
