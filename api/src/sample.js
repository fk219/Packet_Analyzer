const DEFAULT_HOSTS = [
  'youtube.com',
  'netflix.com',
  'tiktok.com',
  'facebook.com',
  'instagram.com',
  'spotify.com',
  'github.com',
  'discord.com',
  'zoom.us',
  'amazon.com',
  'x.com',
  'whatsapp.com',
  'google.com',
  'telegram.org',
  'apple.com',
  'bittorrent.com',
  'example.com',
  'cloudflare.com',
  'wikipedia.org'
];

const MAC_DEST = Buffer.from('001122334455', 'hex');
const MAC_SRC = Buffer.from('66778899aabb', 'hex');

function checksum(buffer) {
  let sum = 0;
  let offset = 0;
  while (offset + 1 < buffer.length) {
    sum += buffer.readUInt16BE(offset);
    offset += 2;
  }
  if (offset < buffer.length) sum += buffer[offset] << 8;
  while (sum >> 16) sum = (sum & 0xffff) + (sum >> 16);
  return ~sum & 0xffff;
}

function buildIpv4(srcIp, dstIp, protocol, payload, id) {
  const header = Buffer.alloc(20);
  header[0] = 0x45;
  header[1] = 0;
  header.writeUInt16BE(20 + payload.length, 2);
  header.writeUInt16BE(id & 0xffff, 4);
  header.writeUInt16BE(0x4000, 6);
  header[8] = 64;
  header[9] = protocol;
  srcIp.copy(header, 12);
  dstIp.copy(header, 16);
  header.writeUInt16BE(checksum(header), 10);
  return Buffer.concat([header, payload]);
}

function buildTcp(srcIp, dstIp, srcPort, dstPort, payload, id) {
  const header = Buffer.alloc(20);
  header.writeUInt16BE(srcPort, 0);
  header.writeUInt16BE(dstPort, 2);
  header.writeUInt32BE(1 + id * 1000, 4);
  header.writeUInt32BE(0, 8);
  header[12] = 5 << 4;
  header[13] = 0x18;
  header.writeUInt16BE(64240, 14);
  header.writeUInt16BE(0, 16);
  header.writeUInt16BE(0, 18);

  const pseudo = Buffer.alloc(12);
  srcIp.copy(pseudo, 0);
  dstIp.copy(pseudo, 4);
  pseudo[9] = 6;
  pseudo.writeUInt16BE(header.length + payload.length, 10);
  header.writeUInt16BE(checksum(Buffer.concat([pseudo, header, payload])), 16);

  return buildIpv4(srcIp, dstIp, 6, Buffer.concat([header, payload]), id);
}

function buildUdp(srcIp, dstIp, srcPort, dstPort, payload, id) {
  const header = Buffer.alloc(8);
  header.writeUInt16BE(srcPort, 0);
  header.writeUInt16BE(dstPort, 2);
  header.writeUInt16BE(8 + payload.length, 4);
  header.writeUInt16BE(0, 6);
  return buildIpv4(srcIp, dstIp, 17, Buffer.concat([header, payload]), id);
}

function ethernet(payload) {
  return Buffer.concat([MAC_DEST, MAC_SRC, Buffer.from([0x08, 0x00]), payload]);
}

