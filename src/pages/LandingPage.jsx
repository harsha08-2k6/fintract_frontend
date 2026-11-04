import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Database,
  KeyRound,
  Layers,
  Menu,
  PiggyBank,
  Receipt,
  Search,
  ShieldCheck,
  Sliders,
  TrendingUp,
  Wallet,
  X
} from 'lucide-react';

const features = [
  {
    icon: Receipt,
    title: 'Expense Tracking',
    description: 'Record and organize expenses with categories that make sense to you.'
  },
  {
    icon: TrendingUp,
    title: 'Income Management',
    description: 'Keep track of your income sources and monitor your monthly earnings.'
  },
  {
    icon: PiggyBank,
    title: 'Monthly Budgets',
    description: 'Set spending limits for individual categories and stay aware of your progress.'
  },
  {
    icon: BarChart3,
    title: 'Financial Analytics',
    description: 'Understand spending habits through monthly summaries and visual reports.'
  },
  {
    icon: Search,
    title: 'Transaction Management',
    description: 'Search, filter, review, and manage your financial records in one place.'
  },
  {
    icon: Layers,
    title: 'Reports & Notifications',
    description: 'Get useful financial summaries and alerts when your spending approaches budget limits.'
  }
];

const steps = [
  {
    number: '01',
    title: 'Create your account',
    text: 'Register and access your personal financial workspace.'
  },
  {
    number: '02',
    title: 'Add your transactions',
    text: 'Record income and expenses, organize categories, and set monthly budgets.'
  },
  {
    number: '03',
    title: 'Review your finances',
    text: 'Monitor spending, review reports, and make informed financial decisions.'
  }
];

const comparisonData = [
  { capability: 'Expense Tracking', spreadsheets: 'Manual', fintrack: 'Organized' },
  { capability: 'Budget Monitoring', spreadsheets: 'Manual formulas', fintrack: 'Category budgets' },
  { capability: 'Income Tracking', spreadsheets: 'Separate sheets', fintrack: 'Unified ledger' },
  { capability: 'Financial Reports', spreadsheets: 'Manual creation', fintrack: 'Automated summaries' },
  { capability: 'Transaction Search', spreadsheets: 'Limited', fintrack: 'Built-in filters' }
];

const securityPillars = [
  {
    icon: KeyRound,
    title: 'JWT-based authentication',
    description: 'Cryptographically signed tokens ensure only authorized users access protected routes.'
  },
  {
    icon: ShieldCheck,
    title: 'API Gateway request management',
    description: 'A central gateway strips unsafe client headers and routes requests to verified services.'
  },
  {
    icon: Sliders,
    title: 'User-level data access controls',
    description: 'Every microservice strictly verifies user ownership before reading, creating, or modifying records.'
  },
  {
    icon: Database,
    title: 'Isolated PostgreSQL databases',
    description: 'Dedicated database boundaries prevent data crossover between microservices.'
  }
];

const faqs = [
  {
    q: 'Do I need to connect my bank account?',
    a: 'No. You can manually record your income and expenses without sharing your banking credentials.'
  },
  {
    q: 'Can I create custom categories?',
    a: 'Yes. Create and manage categories according to your spending habits.'
  },
  {
    q: 'Can I set monthly budgets?',
    a: 'Yes. Assign spending limits to individual categories and monitor your usage.'
  },
  {
    q: 'Does FinTrack support mobile devices?',
    a: 'FinTrack is designed to be accessible through responsive web interfaces.'
  },
  {
    q: 'Is FinTrack free?',
    a: 'Get started with the available free features without requiring a credit card.'
  }
];

const FinTrackMark = () => (
  <span className="brand-mark" aria-hidden="true">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  </span>
);

