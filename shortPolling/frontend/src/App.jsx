import { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/polling';
const SHORT_POLL_INTERVAL_MS = 2000;

export default function App() {
  const [jobId, setJobId] = useState('');
  const [shortPollStatus, setShortPollStatus] = useState('');
  const [longPollStatus, setLongPollStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [longPolling, setLongPolling] = useState(false);
  const [autoShortPolling, setAutoShortPolling] = useState(false);
  const [error, setError] = useState('');

  const apiBaseLabel = useMemo(() => {
    if (API_BASE.startsWith('http')) {
      return API_BASE;
    }
    return `${window.location.origin}${API_BASE}`;
  }, []);

  const requestText = useCallback(async (path, options = {}) => {
    setError('');
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        ...(options.headers || {}),
      },
      ...options,
    });
    const text = (await response.text()).trim();
    if (!response.ok) {
      throw new Error(text || `Request failed with ${response.status}`);
    }
    return text;
  }, []);

  const handleStartJob = async () => {
    setLoading(true);
    setShortPollStatus('');
    setLongPollStatus('');
    try {
      const id = await requestText('/start/job', { method: 'POST' });
      setJobId(id);
      setAutoShortPolling(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const ensureJobId = () => {
    if (!jobId) {
      setError('Please start a job before polling.');
      return false;
    }
    return true;
  };

  const handleShortPoll = async () => {
    if (!ensureJobId()) {
      return;
    }
    setLoading(true);
    try {
      const status = await requestText(`/shortPoll/${jobId}`);
      const normalized = status || '(no status yet)';
      setShortPollStatus(normalized);
      logShortPoll(normalized);
      setAutoShortPolling(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLongPoll = async () => {
    if (!ensureJobId()) {
      return;
    }
    setLongPolling(true);
    try {
      const status = await requestText(`/longPoll/${jobId}`);
      setLongPollStatus(status || '(no status yet)');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLongPolling(false);
    }
  };

  const logShortPoll = useCallback(status => {
    const normalized = status || '(no status yet)';
    const timestamp = new Date().toLocaleTimeString();
    console.info(`[short-poll] ${timestamp} -> ${normalized}`);
    if (normalized.toUpperCase() !== 'RUNNING') {
      setAutoShortPolling(false);
    }
  }, []);

  useEffect(() => {
    if (!autoShortPolling || !jobId) {
      return;
    }
    let cancelled = false;
    let timeoutId;

    const poll = async () => {
      if (cancelled) {
        return;
      }
      try {
        const status = await requestText(`/shortPoll/${jobId}`);
        const normalized = status || '(no status yet)';
        setShortPollStatus(normalized);
        logShortPoll(normalized);
        if (!cancelled) {
          timeoutId = setTimeout(poll, SHORT_POLL_INTERVAL_MS);
        }
      } catch (pollError) {
        setError(pollError.message);
        setAutoShortPolling(false);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [autoShortPolling, jobId, requestText, logShortPoll]);

  const renderResult = (title, status) => (
    <section className="card">
      <header>
        <h3>{title}</h3>
      </header>
      {status ? (
        <div className="result-row">
          <span className="label">Status</span>
          <span className={`value status ${status.toLowerCase()}`}>{status}</span>
        </div>
      ) : (
        <p className="placeholder">No data yet.</p>
      )}
    </section>
  );

  return (
    <main className="app">
      <h1>Polling Playground</h1>
      <p className="subtitle">Backend endpoint: {apiBaseLabel}</p>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <header>
          <h3>Job Controls</h3>
        </header>
        <div className="controls">
          <button onClick={handleStartJob} disabled={loading}>
            {loading ? 'Starting…' : 'Start New Job'}
          </button>
          <button onClick={handleShortPoll} disabled={loading || !jobId}>
            {loading ? 'Polling…' : 'Short Poll'}
          </button>
          <button onClick={handleLongPoll} disabled={longPolling || !jobId}>
            {longPolling ? 'Waiting…' : 'Long Poll'}
          </button>
        </div>
        <div className="result-row">
          <span className="label">Current Job ID</span>
          <span className="value mono">{jobId || '—'}</span>
        </div>
      </div>

      <div className="results-grid">
        {renderResult('Short Poll Result', shortPollStatus)}
        {renderResult('Long Poll Result', longPollStatus)}
      </div>
    </main>
  );
}
