'use client';

import React, { useState } from 'react';
import { IpCalculator } from '../components/IpCalculator';
import { CidrCalculator } from '../components/CidrCalculator';
import { SubnetCalculator } from '../components/SubnetCalculator';
import { VlsmCalculator } from '../components/VlsmCalculator';
import { SupernetCalculator } from '../components/SupernetCalculator';
import { VpcDesigner } from '../components/VpcDesigner';
import { IpamDashboard } from '../components/IpamDashboard';
import { ExportPanel } from '../components/ExportPanel';
import { AiAssistant } from '../components/AiAssistant';
import { IpReference } from '../components/IpReference';
import { EducationSidebar, EducationTopic } from '../components/EducationSidebar';
import { motion } from 'framer-motion';

type ActiveTab = 'ip' | 'cidr' | 'subnet' | 'vlsm' | 'supernet' | 'designer' | 'ipam' | 'export' | 'ai' | 'reference';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ip');

  // Map active tab to education topic
  const getEduTopic = (): EducationTopic => {
    switch (activeTab) {
      case 'ip': return 'ip';
      case 'cidr': return 'cidr';
      case 'subnet': return 'subnet';
      case 'vlsm': return 'vlsm';
      case 'supernet': return 'supernet';
      case 'designer': return 'vpc';
      case 'ipam': return 'ipam';
      case 'reference': return 'ip';
      default: return 'firewall';
    }
  };

  const tabsConfig = [
    { id: 'ip', label: 'IP Calculator' },
    { id: 'cidr', label: 'CIDR Subnets' },
    { id: 'subnet', label: 'Equal Subnets' },
    { id: 'vlsm', label: 'VLSM Calculator' },
    { id: 'supernet', label: 'Supernets' },
    { id: 'designer', label: 'VPC Designer & Sim' },
    { id: 'ipam', label: 'IPAM Manager' },
    { id: 'export', label: 'Configs Exporter' },
    { id: 'ai', label: 'AI Assistant' },
    { id: 'reference', label: 'IP Reference & Formulas' },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-800 bg-slate-50">
      
      {/* 1. Header Bar */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-5 shrink-0 z-20 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
            <span className="text-white font-black text-sm">IP</span>
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 tracking-wide uppercase flex items-center gap-1.5">
              IP Intelligence Platform
              <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded font-bold">V1.0.0</span>
            </h1>
            <span className="text-[10px] text-slate-500 font-medium">Enterprise Network Architect Suite</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2 text-slate-600 text-xs bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-semibold">
            <span>Interactive Labs Enabled</span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-slate-900 font-semibold text-xs transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* 2. Main Layout Shell */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-slate-200 bg-slate-100 flex flex-col p-4 shrink-0 overflow-y-auto">
          <div className="mb-4">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black px-3">Network Tools</span>
          </div>
          
          <nav className="flex-1 space-y-1 text-xs">
            {tabsConfig.map((tab) => {
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`
                    w-full flex items-center px-3 py-2.5 rounded-lg transition-all text-left font-semibold border
                    ${isActive 
                      ? 'bg-blue-600 border-blue-650 text-white shadow-sm' 
                      : 'text-slate-700 border-transparent hover:text-slate-900 hover:bg-slate-200/50'}
                  `}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Primary Content Window (Resizable center) */}
        <main className="flex-1 bg-slate-100/30 p-6 overflow-y-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'ip' && <IpCalculator />}
            {activeTab === 'cidr' && <CidrCalculator />}
            {activeTab === 'subnet' && <SubnetCalculator />}
            {activeTab === 'vlsm' && <VlsmCalculator />}
            {activeTab === 'supernet' && <SupernetCalculator />}
            {activeTab === 'designer' && <VpcDesigner />}
            {activeTab === 'ipam' && <IpamDashboard />}
            {activeTab === 'export' && <ExportPanel />}
            {activeTab === 'ai' && <AiAssistant />}
            {activeTab === 'reference' && <IpReference />}
          </motion.div>
        </main>

        {/* Education Mode Panel (Right Sidebar) */}
        <aside className="w-80 border-l border-slate-200 bg-slate-50 shrink-0 flex flex-col z-10">
          <div className="p-4 border-b border-slate-200 bg-slate-100/50 flex items-center justify-between shrink-0">
            <span className="text-[10px] text-slate-600 uppercase tracking-widest font-black">
              Education Mode
            </span>
            <span className="text-[9px] bg-slate-200 text-slate-600 border border-slate-350 px-1.5 py-0.5 rounded font-mono font-bold">
              Tab Synced
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <EducationSidebar topic={getEduTopic()} />
          </div>
        </aside>

      </div>
    </div>
  );
}
