import React, { useState } from 'react';

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
}

export const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'ai', text: "Hello! I am your IP Intelligence AI Assistant. I can help you compute subnet plans, explain routing protocols, troubleshoot firewall issues, and create practice networking labs. Ask me anything!" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const samplePrompts = [
    "Design a subnet plan for IT (50 hosts) and Admin (15 hosts)",
    "Explain Longest Prefix Match routing",
    "Give me 3 practice interview questions on CIDR"
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let responseText = '';
      const promptLower = text.toLowerCase();

      if (promptLower.includes('design') || promptLower.includes('subnet plan')) {
        responseText = `### Subnet Allocation Plan (VLSM calculation)
Parent network: **192.168.10.0/24** (256 IP Addresses)

| Department | Required Hosts | Subnet Allocated | Usable IP Range | Subnet Mask | Gateway | Waste % |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **IT Department** | 50 | \`192.168.10.0/26\` | \`192.168.10.1 - 10.62\` | \`255.255.255.192\` | \`192.168.10.1\` | 19.3% |
| **Admin Team** | 15 | \`192.168.10.64/27\` | \`192.168.10.65 - 10.94\` | \`255.255.255.224\` | \`192.168.10.65\` | 46.8% |

**Remaining Space:** \`192.168.10.96/27\`, \`192.168.10.128/25\` available for future scaling.`;
      } else if (promptLower.includes('longest') || promptLower.includes('prefix match') || promptLower.includes('lpm')) {
        responseText = `### Longest Prefix Match (LPM) routing
Longest Prefix Match is an algorithm used by IP routers to select an entry from a routing table.

Because routing table entries can represent overlapping blocks (e.g., a default route \`0.0.0.0/0\` vs a local subnet route \`10.0.0.0/16\` vs a specific host route \`10.0.1.5/32\`), the router must decide which route is the best fit.

#### Selection Rules:
1. Compare destination IP with all route targets using bitwise AND.
2. Select the route that has the **longest prefix length** (most bits matched).
3. If prefix length is equal, choose the route with the highest priority (lowest administrative metric).

**Example:**
Destination IP: \`10.0.1.15\`
Available routes:
- Route A: \`10.0.0.0/16\` (16 matched bits)
- Route B: \`10.0.1.0/24\` (24 matched bits) - **Selected! (Longer Prefix)**`;
      } else if (promptLower.includes('interview') || promptLower.includes('question') || promptLower.includes('practice')) {
        responseText = `### CIDR & IP Addressing Interview Questions

1. **Q: Why does AWS reserve 5 IP addresses in each subnet instead of the standard 2?**
   * *A:* AWS reserves the first 4 IPs and the last IP in each subnet block. Specifically: .0 (Network address), .1 (VPC Router/Gateway), .2 (DNS Server), .3 (Future capabilities), and .255 (Broadcast address).

2. **Q: How does stateful security groups differ from stateless NACLs?**
   * *A:* Security Groups are stateful; if you open an inbound port, return outbound traffic is automatically permitted. NACLs are stateless; rules must be explicitly added for both inbound and outbound pathways, including ephemeral ports.

3. **Q: What is the purpose of a Wildcard Mask?**
   * *A:* A wildcard mask (used in Cisco ACLs) is the bitwise complement of the subnet mask. Binary 0s indicate the corresponding bit must match exactly, while binary 1s indicate the bit value is ignored.`;
      } else {
        responseText = `I can help you design networks, compute CIDR scopes, configure stateful security groups, or outline NestJS / Next.js code structures. Try selecting one of the shortcut buttons above or ask for:
- "Design a subnet plan for IT"
- "Explain Longest Prefix Match"
- "Create interview questions on CIDR"`;
      }

      setMessages(prev => [...prev, { sender: 'ai', text: responseText }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Explanation Box */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-800">AI Assistant</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-700">What is this?</p>
            <p>An interactive AI network assistant configured to answer domain questions and build custom subnets.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">What is the use?</p>
            <p>To dynamically explain concepts, solve complex routing challenges, and generate custom template scripts.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">When to use?</p>
            <p>When you need step-by-step guidance, CCNA practice questions, or custom script design guidance.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">How the calculations happen? (Simple Arithmetic)</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>It analyzes your textual keywords.</li>
              <li>Then it retrieves and presents calculated templates, routing summaries, or Q&A blocks based on standard networking equations.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-lg flex flex-col h-[500px] border-slate-200">
        
        {/* Assistant Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xs font-bold text-slate-850">
              IP Intel AI Copilot
            </h3>
            <span className="text-[9px] text-emerald-600 font-bold">Online & Ready</span>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-white">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'ai' && (
                <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-600 font-bold shrink-0 text-[10px]">
                  AI
                </div>
              )}
              <div className={`p-3 rounded-lg max-w-[80%] leading-relaxed ${
                m.sender === 'user' 
                  ? 'bg-blue-650 text-white font-medium rounded-br-none bg-blue-600' 
                  : 'bg-slate-50 border border-slate-200 text-slate-700 rounded-bl-none prose'
              }`}>
                <div className="whitespace-pre-wrap select-text">{m.text}</div>
              </div>
              {m.sender === 'user' && (
                <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold shrink-0 text-[10px]">
                  ME
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-600 font-bold shrink-0 text-[10px]">
                AI
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-400 font-mono text-[10px] flex items-center gap-1.5">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce delay-100">●</span>
                <span className="animate-bounce delay-200">●</span>
              </div>
            </div>
          )}
        </div>

        {/* Shortcuts */}
        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50/50 flex flex-wrap gap-1.5 shrink-0 select-none">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 px-2.5 py-1 rounded text-[9px] font-semibold transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/20 shrink-0 bg-white">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              placeholder="Ask AI Copilot for network calculations or labs..."
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
            >
              Send
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
