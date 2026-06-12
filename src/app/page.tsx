import styles from "./home.module.css";

export default function Home() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>⚡</div>
          <h1 className={styles.logoTitle}>Syntaxis</h1>
          <p className={styles.logoSubtitle}>
            Sistema inteligente de captação e gestão de leads para otimização de vendas de energia.
          </p>
        </div>

        <div className={styles.grid}>
          {/* Vendedor Card */}
          <div className={`${styles.portalCard} glass-card`}>
            <div>
              <div className={styles.cardIcon}>📱</div>
              <h2 className={styles.cardTitle}>Área do Vendedor</h2>
              <p className={styles.cardDesc}>
                Interface otimizada para dispositivos móveis. Permite que vendedores externos 
                cadastrem novos interessados de forma ágil durante visitas em campo.
              </p>
            </div>
            <a href="/cadastro" className={`${styles.cardBtn} btn btn-primary`}>
              Iniciar Captação
            </a>
          </div>

          {/* Admin Card */}
          <div className={`${styles.portalCard} glass-card`}>
            <div>
              <div className={styles.cardIcon}>📊</div>
              <h2 className={styles.cardTitle}>Painel Administrativo</h2>
              <p className={styles.cardDesc}>
                Gestão centralizada do funil de vendas. Visualize estatísticas, gerencie status, 
                filtre interessados e inicie contato imediato via WhatsApp.
              </p>
            </div>
            <a href="/dashboard" className={`${styles.cardBtn} btn btn-secondary`}>
              Acessar Dashboard
            </a>
          </div>
        </div>

        <footer className={styles.footer}>
          &copy; {new Date().getFullYear()} Syntaxis Energia. Todos os direitos reservados.
        </footer>
      </div>
    </div>
  );
}
