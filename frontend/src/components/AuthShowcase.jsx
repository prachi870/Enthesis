import { BrainCircuit, Sparkles } from 'lucide-react'

function AuthShowcase() {
  return (
    <aside className="auth-showcase" aria-label="About Enthesis">
      <div className="auth-showcase-copy">
        <LinkBrand />
        <div className="auth-eyebrow"><span /> Research, made more thoughtful</div>
        <h2>Think deeper.<br /><span>Write with purpose.</span></h2>
        <p className="auth-showcase-description">
          An AI-powered workspace for creating, analyzing, and improving research.
        </p>
        <div className="auth-hero-pipeline" aria-label="Create, analyze, improve, and export">
          <span>Create</span><i /><span>Analyze</span><i /><span>Improve</span><i /><span>Export</span>
        </div>
      </div>

      <div className="auth-visual" aria-hidden="true">
        <div className="auth-visual-grid" />
        <div className="auth-orbit auth-orbit-outer" />
        <div className="auth-orbit auth-orbit-inner" />
        <div className="auth-orbit-node auth-node-one"><Sparkles size={17} /></div>
        <div className="auth-orbit-node auth-node-two"><BrainCircuit size={17} /></div>
        <div className="auth-paper-stack">
          <div className="auth-paper-back" />
          <div className="auth-paper">
            <div className="auth-paper-brand"><Sparkles size={13} /> ENTHESIS <span>RESEARCH NOTES · 01</span></div>
            <div className="auth-paper-title">Ideas, refined<br />by evidence.</div>
            <div className="auth-paper-rule" />
            <div className="auth-paper-line auth-paper-line-long" />
            <div className="auth-paper-line" />
            <div className="auth-paper-line auth-paper-line-short" />
            <div className="auth-paper-chart">
              <i /><i /><i /><i /><i /><i /><i />
            </div>
            <div className="auth-paper-caption">A better way to move research forward</div>
          </div>
        </div>
        <div className="auth-float-chip auth-chip-top"><span className="auth-chip-dot" /> Evidence-first</div>
        <div className="auth-float-chip auth-chip-bottom"><span>05</span> research lenses</div>
        <div className="auth-visual-glow" />
      </div>
    </aside>
  )
}

function LinkBrand() {
  return (
    <div className="auth-brand">
      <span className="auth-brand-mark"><Sparkles size={20} /></span>
      <span>enthesis<span className="auth-brand-period">.</span></span>
    </div>
  )
}

export default AuthShowcase
