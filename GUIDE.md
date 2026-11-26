# PacketAnalyzer — Guide

## What it is

PacketAnalyzer is a deep packet inspection workbench. It parses classic PCAP captures, walks Ethernet/IP/TCP/UDP headers, extracts TLS SNI, DNS names, and HTTP Host headers, classifies applications, and applies blocking rules.

- **Live app:** https://packetanalyzer.furqankhan.dev
- **API:** https://packet-analyzer-api-11k7.onrender.com

## How to analyze a capture

1. Open the **Capture** page.
2. Drop a classic `.pcap` file (not pcapng) into the intake panel, or press **Analyze demo capture**.
3. Set the apps and domains the wire should refuse in the **Blocking rules** panel.
4. Press **Save rules** if you changed them. Rules apply to the next analysis.
5. Read the metric strip: packets, flows, blocked packets, apps, and capture span.
6. Scan the application breakdown, capture facts, transport mix, flow table, top domains, and packet trace.
7. Open **History** to reopen or delete a saved capture.

The demo capture is synthetic and safe to inspect. Your own file is parsed in memory; only the flow summary is stored.

## What you can learn from a run

- Which applications own the most packets.
- Which domains were named over TLS or DNS.
- Which flows were refused by the current rules.
- Which packets appear in the first trace window.
- How the same capture changes when the rule snapshot changes.

## History

Every analysis is stored in MongoDB with the rule snapshot that was active at the time. The history page can reopen a run or delete it.

## API

- `GET /api/health` — service heartbeat and database status.
- `GET /api/apps` — classifier catalogue.
- `GET /api/rules` / `PUT /api/rules` — read or update blocking rules.
- `POST /api/analyze` — upload and parse a PCAP.
- `POST /api/analyze/demo` — parse the built-in demo.
- `GET /api/runs` / `GET /api/runs/:id` — history and full run detail.
- `DELETE /api/runs/:id` — remove a saved run.

## Tech

React, Vite, Express, MongoDB Atlas, custom PCAP parser, TLS SNI / DNS / HTTP host extraction.

## Honest limits

- No pcapng. Convert with `editcap -F pcap` first.
- No TCP reassembly, IPv6, QUIC, or encrypted ClientHello inspection.
- Checksums are not validated.
- The free Render API can cold-start after inactivity.
