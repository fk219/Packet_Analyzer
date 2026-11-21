# Packet Lab — Deep Packet Inspection, MERN

A live PCAP analysis lab. Upload a capture, parse Ethernet/IP/TCP/UDP, extract TLS SNI, DNS names, and HTTP Host headers, classify applications, and apply blocking rules. Every analysis is stored in MongoDB and keeps a snapshot of the rules that were active.

This is the MERN rebuild of the original C++ DPI engine. The C++ implementation is preserved in [`engine/`](engine/) for reference.

## Live demo

| Surface | URL |
|---|---|
| React capture lab | https://packet-analyzer-swart.vercel.app |
| Express API | https://packet-analyzer-api-11k7.onrender.com/api/health |

## What works

- **Classic PCAP parsing.** Little- or big-endian, microsecond or nanosecond timestamps, Ethernet with optional VLAN tags, raw IPv4, and Linux cooked captures.
- **Application identification.** TLS ClientHello SNI, DNS query names, and HTTP Host headers are matched against a classifier catalogue of 18 apps.
- **Flow aggregation.** Five-tuple flows track packets, bytes, app, domain, first/last timestamp, and blocked state.
- **Blocking rules.** Toggle blocked apps, add blocked domain substrings, and apply them to the next capture. The rule snapshot is stored with each run.
- **Real run history.** MongoDB stores summaries, flows, domains, and packet traces. Old runs keep the rules they were analyzed with.
- **Demo capture.** The API generates a valid synthetic PCAP with 22 packets across known apps, DNS queries, and an HTTP request.
- **Upload.** Classic `.pcap` files up to 8 MB are parsed in memory.

## Architecture

```
web/                 React + Vite frontend
  src/
    pages/           Capture, history, run detail, method
    components/      Upload, rules, flow table, analysis view
    useLab.js        API state and actions

api/                 Express + MongoDB API
  src/
    pcap.js          PCAP, Ethernet, IPv4, TCP/UDP, TLS SNI, DNS, HTTP
    sample.js        Synthetic demo capture generator
    analysis.js      Parse, persist, list, load, delete
    rules.js         Blocking rules
    models.js        Analysis and Rule schemas
    routes.js        REST surface

engine/              Original C++ DPI engine and sample captures
```

## API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/apps` | Classifier catalogue |
| `GET` | `/api/rules` | Current blocking rules |
| `PUT` | `/api/rules` | Update blocked apps/domains |
| `POST` | `/api/analyze` | Upload and parse a PCAP |
| `POST` | `/api/analyze/demo` | Parse the generated demo capture |
| `GET` | `/api/runs` | Saved analysis history |
| `GET` | `/api/runs/:id` | One full analysis |
| `DELETE` | `/api/runs/:id` | Remove a saved analysis |

## Run locally

```bash
npm run install:all

# API (port 4200)
# api/.env: MONGODB_URI=...
npm run dev:api

# Web (port 5176, proxies /api to 4200)
npm run dev:web
```

## Tests

```bash
npm test
```

Seven tests cover the parser, demo capture, SNI classification, flow counts, stored history, rule changes, invalid uploads, and deletion.

## Deployment

- **Frontend:** Vercel static build, proxying `/api` to the Render API.
- **API:** Render web service from `api/`.
- **Database:** MongoDB Atlas database `packetanalyzer` on `Cluster0`.

## Honest limitations

- Classic PCAP only; pcapng is not supported.
- No TCP reassembly. A TLS ClientHello split across segments may not yield SNI.
- No IPv6, QUIC, or Encrypted ClientHello (ECH) inspection.
- Checksums are not validated; the parser trusts the capture bytes.
- The built-in demo capture is synthetic and labelled `source: demo`.
- Payloads are not stored; the database keeps flow summaries and a short packet trace.
