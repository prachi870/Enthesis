import { ArrowDown, ArrowRight, ArrowUpRight, BookOpenText, BrainCircuit, FileCheck2, FileOutput, FileText, SearchCheck, Sparkles } from 'lucide-react'

const stages = [
  {
    number: '01',
    title: 'Create',
    description: 'Turn your project information into structured academic work.',
    icon: BookOpenText,
    tone: 'cyan',
  },
  {
    number: '02',
    title: 'Analyze',
    description: 'Examine related work, novelty, weaknesses, clarity, and reviewer-style concerns.',
    icon: SearchCheck,
    tone: 'blue',
  },
  {
    number: '03',
    title: 'Improve',
    description: 'Understand findings through evidence and actionable recommendations.',
    icon: BrainCircuit,
    tone: 'violet',
  },
  {
    number: '04',
    title: 'Export',
    description: 'Create polished research papers and reports in the required format.',
    icon: FileOutput,
    tone: 'mint',
  },
]

const features = [
  {
    title: 'Research Paper Builder',
    description: 'Turn your project documents and ideas into a structured research paper.',
    icon: BookOpenText,
    tone: 'cyan',
    tag: 'Research writing',
  },
  {
    title: 'Research Analysis',
    description: 'Analyze related work, potential novelty, weaknesses, clarity, and reviewer-style concerns.',
    icon: BrainCircuit,
    tone: 'violet',
    tag: 'Five analysis lenses',
  },
  {
    title: 'Evidence Explorer',
    description: 'Understand why a finding was detected and trace it back to supporting evidence.',
    icon: SearchCheck,
    tone: 'blue',
    tag: 'Evidence-led insights',
  },
]

const workflow = [
  ['Your Documents', 'Start with material you provide.'],
  ['Enthesis Understands', 'Organize the content and its structure.'],
  ['Missing Information Identified', 'See what still needs your input.'],
  ['Research / Report Generated', 'Build a draft from the information supplied.'],
  ['Analyze & Improve', 'Review findings, evidence, and next steps.'],
  ['Export', 'Prepare a document in the format you need.'],
]

function AuthProductIntro() {
  return (
    <div className="auth-product-intro">
      <section className="auth-intro-section auth-process-section" aria-labelledby="auth-process-title">
        <div className="auth-section-heading">
          <p className="auth-section-kicker"><Sparkles size={14} /> THE ENTHESIS APPROACH</p>
          <h2 id="auth-process-title">From project idea to <span>stronger research.</span></h2>
          <p>One considered process—from your first notes to a document ready to share.</p>
        </div>
        <div className="auth-stage-pipeline">
          {stages.map(({ number, title, description, icon: Icon, tone }, index) => (
            <article className={`auth-stage-card auth-tone-${tone}`} key={title} style={{ '--stage-index': index }}>
              <div className="auth-stage-topline">
                <span className="auth-stage-number">{number}</span>
                <span className="auth-stage-icon"><Icon size={19} /></span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              {index < stages.length - 1 && <ArrowRight className="auth-stage-arrow" size={18} aria-hidden="true" />}
            </article>
          ))}
        </div>
      </section>

      <section className="auth-intro-section auth-features-section" aria-labelledby="auth-features-title">
        <div className="auth-section-heading auth-section-heading-row">
          <div>
            <p className="auth-section-kicker"><BrainCircuit size={14} /> A WORKSPACE FOR REAL ACADEMIC WORK</p>
            <h2 id="auth-features-title">What can Enthesis <span>help you do?</span></h2>
          </div>
          <p>Useful tools for building, examining, and presenting your own work.</p>
        </div>
        <div className="auth-feature-grid">
          {features.map(({ title, description, icon: Icon, tone, tag }, index) => (
            <article className={`auth-feature-card auth-tone-${tone}`} key={title} style={{ '--stage-index': index }}>
              <div className="auth-feature-icon"><Icon size={21} /></div>
              <span className="auth-feature-tag">{tag}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="auth-feature-decoration" aria-hidden="true"><Icon size={74} /></span>
            </article>
          ))}
        </div>

        <article className="auth-college-card">
          <div className="auth-college-icon"><FileCheck2 size={22} /></div>
          <div className="auth-college-copy">
            <p className="auth-college-label">A separate report workflow</p>
            <h3>College Report Generator</h3>
            <p>Use your college's sample format to create a project report based on your own information.</p>
          </div>
          <span className="auth-college-mark" aria-hidden="true"><FileText size={48} /></span>
        </article>
      </section>

      <section className="auth-intro-section auth-workflow-section" aria-labelledby="auth-workflow-title">
        <div className="auth-section-heading">
          <p className="auth-section-kicker"><FileCheck2 size={14} /> FROM SOURCE TO FINISHED DOCUMENT</p>
          <h2 id="auth-workflow-title">Your work stays <span>at the center.</span></h2>
          <p>Enthesis helps organize and strengthen what you provide—missing facts are brought back to you.</p>
        </div>
        <ol className="auth-workflow">
          {workflow.map(([title, description], index) => (
            <li className="auth-workflow-step" key={title} style={{ '--stage-index': index }}>
              <span className="auth-workflow-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="auth-workflow-copy">
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              {index < workflow.length - 1 && <ArrowDown size={15} className="auth-workflow-arrow" aria-hidden="true" />}
            </li>
          ))}
        </ol>

        <section className="auth-final-cta" aria-labelledby="auth-cta-title">
          <div className="auth-cta-orbit auth-cta-orbit-one" aria-hidden="true" />
          <div className="auth-cta-orbit auth-cta-orbit-two" aria-hidden="true" />
          <div className="auth-cta-content">
            <p className="auth-section-kicker"><Sparkles size={14} /> BEGIN WITH YOUR IDEA</p>
            <h2 id="auth-cta-title">Your research deserves<br />more than a blank page.</h2>
            <p>Build. Analyze. Refine.</p>
            <a href="#sign-in" className="auth-cta-button">
              Enter Enthesis <ArrowUpRight size={17} />
            </a>
          </div>
        </section>
      </section>
    </div>
  )
}

export default AuthProductIntro
