export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'PacketAnalyzer API',
    version: '1.0.0',
    description:
      'Classic PCAP parsing, TLS SNI/DNS/HTTP classification, flow aggregation, blocking rules, and MongoDB-backed analysis history.'
  },
  servers: [{ url: '/' }],
  paths: {
    '/api/health': {
      get: { summary: 'Health and MongoDB readiness', responses: { 200: { description: 'Ready' }, 503: { description: 'Database unavailable' } } }
    },
    '/api/openapi.json': {
      get: { summary: 'This OpenAPI contract', responses: { 200: { description: 'OpenAPI JSON' } } }
    },
    '/api/apps': {
      get: { summary: 'Classifier catalogue', responses: { 200: { description: 'App names' } } }
    },
    '/api/rules': {
      get: { summary: 'Current blocking rules', responses: { 200: { description: 'Rules and catalogue' } } },
      put: {
        summary: 'Update blocking rules (operator token)',
        security: [{ DemoOperator: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Rules' } } } },
        responses: { 200: { description: 'Updated rules' }, 401: { description: 'Operator token required' }, 400: { description: 'Validation error' } }
      }
    },
    '/api/analyze': {
      post: {
        summary: 'Upload and parse a classic PCAP',
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } }
        },
        responses: { 201: { description: 'Stored analysis' }, 400: { description: 'Invalid PCAP' }, 429: { description: 'Rate limited' } }
      }
    },
    '/api/analyze/demo': {
      post: { summary: 'Parse the generated demo capture', responses: { 201: { description: 'Stored analysis' }, 429: { description: 'Rate limited' } } }
    },
    '/api/runs': {
      get: { summary: 'Analysis history', responses: { 200: { description: 'Run summaries' } } }
    },
    '/api/runs/{id}': {
      get: {
        summary: 'Full analysis',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Run with flows and trace' }, 404: { description: 'Not found' } }
      },
      delete: {
        summary: 'Delete an analysis (operator token)',
        security: [{ DemoOperator: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' }, 401: { description: 'Operator token required' }, 404: { description: 'Not found' } }
      }
    }
  },
  components: {
    securitySchemes: {
      DemoOperator: { type: 'apiKey', in: 'header', name: 'x-demo-admin-token' }
    },
    schemas: {
      Rules: {
        type: 'object',
        properties: {
          blockedApps: { type: 'array', items: { type: 'string' }, example: ['TikTok', 'BitTorrent'] },
          blockedDomains: { type: 'array', items: { type: 'string' }, example: ['example.com'] },
          blockedIps: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }
};
