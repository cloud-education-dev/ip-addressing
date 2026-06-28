import { 
  analyzeIp, 
  analyzeCidr, 
  calculateEqualSubnets, 
  calculateVlsm, 
  calculateSupernet, 
  simulatePacketFlow,
  Packet,
  SimNode,
  SimEdge,
  RouteTable,
  Nacl,
  SecurityGroup
} from './index';

describe('IP Address Analysis', () => {
  test('Analyze IPv4 Localhost Loopback', () => {
    const res = analyzeIp('127.0.0.1');
    expect(res.version).toBe(4);
    expect(res.addressType).toBe('Loopback');
    expect(res.isPrivate).toBe(false);
    expect(res.isUsable).toBe(false);
    expect(res.class).toBe('A');
  });

  test('Analyze IPv4 Private Range RFC1918', () => {
    const res = analyzeIp('192.168.10.20');
    expect(res.version).toBe(4);
    expect(res.addressType).toBe('Private Unicast');
    expect(res.isPrivate).toBe(true);
    expect(res.isUsable).toBe(true);
    expect(res.class).toBe('C');
  });

  test('Analyze IPv6 Loopback', () => {
    const res = analyzeIp('::1');
    expect(res.version).toBe(6);
    expect(res.addressType).toBe('Loopback');
    expect(res.isUsable).toBe(false);
  });
});

describe('CIDR Calculations', () => {
  test('Subnet CIDR properties for 192.168.10.20/27', () => {
    const res = analyzeCidr('192.168.10.20/27');
    expect(res.networkAddress).toBe('192.168.10.0');
    expect(res.broadcastAddress).toBe('192.168.10.31');
    expect(res.subnetMask).toBe('255.255.255.224');
    expect(res.totalAddresses).toBe('32');
    expect(res.usableAddresses).toBe('30');
    expect(res.firstHost).toBe('192.168.10.1');
    expect(res.lastHost).toBe('192.168.10.30');
  });
});

describe('Equal Subnetting splits', () => {
  test('Split 10.0.0.0/16 into 4 equal subnets', () => {
    const res = calculateEqualSubnets({
      parentCidr: '10.0.0.0/16',
      subnetCount: 4
    });
    expect(res.totalSubnetsCreated).toBe(4);
    expect(res.newPrefix).toBe(18);
    expect(res.subnets[0].cidr).toBe('10.0.0.0/18');
    expect(res.subnets[1].cidr).toBe('10.0.64.0/18');
    expect(res.subnets[2].cidr).toBe('10.0.128.0/18');
    expect(res.subnets[3].cidr).toBe('10.0.192.0/18');
  });
});

describe('VLSM calculation algorithms', () => {
  test('Allocate subnets of sizes: IT(120 hosts), Admin(30 hosts) within 192.168.1.0/24', () => {
    const reqs = [
      { name: 'IT', requiredHosts: 120 },
      { name: 'Admin', requiredHosts: 30 }
    ];
    const res = calculateVlsm('192.168.1.0/24', reqs);
    expect(res.allocations.length).toBe(2);
    // IT gets size of 128 hosts, Admin gets size of 32 hosts
    expect(res.allocations[0].name).toBe('IT');
    expect(res.allocations[0].allocatedCidr).toBe('192.168.1.0/25'); // 128 total
    expect(res.allocations[1].name).toBe('Admin');
    expect(res.allocations[1].allocatedCidr).toBe('192.168.1.128/27'); // 32 total
  });
});

describe('Supernet Aggregate Summarization', () => {
  test('Summarize four continuous subnets', () => {
    const inputs = [
      '192.168.8.0/24',
      '192.168.9.0/24',
      '192.168.10.0/24',
      '192.168.11.0/24'
    ];
    const res = calculateSupernet(inputs);
    expect(res.summaryRoute).toBe('192.168.8.0/22');
  });
});

describe('Network Simulators Flow Engine', () => {
  const nodes: SimNode[] = [
    { id: 'ec2-src', name: 'Instance-A', type: 'EC2_INSTANCE', ip: '10.0.1.10', subnetId: 'sub-a', securityGroupId: 'sg-ok' },
    { id: 'sub-a', name: 'Subnet-A', type: 'SUBNET', cidrBlock: '10.0.1.0/24', routeTableId: 'rt-main', naclId: 'nacl-ok' },
    { id: 'sub-b', name: 'Subnet-B', type: 'SUBNET', cidrBlock: '10.0.2.0/24', routeTableId: 'rt-main', naclId: 'nacl-ok' },
    { id: 'ec2-dst', name: 'Instance-B', type: 'EC2_INSTANCE', ip: '10.0.2.20', subnetId: 'sub-b', securityGroupId: 'sg-ok' }
  ];

  const edges: SimEdge[] = [];

  const routeTables: Record<string, RouteTable> = {
    'rt-main': {
      id: 'rt-main',
      name: 'Main Route Table',
      routes: [
        { destination: '10.0.0.0/16', target: 'local' }
      ]
    }
  };

  const nacls: Record<string, Nacl> = {
    'nacl-ok': {
      id: 'nacl-ok',
      name: 'Allow-All NACL',
      rules: [
        { ruleNumber: 100, isIngress: true, protocol: 'ALL', portRange: 'ALL', cidrBlock: '0.0.0.0/0', action: 'ALLOW' },
        { ruleNumber: 100, isIngress: false, protocol: 'ALL', portRange: 'ALL', cidrBlock: '0.0.0.0/0', action: 'ALLOW' }
      ]
    }
  };

  const securityGroups: Record<string, SecurityGroup> = {
    'sg-ok': {
      id: 'sg-ok',
      name: 'Web SG',
      rules: [
        { isIngress: true, protocol: 'TCP', portRange: '80', cidrBlock: '0.0.0.0/0' },
        { isIngress: false, protocol: 'ALL', portRange: 'ALL', cidrBlock: '0.0.0.0/0' }
      ]
    }
  };

  test('Successful packet delivery inside VPC', () => {
    const packet: Packet = {
      srcIp: '10.0.1.10',
      dstIp: '10.0.2.20',
      protocol: 'TCP',
      srcPort: 53120,
      dstPort: 80
    };

    const res = simulatePacketFlow({
      nodes,
      edges,
      routeTables,
      nacls,
      securityGroups,
      packet
    });

    expect(res.status).toBe('SUCCESS');
    expect(res.trace.length).toBeGreaterThan(0);
    expect(res.trace[res.trace.length - 1].actionTaken).toBe('DELIVERED');
  });

  test('Fails if Security Group blocks Inbound TCP port 22', () => {
    const packet: Packet = {
      srcIp: '10.0.1.10',
      dstIp: '10.0.2.20',
      protocol: 'TCP',
      srcPort: 53120,
      dstPort: 22 // Blocks since SG rules only allows inbound port 80
    };

    const res = simulatePacketFlow({
      nodes,
      edges,
      routeTables,
      nacls,
      securityGroups,
      packet
    });

    expect(res.status).toBe('FAILED');
    expect(res.trace[res.trace.length - 1].status).toBe('BLOCKED');
  });
});
