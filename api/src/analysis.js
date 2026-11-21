import { Analysis } from './models.js';
import { parsePcap } from './pcap.js';
import { getRules } from './rules.js';
import { buildDemoPcap } from './sample.js';

const serialize = (doc) => {
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const { _id, __v, ...rest } = plain;
  return { id: String(_id), ...rest };
};

export async function analyzeBuffer(buffer, { filename, source = 'upload' }) {
  const rules = await getRules();
  const parsed = parsePcap(buffer, { filename, rules });
  const doc = await Analysis.create({
    ...parsed,
    source
  });
  return serialize(doc);
}

export async function analyzeDemo() {
  return analyzeBuffer(buildDemoPcap(), {
    filename: 'demo-signal.pcap',
    source: 'demo'
  });
}

export async function listRuns(limit = 12) {
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);
  const docs = await Analysis.find({})
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .select('-flows -packetTrace')
    .lean();
  return docs.map(serialize);
}

export async function getRun(id) {
  if (!id || !/^[a-f\d]{24}$/i.test(id)) return null;
  const doc = await Analysis.findById(id).lean();
  return doc ? serialize(doc) : null;
}

export async function deleteRun(id) {
  if (!id || !/^[a-f\d]{24}$/i.test(id)) return false;
  const result = await Analysis.deleteOne({ _id: id });
  return result.deletedCount === 1;
}
