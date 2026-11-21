const APP_PATTERNS = {
  YouTube: ['youtube.com', 'youtu.be', 'ytimg.com', 'googlevideo.com'],
  Facebook: ['facebook.com', 'fbcdn.net', 'fb.com'],
  Instagram: ['instagram.com', 'cdninstagram.com'],
  Netflix: ['netflix.com', 'nflxvideo.net', 'nflximg.net'],
  WhatsApp: ['whatsapp.com', 'whatsapp.net'],
  Google: ['google.com', 'gstatic.com', 'googleapis.com'],
  Amazon: ['amazon.com', 'amazonaws.com', 'cloudfront.net'],
  Spotify: ['spotify.com', 'scdn.co'],
  TikTok: ['tiktok.com', 'tiktokcdn.com'],
  X: ['twitter.com', 'x.com', 'twimg.com'],
  GitHub: ['github.com', 'githubusercontent.com'],
  Zoom: ['zoom.us', 'zoom.com'],
  Discord: ['discord.com', 'discordapp.com', 'discord.gg'],
  BitTorrent: ['bittorrent.com', 'utorrent.com'],
  Telegram: ['telegram.org', 't.me'],
  Apple: ['apple.com', 'icloud.com'],
  Cloudflare: ['cloudflare.com', 'cloudflare-dns.com'],
  Wikipedia: ['wikipedia.org', 'wikimedia.org']
};

export const APP_CATALOG = Object.keys(APP_PATTERNS);

export function classifyDomain(domain = '') {
  const host = domain.toLowerCase().replace(/^www\./, '');
  if (!host) return 'Unknown';
  for (const [app, patterns] of Object.entries(APP_PATTERNS)) {
    if (patterns.some((pattern) => host === pattern || host.endsWith(`.${pattern}`))) return app;
  }
  return 'Unknown';
}

function extractSni(payload) {
  if (!payload || payload.length < 9 || payload[0] !== 0x16) return null;
  const recordLength = payload.readUInt16BE(3);
  const recordEnd = Math.min(5 + recordLength, payload.length);
  if (payload[5] !== 0x01) return null;

  let offset = 9;
  offset += 2 + 32;
  if (offset >= recordEnd) return null;
  const sessionLength = payload[offset];
  offset += 1 + sessionLength;
  if (offset + 2 > recordEnd) return null;
  const cipherLength = payload.readUInt16BE(offset);
  offset += 2 + cipherLength;
  if (offset >= recordEnd) return null;
  const compressionLength = payload[offset];
  offset += 1 + compressionLength;
  if (offset + 2 > recordEnd) return null;

  const extensionLength = payload.readUInt16BE(offset);
  offset += 2;
  const extensionEnd = Math.min(offset + extensionLength, recordEnd);

  while (offset + 4 <= extensionEnd) {
    const type = payload.readUInt16BE(offset);
    const length = payload.readUInt16BE(offset + 2);
    offset += 4;
    if (offset + length > extensionEnd) break;

    if (type === 0) {
      const listLength = payload.readUInt16BE(offset);
      let cursor = offset + 2;
      const listEnd = Math.min(cursor + listLength, offset + length);
      while (cursor + 3 <= listEnd) {
        const nameType = payload[cursor];
        const nameLength = payload.readUInt16BE(cursor + 1);
        cursor += 3;
        if (nameType === 0 && cursor + nameLength <= listEnd) {
          return payload.toString('ascii', cursor, cursor + nameLength);
        }
        cursor += nameLength;
      }
    }
    offset += length;
  }
  return null;
}

function extractDnsQuery(payload) {
  if (!payload || payload.length < 13) return null;
  const flags = payload.readUInt16BE(2);
  if (flags & 0x8000) return null;
  const questions = payload.readUInt16BE(4);
  if (questions < 1) return null;

  const labels = [];
  let offset = 12;
  while (offset < payload.length && payload[offset] !== 0) {
    const length = payload[offset];
    if (length > 63 || offset + 1 + length > payload.length) return null;
    labels.push(payload.toString('ascii', offset + 1, offset + 1 + length));
    offset += 1 + length;
  }
  return labels.length ? labels.join('.') : null;
}

