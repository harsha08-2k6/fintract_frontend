import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Check,
  ClipboardList,
  LockKeyhole,
  Menu,
  PiggyBank,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  WalletCards,
  X
} from 'lucide-react';

const features = [
  {
    icon: ReceiptText,
    title: 'Expense Tracking',
    text: 'Capture everyday spending and keep every expense organized.',
    intro: 'Keep daily spending organized in one clear expense workspace.',
    details: ['Record and organize daily expenses.', 'Categorize spending.', 'Monitor where money goes.', 'Maintain an organized expense history.'],
    howItWorks: 'Add expenses, assign categories, and review your history whenever you need a clearer view of your spending.'
  },
  {
    icon: TrendingUp,
    title: 'Income Management',
    text: 'Bring income into one clear view and stay close to your goals.',
    intro: 'Bring your earnings together so your income stays easy to understand.',
    details: ['Record different income sources.', 'Monitor total income.', 'Maintain income history.', 'Understand your earnings.'],
    howItWorks: 'Record income entries and review the history to understand how your earnings change over time.'
  },
  {
    icon: PiggyBank,
    title: 'Budget Planning',
    text: 'Create practical budgets that make better decisions easier.',
    intro: 'Set practical spending boundaries and keep your plans visible.',
    details: ['Create monthly budgets.', 'Set category-wise spending limits.', 'Monitor budget utilization.', 'Manage spending more effectively.'],
    howItWorks: 'Create a budget, define category limits, and use the dashboard to track how your spending compares with the plan.'
  },
  {
    icon: BarChart3,
    title: 'Financial Analytics',
    text: 'See patterns in your habits with focused, useful insights.',
    intro: 'Turn organized financial activity into useful patterns and insights.',
    details: ['Understand spending patterns.', 'View category-wise expense distribution.', 'Analyze income and expenses.', 'Make informed financial decisions.'],
    howItWorks: 'Use the analytics views to compare income and expenses and explore how spending is distributed across categories.'
  },
  {
    icon: ClipboardList,
    title: 'Transaction Management',
    text: 'Review and manage your financial activity with confidence.',
    intro: 'Keep financial activity organized from one transaction history.',
    details: ['View transaction history.', 'Add and manage transactions.', 'Edit or delete existing transactions.', 'Organize financial activities.'],
    howItWorks: 'Open your transaction history to review activity, add new entries, or update and remove existing transactions.'
  },
  {
    icon: WalletCards,
    title: 'Reports and Insights',
    text: 'Turn organized information into a clearer financial picture.',
    intro: 'Review summarized financial activity through focused reports.',
    details: ['Generate financial reports.', 'Review spending summaries.', 'Understand financial trends.', 'Analyze financial activity.'],
    howItWorks: 'Open Reports to review summaries and analyze trends from your recorded financial activity.'
  },
  {
    icon: BellRing,
    title: 'Notifications',
    text: 'Stay informed with timely updates from your workspace.',
    intro: 'Stay informed about important updates from your financial workspace.',
    details: ['Receive relevant notifications.', 'Stay informed about financial activities.', 'Get budget-related updates.', 'View important account notifications.'],
    howItWorks: 'Review notifications from the application workspace to keep up with relevant financial and account updates.'
  },
  {
    icon: LockKeyhole,
    title: 'Secure Authentication',
    text: 'Your personal financial workspace is protected from the start.',
    intro: 'Access FinTrack through its existing secure authentication flow.',
    details: ['Secure user registration and login.', 'JWT-based authentication.', 'Protected application routes.', 'Secure access to personal financial information.'],
    howItWorks: 'Register or sign in through the existing authentication pages; protected application areas remain available only after authentication.'
  }
];

const steps = [
  { number: '01', title: 'Create Your Account', text: 'Sign up securely and access your personal financial workspace.' },
  { number: '02', title: 'Manage Your Finances', text: 'Organize income, record expenses and create budgets.' },
  { number: '03', title: 'Understand Your Spending', text: 'Use reports and analytics to understand financial habits and improve money management.' }
];

const FinTrackMark = () => (
  <span className="landing-brand-mark" aria-hidden="true">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  </span>
);