export const LandingPage = ({ onNavigateLogin, onNavigateRegister }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // Savings Calculator State
  const [calcIncome, setCalcIncome] = useState(80000);
  const [calcExpenses, setCalcExpenses] = useState(45000);
  const [calcRate, setCalcRate] = useState(7);
  const [calcYears, setCalcYears] = useState(3);

  const closeMenu = () => setMenuOpen(false);

  // Calculations
  const monthlySurplus = Math.max(0, calcIncome - calcExpenses);
  const totalBaseSavings = monthlySurplus * 12 * calcYears;
  
  // Future Value with regular monthly deposits at annual rate r
  const monthlyRate = calcRate / 100 / 12;
  const totalMonths = calcYears * 12;
  const projectedWithGrowth = monthlyRate > 0 && monthlySurplus > 0
    ? Math.round(monthlySurplus * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate))
    : totalBaseSavings;
  const potentialGrowth = Math.max(0, projectedWithGrowth - totalBaseSavings);

  const formatINR = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');

  return (
    <div className="ft-landing">
      {/* Navigation */}
      <header className="ft-nav">
        <div className="ft-nav-inner">
          <a className="ft-brand" href="#home" onClick={closeMenu} aria-label="FinTrack Home">
            <FinTrackMark />
            <span>Fin<span>Track</span></span>
          </a>

          <button
            className="ft-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <nav className={`ft-links ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            <a href="#features" onClick={closeMenu}>Features</a>
            <a href="#preview" onClick={closeMenu}>Product Preview</a>
            <a href="#calculator" onClick={closeMenu}>Savings Calculator</a>
            <a href="#how-it-works" onClick={closeMenu}>How It Works</a>
            <a href="#security" onClick={closeMenu}>Security</a>
            <a href="#faq" onClick={closeMenu}>FAQ</a>
            
            <div className="ft-nav-actions">
              <button className="ft-btn-text" onClick={() => { closeMenu(); onNavigateLogin(); }}>
                Sign In
              </button>
              <button className="ft-btn-primary" onClick={() => { closeMenu(); onNavigateRegister(); }}>
                Get Started
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="ft-hero" id="home">
          <div className="ft-hero-header">
            <span className="ft-eyebrow">Personal finance, made clearer</span>
            <h1>Take control of your finances.</h1>
            <p>
              Track income, manage expenses, set monthly budgets, and understand where your money goes.
              FinTrack brings your financial activity together in one simple workspace.
            </p>
            <div className="ft-hero-cta">
              <button className="ft-btn-primary" onClick={onNavigateRegister}>
                Get Started
              </button>
              <a href="#features" className="ft-btn-secondary">
                Explore Features
              </a>
            </div>
            <span className="ft-hero-subtext">No credit card required. Free to get started.</span>
          </div>

          {/* REALISTIC FINTRACK DASHBOARD PREVIEW */}
          <div className="ft-preview-wrapper" id="preview">
            <div className="ft-dashboard-window">
              <div className="ft-window-topbar">
                <div className="ft-window-controls">
                  <span className="ft-ctrl-dot" />
                  <span className="ft-ctrl-dot" />
                  <span className="ft-ctrl-dot" />
                </div>
                <div className="ft-window-path">
                  <span>FinTrack Dashboard</span>
                  <span className="ft-path-sep">/</span>
                  <span className="ft-path-active">October 2026</span>
                </div>
                <div className="ft-window-status">
                  <span className="ft-status-indicator" />
                  <span>Reconciled</span>
                </div>
              </div>

              <div className="ft-dashboard-body">
                {/* 4 Financial Pillar Metric Cards */}
                <div className="ft-metrics-grid">
                  <div className="ft-metric-card">
                    <span className="ft-metric-label">Net Balance</span>
                    <span className="ft-metric-val ft-val-green">₹1,52,400</span>
                    <span className="ft-metric-sub">Monthly cash surplus</span>
                  </div>
                  <div className="ft-metric-card">
                    <span className="ft-metric-label">Income</span>
                    <span className="ft-metric-val">₹2,10,000</span>
                    <span className="ft-metric-sub">Earned this month</span>
                  </div>
                  <div className="ft-metric-card">
                    <span className="ft-metric-label">Expenses</span>
                    <span className="ft-metric-val">₹57,600</span>
                    <span className="ft-metric-sub">Logged outlays</span>
                  </div>
                  <div className="ft-metric-card">
                    <span className="ft-metric-label">Savings Rate</span>
                    <span className="ft-metric-val ft-val-blue">72.5%</span>
                    <span className="ft-metric-sub">Portion of income retained</span>
                  </div>
                </div>

                {/* Dashboard Middle Split: Overview & Budgets */}
                <div className="ft-dashboard-split">
                  {/* Monthly Spending Overview */}
                  <div className="ft-panel">
                    <div className="ft-panel-header">
                      <h3>Monthly Spending Overview</h3>
                      <span className="ft-badge">Current Month</span>
                    </div>
                    <div className="ft-chart-mock">
                      <div className="ft-chart-bars">
                        <div className="ft-bar-col"><div className="ft-bar-fill" style={{ height: '35%' }} /><span>W1</span></div>
                        <div className="ft-bar-col"><div className="ft-bar-fill" style={{ height: '58%' }} /><span>W2</span></div>
                        <div className="ft-bar-col"><div className="ft-bar-fill" style={{ height: '44%' }} /><span>W3</span></div>
                        <div className="ft-bar-col"><div className="ft-bar-fill ft-bar-active" style={{ height: '72%' }} /><span>W4</span></div>
                      </div>
                      <div className="ft-chart-summary">
                        <span>Average daily spend: <strong>₹1,850</strong></span>
                        <span>Spending pace: <strong>On target</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Category Budgets */}
                  <div className="ft-panel">
                    <div className="ft-panel-header">
                      <h3>Category Budgets</h3>
                      <span className="ft-badge">2 of 6 Set</span>
                    </div>
                    <div className="ft-budgets-list">
                      <div className="ft-budget-row">
                        <div className="ft-budget-labels">
                          <span className="ft-budget-name">Food &amp; Dining</span>
                          <span className="ft-budget-amounts">₹12,400 / ₹18,000</span>
                        </div>
                        <div className="ft-progress-track">
                          <div className="ft-progress-fill" style={{ width: '68%', backgroundColor: '#10B981' }} />
                        </div>
                        <span className="ft-budget-foot">68% used • ₹5,600 remaining</span>
                      </div>

                      <div className="ft-budget-row">
                        <div className="ft-budget-labels">
                          <span className="ft-budget-name">Bills &amp; Utilities</span>
                          <span className="ft-budget-amounts">₹8,500 / ₹12,000</span>
                        </div>
                        <div className="ft-progress-track">
                          <div className="ft-progress-fill" style={{ width: '70%', backgroundColor: '#10B981' }} />
                        </div>
                        <span className="ft-budget-foot">70% used • ₹3,500 remaining</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions Table */}
                <div className="ft-panel ft-panel-full">
                  <div className="ft-panel-header">
                    <h3>Recent Transactions</h3>
                    <span className="ft-panel-link">Latest activity</span>
                  </div>
                  <div className="ft-table-wrapper">
                    <table className="ft-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Category</th>
                          <th>Type</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="ft-td-muted">Oct 28, 2026</td>
                          <td className="ft-td-bold">Consulting Client Retainer</td>
                          <td><span className="ft-tag ft-tag-income">Income</span></td>
                          <td className="ft-td-muted">Bank Transfer</td>
                          <td className="ft-td-amount ft-val-green">+₹85,000</td>
                        </tr>
                        <tr>
                          <td className="ft-td-muted">Oct 27, 2026</td>
                          <td className="ft-td-bold">Monthly Grocery Supplies</td>
                          <td><span className="ft-tag">Food &amp; Dining</span></td>
                          <td className="ft-td-muted">Card</td>
                          <td className="ft-td-amount">-₹3,850</td>
                        </tr>
                        <tr>
                          <td className="ft-td-muted">Oct 26, 2026</td>
                          <td className="ft-td-bold">Fiber Internet Subscription</td>
                          <td><span className="ft-tag">Bills &amp; Utilities</span></td>
                          <td className="ft-td-muted">UPI</td>
                          <td className="ft-td-amount">-₹1,499</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="ft-section" id="features">
          <div className="ft-section-header">
            <h2>Everything you need to manage your money.</h2>
            <p>
              A clear view of your finances, from everyday transactions to monthly spending patterns.
            </p>
          </div>

          <div className="ft-features-grid">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <div className="ft-feature-card" key={item.title}>
                  <div className="ft-feature-icon">
                    <Icon size={20} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* PRODUCT PREVIEW HIGHLIGHT SECTION */}
        <section className="ft-section ft-section-alt">
          <div className="ft-section-header">
            <h2>Your finances, all in one place.</h2>
            <p>
              See your income, expenses, budgets, and available balance without switching between
              spreadsheets or multiple applications.
            </p>
            <div style={{ marginTop: '1.5rem' }}>
              <button className="ft-btn-primary" onClick={onNavigateRegister}>
                Explore the Dashboard
              </button>
            </div>
          </div>
        </section>

        {/* SAVINGS CALCULATOR */}
        <section className="ft-section" id="calculator">
          <div className="ft-section-header">
            <h2>See how much you could save.</h2>
            <p>Enter your monthly income and expenses to estimate your potential savings.</p>
          </div>

          <div className="ft-calculator-card">
            <div className="ft-calc-inputs">
              <div className="ft-calc-group">
                <div className="ft-calc-label-row">
                  <label htmlFor="inflow-input">Monthly Income</label>
                  <span className="ft-calc-display">{formatINR(calcIncome)}</span>
                </div>
                <input
                  id="inflow-input"
                  type="range"
                  min="20000"
                  max="400000"
                  step="5000"
                  value={calcIncome}
                  onChange={(e) => setCalcIncome(Number(e.target.value))}
                  className="ft-slider"
                />
                <div className="ft-slider-bounds">
                  <span>₹20,000</span>
                  <span>₹4,00,000</span>
                </div>
              </div>

              <div className="ft-calc-group">
                <div className="ft-calc-label-row">
                  <label htmlFor="outflow-input">Monthly Expenses</label>
                  <span className="ft-calc-display">{formatINR(calcExpenses)}</span>
                </div>
                <input
                  id="outflow-input"
                  type="range"
                  min="10000"
                  max="350000"
                  step="2500"
                  value={calcExpenses}
                  onChange={(e) => setCalcExpenses(Number(e.target.value))}
                  className="ft-slider"
                />
                <div className="ft-slider-bounds">
                  <span>₹10,000</span>
                  <span>₹3,50,000</span>
                </div>
              </div>

              <div className="ft-calc-row-split">
                <div className="ft-calc-group">
                  <div className="ft-calc-label-row">
                    <label htmlFor="rate-input">Investment Growth Rate</label>
                    <span className="ft-calc-display">{calcRate}% p.a.</span>
                  </div>
                  <input
                    id="rate-input"
                    type="range"
                    min="4"
                    max="14"
                    step="1"
                    value={calcRate}
                    onChange={(e) => setCalcRate(Number(e.target.value))}
                    className="ft-slider"
                  />
                </div>

                <div className="ft-calc-group">
                  <label>Time Period</label>
                  <div className="ft-years-toggle">
                    {[1, 3, 5, 10].map((y) => (
                      <button
                        key={y}
                        type="button"
                        className={`ft-year-btn ${calcYears === y ? 'active' : ''}`}
                        onClick={() => setCalcYears(y)}
                      >
                        {y} {y === 1 ? 'Year' : 'Years'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="ft-calc-results">
              <div className="ft-results-title">Your Estimated Savings</div>

              <div className="ft-results-grid">
                <div className="ft-res-item">
                  <span className="ft-res-lbl">Monthly Surplus</span>
                  <span className="ft-res-val ft-val-green">{formatINR(monthlySurplus)}</span>
                  <span className="ft-res-sub">Unspent monthly income</span>
                </div>

                <div className="ft-res-item">
                  <span className="ft-res-lbl">Projected Savings</span>
                  <span className="ft-res-val">{formatINR(totalBaseSavings)}</span>
                  <span className="ft-res-sub">Principal saved over {calcYears} years</span>
                </div>

                <div className="ft-res-item">
                  <span className="ft-res-lbl">Potential Growth</span>
                  <span className="ft-res-val ft-val-blue">{formatINR(potentialGrowth)}</span>
                  <span className="ft-res-sub">Estimated return at {calcRate}% annual growth</span>
                </div>
              </div>

              <div className="ft-total-savings-box">
                <span className="ft-ts-label">Total Estimated Value ({calcYears} Years)</span>
                <span className="ft-ts-value">{formatINR(projectedWithGrowth)}</span>
              </div>

              <button className="ft-btn-primary ft-btn-block" onClick={onNavigateRegister}>
                Create Your Financial Plan
              </button>

              <span className="ft-calc-disclaimer">
                Projections are illustrative estimates, not guaranteed returns.
              </span>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="ft-section ft-section-alt" id="how-it-works">
          <div className="ft-section-header">
            <h2>Getting started is simple.</h2>
            <p>Three straightforward steps to establish your financial workspace.</p>
          </div>

          <div className="ft-steps-grid">
            {steps.map((s) => (
              <div className="ft-step-item" key={s.number}>
                <span className="ft-step-num">{s.number}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* COMPARISON */}
        <section className="ft-section" id="comparison">
          <div className="ft-section-header">
            <h2>A better way to manage everyday finances.</h2>
            <p>Compare the FinTrack workspace against traditional manual spreadsheet tracking.</p>
          </div>

          <div className="ft-comparison-card">
            <table className="ft-comparison-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Spreadsheets</th>
                  <th className="ft-col-highlight">FinTrack</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row) => (
                  <tr key={row.capability}>
                    <td className="ft-td-cap">{row.capability}</td>
                    <td className="ft-td-muted">{row.spreadsheets}</td>
                    <td className="ft-col-highlight ft-td-bold">
                      <Check size={16} className="ft-check-icon" />
                      <span>{row.fintrack}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECURITY & ARCHITECTURE */}
        <section className="ft-section ft-section-alt" id="security">
          <div className="ft-section-header">
            <h2>Your financial data deserves protection.</h2>
            <p>
              FinTrack uses authentication, controlled API access, and isolated microservices to
              protect application operations and user data.
            </p>
          </div>

          <div className="ft-security-grid">
            {securityPillars.map((item) => {
              const Icon = item.icon;
              return (
                <div className="ft-security-card" key={item.title}>
                  <div className="ft-sec-icon">
                    <Icon size={20} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="ft-section" id="faq">
          <div className="ft-section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Common questions about using FinTrack to manage personal finances.</p>
          </div>

          <div className="ft-faq-list">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={faq.q} className={`ft-faq-item ${isOpen ? 'open' : ''}`}>
                  <button
                    className="ft-faq-trigger"
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} className={`ft-faq-chevron ${isOpen ? 'rotated' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="ft-faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="ft-cta-section">
          <div className="ft-cta-box">
            <h2>Make better decisions with your money.</h2>
            <p>
              Bring your income, expenses, and budgets together. Start understanding your finances with
              FinTrack.
            </p>
            <div className="ft-cta-actions">
              <button className="ft-btn-primary" onClick={onNavigateRegister}>
                Get Started Free
              </button>
              <button className="ft-btn-secondary" onClick={onNavigateLogin}>
                Sign In
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="ft-footer">
        <div className="ft-footer-inner">
          <div className="ft-footer-brand">
            <a className="ft-brand" href="#home">
              <FinTrackMark />
              <span>Fin<span>Track</span></span>
            </a>
            <p>
              A simpler way to track income, manage expenses, and understand your finances.
            </p>
          </div>

          <div className="ft-footer-col">
            <h4>Product</h4>
            <a href="#features">Expense Tracking</a>
            <a href="#features">Income Management</a>
            <a href="#features">Category Budgets</a>
            <a href="#features">Analytics &amp; Reports</a>
          </div>

          <div className="ft-footer-col">
            <h4>Resources</h4>
            <a href="#calculator">Savings Calculator</a>
            <a href="#preview">Product Preview</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="ft-footer-col">
            <h4>Account</h4>
            <button type="button" onClick={onNavigateLogin}>Sign In</button>
            <button type="button" onClick={onNavigateRegister}>Create Account</button>
          </div>
        </div>

        <div className="ft-footer-bottom">
          <span>&copy; {new Date().getFullYear()} FinTrack. All rights reserved.</span>
          <span>Organize your finances. Make informed decisions.</span>
        </div>
      </footer>
    </div>
  );
};
