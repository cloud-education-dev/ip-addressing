import React from 'react';

export type EducationTopic = 'ip' | 'cidr' | 'subnet' | 'vlsm' | 'supernet' | 'vpc' | 'firewall' | 'ipam';

interface EducationContent {
  title: string;
  what: string;
  why: string;
  realWorld: string;
  awsEq: string;
  ciscoEq: string;
  linuxEq: string;
  mistakes: string[];
  practices: string[];
  questions: { q: string; a: string }[];
}

const TOPICS_CONTENT: Record<EducationTopic, EducationContent> = {
  ip: {
    title: "IP Addressing (IPv4 & IPv6)",
    what: "An Internet Protocol (IP) address is a numerical label assigned to each device connected to a computer network that uses the Internet Protocol for communication.",
    why: "It serves two principal functions: host or network interface identification and location addressing.",
    realWorld: "Like mailing addresses for houses, every device on the internet requires a unique address so routing systems know where to forward data packets.",
    awsEq: "AWS Elastic IP (EIP) represents static, public IPv4 addresses, while Primary and Secondary Private IPs are assigned to Elastic Network Interfaces (ENIs).",
    ciscoEq: "Configure interface IP:\n`Router(config-if)# ip address 192.168.1.1 255.255.255.0`",
    linuxEq: "Add address to interface:\n`ip addr add 192.168.1.1/24 dev eth0`",
    mistakes: [
      "Confusing Usable Hosts with Total IPs: For standard IPv4 subnets, the first IP (Network) and last IP (Broadcast) are unusable by host devices.",
      "Assigning loopback or reserved range addresses (like 127.0.0.1 or 169.254.x.x) to public interfaces."
    ],
    practices: [
      "Use RFC 1918 private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) for internal corporate systems.",
      "Transition to IPv6 (using Unique Local Addresses fc00::/7) to solve IPv4 address exhaustion."
    ],
    questions: [
      { q: "What is the difference between public and private IP addresses?", a: "Private IPs are designated for internal networks (RFC 1918) and are non-routable on the public internet. Public IPs are globally unique and routable across the worldwide web." },
      { q: "What is the function of the loopback address (127.0.0.1)?", a: "It is used by a host to send network traffic to itself, bypassing external network hardware, primarily for testing local network services." }
    ]
  },
  cidr: {
    title: "CIDR (Classless Inter-Domain Routing)",
    what: "CIDR replaced class-based IP routing. It introduces a prefix length notation (e.g. /24) indicating how many bits of the address represent the network portion.",
    why: "It slows down IPv4 address exhaustion and prevents massive route-table bloat in internet routers by allowing flexible subnet boundaries.",
    realWorld: "A /24 network offers 256 IPs, while a /27 network offers 32 IPs. CIDR lets ISPs carve out exact network sizes rather than giving away standard class sizes (like 16.7M for Class A).",
    awsEq: "When creating an AWS VPC, you must specify a CIDR block (e.g. `10.0.0.0/16`), which is then carved into smaller subnet CIDRs (e.g. `10.0.1.0/24`).",
    ciscoEq: "Define classless routing behaviors:\n`Router(config)# ip classless`",
    linuxEq: "Establish prefix routing tables:\n`ip route add 192.168.10.0/24 via 192.168.1.1`",
    mistakes: [
      "Assuming /31 subnet offers usable host addresses (it actually represents point-to-point links; some modern routers support RFC 3021, but legacy systems fail).",
      "Overlapping CIDR allocations, causing packet collisions and routing confusion."
    ],
    practices: [
      "Size VPC blocks generously (e.g., /16) to allow plenty of subnet divisions later.",
      "Align subnets to clean byte/bit boundaries to make route table summarization easier."
    ],
    questions: [
      { q: "How many usable hosts are in a /28 IPv4 subnet?", a: "A /28 subnet has 32 - 28 = 4 host bits. 2^4 = 16 total IPs. Subtracting network and broadcast addresses leaves 14 usable hosts." },
      { q: "What is a wildcard mask?", a: "It is the bitwise complement of the subnet mask, used in Cisco ACLs. In a wildcard mask, 0s mean 'match exactly' and 1s mean 'ignore'." }
    ]
  },
  subnet: {
    title: "Subnetting (Equal Splits)",
    what: "Subnetting is the practice of dividing a large parent network into multiple smaller, logically isolated subnetworks.",
    why: "It controls broadcast traffic (splits broadcast domains), increases security boundaries, and enhances routing efficiency.",
    realWorld: "Organizations create separate subnets for departments (Finance, Engineering, HR) so traffic is localized and doesn't pollute the entire network.",
    awsEq: "AWS Subnets represent isolated zones within VPCs. Standard subnets split VPC CIDR space equally across Availability Zones.",
    ciscoEq: "Standard interface configurations:\n`Router(config-if)# ip address 10.0.64.1 255.255.192.0`",
    linuxEq: "Create nested network interfaces:\n`vconfig add eth0 100` (VLAN partitioning)",
    mistakes: [
      "Splitting subnets too small, resulting in IP exhaustion during scaling periods.",
      "Forgetting that AWS reserves 5 IP addresses in each subnet, rather than the standard 2."
    ],
    practices: [
      "Always design subnets with room for at least 50% future host growth.",
      "Reserve one subnet range in each zone exclusively for management/troubleshooting."
    ],
    questions: [
      { q: "Why does AWS reserve 5 IP addresses in a subnet?", a: "AWS reserves: .0 (Network), .1 (VPC Router/Gateway), .2 (DNS Server), .3 (Future capabilities), and .255 (Broadcast)." },
      { q: "What is a broadcast domain?", a: "A logical division of a computer network in which all nodes can reach each other by broadcast at the data link layer." }
    ]
  },
  vlsm: {
    title: "VLSM (Variable Length Subnet Masking)",
    what: "VLSM is subnetting subnets. It allows using different subnet masks for different subnetworks within the same parent space.",
    why: "It maximizes IP address efficiency by tailoring network sizes to the specific host requirements of each department or connection.",
    realWorld: "Instead of giving 256 IPs to a WAN serial link that only needs 2 IPs (a massive waste), VLSM allocates a /30 to the WAN and /25 to a large department office.",
    awsEq: "Designing different-sized private/public/database subnets in AWS (e.g. allocating /24 for public web servers and /28 for database clusters).",
    ciscoEq: "Classless routing protocols (OSPF, EIGRP, RIPv2) must be enabled to transmit VLSM subnets:\n`Router(config-router)# network 10.0.0.0`",
    linuxEq: "Set up multi-sized local routing bridges:\n`ip route add 192.168.1.128/28 dev br0`",
    mistakes: [
      "Allocating small subnets first: You must always allocate subnets from largest host requirement to smallest, otherwise alignment rules cause overlaps.",
      "Overlapping CIDR blocks due to mathematical rounding errors."
    ],
    practices: [
      "Always sort host requirements in descending order before computing VLSM subnets.",
      "Include a cushion of future hosts in the initial input requirements."
    ],
    questions: [
      { q: "Why must VLSM requirements be sorted in descending order of size?", a: "Sorting descending ensures that large subnets are allocated first on their clean power-of-two boundaries, preventing them from overlapping with smaller subnets." },
      { q: "What is subnet wastage in VLSM?", a: "Wastage occurs because host blocks are allocated in powers of two. If you need 17 hosts, you must allocate a /27 (32 IPs), wasting 13 host IPs." }
    ]
  },
  supernet: {
    title: "Supernetting & Route Summarization",
    what: "Supernetting combines multiple continuous classless IP subnets into a single, larger network block with a shorter prefix.",
    why: "It reduces the size of routing tables. Instead of advertising 8 separate routes, a router advertises one summary route, reducing RAM/CPU load.",
    realWorld: "Core internet routers carry over 1 million routes. Without route aggregation, routing tables would grow exponentially, crashes would occur, and lookup latency would spike.",
    awsEq: "AWS Transit Gateway route tables use route summarization to route transit traffic between dozens of VPCs with minimal route rule limits.",
    ciscoEq: "Summarize routes in OSPF area boundary:\n`Router(config-router)# area 0 range 192.168.8.0 255.255.248.0`",
    linuxEq: "Aggregated routes forwarding:\n`ip route add 192.168.8.0/21 via 10.0.0.1`",
    mistakes: [
      "Summarizing non-contiguous blocks: This will direct traffic destined for networks you don't own to your router, creating black holes or loops.",
      "Over-summarizing, which overlaps onto valid ranges belonging to other routers."
    ],
    practices: [
      "Only aggregate routes that share the same next-hop router destination.",
      "Keep network topologies hierarchical to facilitate natural boundary aggregations."
    ],
    questions: [
      { q: "What is route aggregation?", a: "The process of combining multiple IP routing prefixes into a single routing entry, minimizing route advertisement overhead." },
      { q: "How do you check if networks are contiguous?", a: "Networks are contiguous if their address ranges sit adjacent to one another without gaps, allowing them to merge on a binary boundary." }
    ]
  },
  vpc: {
    title: "AWS VPC Networking",
    what: "Amazon Virtual Private Cloud (VPC) lets you provision a logically isolated section of the AWS Cloud where you can launch resources in a virtual network.",
    why: "It gives you complete control over your virtual networking environment, including selection of IP ranges, subnets, route tables, and gateways.",
    realWorld: "Like building a private datacenter in the cloud, VPC defines the software-defined routing perimeter for all your cloud compute, databases, and load balancers.",
    awsEq: "The fundamental unit of cloud infrastructure. Contains subnets, NAT gateways, Route Tables, Internet Gateways, etc.",
    ciscoEq: "Equivalent to Cisco VRF (Virtual Routing and Forwarding) combined with VLANs and inter-VLAN routing sub-interfaces.",
    linuxEq: "Creating isolated networks via Linux namespaces:\n`ip netns add tenant-vpc`",
    mistakes: [
      "Creating overlapping VPC CIDRs across accounts, making future VPC Peering or Transit Gateway connections impossible.",
      "Putting database servers in public subnets with direct routes to the Internet Gateway."
    ],
    practices: [
      "Use 10.x.x.x private scopes for large enterprises to avoid overlapping third-party networks.",
      "Always deploy subnets in pairs across multiple Availability Zones (AZs) for high availability."
    ],
    questions: [
      { q: "What is the difference between public and private subnets in AWS?", a: "A public subnet has a route in its Route Table directing external traffic (0.0.0.0/0) to an Internet Gateway (IGW). A private subnet routes outbound internet traffic through a NAT Gateway." },
      { q: "What is a Transit Gateway (TGW)?", a: "A network transit hub that connects VPCs, VPN connections, and AWS Direct Connect links, simplifying multi-VPC routing topologies." }
    ]
  },
  firewall: {
    title: "Security Groups vs. Network ACLs",
    what: "Security Groups act as virtual firewalls for instances (at the ENI level), while Network ACLs are firewalls at the subnet boundary level.",
    why: "They provide defense-in-depth: NACLs guard the subnet borders while SGs protect individual resources.",
    realWorld: "NACLs block bad actors or entire CIDRs (blacklisting), while SGs allow traffic from specific application servers (whitelisting/micro-segmentation).",
    awsEq: "Security Groups are stateful (returns allowed automatically); NACLs are stateless (rules must be written for inbound AND outbound).",
    ciscoEq: "NACL is equivalent to Cisco Router ACLs (`access-list`). Security Group is equivalent to Cisco ASA Stateful inspection or Security Group Tags.",
    linuxEq: "NACL: `iptables` rules without state modules. SG: `iptables` with connection tracking: `-m state --state ESTABLISHED,RELATED -j ACCEPT`.",
    mistakes: [
      "Forgetting return traffic in NACLs: Since NACLs are stateless, if you allow Port 80 Inbound, you must also allow ephemeral ports Outbound (1024-65535).",
      "Treating Security Groups as stateless, writing redundant return rules."
    ],
    practices: [
      "Keep Security Groups focused on application roles (e.g. web-sg, db-sg) and reference SGs by ID rather than CIDRs.",
      "Use NACLs sparingly for coarse blocklist rules, relying on Security Groups for refined stateful controls."
    ],
    questions: [
      { q: "What does it mean that Security Groups are stateful?", a: "If you send an outbound request from your instance, the return traffic for that request is automatically allowed to flow back in, regardless of inbound SG rules." },
      { q: "How are NACL rules evaluated?", a: "NACL rules are processed in numerical order starting with the lowest rule number. Once a rule matches, evaluation stops and the action (ALLOW/DENY) is executed." }
    ]
  },
  ipam: {
    title: "IPAM (IP Address Management)",
    what: "IPAM is a suite of tools to plan, track, allocate, and manage the IP address space used in a network.",
    why: "It prevents IP duplication conflicts, tracks usage trends, automates DNS assignments, and simplifies auditing for corporate networks.",
    realWorld: "Without IPAM, network administrators track IPs on messy spreadsheets, leading to duplicate assignments, routing crashes, and long deployment delays.",
    awsEq: "AWS VPC IPAM automatically allocates non-overlapping CIDRs to VPCs across regions based on organizational pools.",
    ciscoEq: "Cisco Prime IPAM or integration with active DHCP/DNS systems to sync subnet scopes.",
    linuxEq: "Managing DHCP allocation pools in `dnsmasq` or `dhcpd.conf` files.",
    mistakes: [
      "Relying on spreadsheets for large IP inventories, which quickly become outdated and lead to double-allocations.",
      "Failing to monitor IP pool utilization thresholds, causing application failures when subnets run dry."
    ],
    practices: [
      "Centralize IPAM within a master cloud account to govern multiple environments.",
      "Establish alerts when subnet availability drops below 20% capacity."
    ],
    questions: [
      { q: "What is an IP conflict?", a: "An IP conflict occurs when two devices on the same physical or logical network are assigned the same IP address, causing communication failures for one or both devices." },
      { q: "What is the role of DHCP in IPAM?", a: "DHCP dynamically leases IP addresses to client devices from defined pools, automatically updating IPAM inventory systems with active leases." }
    ]
  }
};

