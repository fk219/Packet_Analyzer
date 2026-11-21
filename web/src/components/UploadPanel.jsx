import { useRef, useState } from 'react';
import { FileUp, FlaskConical, ScanLine, UploadCloud } from 'lucide-react';

const size = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export function UploadPanel({ data }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const busy = Boolean(data.action);

  const choose = (nextFile) => {
    if (!nextFile) return;
    setFile(nextFile);
    data.setError?.('');
  };

  const drop = (event) => {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files?.[0] || null);
  };

  const analyze = async () => {
    if (!file) return;
    const result = await data.analyzeFile(file);
    if (result) setFile(null);
  };

  return (
    <section className="panel intake-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">01 / CAPTURE INTAKE</p>
          <h2>Put a wire on the table.</h2>
        </div>
        <ScanLine size={20} className="panel-icon" />
      </div>

      <div
        className={`dropzone ${dragging ? 'is-dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
      >
        <UploadCloud size={24} />
        <p>{file ? file.name : 'Drop a classic .pcap here'}</p>
        <span>{file ? `${size(file.size)} · ready to parse` : 'or click to choose a capture · max 8 MB'}</span>
        <input
          ref={inputRef}
          type="file"
          accept=".pcap,application/octet-stream"
          onChange={(event) => choose(event.target.files?.[0] || null)}
          hidden
        />
      </div>

      <div className="intake-actions">
        <button type="button" className="btn primary" onClick={analyze} disabled={!file || busy}>
          <FileUp size={15} />
          {data.action === 'analyze' ? 'Parsing…' : 'Analyze capture'}
        </button>
        <button type="button" className="btn secondary" onClick={data.runDemo} disabled={busy}>
          <FlaskConical size={15} />
          {data.action === 'demo' ? 'Building demo…' : 'Analyze demo capture'}
        </button>
      </div>

      <div className="intake-notes">
        <p>Classic PCAP only — not pcapng.</p>
        <p>The parser reads Ethernet, IPv4, TCP/UDP, TLS SNI, DNS queries, and HTTP Host headers.</p>
        <p>Captures are parsed in memory; only the flow summary is stored in MongoDB.</p>
      </div>
    </section>
  );
}
