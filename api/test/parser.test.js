import { describe, expect, it } from 'vitest';
import { parsePcap } from '../src/pcap.js';
import { buildDemoPcap } from '../src/sample.js';

describe('PCAP parser', () => {
  it('parses the synthetic demo capture and extracts SNI domains', () => {
    const buffer = buildDemoPcap();
    const result = parsePcap(buffer, {
      filename: 'demo.pcap',
      rules: {
        blockedApps: ['TikTok', 'BitTorrent'],
        blockedDomains: ['example.com']
      }
    });

    expect(result.packetCount).toBe(22);
    expect(result.parsedPackets).toBe(22);
    expect(result.flowCount).toBeGreaterThanOrEqual(20);
    expect(result.protocols.TCP).toBe(20);
    expect(result.protocols.UDP).toBe(2);
    expect(result.apps.find((app) => app.app === 'YouTube')).toBeTruthy();
    expect(result.topDomains.find((domain) => domain.domain === 'netflix.com')).toBeTruthy();
    expect(result.blockedFlowCount).toBeGreaterThanOrEqual(3);
  });

  it('rejects a non-PCAP buffer', () => {
    expect(() => parsePcap(Buffer.from('not a capture'), { filename: 'bad.pcap' })).toThrow(/too small/i);
  });
});