export const EducationSidebar: React.FC<{ topic: EducationTopic }> = ({ topic }) => {
  const content = TOPICS_CONTENT[topic];

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 space-y-5 text-sm bg-slate-50 text-slate-700">
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-base font-bold text-slate-800">{content.title}</h2>
      </div>

      <div>
        <h3 className="font-bold text-blue-650 mb-1">
          What is it?
        </h3>
        <p className="text-slate-600 leading-relaxed text-xs">{content.what}</p>
      </div>

      <div>
        <h3 className="font-bold text-emerald-700 mb-1">
          Why do we use it?
        </h3>
        <p className="text-slate-600 leading-relaxed text-xs">{content.why}</p>
      </div>

      <div>
        <h4 className="font-bold text-slate-850 text-xs uppercase tracking-wide">Real-World Analogy</h4>
        <p className="text-slate-500 text-xs italic mt-0.5">"{content.realWorld}"</p>
      </div>

      <div className="border-t border-slate-200 pt-4 space-y-3">
        <h3 className="font-bold text-slate-800 text-xs">
          Technology Equivalents
        </h3>
        
        <div className="space-y-2 bg-white p-2.5 rounded border border-slate-200 text-[11px] shadow-sm">
          <div>
            <span className="text-purple-650 font-bold">AWS Platform:</span>
            <p className="text-slate-650 mt-0.5 font-medium">{content.awsEq}</p>
          </div>
          <div>
            <span className="text-orange-700 font-bold">Cisco Configuration:</span>
            <pre className="text-slate-750 bg-slate-50 border border-slate-200 p-1.5 rounded mt-1 overflow-x-auto font-mono text-[10px] font-semibold">
              {content.ciscoEq}
            </pre>
          </div>
          <div>
            <span className="text-sky-650 font-bold">Linux Namespace Command:</span>
            <pre className="text-slate-750 bg-slate-50 border border-slate-200 p-1.5 rounded mt-1 overflow-x-auto font-mono text-[10px] font-semibold">
              {content.linuxEq}
            </pre>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4 space-y-3">
        <h3 className="font-bold text-rose-700 text-xs">
          Common Mistakes
        </h3>
        <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-650 font-medium">
          {content.mistakes.map((m, idx) => (
            <li key={idx}><span className="text-rose-600 font-bold">{m.split(':')[0]}:</span>{m.split(':')[1]}</li>
          ))}
        </ul>
      </div>

      <div className="border-t border-slate-200 pt-4 space-y-3">
        <h3 className="font-bold text-emerald-700 text-xs">
          Best Practices
        </h3>
        <ul className="list-disc pl-4 space-y-1 text-xs text-slate-650 font-medium font-semibold">
          {content.practices.map((p, idx) => (
            <li key={idx}>{p}</li>
          ))}
        </ul>
      </div>

      <div className="border-t border-slate-200 pt-4 space-y-3">
        <h3 className="font-bold text-blue-650 text-xs">
          Interview Questions
        </h3>
        <div className="space-y-3">
          {content.questions.map((q, idx) => (
            <div key={idx} className="bg-white p-2.5 rounded border border-slate-200 shadow-sm font-medium">
              <span className="font-bold text-slate-800 text-xs">Q: {q.q}</span>
              <p className="text-slate-600 text-xs mt-1 leading-relaxed">A: {q.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
