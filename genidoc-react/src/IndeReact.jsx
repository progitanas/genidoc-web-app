import React, { useState, useEffect } from "react";

const IndeReact = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSearchTab, setActiveSearchTab] = useState("find-doctor");
  const [language, setLanguage] = useState("fr");

  const translations = {
    fr: {
      "nav-home": "Accueil",
      "nav-features": "Fonctionnalités",
      "nav-services": "Services",
      "nav-pricing": "Tarifs",
      "nav-faq": "FAQ",
      "nav-testimonials": "Témoignages",
      "btn-login": "Connexion",
      "btn-signup": "Inscription",
      "hero-title": "Votre santé mérite mieux qu'une salle d'attente",
      "hero-subtitle":
        "Trouvez un médecin, CHU ou clinique au Maroc en quelques secondes. Prenez rendez-vous en ligne aussi facilement que commander un café.",
      "btn-start": "Commencer Gratuitement",
      "btn-demo": "Demander une Démo",
      "search-doctor": "Trouver un Médecin",
      "search-care": "Parcourir les Soins",
      "search-placeholder": "Spécialité, médecin ou symptôme...",
      "features-title": "Pourquoi choisir GeniDoc?",
      "features-subtitle": "Des outils puissants pour transformer votre santé",
      "feature-1": "Matching IA Avancé",
      "feature-1-desc":
        "Algorithme qui analyse 200+ critères pour trouver les meilleurs médecins",
      "feature-2": "Consultations Flexibles",
      "feature-2-desc": "Cabinet ou téléconsultation selon vos préférences",
      "feature-3": "Réduction du Temps",
      "feature-3-desc": "Trouvez un rendez-vous en moins de 24 heures",
      "feature-4": "Données Sécurisées",
      "feature-4-desc": "Chiffrement RGPD pour votre confidentialité",
      "feature-5": "Suivi Facile",
      "feature-5-desc": "Interface simple et intuitive pour tous",
      "feature-6": "Support 24/7",
      "feature-6-desc": "Équipe d'experts toujours disponible",
      "services-title": "Nos Services",
      "testimonials-title": "Ce que disent nos patients",
      "faq-title": "Questions fréquemment posées",
    },
    en: {
      "nav-home": "Home",
      "nav-features": "Features",
      "nav-services": "Services",
      "nav-pricing": "Pricing",
      "nav-faq": "FAQ",
      "nav-testimonials": "Testimonials",
      "btn-login": "Login",
      "btn-signup": "Sign Up",
      "hero-title": "Your Health Deserves Better Than a Waiting Room",
      "hero-subtitle":
        "Find a doctor, hospital or clinic in Morocco in seconds. Book appointments online as easily as ordering a coffee.",
      "btn-start": "Start Free",
      "btn-demo": "Request Demo",
      "search-doctor": "Find a Doctor",
      "search-care": "Browse Care",
      "search-placeholder": "Specialty, doctor or symptom...",
      "features-title": "Why Choose GeniDoc?",
      "features-subtitle": "Powerful tools to transform your health",
      "feature-1": "Advanced AI Matching",
      "feature-1-desc":
        "Algorithm that analyzes 200+ criteria to find the best doctors",
      "feature-2": "Flexible Consultations",
      "feature-2-desc":
        "Office or teleconsultation according to your preferences",
      "feature-3": "Time Reduction",
      "feature-3-desc": "Find an appointment in less than 24 hours",
      "feature-4": "Secure Data",
      "feature-4-desc": "GDPR encryption for your privacy",
      "feature-5": "Easy Follow-up",
      "feature-5-desc": "Simple and intuitive interface for everyone",
      "feature-6": "Support 24/7",
      "feature-6-desc": "Expert team always available",
      "services-title": "Our Services",
      "testimonials-title": "What Our Patients Say",
      "faq-title": "Frequently Asked Questions",
    },
  };

  const t = (key) => translations[language]?.[key] || key;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.pageYOffset > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    { icon: "🎯", title: t("feature-1"), desc: t("feature-1-desc") },
    { icon: "🏥", title: t("feature-2"), desc: t("feature-2-desc") },
    { icon: "⚡", title: t("feature-3"), desc: t("feature-3-desc") },
    { icon: "🔒", title: t("feature-4"), desc: t("feature-4-desc") },
    { icon: "📋", title: t("feature-5"), desc: t("feature-5-desc") },
    { icon: "💬", title: t("feature-6"), desc: t("feature-6-desc") },
  ];

  const testimonials = [
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
  ];

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <style>{`
        * {
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
          --color-text-primary: #0f172a;
          --color-text-secondary: #475569;
          --color-text-muted: #94a3b8;
          --color-bg-primary: #ffffff;
          --color-bg-secondary: #fafafa;
          --color-bg-alt: #f8fafc;
          --color-border: #e2e8f0;
        }

        body {
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: var(--color-text-primary);
          background: var(--color-bg-primary);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .site-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid transparent;
          transition: all 0.3s ease;
          height: 72px;
        }

        .site-header.scrolled {
          border-bottom-color: var(--color-border);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
          padding: 0 1.5rem;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--color-primary);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav {
          display: none;
          gap: 2rem;
          list-style: none;
        }

        @media (min-width: 768px) {
          .nav {
            display: flex;
          }
        }

        .nav a {
          color: var(--color-text-secondary);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9rem;
          transition: color 0.2s;
        }

        .nav a:hover {
          color: var(--color-primary);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          font-size: 1rem;
        }

        .btn-primary {
          background: var(--color-primary);
          color: white;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
        }

        .btn-primary:hover {
          background: var(--color-primary-hover);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .btn-ghost {
          background: transparent;
          color: var(--color-text-primary);
        }

        .btn-ghost:hover {
          background: var(--color-bg-secondary);
        }

        .hero {
          min-height: 600px;
          padding: 4rem 0;
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
        }

        .hero-content h1 {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.2;
          margin: 1rem 0 1.5rem;
          color: var(--color-text-primary);
        }

        .lead {
          font-size: 1.125rem;
          line-height: 1.75;
          color: var(--color-text-secondary);
          margin-bottom: 2rem;
        }

        .hero-ctas {
          display: flex;
          gap: 1rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }

        .badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: var(--color-primary-light);
          color: var(--color-primary);
          border-radius: 50px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .section {
          padding: 4rem 0;
        }

        .section-header {
          text-align: center;
          max-width: 800px;
          margin: 0 auto 3rem;
        }

        .section-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--color-text-primary);
          margin: 1rem 0;
        }

        .section-subtitle {
          font-size: 1.125rem;
          color: var(--color-text-secondary);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          padding: 2rem;
          border: 1px solid var(--color-border);
          border-radius: 1.125rem;
          background: white;
          transition: all 0.3s;
        }

        .feature-card:hover {
          border-color: var(--color-primary);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
        }

        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .feature-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: var(--color-text-primary);
        }

        .feature-card p {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--color-text-secondary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          text-align: center;
        }

        .stat-card {
          padding: 2rem;
        }

        .stat-number {
          font-size: 3.5rem;
          font-weight: 800;
          color: var(--color-primary);
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .testimonial-card {
          padding: 2rem;
          border: 1px solid var(--color-border);
          border-radius: 1.125rem;
          background: white;
          transition: all 0.3s;
        }

        .testimonial-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-4px);
        }

        .testimonial-text {
          font-size: 1rem;
          line-height: 1.6;
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
          background: var(--color-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .author-name {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .author-role {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .cta-final {
          background: var(--color-primary);
          color: white;
          padding: 4rem 0;
          text-align: center;
        }

        .cta-title {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .cta-subtitle {
          font-size: 1.125rem;
          opacity: 0.9;
          margin-bottom: 2rem;
        }

        .site-footer {
          background: var(--color-text-primary);
          color: white;
          padding: 3rem 0 1.5rem;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .footer-heading {
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
          font-size: 0.875rem;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: white;
        }

        .search-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.4rem;
          border-radius: 50px;
          width: fit-content;
        }

        .search-tab {
          padding: 0.75rem 2rem;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .search-tab.active {
          background: white;
          color: var(--color-text-primary);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .search-input {
          width: 100%;
          padding: 0.875rem 1.25rem;
          border: none;
          border-radius: 50px;
          background: white;
          font-size: 1rem;
          font-family: inherit;
        }

        .search-button {
          background: black;
          color: white;
          border: none;
          padding: 0.875rem 2rem;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
        }

        .search-button:hover {
          background: #1a1a1a;
        }
      `}</style>

      {/* HEADER */}
      <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
        <div className="header-inner">
          <a href="#" className="logo">
            🏥 GeniDoc
          </a>
          <nav className="nav">
            <a href="#features">{t("nav-features")}</a>
            <a href="#services">{t("nav-services")}</a>
            <a href="#testimonials">{t("nav-testimonials")}</a>
          </nav>
          <div className="header-actions">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                padding: "0.5rem",
                border: "1px solid var(--color-border)",
                borderRadius: "0.5rem",
                fontFamily: "inherit",
              }}
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
            </select>
            <button className="btn btn-ghost">{t("btn-login")}</button>
            <button className="btn btn-primary">{t("btn-signup")}</button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <span className="badge">{t("nav-home")}</span>
            <h1>{t("hero-title")}</h1>
            <p className="lead">{t("hero-subtitle")}</p>
            <div className="hero-ctas">
              <button className="btn btn-primary">{t("btn-start")}</button>
              <button className="btn btn-ghost">{t("btn-demo")}</button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-header">
            <span className="badge">{t("nav-features")}</span>
            <h2 className="section-title">{t("features-title")}</h2>
            <p className="section-subtitle">{t("features-subtitle")}</p>
          </div>
          <div className="features-grid">
            {features.map((feature, idx) => (
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
      <section
        className="section"
        style={{ background: "var(--color-bg-alt)" }}
      >
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
              <div className="stat-label">Établissements</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">98%</div>
              <div className="stat-label">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" id="testimonials">
        <div className="container">
          <div className="section-header">
            <span className="badge">{t("nav-testimonials")}</span>
            <h2 className="section-title">{t("testimonials-title")}</h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, idx) => (
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
          <h2 className="cta-title">Prêt à Transformer Votre Santé ?</h2>
          <p className="cta-subtitle">
            Rejoignez des milliers de patients qui font déjà confiance à GeniDoc
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
              <h4 className="footer-heading">GeniDoc</h4>
              <p style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                Votre partenaire santé de confiance au Maroc
              </p>
            </div>
            <div>
              <h4 className="footer-heading">{t("nav-features")}</h4>
              <ul className="footer-links">
                <li>
                  <a href="#features">Fonctionnalités</a>
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
          <div
            style={{
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              paddingTop: "1.5rem",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "0.875rem", opacity: 0.6 }}>
              © 2025 GeniDoc. Créé pour révolutionner la santé au Maroc.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IndeReact;