const FeatureModal = ({ feature, onClose }) => {
  const closeButtonRef = useRef(null);
  const Icon = feature.icon;

  useEffect(() => {
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="landing-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="landing-feature-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="landing-feature-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          className="landing-modal-close"
          type="button"
          aria-label="Close feature information"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <div className="landing-feature-icon"><Icon size={22} /></div>
        <h2 id="landing-feature-modal-title">{feature.title}</h2>
        <p className="landing-modal-intro">{feature.intro}</p>
        <h3>Key benefits</h3>
        <ul className="landing-modal-list">
          {feature.details.map((detail) => <li key={detail}><Check size={16} />{detail}</li>)}
        </ul>
        <h3>How it works</h3>
        <p>{feature.howItWorks}</p>
      </section>
    </div>
  );
};

export const LandingPage = ({ onNavigateLogin, onNavigateRegister }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!selectedFeature) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') setSelectedFeature(null);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedFeature]);

  const handleFeatureClick = (feature) => setSelectedFeature(feature);

  const handleFeatureKeyDown = (event, feature) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleFeatureClick(feature);
    }
  };

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <a className="landing-brand" href="#home" onClick={closeMenu} aria-label="FinTrack home">
          <FinTrackMark />
          <span>Fin<span>Track</span></span>
        </a>
        <button className="landing-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={`landing-links ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <a href="#home" onClick={closeMenu}>Home</a>
          <a href="#features" onClick={closeMenu}>Features</a>
          <a href="#how-it-works" onClick={closeMenu}>How It Works</a>
          <a href="#about" onClick={closeMenu}>About Us</a>
          <button className="landing-login-link" onClick={() => { closeMenu(); onNavigateLogin(); }}>Login</button>
          <button className="landing-nav-cta" onClick={() => { closeMenu(); onNavigateRegister(); }}>
            Get Started <ArrowRight size={16} />
          </button>
        </nav>
      </header>

      <main>
        <section className="landing-hero" id="home">
          <div className="landing-hero-copy">
            <div className="landing-eyebrow">A clearer way to manage your money</div>
            <h1>Take Control of Your Finances. <em>Build a Smarter Future.</em></h1>
            <p>Manage your income, track expenses, plan budgets and understand your financial habits with FinTrack. Everything you need to manage your money in one place.</p>
            <div className="landing-actions">
              <button className="landing-primary-button" onClick={onNavigateRegister}>Get Started Free <ArrowRight size={18} /></button>
              <button className="landing-secondary-button" onClick={onNavigateLogin}>Login</button>
            </div>
            <div className="landing-trust-row">
              <span><Check size={15} /> Simple to use</span>
              <span><Check size={15} /> Built for clarity</span>
              <span><Check size={15} /> Secure by design</span>
            </div>
          </div>
          <div className="landing-hero-art" aria-hidden="true">
            <div className="hero-accent-panel">
              <FinTrackMark />
              <span className="hero-accent-line" />
              <span className="hero-accent-line hero-accent-line-short" />
              <span className="hero-accent-caption">Organize. Understand. Grow.</span>
            </div>
            <div className="hero-accent-note"><ShieldCheck size={17} /> Secure by design</div>
          </div>
        </section>

        <section className="landing-section landing-features" id="features">
          <div className="landing-section-heading">
            <div className="landing-eyebrow">Everything in one place</div>
            <h2>Make your money <em>make more sense.</em></h2>
            <p>A focused toolkit for building better financial habits, without the clutter.</p>
          </div>
          <div className="landing-feature-grid">
            {features.map((feature) => {
              const { icon: Icon, title, text } = feature;
              return (
              <article
                className="landing-feature-card"
                key={title}
                role="button"
                tabIndex="0"
                aria-label={`Open ${title}`}
                onClick={() => handleFeatureClick(feature)}
                onKeyDown={(event) => handleFeatureKeyDown(event, feature)}
              >
                <div className="landing-feature-icon"><Icon size={20} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
                <ArrowRight className="landing-feature-arrow" size={17} />
              </article>
              );
            })}
          </div>
        </section>

        <section className="landing-section landing-steps" id="how-it-works">
          <div className="landing-section-heading">
            <div className="landing-eyebrow">A clearer way forward</div>
            <h2>From scattered to <em>sorted.</em></h2>
            <p>FinTrack gives your financial life a simple rhythm you can keep up with.</p>
          </div>
          <div className="landing-step-grid">
            {steps.map((step, index) => (
              <article className="landing-step" key={step.number}>
                <div className="landing-step-number">{step.number}</div>
                {index < steps.length - 1 && <div className="landing-step-connector" />}
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-value-section" id="about">
          <div className="landing-value-glow" />
          <div className="landing-value-copy">
            <div className="landing-eyebrow">Why FinTrack</div>
            <h2>Confidence starts with <em>clarity.</em></h2>
            <p>Good money management should feel approachable. FinTrack helps you build a calm, organized view of your finances so every decision can be more intentional.</p>
            <div className="landing-value-list">
              {['Simple financial management', 'Organized expense tracking', 'Better budget control', 'Clear financial insights', 'Secure account access'].map(item => (
                <span key={item}><Check size={16} /> {item}</span>
              ))}
            </div>
          </div>
          <div className="landing-value-art">
            <div className="value-ring value-ring-one" />
            <div className="value-ring value-ring-two" />
            <div className="value-lock"><ShieldCheck size={42} /></div>
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-cta-inner">
            <div className="landing-eyebrow">Start with a better view</div>
            <h2>Make Every Financial Decision Count.</h2>
            <p>Start organizing your finances and take the next step towards smarter money management.</p>
            <div className="landing-actions">
              <button className="landing-primary-button" onClick={onNavigateRegister}>Get Started <ArrowRight size={18} /></button>
              <button className="landing-ghost-button" onClick={onNavigateLogin}>Login</button>
            </div>
          </div>
        </section>
      </main>

      {selectedFeature && (
        <FeatureModal
          feature={selectedFeature}
          onClose={() => setSelectedFeature(null)}
        />
      )}

      <footer className="landing-footer">
        <div className="landing-footer-main">
          <div className="landing-footer-brand">
            <a className="landing-brand" href="#home"><FinTrackMark /><span>Fin<span>Track</span></span></a>
            <p>A simpler way to understand your money and build a smarter future.</p>
          </div>
          <div className="landing-footer-column"><h3>Explore</h3><a href="#features">Features</a><a href="#how-it-works">How It Works</a><a href="#about">About Us</a></div>
          <div className="landing-footer-column"><h3>Account</h3><button onClick={onNavigateLogin}>Login</button><button onClick={onNavigateRegister}>Registration</button></div>
        </div>
        <div className="landing-footer-bottom"><span>© {new Date().getFullYear()} FinTrack. All rights reserved.</span><span>Organize. Understand. Grow.</span></div>
      </footer>
    </div>
  );
};
