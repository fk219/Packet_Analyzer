import { Rule } from './models.js';

export const DEFAULT_RULES = {
  blockedApps: ['TikTok', 'BitTorrent'],
  blockedDomains: ['example.com'],
  blockedIps: []
};

export async function seedRules() {
  await Rule.init();
  await Rule.updateOne(
    { key: 'default' },
    { $setOnInsert: { key: 'default', ...DEFAULT_RULES } },
    { upsert: true }
  );
}

export async function getRules() {
  const rules = await Rule.findOne({ key: 'default' }).lean();
  return rules || { key: 'default', ...DEFAULT_RULES };
}

export async function updateRules(payload = {}) {
  const normalize = (value) =>
    Array.isArray(value)
      ? Array.from(
          new Set(
            value
              .map((item) => String(item || '').trim())
              .filter(Boolean)
          )
        )
      : [];

  const next = {
    blockedApps: normalize(payload.blockedApps),
    blockedDomains: normalize(payload.blockedDomains).map((domain) => domain.toLowerCase()),
    blockedIps: normalize(payload.blockedIps)
  };

  const rules = await Rule.findOneAndUpdate(
    { key: 'default' },
    { $set: next },
    { new: true, upsert: true }
  ).lean();

  return rules;
}
