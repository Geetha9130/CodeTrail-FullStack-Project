import { useMemo, useState } from 'react';
import { Activity, ArrowLeft, ArrowRight, BookOpen, Bug, CheckCircle2, Code2, Cpu, GraduationCap, Play, RotateCcw, ShieldCheck, Sparkles, Terminal, Zap } from 'lucide-react';

const samples = {
  'Variables': 'a = 10\nb = 20\nc = a + b\nprint(c)',
  'For loop': 'for i in range(3):\n    print(i)',
  'List indexing': 'numbers = [10, 20, 30]\nfirst = numbers[0]\nprint(first)',
  'Find the error': 'numbers = [10, 20, 30]\nfor i in range(4):\n    print(numbers[i])',
  'If condition': 'score = 85\nif score >= 70:\n    print("Passed")\nelse:\n    print("Try again")',
};

const starterTrace = {
  ok: true,
  summary: 'Choose a sample or write code, then visualize it.',
  steps: [],
  output: '',
};

function App() {
  const [code, setCode] = useState(samples['Variables']);
  const [trace, setTrace] = useState(starterTrace);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [apiStatus, setApiStatus] = useState('unknown');

  const step = trace.steps?.[active];
  const codeLines = useMemo(() => code.split('\n'), [code]);
  const vars = step?.variables || {};

  async function visualize() {
    setBusy(true);
    setTrace(starterTrace);
    setActive(0);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      const data = await response.json();
      setTrace(data);
      setApiStatus('connected');
    } catch (error) {
      setApiStatus('offline');
      setTrace({
        ok: false,
        summary: 'Could not connect to the backend. Start FastAPI in the backend terminal and try again.',
        error: 'Backend not reachable at http://127.0.0.1:8000. Check that uvicorn is running.',
        steps: [],
        output: '',
      });
    } finally {
      setBusy(false);
    }
  }

  function selectSample(name) {
    setCode(samples[name]);
    setTrace(starterTrace);
    setActive(0);
  }

  function previous() { setActive((n) => Math.max(0, n - 1)); }
  function next() { setActive((n) => Math.min((trace.steps?.length || 1) - 1, n + 1)); }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="CodeTrail home">
          <span className="brand-mark"><Code2 size={22} /></span>
          <span>Code<span className="brand-accent">Trail</span><small>VISUAL PYTHON LAB</small></span>
        </a>
        <div className="topbar-right">
          <span className={`status-pill ${apiStatus === 'connected' ? 'online' : ''}`}><span className="status-dot" />{apiStatus === 'connected' ? 'API connected' : apiStatus === 'offline' ? 'API offline' : 'Ready to learn'}</span>
          <a className="github-link" href="https://github.com/" target="_blank" rel="noreferrer">GitHub <ArrowRight size={14} /></a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={14} /> LEARN BY SEEING</div>
            <h1>Every line has a story.<br /><span>Watch it unfold.</span></h1>
            <p>Understand Python from the inside out. Step through your code, follow variables, and learn why errors happen — one moment at a time.</p>
            <div className="hero-points">
              <span><CheckCircle2 size={15} /> Step-by-step execution</span>
              <span><CheckCircle2 size={15} /> Beginner-friendly insights</span>
              <span><CheckCircle2 size={15} /> Safe learning simulator</span>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="orbit orbit-one"></div><div className="orbit orbit-two"></div>
            <div className="visual-core"><Code2 size={44} /></div>
            <div className="float-card float-card-top"><span className="mini-dot purple"></span> variable <b>total = 30</b></div>
            <div className="float-card float-card-bottom"><Activity size={16} /> Execution trace <b>04 steps</b></div>
            <div className="visual-spark spark-one">✦</div><div className="visual-spark spark-two">✧</div>
          </div>
        </section>

        <section className="workspace">
          <div className="section-heading">
            <div><span className="section-kicker">YOUR WORKSPACE</span><h2>Python visualizer</h2></div>
            <div className="workspace-badge"><ShieldCheck size={15} /> AST-based safe simulator</div>
          </div>

          <div className="sample-row">
            <span className="sample-label">TRY A SAMPLE</span>
            {Object.keys(samples).map((name) => <button key={name} className={`sample-chip ${code === samples[name] ? 'selected' : ''}`} onClick={() => selectSample(name)}>{name}</button>)}
          </div>

          <div className="work-grid">
            <section className="panel editor-panel">
              <div className="panel-header"><div className="panel-title"><span className="panel-icon"><Code2 size={16} /></span><div><b>Code editor</b><small>main.py</small></div></div><span className="language-pill">Python 3</span></div>
              <div className="editor">
                <div className="line-numbers">{codeLines.map((_, i) => <span key={i} className={step?.line === i + 1 ? 'current-line-number' : ''}>{String(i + 1).padStart(2, '0')}</span>)}</div>
                <textarea spellCheck="false" aria-label="Python code editor" value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              <div className="editor-footer"><span><span className="tiny-green-dot"></span> Python syntax practice</span><span>{code.length} characters</span></div>
              <button className="run-button" onClick={visualize} disabled={busy || !code.trim()}><Play size={17} fill="currentColor" />{busy ? 'Visualizing…' : 'Visualize code'}<span>Ctrl ↵</span></button>
              <p className="safe-note"><ShieldCheck size={14} /> Code is analyzed by a limited AST simulator — arbitrary Python is not executed.</p>
            </section>

            <section className="panel trace-panel">
              <div className="panel-header"><div className="panel-title"><span className="panel-icon purple-icon"><Activity size={16} /></span><div><b>Execution journey</b><small>Follow each step</small></div></div><span className="step-counter">{trace.steps?.length ? `${active + 1} / ${trace.steps.length}` : '0 steps'}</span></div>
              <div className="trace-content">
                {trace.steps?.length ? (
                  <>
                    <div className="trace-progress"><div style={{ width: `${((active + 1) / trace.steps.length) * 100}%` }} /></div>
                    <div className="active-step">
                      <div className="step-topline"><span className="step-number">STEP {String(active + 1).padStart(2, '0')}</span><span className={`kind-tag ${step?.kind || ''}`}>{step?.kind || 'execute'}</span></div>
                      <div className="active-code"><span className="line-pointer">›</span><code>{step?.source || '(no source)'}</code></div>
                      <p className="step-message">{step?.message}</p>
                    </div>
                    <div className="step-controls"><button onClick={previous} disabled={active === 0}><ArrowLeft size={15} /> Previous</button><button onClick={next} disabled={active >= trace.steps.length - 1}>Next <ArrowRight size={15} /></button></div>
                    <div className="mini-timeline">{trace.steps.map((s, i) => <button key={i} title={`Step ${i + 1}: ${s.message}`} onClick={() => setActive(i)} className={`timeline-dot ${i === active ? 'active' : ''} ${i < active ? 'done' : ''}`} />)}</div>
                  </>
                ) : (
                  <div className="empty-state"><div className="empty-icon"><Zap size={24} /></div><b>Your code journey starts here</b><p>Choose a sample, then click <strong>Visualize code</strong> to see each step.</p><div className="empty-mini"><span>01</span> Read the line <ArrowRight size={13} /><span>02</span> Track values <ArrowRight size={13} /><span>03</span> Understand</div></div>
                )}
                {trace.error && <div className="error-box"><Bug size={17} /><div><b>Let's understand the issue</b><p>{trace.error}</p></div></div>}
              </div>
            </section>
          </div>

          <div className="lower-grid">
            <section className="panel data-panel">
              <div className="panel-header"><div className="panel-title"><span className="panel-icon orange-icon"><Cpu size={16} /></span><div><b>Variable memory</b><small>Current step snapshot</small></div></div><span className="muted-count">{Object.keys(vars).length} variables</span></div>
              <div className="memory-content">
                {Object.keys(vars).length ? Object.entries(vars).map(([name, value]) => <div className="variable-row" key={name}><span className="variable-symbol">$</span><code>{name}</code><span className="equals">=</span><code className="variable-value">{JSON.stringify(value)}</code><span className="value-type">{Array.isArray(value) ? 'list' : value === null ? 'None' : typeof value}</span></div>) : <div className="small-empty">Variables will appear here as your code runs.</div>}
              </div>
            </section>
            <section className="panel output-panel">
              <div className="panel-header"><div className="panel-title"><span className="panel-icon green-icon"><Terminal size={16} /></span><div><b>Program output</b><small>Console</small></div></div><span className="live-label"><span></span> OUTPUT</span></div>
              <pre className="console">{step?.output || (trace.output ? trace.output : 'Output will appear here…')}</pre>
            </section>
          </div>

          <div className="insight-strip">
            <div className="insight-icon"><GraduationCap size={21} /></div><div><b>Learning tip</b><p>Debugging is a skill, not a talent. Read the error, inspect the values, and change one thing at a time.</p></div><div className="insight-side"><BookOpen size={17} /> Learn by doing</div>
          </div>
        </section>
      </main>

      <footer><div className="footer-brand"><Code2 size={17} /> CodeTrail</div><span>Built for curious minds · Learn one line at a time</span><span className="footer-version">MVP v1.0</span></footer>
    </div>
  );
}

export default App;