function buildTlsClientHello(host) {
  const name = Buffer.from(host, 'ascii');
  const sni = Buffer.alloc(5 + name.length);
  sni.writeUInt16BE(name.length + 3, 0);
  sni[2] = 0;
  sni.writeUInt16BE(name.length, 3);
  name.copy(sni, 5);

  const extensions = Buffer.alloc(4 + sni.length);
  extensions.writeUInt16BE(0, 0);
  extensions.writeUInt16BE(sni.length, 2);
  sni.copy(extensions, 4);

  const body = Buffer.alloc(43 + extensions.length);
  let offset = 0;
  body.writeUInt16BE(0x0303, offset);
  offset += 2;
  for (let i = 0; i < 32; i += 1) body[offset + i] = (i * 37 + 11) & 0xff;
  offset += 32;
  body[offset++] = 0;
  body.writeUInt16BE(2, offset);
  offset += 2;
  body.writeUInt16BE(0x1301, offset);
  offset += 2;
  body[offset++] = 1;
  body[offset++] = 0;
  body.writeUInt16BE(extensions.length, offset);
  offset += 2;
  extensions.copy(body, offset);

  const handshake = Buffer.alloc(4 + body.length);
  handshake[0] = 0x01;
  handshake.writeUIntBE(body.length, 1, 3);
  body.copy(handshake, 4);

  const record = Buffer.alloc(5 + handshake.length);
  record[0] = 0x16;
  record.writeUInt16BE(0x0301, 1);
  record.writeUInt16BE(handshake.length, 3);
  handshake.copy(record, 5);
  return record;
}

function buildDnsQuery(host, id) {
  const labels = host.split('.');
  const name = Buffer.concat([
    ...labels.map((label) => {
      const bytes = Buffer.from(label, 'ascii');
      return Buffer.concat([Buffer.from([bytes.length]), bytes]);
    }),
    Buffer.from([0])
  ]);
  const header = Buffer.alloc(12);
  header.writeUInt16BE(id, 0);
  header.writeUInt16BE(0x0100, 2);
  header.writeUInt16BE(1, 4);
  const question = Buffer.alloc(4);
  question.writeUInt16BE(1, 0);
  question.writeUInt16BE(1, 2);
  return Buffer.concat([header, name, question]);
}

export function buildDemoPcap(hosts = DEFAULT_HOSTS) {
  const frames = [];
  const baseTime = Math.floor(Date.now() / 1000) - 60;

  hosts.forEach((host, index) => {
    const srcIp = Buffer.from([10, 0, 0, 10 + (index % 40)]);
    const dstIp = Buffer.from([93, 184, 216, 34]);
    const payload = buildTlsClientHello(host);
    frames.push({ data: ethernet(buildTcp(srcIp, dstIp, 40000 + index, 443, payload, index + 1)), index });
  });

  frames.push({
    data: ethernet(
      buildUdp(
        Buffer.from([10, 0, 0, 60]),
        Buffer.from([8, 8, 8, 8]),
        53000,
        53,
        buildDnsQuery('netflix.com', 7001),
        80
      )
    ),
    index: frames.length
  });

  frames.push({
    data: ethernet(
      buildUdp(
        Buffer.from([10, 0, 0, 61]),
        Buffer.from([8, 8, 8, 8]),
        53001,
        53,
        buildDnsQuery('tiktok.com', 7002),
        81
      )
    ),
    index: frames.length
  });

  const httpPayload = Buffer.from(
    'GET / HTTP/1.1\r\nHost: wikipedia.org\r\nUser-Agent: dpi-lab-demo\r\nConnection: close\r\n\r\n',
    'ascii'
  );
  frames.push({
    data: ethernet(
      buildTcp(Buffer.from([10, 0, 0, 62]), Buffer.from([93, 184, 216, 34]), 40100, 80, httpPayload, 90)
    ),
    index: frames.length
  });

  const globalHeader = Buffer.alloc(24);
  globalHeader.writeUInt32LE(0xa1b2c3d4, 0);
  globalHeader.writeUInt16LE(2, 4);
  globalHeader.writeUInt16LE(4, 6);
  globalHeader.writeUInt32LE(0, 8);
  globalHeader.writeUInt32LE(0, 12);
  globalHeader.writeUInt32LE(65535, 16);
  globalHeader.writeUInt32LE(1, 20);

  const records = frames.map(({ data, index }) => {
    const record = Buffer.alloc(16);
    record.writeUInt32LE(baseTime + index, 0);
    record.writeUInt32LE(index * 120000, 4);
    record.writeUInt32LE(data.length, 8);
    record.writeUInt32LE(data.length, 12);
    return Buffer.concat([record, data]);
  });

  return Buffer.concat([globalHeader, ...records]);
}
