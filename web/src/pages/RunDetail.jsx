import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Radar } from 'lucide-react';
import { AnalysisView } from '../components/AnalysisView.jsx';

export function RunDetail({ data }) {
  const { id } = useParams();

  useEffect(() => {
    if (id && data.run?.id !== id) {
      void data.loadRun(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loading = data.action === 'load' && data.run?.id !== id;

  if (loading) {
    return (
      <div className="page">
        <div className="panel empty-wire">
          <Radar size={28} />
          <p>Reading the capture…</p>
        </div>
      </div>
    );
  }

  if (!data.run || data.run.id !== id) {
    return (
      <div className="page">
        <div className="panel empty-wire">
          <Radar size={28} />
          <p>This capture is not in the ledger.</p>
          <Link to="/history" className="btn primary">Back to history</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head run-head">
        <div>
          <p className="eyebrow">CAPTURE / {data.run.source.toUpperCase()}</p>
          <h1>
            {data.run.filename}
            <br />
            <em>decoded.</em>
          </h1>
          <p className="lede">
            {new Date(data.run.createdAt).toLocaleString('en-IN')} · {data.run.packetCount} packets · {data.run.flowCount} flows
          </p>
        </div>
        <Link to="/history" className="back-link"><ArrowLeft size={13} /> All captures</Link>
      </header>
      <AnalysisView run={data.run} />
    </div>
  );
}
