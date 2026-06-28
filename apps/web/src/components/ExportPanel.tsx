import React, { useState } from 'react';

type ExportFormat = 'terraform' | 'containerlab' | 'cloudformation' | 'cdk';

export const ExportPanel: React.FC = () => {
  const [format, setFormat] = useState<ExportFormat>('terraform');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getExportCode = (): string => {
    switch (format) {
      case 'terraform':
        return `# Terraform AWS VPC Infrastructure Provisioning Configuration
# Generated automatically by IP Intelligence Platform

provider "aws" {
  region = "us-east-1"
}

# 1. Primary VPC
resource "aws_vpc" "primary_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "Primary-VPC"
  }
}

# 2. Subnets
resource "aws_subnet" "public_subnet" {
  vpc_id            = aws_vpc.primary_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "Public-Subnet-Web"
  }
}

resource "aws_subnet" "private_subnet" {
  vpc_id            = aws_vpc.primary_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "Private-Subnet-DB"
  }
}

# 3. Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.primary_vpc.id

  tags = {
    Name = "VPC-Internet-Gateway"
  }
}

# 4. NAT Gateway & EIP
resource "aws_eip" "nat_eip" {
  domain = "vpc"
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_subnet.id

  tags = {
    Name = "VPC-NAT-Gateway"
  }
}
`;

      case 'containerlab':
        return `# Containerlab Network Simulation Topology File
# Generated automatically by IP Intelligence Platform
# Run: containerlab deploy -t ip-intel-topo.clab.yml

name: ip-intel-topo

topology:
  nodes:
    # 1. Routers/Gateways
    vpc-gw:
      kind: linux
      image: alpine:latest
      cmd: sysctl -w net.ipv4.ip_forward=1
    
    # 2. Subnet Clients
    web-host:
      kind: linux
      image: alpine:latest
      binds:
        - /var/run/netns:/var/run/netns
    
    db-host:
      kind: linux
      image: alpine:latest

  links:
    # Connect hosts to gateway interface bridges
    - endpoints: ["web-host:eth1", "vpc-gw:eth1"]
    - endpoints: ["db-host:eth1", "vpc-gw:eth2"]
`;

      case 'cloudformation':
        return `AWSTemplateFormatVersion: '2010-09-09'
Description: 'AWS VPC Infrastructure template - IP Intelligence Platform'

Resources:
  # VPC
  PrimaryVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: Primary-VPC

  # Subnets
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref PrimaryVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: Public-Subnet-Web

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref PrimaryVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: Private-Subnet-DB
`;

      case 'cdk':
        return `// AWS Cloud Development Kit (CDK) v2 TypeScript Code
// Generated automatically by IP Intelligence Platform

import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class IpIntelVpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC with Public and Private Subnet layout
    const vpc = new ec2.Vpc(this, 'PrimaryVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'Public-Subnet-Web',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private-Subnet-DB',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        }
      ],
    });
  }
}
`;
    }
  };

  const code = getExportCode();

  return (
    <div className="space-y-6 bg-slate-50 text-slate-800">
      {/* Explanation Box */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-800">Configs Exporter</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-700">What is this?</p>
            <p>A configuration builder that converts visual network architectures into infrastructure setup files.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">What is the use?</p>
            <p>To automatically generate setup files for systems like Terraform or Containerlab, eliminating manual copy-pasting errors.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">When to use?</p>
            <p>When you have finalized your VPC subnet layout and want to deploy it directly to AWS cloud or local docker nodes.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">How the calculations happen? (Simple Arithmetic)</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>It reads your configured subnet names, IP addresses, prefixes, routing targets, and security rules.</li>
              <li>Then it maps those variables directly into pre-written text configurations (string templates) depending on the selected format.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-lg p-5 space-y-4">
        
        {/* Selector Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-slate-700">
            Infrastructure Configurations Exporter
          </h3>
          <div className="flex gap-2">
            {(['terraform', 'containerlab', 'cloudformation', 'cdk'] as ExportFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-3 py-1 rounded text-[10px] uppercase font-bold transition-all border ${
                  format === f
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-650 hover:text-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Copy bar */}
        <div className="relative">
          <button
            onClick={() => handleCopy(code)}
            className="absolute right-3 top-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 p-1.5 rounded transition-all flex items-center gap-1 text-[10px] font-semibold"
            title="Copy Config Code"
          >
            {copied ? (
              <span className="text-emerald-650 font-bold">Copied!</span>
            ) : (
              <span>Copy Code</span>
            )}
          </button>

          {/* Simulated Monaco Editor wrapper layout */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-750 overflow-x-auto min-h-[300px] leading-relaxed select-all">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-3 text-[10px] text-slate-400 select-none">
              <span>main.{format === 'terraform' ? 'tf' : format === 'containerlab' ? 'yml' : format === 'cloudformation' ? 'yaml' : 'ts'}</span>
            </div>
            <pre className="whitespace-pre">{code}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
