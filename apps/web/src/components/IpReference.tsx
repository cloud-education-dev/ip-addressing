import React, { useState, useEffect, useRef } from 'react';
import { parseIpv4, ipv4ToString } from '@ip-intel/networking';

const BitwiseAndAnimator: React.FC = () => {
  const [ip, setIp] = useState('192.168.1.50');
  const [prefix, setPrefix] = useState(24);
  const [animIndex, setAnimIndex] = useState(-1);
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [ipBits, setIpBits] = useState<number[]>([]);
  const [maskBits, setMaskBits] = useState<number[]>([]);
  const [resultBits, setResultBits] = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Compute bits
  const computeBits = (ipStr: string, pref: number) => {
    const ipNum = parseIpv4(ipStr);
    if (ipNum === null) return;
    const ipBin = ipNum.toString(2).padStart(32, '0').split('').map(Number);
    
    const maskNum = pref === 0 ? 0 : (~0 << (32 - pref)) >>> 0;
    const maskBin = maskNum.toString(2).padStart(32, '0').split('').map(Number);

    setIpBits(ipBin);
    setMaskBits(maskBin);
    setResultBits(Array(32).fill(0));
    setAnimIndex(-1);
  };

  useEffect(() => {
    computeBits(ip, prefix);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ip, prefix]);

  const startAnimation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResultBits(Array(32).fill(0));
    setAnimIndex(0);

    let currentIndex = 0;
    timerRef.current = setInterval(() => {
      setResultBits(prev => {
        const next = [...prev];
        next[currentIndex] = ipBits[currentIndex] & maskBits[currentIndex];
        return next;
      });
      setAnimIndex(currentIndex);
      currentIndex++;

      if (currentIndex >= 32) {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 80);
  };

  const resetAnimation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResultBits(Array(32).fill(0));
    setAnimIndex(-1);
  };

  const isValidIp = parseIpv4(ip) !== null;

  return (
    <div className="glass-panel rounded-lg p-5 space-y-4">
      <h3 className="text-xs font-bold text-slate-700 tracking-widest uppercase">
        Interactive Bitwise AND Masking Animator
      </h3>
      <p className="text-xs text-slate-650 leading-relaxed font-semibold">
        Input any IP Address and Prefix length. Hit "Run Animation" or **hover over any bit block** to inspect the logic column-by-column, blocking host bits to resolve the Network Base address.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div className="flex flex-col space-y-1">
          <label className="text-slate-600 font-bold">IP Address</label>
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-slate-600 font-bold">Prefix (/0 to /32)</label>
          <input
            type="number"
            value={prefix}
            onChange={(e) => setPrefix(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
            min="0"
            max="32"
          />
        </div>
        <div className="flex gap-2 items-end">
          <button
            onClick={startAnimation}
            disabled={!isValidIp || animIndex >= 0 && animIndex < 31}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-[10px] font-bold py-2 rounded text-white disabled:bg-blue-900/20 disabled:text-blue-505 transition-all text-center"
          >
            Run Animation
          </button>
          <button
            onClick={resetAnimation}
            className="bg-slate-100 border border-slate-200 hover:bg-slate-250 text-slate-600 px-3 py-2 rounded text-xs font-bold"
          >
            Reset
          </button>
        </div>
      </div>

      {isValidIp && ipBits.length === 32 && (
        <div className="space-y-3.5 pt-2 font-mono text-[10px]">
          {/* Row 1: IP Bits */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <span className="text-slate-500 w-24 shrink-0 font-bold font-sans">IP Address:</span>
            <div className="flex gap-0.5">
              {ipBits.map((b, idx) => {
                const isActive = idx === animIndex || idx === hoverIndex;
                const isGroupEnd = (idx + 1) % 8 === 0 && idx !== 31;
                return (
                  <React.Fragment key={idx}>
                    <span 
                      onMouseEnter={() => setHoverIndex(idx)}
                      onMouseLeave={() => setHoverIndex(-1)}
                      className={`w-4 h-5 rounded flex items-center justify-center font-bold border cursor-help transition-all ${isActive ? 'bg-amber-100 border-amber-350 text-amber-800 scale-105 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-350'}`}
                    >
                      {b}
                    </span>
                    {isGroupEnd && <span className="w-1.5 h-5 flex items-center justify-center text-slate-400">.</span>}
                  </React.Fragment>
                );
              })}
            </div>
            <span className="text-slate-550 text-[9px] font-semibold">({ip})</span>
          </div>

          {/* Row 2: Mask Bits */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <span className="text-slate-500 w-24 shrink-0 font-bold font-sans">Subnet Mask:</span>
            <div className="flex gap-0.5">
              {maskBits.map((b, idx) => {
                const isActive = idx === animIndex || idx === hoverIndex;
                const isGroupEnd = (idx + 1) % 8 === 0 && idx !== 31;
                return (
                  <React.Fragment key={idx}>
                    <span 
                      onMouseEnter={() => setHoverIndex(idx)}
                      onMouseLeave={() => setHoverIndex(-1)}
                      className={`w-4 h-5 rounded flex items-center justify-center font-bold border cursor-help transition-all ${isActive ? 'bg-amber-100 border-amber-350 text-amber-800 scale-105 shadow-sm' : 'bg-white border-slate-200 text-slate-550 hover:border-slate-350'}`}
                    >
                      {b}
                    </span>
                    {isGroupEnd && <span className="w-1.5 h-5 flex items-center justify-center text-slate-400">.</span>}
                  </React.Fragment>
                );
              })}
            </div>
            <span className="text-slate-550 text-[9px] font-semibold">({prefix === 0 ? '0.0.0.0' : ipv4ToString( (~0 << (32 - prefix)) >>> 0 )})</span>
          </div>

          {/* Row 3: Result Bits */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2 border-t border-slate-200 pt-3">
            <span className="text-slate-800 w-24 shrink-0 font-black font-sans">Network Base:</span>
            <div className="flex gap-0.5">
              {resultBits.map((b, idx) => {
                const isActive = idx === animIndex || idx === hoverIndex;
                const isEvaluated = idx <= animIndex || idx === hoverIndex;
                const isGroupEnd = (idx + 1) % 8 === 0 && idx !== 31;
                const evaluatedVal = idx <= animIndex ? b : (ipBits[idx] & maskBits[idx]);
                return (
                  <React.Fragment key={idx}>
                    <span 
                      onMouseEnter={() => setHoverIndex(idx)}
                      onMouseLeave={() => setHoverIndex(-1)}
                      className={`w-4 h-5 rounded flex items-center justify-center font-bold border cursor-help transition-all ${
                        isActive ? 'bg-amber-100 border-amber-300 text-amber-800 scale-105 shadow-sm' :
                        isEvaluated ? 'bg-blue-100 border-blue-200 text-blue-700' :
                        'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      {isEvaluated ? evaluatedVal : '?' }
                    </span>
                    {isGroupEnd && <span className="w-1.5 h-5 flex items-center justify-center text-slate-400">.</span>}
                  </React.Fragment>
                );
              })}
            </div>
            {(animIndex === 31 || hoverIndex >= 0) && (
              <span className="text-emerald-700 font-bold text-[9px] font-sans">
                ({ipv4ToString((parseIpv4(ip)! & (prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0)) >>> 0)})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bit explanation tooltip */}
      {(hoverIndex >= 0 || animIndex >= 0) && (
        (() => {
          const activeIdx = hoverIndex >= 0 ? hoverIndex : animIndex;
          return (
            <div className="bg-slate-100 p-2.5 rounded border border-slate-200 text-[10px] text-slate-650 flex items-center gap-2">
              <span className="font-bold text-amber-700">Bit index #{activeIdx + 1}:</span>
              <span>
                IP bit <strong className="text-slate-850">{ipBits[activeIdx]}</strong> AND Mask bit <strong className="text-slate-850">{maskBits[activeIdx]}</strong> = <strong className="text-blue-600">{ipBits[activeIdx] & maskBits[activeIdx]}</strong>
              </span>
              <span className="text-[9px] text-slate-500 italic ml-auto font-semibold">
                {maskBits[activeIdx] === 1 ? 'Mask bit is 1: IP bit passes through.' : 'Mask bit is 0: IP bit is blocked (forced to 0).'}
              </span>
            </div>
          );
        })()
      )}
    </div>
  );
};

interface QuizQuestion {
  text: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

const SubnetPracticeQuiz: React.FC = () => {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  const generateQuestion = (): QuizQuestion => {
    const qTypes = ['hosts', 'mask', 'network'];
    const type = qTypes[Math.floor(Math.random() * qTypes.length)];

    if (type === 'hosts') {
      const prefixes = [24, 25, 26, 27, 28, 29, 30];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const hostBits = 32 - prefix;
      const totalIps = Math.pow(2, hostBits);
      const usable = totalIps - 2;

      const choices = Array.from(new Set([
        usable.toString(),
        totalIps.toString(),
        (usable === 254 ? 126 : usable * 2).toString(),
        (usable + 8).toString()
      ])).sort(() => Math.random() - 0.5);

      const correctIndex = choices.indexOf(usable.toString());

      return {
        text: `How many usable host IP addresses are in a /${prefix} network?`,
        choices,
        correctIndex,
        explanation: `1. Calculate the host bits: 32 minus the prefix = 32 - ${prefix} = ${hostBits} bits.\n2. Calculate the total IP addresses: 2 multiplied by itself ${hostBits} times = ${totalIps} IPs.\n3. Subtract 2 addresses (one for network base, one for broadcast): ${totalIps} - 2 = ${usable} usable hosts.`
      };
    } else if (type === 'mask') {
      const prefixes = [25, 26, 27, 28, 29, 30];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const fourthOctetValue = 256 - Math.pow(2, 32 - prefix);
      const maskStr = `255.255.255.${fourthOctetValue}`;

      const choices = Array.from(new Set([
        maskStr,
        `255.255.255.${fourthOctetValue === 128 ? 192 : fourthOctetValue - 32}`,
        `255.255.255.${fourthOctetValue === 252 ? 240 : fourthOctetValue + 16}`,
        '255.255.255.0'
      ])).sort(() => Math.random() - 0.5);

      const correctIndex = choices.indexOf(maskStr);

      return {
        text: `What is the subnet mask for a /${prefix} prefix length?`,
        choices,
        correctIndex,
        explanation: `1. A /${prefix} prefix length means the first ${prefix} bits are 1, and the remaining ${32 - prefix} bits are 0.\n2. The first 24 bits make 255.255.255.\n3. The fourth octet has ${prefix - 24} network bits set to 1 and ${32 - prefix} host bits set to 0.\n4. Adding up the binary bit values (128, 64, 32, etc.) gives: ${fourthOctetValue}.\n5. This gives a final subnet mask of: ${maskStr}.`
      };
    } else {
      const subnets = [
        { ip: '192.168.1.45', prefix: 26, net: '192.168.1.0', block: 64 },
        { ip: '192.168.1.85', prefix: 26, net: '192.168.1.64', block: 64 },
        { ip: '192.168.1.150', prefix: 25, net: '192.168.1.128', block: 128 },
        { ip: '192.168.1.20', prefix: 27, net: '192.168.1.0', block: 32 },
        { ip: '10.0.0.140', prefix: 25, net: '10.0.0.128', block: 128 },
        { ip: '10.0.0.95', prefix: 26, net: '10.0.0.64', block: 64 }
      ];
      const item = subnets[Math.floor(Math.random() * subnets.length)];

      const choices = Array.from(new Set([
        item.net,
        item.net.substring(0, item.net.lastIndexOf('.') + 1) + '0',
        item.net.substring(0, item.net.lastIndexOf('.') + 1) + (parseInt(item.net.split('.')[3]) + item.block),
        item.net.substring(0, item.net.lastIndexOf('.') + 1) + '255'
      ])).sort(() => Math.random() - 0.5);

      const correctIndex = choices.indexOf(item.net);

      return {
        text: `What is the network address for the host IP ${item.ip}/${item.prefix}?`,
        choices,
        correctIndex,
        explanation: `1. Calculate the size of each subnet block: 2 to the power of host bits. For /${item.prefix}, host bits = 32 - ${item.prefix} = ${32 - item.prefix}.\n2. Block size = 2^${32 - item.prefix} = ${item.block} IP addresses.\n3. Subnet ranges start at multiples of ${item.block}: 0, ${item.block}, ${item.block * 2}, etc.\n4. Find the largest multiple of ${item.block} that is less than or equal to the host IP's end number (.${item.ip.split('.')[3]}). That value is ${item.net.split('.')[3]}.\n5. This gives a network base address of: ${item.net}.`
      };
    }
  };

  const handleNext = () => {
    setQuestion(generateQuestion());
    setSelectedIdx(-1);
    setIsAnswered(false);
  };

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
    setIsAnswered(true);
    const isCorrect = idx === question?.correctIndex;
    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
  };

  const handleResetScore = () => {
    setStats({ correct: 0, total: 0 });
    handleNext();
  };

  useEffect(() => {
    handleNext();
  }, []);

  if (!question) return null;

  return (
    <div className="glass-panel rounded-lg p-5 space-y-5">
      <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
        <h3 className="text-xs font-bold text-slate-700 tracking-widest uppercase">
          Subnetting Practice Quiz
        </h3>
        <div className="text-xs font-semibold text-slate-650 flex items-center gap-3">
          <span>Score: {stats.correct} / {stats.total}</span>
          <button 
            onClick={handleResetScore}
            className="text-[10px] text-blue-600 hover:text-blue-500 underline"
          >
            Reset Score
          </button>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-4">
        <p className="text-sm font-bold text-slate-800 leading-relaxed">
          {question.text}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {question.choices.map((choice, idx) => {
            let btnClass = "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-350";
            if (isAnswered) {
              if (idx === question.correctIndex) {
                btnClass = "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold";
              } else if (idx === selectedIdx) {
                btnClass = "bg-rose-50 border-rose-300 text-rose-800 font-bold";
              } else {
                btnClass = "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={isAnswered}
                className={`py-3 px-4 rounded border text-left font-medium transition-all ${btnClass}`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      </div>

      {isAnswered && (
        <div className="space-y-4 animate-fade-in text-xs">
          <div className={`p-3 rounded-lg border font-semibold ${selectedIdx === question.correctIndex ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
            {selectedIdx === question.correctIndex ? "Correct Answer! Great job." : "Incorrect Answer. See the explanation below to learn how to solve it."}
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2">
            <h4 className="font-bold text-slate-800">Arithmetic Explanation</h4>
            <pre className="whitespace-pre-wrap font-sans text-slate-650 leading-relaxed font-semibold">
              {question.explanation}
            </pre>
          </div>

          <button
            onClick={handleNext}
            className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-2 rounded text-white text-xs transition-colors"
          >
            Next Question
          </button>
        </div>
      )}
    </div>
  );
};

type SubSection = 'classes' | 'formulas' | 'examples' | 'quiz';

export const IpReference: React.FC = () => {
  const [subTab, setSubTab] = useState<SubSection>('classes');

  return (
    <div className="space-y-6 bg-slate-50 text-slate-800">
      {/* Explanation Box */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-800">IP Reference & Formulas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-700">What is this?</p>
            <p>A reference cheatsheet mapping address classes, subnet masks, calculation equations, and walkthroughs.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">What is the use?</p>
            <p>To provide instant reference lookup for subnet bit equations, network classes, and step-by-step math workflows.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">When to use?</p>
            <p>When computing subnets manually or studying for network certification exams.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">How the calculations happen? (Simple Arithmetic)</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Bitwise AND:</strong> Compares each bit of the IP with the Subnet Mask bit. Output is 1 only when both are 1. Otherwise, output is 0.</li>
              <li>This masks or "zeros out" the host portion of the IP, leaving the network prefix intact.</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setSubTab('classes')}
          className={`px-4 py-2 rounded text-xs font-bold transition-all border ${
            subTab === 'classes'
              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800'
          }`}
        >
          IP Address Classes
        </button>
        <button
          onClick={() => setSubTab('formulas')}
          className={`px-4 py-2 rounded text-xs font-bold transition-all border ${
            subTab === 'formulas'
              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800'
          }`}
        >
          Calculations Formulas
        </button>
        <button
          onClick={() => setSubTab('examples')}
          className={`px-4 py-2 rounded text-xs font-bold transition-all border ${
            subTab === 'examples'
              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800'
          }`}
        >
          Step-by-Step Examples
        </button>
        <button
          onClick={() => setSubTab('quiz')}
          className={`px-4 py-2 rounded text-xs font-bold transition-all border ${
            subTab === 'quiz'
              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800'
          }`}
        >
          Subnetting Practice Quiz
        </button>
      </div>

      {/* 1. IP Classes Section */}
      {subTab === 'classes' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">
              Classful IP Addressing Schemes (IPv4)
            </h3>
            <p className="text-xs text-slate-655 leading-relaxed">
              Before Classless Inter-Domain Routing (CIDR) was introduced in 1993, the Internet Protocol address space was divided into five distinct classes (A, B, C, D, and E). Each class dictated the size of the network prefix and host fields.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Class A */}
            <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-2 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-base font-black text-blue-600">Class A</span>
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[9px] font-mono font-bold border border-blue-100">1.0.0.0 - 127.255.255.255</span>
              </div>
              <ul className="space-y-1.5 text-slate-650 pt-2 font-medium">
                <li><strong className="text-slate-700">First Octet range:</strong> 1 - 127</li>
                <li><strong className="text-slate-700">Leading Bits:</strong> <code>0</code> (starts with binary 0)</li>
                <li><strong className="text-slate-700">Default Subnet Mask:</strong> 255.0.0.0 (/8)</li>
                <li><strong className="text-slate-700">Network/Host bits:</strong> 8 bits net, 24 bits host</li>
                <li><strong className="text-slate-700">Usable Networks:</strong> 128 (126 usable)</li>
                <li><strong className="text-slate-700">Usable Hosts:</strong> 16,777,214 hosts per network</li>
                <li><strong className="text-slate-700">Purpose:</strong> Massive multinational networks and ISPs.</li>
              </ul>
            </div>

            {/* Class B */}
            <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-2 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-base font-black text-emerald-600">Class B</span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-mono font-bold border border-emerald-100">128.0.0.0 - 191.255.255.255</span>
              </div>
              <ul className="space-y-1.5 text-slate-650 pt-2 font-medium">
                <li><strong className="text-slate-700">First Octet range:</strong> 128 - 191</li>
                <li><strong className="text-slate-700">Leading Bits:</strong> <code>10</code> (starts with binary 10)</li>
                <li><strong className="text-slate-700">Default Subnet Mask:</strong> 255.255.0.0 (/16)</li>
                <li><strong className="text-slate-700">Network/Host bits:</strong> 16 bits net, 16 bits host</li>
                <li><strong className="text-slate-700">Usable Networks:</strong> 16,384</li>
                <li><strong className="text-slate-700">Usable Hosts:</strong> 65,534 hosts per network</li>
                <li><strong className="text-slate-700">Purpose:</strong> Medium to large enterprise networks.</li>
              </ul>
            </div>

            {/* Class C */}
            <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-2 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-base font-black text-purple-600">Class C</span>
                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[9px] font-mono font-bold border border-purple-100">192.0.0.0 - 223.255.255.255</span>
              </div>
              <ul className="space-y-1.5 text-slate-650 pt-2 font-medium">
                <li><strong className="text-slate-700">First Octet range:</strong> 192 - 223</li>
                <li><strong className="text-slate-700">Leading Bits:</strong> <code>110</code> (starts with binary 110)</li>
                <li><strong className="text-slate-700">Default Subnet Mask:</strong> 255.255.255.0 (/24)</li>
                <li><strong className="text-slate-700">Network/Host bits:</strong> 24 bits net, 8 bits host</li>
                <li><strong className="text-slate-700">Usable Networks:</strong> 2,097,152</li>
                <li><strong className="text-slate-700">Usable Hosts:</strong> 254 hosts per network</li>
                <li><strong className="text-slate-700">Purpose:</strong> Small business and home networks.</li>
              </ul>
            </div>

            {/* Class D */}
            <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-2 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-base font-black text-amber-600">Class D</span>
                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[9px] font-mono font-bold border border-amber-100">224.0.0.0 - 239.255.255.255</span>
              </div>
              <ul className="space-y-1.5 text-slate-650 pt-2 font-medium">
                <li><strong className="text-slate-700">First Octet range:</strong> 224 - 239</li>
                <li><strong className="text-slate-700">Leading Bits:</strong> <code>1110</code></li>
                <li><strong className="text-slate-700">Default Subnet Mask:</strong> None (No subnet mask)</li>
                <li><strong className="text-slate-700">Usable Hosts:</strong> N/A (Not assigned to individual hosts)</li>
                <li><strong className="text-slate-700">Purpose:</strong> **IP Multicasting** (delivering one data stream to multiple destinations simultaneously).</li>
              </ul>
            </div>

            {/* Class E */}
            <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-2 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-base font-black text-rose-600">Class E</span>
                <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[9px] font-mono font-bold border border-rose-100">240.0.0.0 - 255.255.255.255</span>
              </div>
              <ul className="space-y-1.5 text-slate-650 pt-2 font-medium">
                <li><strong className="text-slate-700">First Octet range:</strong> 240 - 255</li>
                <li><strong className="text-slate-700">Leading Bits:</strong> <code>1111</code></li>
                <li><strong className="text-slate-700">Default Subnet Mask:</strong> None</li>
                <li><strong className="text-slate-700">Purpose:</strong> Reserved for experimental, research, and future military/scientific capabilities. Includes the all-ones local broadcast address (`255.255.255.255`).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 2. Formulas Section */}
      {subTab === 'formulas' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">
              CIDR Subnetting Math Formulas
            </h3>
            <p className="text-xs text-slate-600">
              Below are the standard boolean algebra and binary formulas used by routers and the platform core to compute address boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            {/* Mask Calculation */}
            <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-2 shadow-sm">
              <h4 className="font-bold text-slate-800">1. Subnet Mask from Prefix (P)</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed font-semibold">
                Toggles the first $P$ bits of a 32-bit word to binary 1, and the remaining bits to binary 0.
              </p>
              <pre className="bg-slate-50 border border-slate-200 p-2.5 rounded text-[10px] text-blue-600 font-mono mt-2 font-bold">
                Mask = (~0 &lt;&lt; (32 - Prefix)) &gt;&gt;&gt; 0
              </pre>
            </div>

            {/* Wildcard Mask */}
            <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-2 shadow-sm">
              <h4 className="font-bold text-slate-800">2. Wildcard Mask</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed font-semibold">
                The bitwise inverse (NOT) of the Subnet Mask. Represents the size of the host scope.
              </p>
              <pre className="bg-slate-50 border border-slate-200 p-2.5 rounded text-[10px] text-blue-600 font-mono mt-2 font-bold">
                Wildcard = ~SubnetMask &gt;&gt;&gt; 0
              </pre>
            </div>

            {/* Network Address */}
            <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-2 shadow-sm">
              <h4 className="font-bold text-slate-800">3. Network Address (Base IP)</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed font-semibold">
                Bitwise AND of any host IP address and the Subnet Mask.
              </p>
              <pre className="bg-slate-50 border border-slate-200 p-2.5 rounded text-[10px] text-blue-600 font-mono mt-2 font-bold">
                NetworkAddress = IP Address &amp; SubnetMask
              </pre>
            </div>

            {/* Broadcast Address */}
            <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-2 shadow-sm">
              <h4 className="font-bold text-slate-800">4. Broadcast Address</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed font-semibold">
                Bitwise OR of the Network Address and the Wildcard Mask.
              </p>
              <pre className="bg-slate-50 border border-slate-200 p-2.5 rounded text-[10px] text-blue-600 font-mono mt-2 font-bold">
                Broadcast = NetworkAddress | WildcardMask
              </pre>
            </div>

            {/* Usable Hosts */}
            <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-2 shadow-sm">
              <h4 className="font-bold text-slate-800">5. Usable Host Capacity</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed font-semibold">
                The total host combinations minus reserved configurations (2^(32 - P) total combinations).
              </p>
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded text-[10px] text-blue-600 font-mono mt-2 space-y-1 font-bold">
                <div>Standard rules: Usable = 2^(32 - Prefix) - 2</div>
                <div>AWS Cloud rules: Usable = 2^(32 - Prefix) - 5</div>
              </div>
            </div>

            {/* Equal subnetting */}
            <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-2 shadow-sm">
              <h4 className="font-bold text-slate-800">6. Equal Subnetting Bits</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed font-semibold">
                To split a parent prefix $P$ into $S$ equal-sized subnets, the extra bits needed $k$ is:
              </p>
              <pre className="bg-slate-50 border border-slate-200 p-2.5 rounded text-[10px] text-blue-600 font-mono mt-2 font-bold">
                NewPrefix (P') = P + ceil(log2(S))
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 3. Detailed Walkthrough Examples Section */}
      {subTab === 'examples' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">
              Step-by-Step Calculation Walkthrough
            </h3>
            <p className="text-xs text-slate-600">
              Let's analyze exactly how a router evaluates the CIDR Block: <strong className="text-blue-600">192.168.10.20/27</strong>.
            </p>
          </div>

          <div className="glass-panel rounded-lg p-5 space-y-4 text-xs leading-relaxed text-slate-700">
            {/* Step 1 */}
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono border border-blue-150">Step 1</span>
                Convert IP Address to Binary
              </h4>
              <p className="mb-2 font-medium">
                Convert each octet of `192.168.10.20` into an 8-bit binary word:
              </p>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded font-mono text-[11px] text-slate-700 space-y-1 font-semibold">
                <div>192 = 11000000</div>
                <div>168 = 10101000</div>
                <div>10  = 00001010</div>
                <div>20  = 00010100</div>
                <div className="text-blue-600 font-bold border-t border-slate-250 pt-1 mt-1">
                  IP Binary = 11000000.10101000.00001010.00010100
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono border border-blue-150">Step 2</span>
                Derive the Subnet Mask
              </h4>
              <p className="mb-2 font-medium">
                A `/27` prefix means the first 27 bits are set to binary `1`, and the remaining 5 bits are set to `0`:
              </p>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded font-mono text-[11px] text-slate-700 font-semibold">
                <div>Mask Binary = 11111111.11111111.11111111.11100000</div>
                <div className="text-blue-600 font-bold border-t border-slate-250 pt-1 mt-1">
                  Convert to Decimal = 255.255.255.224
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono border border-blue-150">Step 3</span>
                Compute the Network Address (Bitwise AND)
              </h4>
              <p className="mb-2 font-medium">
                Align the IP binary and Mask binary, then apply the bitwise AND operator (only 1 &amp; 1 yields 1):
              </p>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded font-mono text-[11px] text-slate-700 space-y-1 font-semibold">
                <div>IP:   11000000.10101000.00001010.00010100 (192.168.10.20)</div>
                <div>MASK: 11111111.11111111.11111111.11100000 (255.255.255.224)</div>
                <div className="text-emerald-700 font-bold border-t border-slate-250 pt-1 mt-1">
                  NET:  11000000.10101000.00001010.00000000 (192.168.10.0)
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-500 font-semibold">
                Notice the last 5 host bits are zeroed out completely. The network base is **192.168.10.0**.
              </p>
            </div>

            {/* Step 4 */}
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono border border-blue-150">Step 4</span>
                Compute the Broadcast Address (Bitwise OR with Wildcard)
              </h4>
              <p className="mb-2 font-medium">
                The wildcard mask is the inverse of the subnet mask: `00000000.00000000.00000000.00011111` (decimal `0.0.0.31`).
                Apply bitwise OR between Network address and Wildcard:
              </p>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded font-mono text-[11px] text-slate-700 space-y-1 font-semibold">
                <div>NET:  11000000.10101000.00001010.00000000 (192.168.10.0)</div>
                <div>WLD:  00000000.00000000.00000000.00011111 (0.0.0.31)</div>
                <div className="text-rose-600 font-bold border-t border-slate-250 pt-1 mt-1">
                  BRD:  11000000.10101000.00001010.00011111 (192.168.10.31)
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-500 font-semibold">
                Notice all 5 host bits are set to binary 1. The broadcast IP is **192.168.10.31**.
              </p>
            </div>

            {/* Step 5 */}
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono border border-blue-150">Step 5</span>
                Identify Usable Hosts Range
              </h4>
              <p className="mb-1 font-medium">
                - **Network Base** `192.168.10.0` is unusable (reserved for network identification).
                - **Broadcast IP** `192.168.10.31` is unusable (reserved for broadcasting packets).
              </p>
              <p className="mb-2 font-medium">
                Therefore, the usable hosts sit between these two boundaries:
              </p>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded font-mono text-[11px] text-slate-700 flex items-center gap-2 font-semibold">
                <span className="text-emerald-700 font-bold">First Host: 192.168.10.1</span>
                <span className="text-slate-400 font-black">»</span>
                <span className="text-emerald-700 font-bold">Last Host: 192.168.10.30</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-500 font-semibold">
                Total host capacity: 2^(32 - 27) - 2 = 2^5 - 2 = 32 - 2 = 30 usable hosts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Subnetting Quiz Section */}
      {subTab === 'quiz' && <SubnetPracticeQuiz />}

      <BitwiseAndAnimator />
    </div>
  );
};
