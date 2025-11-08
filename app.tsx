import React, { useState, useEffect } from "react";

const GeniDocReact = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSearchTab, setActiveSearchTab] = useState("find-talent");
  const [language, setLanguage] = useState("fr");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.pageYOffset > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div>
      <style>{`
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        :root {
          --color-primary: #2563eb;
          --color-primary-hover: #1d4ed8;
          --color-primary-light: #dbeafe;
          --color-accent: #10b981;
          --color-accent-dark: #059669;
          --color-accent-medical: #8b5cf6;
          --color-gold: #f59e0b;
          --color-gold-light: #fef3c7;
          --color-text-primary: #0f172a;
          --color-text-secondary: #475569;
          --color-text-muted: #94a3b8;
          --color-bg-primary: #ffffff;
          --color-bg-secondary: #fafafa;
          --color-bg-alt: #f8fafc;
          --color-border: #e2e8f0;
          --color-border-light: #f1f5f9;
          --color-success: #10b981;
          --color-error: #ef4444;
          --font-primary: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          --font-size-xs: 0.75rem;
          --font-size-sm: 0.875rem;
          --font-size-base: 1rem;
          --font-size-lg: 1.125rem;
          --font-size-xl: 1.25rem;
          --font-size-2xl: 1.5rem;
          --font-size-3xl: 2.25rem;
          --font-size-4xl: 3.5rem;
          --font-size-5xl: 4.5rem;
          --font-weight-normal: 400;
          --font-weight-medium: 500;
          --font-weight-semibold: 600;
          --font-weight-bold: 700;
          --font-weight-extrabold: 800;
          --line-height-tight: 1.25;
          --line-height-normal: 1.5;
          --line-height-relaxed: 1.75;
          --spacing-xs: 0.25rem;
          --spacing-sm: 0.5rem;
          --spacing-md: 1rem;
          --spacing-lg: 1.75rem;
          --spacing-xl: 2.75rem;
          --spacing-2xl: 4.5rem;
          --spacing-3xl: 6.5rem;
          --spacing-4xl: 9rem;
          --radius-sm: 0.375rem;
          --radius-md: 0.625rem;
          --radius-lg: 0.875rem;
          --radius-xl: 1.125rem;
          --radius-2xl: 1.75rem;
          --radius-full: 9999px;
          --shadow-sm: 2px 2px 4px rgba(0, 0, 0, 0.06);
          --shadow-md: 3px 6px 12px rgba(0, 0, 0, 0.08);
          --shadow-lg: 4px 12px 24px rgba(0, 0, 0, 0.09);
          --shadow-xl: 6px 20px 36px rgba(0, 0, 0, 0.11);
          --shadow-2xl: 8px 32px 56px rgba(0, 0, 0, 0.14);
          --transition-fast: 180ms cubic-bezier(0.34, 1.56, 0.64, 1);
          --transition-base: 320ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
          --transition-slow: 520ms cubic-bezier(0.17, 0.55, 0.55, 1);
          --container-max-width: 1280px;
          --container-padding: 1rem;
          --header-height: 72px;
        }

        html {
          scroll-behavior: smooth;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background-attachment: fixed;
        }

        body {
          font-family: var(--font-primary);
          font-size: var(--font-size-base);
          line-height: var(--line-height-normal);
          color: var(--color-text-primary);
          background-color: var(--color-bg-primary);
          overflow-x: hidden;
        }

        .container {
          max-width: var(--container-max-width);
          margin: 0 auto;
          padding: 0 var(--container-padding);
        }

        @media (min-width: 640px) {
          .container {
            padding: 0 2rem;
          }
        }

        .site-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid transparent;
          transition: all var(--transition-base);
          height: var(--header-height);
        }

        .site-header.scrolled {
          border-bottom-color: var(--color-border);
          box-shadow: var(--shadow-sm);
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: var(--header-height);
          padding: 0 1.5rem;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: var(--color-text-primary);
          font-weight: 700;
          font-size: var(--font-size-xl);
        }

        .logo-icon {
          color: var(--color-primary);
        }

        .logo-text {
          font-weight: 800;
        }

        .nav {
          display: none;
        }

        @media (min-width: 768px) {
          .nav {
            display: flex;
            gap: 2rem;
            list-style: none;
          }
        }

        .nav a {
          color: var(--color-text-secondary);
          text-decoration: none;
          font-weight: 500;
          font-size: var(--font-size-sm);
          transition: color var(--transition-fast);
          position: relative;
        }

        .nav a:hover {
          color: var(--color-primary);
        }

        .nav a::after {
          content: "";
          position: absolute;
          bottom: -8px;
          left: 0;
          width: 0;
          height: 2px;
          background-color: var(--color-primary);
          transition: width var(--transition-base);
        }

        .nav a:hover::after {
          width: 100%;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.5rem;
          font-size: var(--font-size-base);
          font-weight: 600;
          line-height: 1;
          border-radius: var(--radius-lg);
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-decoration: none;
          white-space: nowrap;
          position: relative;
          overflow: hidden;
        }

        .btn-primary {
          background-color: var(--color-primary);
          color: white;
          box-shadow: var(--shadow-sm);
        }

        .btn-primary:hover {
          background-color: var(--color-primary-hover);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }

        .btn-ghost {
          background-color: transparent;
          color: var(--color-text-primary);
        }

        .btn-ghost:hover {
          background-color: var(--color-bg-secondary);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        @media (min-width: 768px) {
          .header-actions {
            gap: 1rem;
          }
        }

        .hero {
          min-height: 600px;
          padding: 3rem 0;
          display: flex;
          align-items: center;
        }

        @media (min-width: 768px) {
          .hero {
            padding: 4rem 0;
          }
        }

        .hero-title {
          font-size: var(--font-size-4xl);
          font-weight: 800;
          line-height: var(--line-height-tight);
          color: var(--color-text-primary);
          margin: 1rem 0 1.5rem;
        }

        @media (min-width: 768px) {
          .hero-title {
            font-size: var(--font-size-5xl);
          }
        }

        .lead {
          font-size: var(--font-size-lg);
          line-height: var(--line-height-relaxed);
          color: var(--color-text-secondary);
          margin-bottom: 2rem;
        }

        .hero-ctas {
          display: flex;
          gap: 1rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }

        .search-bar-wrapper {
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          padding: 2.5rem 0;
          position: relative;
        }

        .search-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-radius: 50px;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.4rem;
          width: fit-content;
          backdrop-filter: blur(10px);
        }

        .search-tab {
          padding: 0.75rem 2rem;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
          border-radius: 50px;
          cursor: pointer;
          font-family: var(--font-primary);
          font-size: 1rem;
          transition: all var(--transition-base);
        }

        .search-tab:hover {
          color: white;
        }

        .search-tab.active {
          background: rgba(255, 255, 255, 0.95);
          color: #2a2a2a;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .search-tab-content {
          display: none;
          animation: fadeInSearch 300ms ease-out;
        }

        .search-tab-content.active {
          display: block;
        }

        @keyframes fadeInSearch {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .search-input {
          width: 100%;
          padding: 0.875rem 1.25rem;
          border: none;
          border-radius: 50px;
          background: white;
          font-family: var(--font-primary);
          font-size: 1rem;
          color: #2a2a2a;
          transition: all var(--transition-base);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .search-input::placeholder {
          color: #9a9190;
        }

        .search-input:focus {
          outline: none;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.2);
          transform: translateY(-2px);
        }

        .search-button {
          background: black;
          color: white;
          border: none;
          padding: 0.875rem 2rem;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-primary);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all var(--transition-base);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          white-space: nowrap;
        }

        .search-button:hover {
          background: #1a1a1a;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        }

        .features-section {
          padding: 4rem 0;
        }

        .section-header {
          text-align: center;
          max-width: 800px;
          margin: 0 auto 3rem;
        }

        .section-title {
          font-size: var(--font-size-3xl);
          font-weight: 800;
          line-height: var(--line-height-tight);
          color: var(--color-text-primary);
          margin: 1rem 0 1rem;
        }

        @media (min-width: 768px) {
          .section-title {
            font-size: var(--font-size-4xl);
          }
        }

        .section-subtitle {
          font-size: var(--font-size-lg);
          line-height: var(--line-height-relaxed);
          color: var(--color-text-secondary);
        }

        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .feature-card {
          padding: 2rem;
          border-radius: var(--radius-xl);
          background-color: white;
          border: 1px solid var(--color-border-light);
          transition: all var(--transition-base);
        }

        .feature-card:hover {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-lg);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          background-color: var(--color-primary-light);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }

        .feature-card h3 {
          font-size: var(--font-size-xl);
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: 0.75rem;
        }

        .feature-card p {
          font-size: var(--font-size-base);
          line-height: var(--line-height-relaxed);
          color: var(--color-text-secondary);
        }

        .stats-section {
          padding: 3rem 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-card {
          text-align: center;
          padding: 1.5rem;
        }

        .stat-number {
          font-size: var(--font-size-4xl);
          font-weight: 800;
          color: var(--color-primary);
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .testimonials-section {
          padding: 4rem 0;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .testimonials-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .testimonials-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .testimonial-card {
          padding: 2rem;
          border-radius: var(--radius-xl);
          background-color: white;
          border: 1px solid var(--color-border);
          position: relative;
          transition: all var(--transition-base);
        }

        .testimonial-card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-4px);
        }

        .testimonial-text {
          font-size: var(--font-size-base);
          line-height: var(--line-height-relaxed);
          color: var(--color-text-primary);
          margin-bottom: 1.5rem;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .author-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: var(--color-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: var(--font-size-sm);
        }

        .author-name {
          font-weight: 600;
          color: var(--color-text-primary);
          font-size: var(--font-size-base);
        }

        .author-role {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .cta-final {
          background-color: var(--color-primary);
          color: white;
          padding: 4rem 0;
          text-align: center;
        }

        .cta-title {
          font-size: var(--font-size-4xl);
          font-weight: 800;
          line-height: var(--line-height-tight);
          margin-bottom: 1rem;
        }

        .cta-subtitle {
          font-size: var(--font-size-lg);
          line-height: var(--line-height-relaxed);
          opacity: 0.9;
          margin-bottom: 2rem;
        }

        .site-footer {
          background-color: var(--color-text-primary);
          color: white;
          padding: 3rem 0 1.5rem;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 640px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .footer-grid {
            grid-template-columns: 2fr 1fr 1fr 1fr;
          }
        }

        .footer-logo {
          font-size: var(--font-size-xl);
          font-weight: 800;
          color: white;
          text-decoration: none;
          display: inline-block;
          margin-bottom: 1rem;
        }

        .footer-heading {
          font-size: var(--font-size-base);
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .footer-links {
          list-style: none;
        }

        .footer-links li {
          margin-bottom: 0.75rem;
        }

        .footer-links a {
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          font-size: var(--font-size-sm);
          transition: color var(--transition-fast);
        }

        .footer-links a:hover {
          color: white;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 1.5rem;
          text-align: center;
        }

        .copyright {
          font-size: var(--font-size-sm);
          opacity: 0.6;
        }

        .badge {
          display: inline-block;
          padding: 0.375rem 0.875rem;
          font-size: var(--font-size-sm);
          font-weight: 500;
          border-radius: var(--radius-full);
          line-height: 1;
        }

        .badge-accent {
          background-color: var(--color-primary-light);
          color: var(--color-primary);
        }

        @media (max-width: 767px) {
          .hero-ctas {
            flex-direction: column;
          }

          .hero-ctas .btn {
            width: 100%;
          }
        }
      `}</style>

      {/* HEADER */}
      <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
        <div className="header-inner">
          <a href="#" className="logo">
            <span className="logo-icon">🏥</span>
            <span className="logo-text">GeniDoc</span>
          </a>
          <nav className="nav">
            <a href="#features">Fonctionnalités</a>
            <a href="#stats">Statistiques</a>
            <a href="#testimonials">Témoignages</a>
          </nav>
          <div className="header-actions">
            <button className="btn btn-ghost">Connexion</button>
            <button className="btn btn-primary">Inscription</button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="container" style={{ width: "100%" }}>
          <div className="hero-content">
            <h1 className="hero-title">
              Votre santé mérite mieux qu'une salle d'attente
            </h1>
            <p className="lead">
              Trouvez un médecin, CHU ou clinique en quelques secondes. Prenez
              rendez-vous aussi facilement que commander un café.
            </p>
            <div className="hero-ctas">
              <button className="btn btn-primary">Commencer</button>
              <button className="btn btn-ghost">Voir la démo</button>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH BAR */}
      <section className="search-bar-wrapper">
        <div className="container">
          <div className="search-tabs">
            <button
              className={`search-tab ${
                activeSearchTab === "find-talent" ? "active" : ""
              }`}
              onClick={() => setActiveSearchTab("find-talent")}
            >
              Trouver un Médecin
            </button>
            <button
              className={`search-tab ${
                activeSearchTab === "browse-jobs" ? "active" : ""
              }`}
              onClick={() => setActiveSearchTab("browse-jobs")}
            >
              Parcourir les Soins
            </button>
          </div>

          <div>
            {activeSearchTab === "find-talent" && (
              <div className="search-tab-content active">
                <div
                  style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}
                >
                  <input
                    type="text"
                    placeholder="Spécialité, médecin ou symptôme..."
                    className="search-input"
                    style={{ flex: 1 }}
                  />
                  <button className="search-button">🔍 Rechercher</button>
                </div>
              </div>
            )}
            {activeSearchTab === "browse-jobs" && (
              <div className="search-tab-content active">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1.5fr auto",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Cherchez un médecin, spécialité..."
                    className="search-input"
                  />
                  <input
                    type="text"
                    placeholder="Votre localisation..."
                    className="search-input"
                  />
                  <button className="search-button">🔍 Rechercher</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="badge badge-accent">Fonctionnalités</span>
            <h2 className="section-title">Pourquoi GeniDoc Change Tout</h2>
            <p className="section-subtitle">
              Des outils puissants pour transformer votre parcours médical
            </p>
          </div>
          <div className="features-grid">
            {[
              {
                icon: "🎯",
                title: "Consultations Flexibles",
                desc: "Cabinet ou téléconsultation. Vous choisissez. 1 247 médecins marocains disponibles.",
              },
              {
                icon: "⚡",
                title: "Rapide & Simple",
                desc: "Trouvez un créneau en quelques secondes. Plus de files d'attente.",
              },
              {
                icon: "🔒",
                title: "Données Sécurisées",
                desc: "Chiffrement bout-à-bout. Conformité RGPD garantie.",
              },
              {
                icon: "💊",
                title: "Analyses & Vaccins",
                desc: "Trouvez un labo, prenez rendez-vous automatiquement.",
              },
              {
                icon: "📱",
                title: "Ordonnances en Ligne",
                desc: "Renouvellement automatique des traitements.",
              },
              {
                icon: "📊",
                title: "Suivi Intelligent",
                desc: "Historique médical centralisé avec alertes personnalisées.",
              },
            ].map((feature, idx) => (
              <div key={idx} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">8,423+</div>
              <div className="stat-label">Patients Satisfaits</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">1,247+</div>
              <div className="stat-label">Médecins Disponibles</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">500+</div>
              <div className="stat-label">Établissements Partenaires</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">98%</div>
              <div className="stat-label">Satisfaction Client</div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <span className="badge badge-accent">Témoignages</span>
            <h2 className="section-title">Ce que disent nos patients</h2>
            <p className="section-subtitle">
              Des milliers de patients au Maroc font déjà confiance à GeniDoc
            </p>
          </div>
          <div className="testimonials-grid">
            {[
              {
                text: "GeniDoc a complètement changé ma façon de gérer ma santé. J'ai pu consulter un cardiologue en téléconsultation en moins de 24h.",
                name: "Youssef BENALI",
                role: "Patient Premium, Casablanca",
                avatar: "YB",
              },
              {
                text: "Avec le plan Famille, toute ma famille a accès aux meilleurs médecins. Les téléconsultations nous font gagner énormément de temps.",
                name: "Sanaa KHALIL",
                role: "Patiente Famille, Rabat",
                avatar: "SK",
              },
              {
                text: "Je n'imaginais pas pouvoir renouveler mes ordonnances en deux clics. C'est devenu mon application préférée.",
                name: "Mohammed HASSAN",
                role: "Patient Standard, Fès",
                avatar: "MH",
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="testimonial-card">
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.avatar}</div>
                  <div>
                    <div className="author-name">{testimonial.name}</div>
                    <div className="author-role">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-final">
        <div className="container">
          <h2 className="cta-title">Prêt à Prendre Soin de Votre Santé ?</h2>
          <p className="cta-subtitle">
            Rejoignez des milliers de patients qui ont transformé leur parcours
            médical
          </p>
          <button
            className="btn btn-primary"
            style={{ background: "white", color: "var(--color-primary)" }}
          >
            Commencer Maintenant
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <a href="#" className="footer-logo">
                GeniDoc
              </a>
              <p style={{ fontSize: "var(--font-size-sm)", opacity: 0.8 }}>
                Votre partenaire santé de confiance
              </p>
            </div>
            <div>
              <h4 className="footer-heading">Produit</h4>
              <ul className="footer-links">
                <li>
                  <a href="#">Fonctionnalités</a>
                </li>
                <li>
                  <a href="#">Télécharger</a>
                </li>
                <li>
                  <a href="#">API</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="footer-heading">Entreprise</h4>
              <ul className="footer-links">
                <li>
                  <a href="#">À propos</a>
                </li>
                <li>
                  <a href="#">Blog</a>
                </li>
                <li>
                  <a href="#">Carrières</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="footer-heading">Légal</h4>
              <ul className="footer-links">
                <li>
                  <a href="#">Confidentialité</a>
                </li>
                <li>
                  <a href="#">Conditions</a>
                </li>
                <li>
                  <a href="#">RGPD</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="copyright">
              © 2025 GeniDoc. Créé avec ❤️ pour révolutionner la santé au Maroc.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GeniDocReact;
