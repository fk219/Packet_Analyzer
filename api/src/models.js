import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    source: { type: String, enum: ['upload', 'demo'], default: 'upload' },
    fileSize: Number,
    linkType: Number,
    packetCount: Number,
    parsedPackets: Number,
    totalBytes: Number,
    flowCount: Number,
    blockedFlowCount: Number,
    blockedPacketCount: Number,
    appCount: Number,
    durationMs: Number,
    protocols: { type: Object, default: {} },
    apps: { type: Array, default: [] },
    topDomains: { type: Array, default: [] },
    flows: { type: Array, default: [] },
    packetTrace: { type: Array, default: [] },
    rules: { type: Object, default: {} },
    skippedLinkType: { type: Number, default: 0 }
  },
  { timestamps: true }
);

analysisSchema.index({ createdAt: -1 });

const ruleSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    blockedApps: { type: [String], default: [] },
    blockedDomains: { type: [String], default: [] },
    blockedIps: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const Analysis = mongoose.models.Analysis || mongoose.model('Analysis', analysisSchema);
export const Rule = mongoose.models.Rule || mongoose.model('Rule', ruleSchema);