function extractHttpHost(payload) {
  if (!payload || payload.length < 16) return null;
  const text = payload.toString('latin1', 0, Math.min(payload.length, 2048));
  if (!/^(GET|POST|HEAD|PUT|PATCH|DELETE|CONNECT) .+ HTTP\//.test(text)) return null;
  const match = text.match(/\r\nhost:\s*([^\r\n]+)/i);
  return match ? match[1].trim() : null;
}

const toHex = (value) => value.toString(16).padStart(2, '0');
const ipv4 = (buffer, offset) =>
  `${buffer[offset]}.${buffer[offset + 1]}.${buffer[offset + 2]}.${buffer[offset + 3]}`;

function parseTcp(payload, offset) {
  if (payload.length < offset + 20) return null;
  const srcPort = payload.readUInt16BE(offset);
  const dstPort = payload.readUInt16BE(offset + 2);
  const dataOffset = (payload[offset + 12] >> 4) * 4;
  const payloadOffset = offset + dataOffset;
  if (payloadOffset > payload.length) return null;
  return {
    protocol: 'TCP',
    srcPort,
    dstPort,
    payload: payload.subarray(payloadOffset)
  };
}

function parseUdp(payload, offset) {
  if (payload.length < offset + 8) return null;
  return {
    protocol: 'UDP',
    srcPort: payload.readUInt16BE(offset),
    dstPort: payload.readUInt16BE(offset + 2),
    payload: payload.subarray(offset + 8)
  };
}

function parseIpv4(packet) {
  if (packet.length < 20 || (packet[0] >> 4) !== 4) return null;
  const ihl = (packet[0] & 0x0f) * 4;
  if (ihl < 20 || packet.length < ihl) return null;
  const totalLength = packet.readUInt16BE(2);
  const protocolNumber = packet[9];
  const srcIp = ipv4(packet, 12);
  const dstIp = ipv4(packet, 16);
  const transport = protocolNumber === 6 ? parseTcp(packet, ihl) : protocolNumber === 17 ? parseUdp(packet, ihl) : null;
  if (!transport) return null;
  return {
    srcIp,
    dstIp,
    ...transport,
    bytes: Math.min(totalLength || packet.length, packet.length)
  };
}

function parseEthernet(packet) {
  if (packet.length < 14) return null;
  let etherType = packet.readUInt16BE(12);
  let offset = 14;
  if (etherType === 0x8100 && packet.length >= 18) {
    etherType = packet.readUInt16BE(16);
    offset = 18;
  }
  if (etherType !== 0x0800) return null;
  return parseIpv4(packet.subarray(offset));
}

function parseRawIp(packet) {
  if (!packet.length) return null;
  const version = packet[0] >> 4;
  return version === 4 ? parseIpv4(packet) : null;
}

function detectLinkType(packet, linkType) {
  if (linkType === 1) return parseEthernet(packet);
  if (linkType === 101 || linkType === 228) return parseRawIp(packet);
  if (linkType === 113 && packet.length >= 16) {
    return parseIpv4(packet.subarray(16));
  }
  return null;
}

export function parsePcap(buffer, { filename = 'capture.pcap', rules = {} } = {}) {
  if (!buffer || buffer.length < 24) throw new Error('File is too small to be a PCAP capture');

  const magic = buffer.readUInt32LE(0);
  let littleEndian = true;
  let nanoseconds = false;
  if (magic === 0xa1b2c3d4) littleEndian = true;
  else if (magic === 0xd4c3b2a1) littleEndian = false;
  else if (magic === 0xa1b23c4d) {
    littleEndian = true;
    nanoseconds = true;
  } else if (magic === 0x4d3cb2a1) {
    littleEndian = false;
    nanoseconds = true;
  } else {
    throw new Error('Unsupported file. Upload a classic PCAP capture (not pcapng).');
  }

  const u16 = (offset) => (littleEndian ? buffer.readUInt16BE(offset) : buffer.readUInt16BE(offset));
  const u32 = (offset) => (littleEndian ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset));
  const linkType = u32(20);
  const blockedApps = new Set((rules.blockedApps || []).map((app) => app.toLowerCase()));
  const blockedDomains = (rules.blockedDomains || []).map((domain) => domain.toLowerCase()).filter(Boolean);
  const blockedIps = new Set(rules.blockedIps || []);

  const flows = new Map();
  const appMap = new Map();
  const domainMap = new Map();
  const protocols = {};
  const packetTrace = [];
  let offset = 24;
  let packetCount = 0;
  let parsedPackets = 0;
  let totalBytes = 0;
  let blockedPackets = 0;
  let firstTimestamp = null;
  let lastTimestamp = null;
  let skippedLinkType = 0;

  while (offset + 16 <= buffer.length) {
    const seconds = u32(offset);
    const fraction = u32(offset + 4);
    const inclLength = u32(offset + 8);
    offset += 16;
    if (inclLength > 262144 || offset + inclLength > buffer.length) break;

    const packet = buffer.subarray(offset, offset + inclLength);
    offset += inclLength;
    packetCount += 1;

    const timestamp = seconds * 1000 + (nanoseconds ? fraction / 1_000_000 : fraction / 1_000);
    if (firstTimestamp === null) firstTimestamp = timestamp;
    lastTimestamp = timestamp;

    const decoded = detectLinkType(packet, linkType);
    if (!decoded) {
      if (![1, 101, 113, 228].includes(linkType)) skippedLinkType += 1;
      continue;
    }

    parsedPackets += 1;
    totalBytes += decoded.bytes;
    protocols[decoded.protocol] = (protocols[decoded.protocol] || 0) + 1;

    let domain = null;
    if (decoded.protocol === 'TCP') {
      domain = extractSni(decoded.payload) || extractHttpHost(decoded.payload);
    } else if (decoded.protocol === 'UDP' && (decoded.srcPort === 53 || decoded.dstPort === 53)) {
      domain = extractDnsQuery(decoded.payload);
    }

    const app = classifyDomain(domain || '');
    const domainBlocked = Boolean(domain && blockedDomains.some((blocked) => domain.toLowerCase().includes(blocked)));
    const blocked = blockedApps.has(app.toLowerCase()) || domainBlocked || blockedIps.has(decoded.srcIp);

    const flowKey = [
      decoded.srcIp,
      decoded.srcPort,
      decoded.dstIp,
      decoded.dstPort,
      decoded.protocol
    ].join('|');

    let flow = flows.get(flowKey);
    if (!flow) {
      flow = {
        id: flows.size + 1,
        srcIp: decoded.srcIp,
        srcPort: decoded.srcPort,
        dstIp: decoded.dstIp,
        dstPort: decoded.dstPort,
        protocol: decoded.protocol,
        app: 'Unknown',
        domain: null,
        packets: 0,
        bytes: 0,
        blocked: false,
        firstSeen: timestamp,
        lastSeen: timestamp
      };
      flows.set(flowKey, flow);
    }

    flow.packets += 1;
    flow.bytes += decoded.bytes;
    flow.lastSeen = timestamp;
    if (domain) {
      flow.domain = domain;
      flow.app = app;
      domainMap.set(domain, {
        domain,
        app,
        packets: (domainMap.get(domain)?.packets || 0) + 1,
        bytes: (domainMap.get(domain)?.bytes || 0) + decoded.bytes
      });
    }
    if (blocked) {
      flow.blocked = true;
      blockedPackets += 1;
    }

    if (packetTrace.length < 120) {
      packetTrace.push({
        ts: timestamp,
        srcIp: decoded.srcIp,
        srcPort: decoded.srcPort,
        dstIp: decoded.dstIp,
        dstPort: decoded.dstPort,
        protocol: decoded.protocol,
        app: flow.app,
        domain: flow.domain,
        bytes: decoded.bytes,
        blocked
      });
    }
  }

  for (const flow of flows.values()) {
    const entry = appMap.get(flow.app) || {
      app: flow.app,
      flows: 0,
      packets: 0,
      bytes: 0,
      blockedFlows: 0
    };
    entry.flows += 1;
    entry.packets += flow.packets;
    entry.bytes += flow.bytes;
    if (flow.blocked) entry.blockedFlows += 1;
    appMap.set(flow.app, entry);
  }

  const sortedFlows = Array.from(flows.values()).sort((a, b) => b.bytes - a.bytes);
  const apps = Array.from(appMap.values()).sort((a, b) => b.packets - a.packets);
  const topDomains = Array.from(domainMap.values()).sort((a, b) => b.packets - a.packets).slice(0, 12);

  return {
    filename,
    fileSize: buffer.length,
    linkType,
    packetCount,
    parsedPackets,
    totalBytes,
    flowCount: flows.size,
    blockedFlowCount: sortedFlows.filter((flow) => flow.blocked).length,
    blockedPacketCount: blockedPackets,
    appCount: apps.filter((app) => app.app !== 'Unknown').length,
    durationMs: firstTimestamp !== null ? Math.max(0, lastTimestamp - firstTimestamp) : 0,
    protocols,
    apps,
    topDomains,
    flows: sortedFlows.slice(0, 500),
    packetTrace,
    rules: {
      blockedApps: Array.from(blockedApps),
      blockedDomains,
      blockedIps: Array.from(blockedIps)
    },
    skippedLinkType
  };
}

export { extractSni, extractDnsQuery, extractHttpHost };
