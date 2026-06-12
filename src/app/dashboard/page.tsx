"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import styles from "./dashboard.module.css";

interface Lead {
  id: string;
  name: string;
  phone: string;
  product: string;
  observations: string | null;
  status: string;
  lossReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  NOVO: number;
  EM_CONTATO: number;
  CONVERTIDO: number;
  PERDIDO: number;
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    NOVO: 0,
    EM_CONTATO: 0,
    CONVERTIDO: 0,
    PERDIDO: 0,
  });

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL"); // ALL, NOVO, EM_CONTATO, CONVERTIDO, PERDIDO
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Apple Drawer & Custom Message states
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [customMessage, setCustomMessage] = useState("");

  // Quick Add Lead Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [newObs, setNewObs] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch functions
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      // We pass the activeTab as status if it's not ALL, otherwise we fetch all status types
      if (activeTab !== "ALL") params.append("status", activeTab);
      if (dateFilter) params.append("date", dateFilter);

      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.error("Erro ao carregar leads:", err);
    } finally {
      setLoading(false);
    }
  }, [search, activeTab, dateFilter]);

  // Load data initially and when search/filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [search, fetchLeads]);

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [activeTab, dateFilter, fetchLeads, fetchStats]);

  // Format phone for visual layout
  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return "";
    let cleaned = phone;
    if (phone.startsWith("55") && phone.length >= 12) {
      cleaned = phone.slice(2);
    }
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Mask function for Quick Add Modal
  const maskPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 2) return `(${cleaned}`;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  // Status transition handler
  const handleStatusChange = async (id: string, newStatus: string) => {
    let lossReason = "";
    
    if (newStatus === "PERDIDO") {
      const reason = prompt("Por favor, digite o motivo da perda do lead (opcional):");
      if (reason === null) return; // Cancel change
      lossReason = reason;
    }

    setUpdatingId(id);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          lossReason: newStatus === "PERDIDO" ? lossReason : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Optimistic local state update
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === id
              ? { ...lead, status: newStatus, lossReason: newStatus === "PERDIDO" ? lossReason : null, updatedAt: new Date().toISOString() }
              : lead
          )
        );
        
        // Update selected lead details if open
        if (selectedLead && selectedLead.id === id) {
          setSelectedLead((prev) =>
            prev ? { ...prev, status: newStatus, lossReason: newStatus === "PERDIDO" ? lossReason : null, updatedAt: new Date().toISOString() } : null
          );
        }

        fetchStats();
      } else {
        alert(data.error || "Erro ao atualizar status.");
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      alert("Erro ao conectar com o servidor.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Format and redirect to WhatsApp with custom message from drawer
  const handleWhatsappRedirect = (phone: string, messageText: string) => {
    const encodedText = encodeURIComponent(messageText);
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
    window.open(url, "_blank");
  };

  // Drawer select lead handler
  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    const defaultText = `Olá ${lead.name}! Sou consultor de energia da Syntaxis. Vi que você registrou interesse em: ${lead.product}. Como posso te ajudar hoje?`;
    setCustomMessage(defaultText);
  };

  // Get matching icons for product
  const getProductIcon = (product: string) => {
    if (product.includes("Residencial")) return "🏠 ☀️";
    if (product.includes("Comercial")) return "🏢 ☀️";
    if (product.includes("Assinatura")) return "⚡";
    if (product.includes("Adequação")) return "📈";
    return "💡";
  };

  // Handle Quick Add Submit
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim() || !newProduct) {
      alert("Nome, telefone e produto são obrigatórios.");
      return;
    }

    setModalLoading(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone,
          product: newProduct,
          observations: newObs.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar lead.");
      }

      // Reset form and reload
      setNewName("");
      setNewPhone("");
      setNewProduct("");
      setNewObs("");
      setModalOpen(false);
      
      fetchLeads();
      fetchStats();
    } catch (err: any) {
      alert(err.message || "Ocorreu um erro.");
    } finally {
      setModalLoading(false);
    }
  };

  // Conversion rate calculation
  const conversionRate = stats.total > 0 ? Math.round((stats.CONVERTIDO / stats.total) * 100) : 0;

  // Circular progress stroke math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (conversionRate / 100) * circumference;

  return (
    <div className={styles.dashboard}>
      {/* Background breathing light blobs */}
      <div className="blob-container">
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />
      </div>

      <header className={styles.header}>
        <div className={`${styles.headerContent} container`}>
          <div className={styles.titleGroup}>
            <span className={styles.logoIcon}>⚡</span>
            <h1 className={styles.title}>Syntaxis Admin</h1>
          </div>
          <button 
            onClick={() => setModalOpen(true)} 
            className="btn btn-primary" 
            style={{ padding: "0.6rem 1.2rem", fontSize: "0.9rem" }}
          >
            + Novo Lead
          </button>
        </div>
      </header>

      <main className="container">
        {/* KPI Row containing Stats and Conversion Widget */}
        <section className={styles.topGrid}>
          {/* Grid Stats */}
          <div className={styles.gridStats}>
            <div className={`${styles.statCard} ${styles.statCardNovo}`}>
              <span className={styles.statLabel}>📥 Novos</span>
              <span className={styles.statVal}>{stats.NOVO}</span>
            </div>
            <div className={`${styles.statCard} ${styles.statCardContato}`}>
              <span className={styles.statLabel}>⚡ Em Contato</span>
              <span className={styles.statVal}>{stats.EM_CONTATO}</span>
            </div>
            <div className={`${styles.statCard} ${styles.statCardConvertido}`}>
              <span className={styles.statLabel}>🏆 Convertidos</span>
              <span className={styles.statVal}>{stats.CONVERTIDO}</span>
            </div>
            <div className={`${styles.statCard} ${styles.statCardPerdido}`}>
              <span className={styles.statLabel}>⚠️ Perdidos</span>
              <span className={styles.statVal}>{stats.PERDIDO}</span>
            </div>
          </div>

          {/* Apple Donut Circular Conversion Rate */}
          <div className={styles.conversionCard}>
            <div className={styles.conversionLeft}>
              <span className={styles.conversionTitle}>Taxa de Conversão</span>
              <p className={styles.conversionInfo}>
                <strong>{stats.CONVERTIDO}</strong> de {stats.total} leads foram fechados com sucesso no funil.
              </p>
            </div>
            
            <div className={styles.conversionRight}>
              <svg className={styles.circleChart} viewBox="0 0 90 90">
                <circle className={styles.circleBg} cx="45" cy="45" r={radius} />
                <circle 
                  className={styles.circleVal} 
                  cx="45" 
                  cy="45" 
                  r={radius} 
                  stroke="url(#progressGradient)"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--secondary)" />
                    <stop offset="100%" stopColor="var(--status-convertido)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className={styles.circleText}>{conversionRate}%</div>
            </div>
          </div>
        </section>

        {/* Apple Segmented Controls Tab Bar (Surprise) */}
        <section className={styles.tabsContainer}>
          <button 
            onClick={() => setActiveTab("ALL")}
            className={`${styles.tabButton} ${activeTab === "ALL" ? styles.tabButtonActive : ""}`}
          >
            Todos <span className={styles.tabCount}>{stats.total}</span>
          </button>
          <button 
            onClick={() => setActiveTab("NOVO")}
            className={`${styles.tabButton} ${activeTab === "NOVO" ? styles.tabButtonActive : ""}`}
          >
            Novos <span className={styles.tabCount}>{stats.NOVO}</span>
          </button>
          <button 
            onClick={() => setActiveTab("EM_CONTATO")}
            className={`${styles.tabButton} ${activeTab === "EM_CONTATO" ? styles.tabButtonActive : ""}`}
          >
            Em Contato <span className={styles.tabCount}>{stats.EM_CONTATO}</span>
          </button>
          <button 
            onClick={() => setActiveTab("CONVERTIDO")}
            className={`${styles.tabButton} ${activeTab === "CONVERTIDO" ? styles.tabButtonActive : ""}`}
          >
            Convertidos <span className={styles.tabCount}>{stats.CONVERTIDO}</span>
          </button>
          <button 
            onClick={() => setActiveTab("PERDIDO")}
            className={`${styles.tabButton} ${activeTab === "PERDIDO" ? styles.tabButtonActive : ""}`}
          >
            Perdidos <span className={styles.tabCount}>{stats.PERDIDO}</span>
          </button>
        </section>

        {/* Filter Controls Panel */}
        <section className={styles.filterBar}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Pesquisar por nome ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`${styles.filterSelect} select`}
          >
            <option value="">Qualquer Período</option>
            <option value="today">Cadastrado Hoje</option>
            <option value="week">Últimos 7 dias</option>
            <option value="month">Último mês</option>
          </select>
        </section>

        {/* Leads Listing Box */}
        <section className={styles.leadsContainer}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "5rem 0", color: "var(--text-secondary)" }}>
              <div style={{ display: "inline-block", width: "32px", height: "32px", border: "3px solid rgba(255,255,255,0.05)", borderRadius: "50%", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
              <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>Carregando dados dos leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📂</div>
              <div className={styles.emptyText}>Nenhum interessado encontrado para os filtros atuais.</div>
            </div>
          ) : (
            <>
              {/* Desktop View Table */}
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Telefone</th>
                      <th>Produto de Interesse</th>
                      <th>Data de Cadastro</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr 
                        key={lead.id} 
                        className={`${styles.rowLead} ${selectedLead?.id === lead.id ? styles.rowLeadSelected : ""}`}
                        onClick={() => handleSelectLead(lead)}
                      >
                        <td>
                          <div className={styles.leadName}>{lead.name}</div>
                          {lead.observations && (
                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem", maxWidth: "300px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                              📝 {lead.observations}
                            </div>
                          )}
                        </td>
                        <td>{formatPhoneDisplay(lead.phone)}</td>
                        <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                          <span style={{ marginRight: "0.5rem" }}>{getProductIcon(lead.product)}</span>
                          {lead.product}
                        </td>
                        <td className={styles.leadDate}>
                          {new Date(lead.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td>
                          <span className={`${styles.badge} ${
                            lead.status === "NOVO"
                              ? styles.badgeNovo
                              : lead.status === "EM_CONTATO"
                              ? styles.badgeContato
                              : lead.status === "CONVERTIDO"
                              ? styles.badgeConvertido
                              : styles.badgePerdido
                          }`}>
                            {lead.status === "EM_CONTATO" ? "Contato" : lead.status === "CONVERTIDO" ? "Fechado" : lead.status.toLowerCase()}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className={styles.actionsCell}>
                            <button
                              onClick={() => {
                                const defaultText = `Olá ${lead.name}! Sou consultor de energia da Syntaxis. Vi que você registrou interesse em: ${lead.product}. Como posso te ajudar hoje?`;
                                handleWhatsappRedirect(lead.phone, defaultText);
                              }}
                              className={styles.whatsappBtn}
                            >
                              <span className={styles.whatsappBtnText}>Contatar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Compact & Organized Mobile View Cards (Fixes messy visual list) */}
              <div className={styles.mobileCardList}>
                {leads.map((lead) => (
                  <div 
                    key={lead.id} 
                    className={`${styles.mobileLeadCard} ${selectedLead?.id === lead.id ? styles.rowLeadSelected : ""} ${
                      lead.status === "NOVO"
                        ? styles.cardNovo
                        : lead.status === "EM_CONTATO"
                        ? styles.cardContato
                        : lead.status === "CONVERTIDO"
                        ? styles.cardConvertido
                        : styles.cardPerdido
                    }`}
                    onClick={() => handleSelectLead(lead)}
                  >
                    <div className={styles.mobileCardHeader}>
                      <div className={styles.leadName}>{lead.name}</div>
                    </div>

                    <div className={styles.mobileCardBody}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        <span>
                          <span style={{ marginRight: "0.4rem" }}>{getProductIcon(lead.product)}</span>
                          {lead.product}
                        </span>
                        <span>
                          {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Slide-over Drawer Pane (Apple Style Detail View) */}
      {selectedLead && (
        <>
          <div 
            className="drawer-backdrop" 
            onClick={() => setSelectedLead(null)} 
          />
          <div className="drawer">
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitleGroup}>
                <h2 className={styles.drawerTitle}>{selectedLead.name}</h2>
                <span className={styles.drawerSubtitle}>
                  Cadastrado em {new Date(selectedLead.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
              <button 
                className={styles.drawerClose} 
                onClick={() => setSelectedLead(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Funnel Visual Stepper */}
              <div className={styles.drawerSection}>
                <span className={styles.sectionTitle}>Etapa no Funil de Vendas</span>
                <div className={styles.funnelStepper}>
                  <div className={`${styles.funnelLine} ${
                    selectedLead.status !== "NOVO" ? styles.funnelLineActive : ""
                  }`} />
                  
                  {/* Step 1: Novo */}
                  <div className={`${styles.funnelStep} ${
                    selectedLead.status === "NOVO" ? styles.funnelStepActive : styles.funnelStepComplete
                  }`}>
                    <div className={styles.funnelStepCircle}>1</div>
                    <span className={styles.funnelStepLabel}>Fila</span>
                  </div>

                  {/* Step 2: Contato */}
                  <div className={`${styles.funnelStep} ${
                    selectedLead.status === "EM_CONTATO" 
                      ? styles.funnelStepActive 
                      : (selectedLead.status === "CONVERTIDO" || selectedLead.status === "PERDIDO") 
                      ? styles.funnelStepComplete 
                      : ""
                  }`}>
                    <div className={styles.funnelStepCircle}>2</div>
                    <span className={styles.funnelStepLabel}>Contato</span>
                  </div>

                  {/* Step 3: Conclusão */}
                  <div className={`${styles.funnelStep} ${
                    selectedLead.status === "CONVERTIDO" 
                      ? styles.funnelStepComplete 
                      : selectedLead.status === "PERDIDO" 
                      ? styles.funnelStepActive 
                      : ""
                  }`} style={selectedLead.status === "PERDIDO" ? { color: "var(--status-perdido)" } : {}}>
                    <div 
                      className={styles.funnelStepCircle} 
                      style={selectedLead.status === "PERDIDO" ? { backgroundColor: "var(--status-perdido-bg)", borderColor: "var(--status-perdido)", color: "var(--status-perdido)" } : {}}
                    >
                      3
                    </div>
                    <span className={styles.funnelStepLabel}>
                      {selectedLead.status === "PERDIDO" ? "Perdido" : "Fechado"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className={styles.drawerSection}>
                <span className={styles.sectionTitle}>Alterar Status</span>
                <select
                  value={selectedLead.status}
                  onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                  className={`${styles.statusSelect} ${
                    selectedLead.status === "NOVO"
                      ? styles.badgeNovo
                      : selectedLead.status === "EM_CONTATO"
                      ? styles.badgeContato
                      : selectedLead.status === "CONVERTIDO"
                      ? styles.badgeConvertido
                      : styles.badgePerdido
                  }`}
                  style={{ width: "100%", padding: "0.6rem 1rem", fontSize: "0.95rem" }}
                >
                  <option value="NOVO">Novo Lead</option>
                  <option value="EM_CONTATO">Em Contato</option>
                  <option value="CONVERTIDO">Convertido</option>
                  <option value="PERDIDO">Perdido</option>
                </select>
              </div>

              {/* Product Info */}
              <div className={styles.drawerSection}>
                <span className={styles.sectionTitle}>Produto de Interesse</span>
                <div className={styles.detailCard} style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                  <span style={{ marginRight: "0.5rem" }}>{getProductIcon(selectedLead.product)}</span>
                  {selectedLead.product}
                </div>
              </div>

              {/* Contact Info */}
              <div className={styles.drawerSection}>
                <span className={styles.sectionTitle}>Telefone de Contato</span>
                <div className={styles.detailCard}>
                  📞 {formatPhoneDisplay(selectedLead.phone)}
                </div>
              </div>

              {/* Observations */}
              {selectedLead.observations && (
                <div className={styles.drawerSection}>
                  <span className={styles.sectionTitle}>Observações de Campo</span>
                  <div className={styles.detailCard} style={{ color: "var(--text-secondary)", fontStyle: "italic", fontSize: "0.95rem", lineHeight: "1.5" }}>
                    "{selectedLead.observations}"
                  </div>
                </div>
              )}

              {/* Loss Reason Card */}
              {selectedLead.status === "PERDIDO" && selectedLead.lossReason && (
                <div className={styles.drawerSection}>
                  <span className={styles.sectionTitle}>Motivo da Desistência</span>
                  <div className={styles.lossCard}>
                    ⚠️ {selectedLead.lossReason}
                  </div>
                </div>
              )}

              {/* Interaction Timeline */}
              <div className={styles.drawerSection}>
                <span className={styles.sectionTitle}>Histórico do Lead</span>
                <div className={styles.timeline}>
                  <div className={styles.timelineItem}>
                    <div className={`${styles.timelineDot} ${styles.timelineDotActive}`} />
                    <div className={styles.timelineContent}>
                      <span className={styles.timelineLabel}>Lead Capturado</span>
                      <span className={styles.timelineTime}>
                        {new Date(selectedLead.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  {selectedLead.updatedAt && selectedLead.createdAt !== selectedLead.updatedAt && (
                    <div className={styles.timelineItem}>
                      <div className={`${styles.timelineDot} ${styles.timelineDotActive}`} />
                      <div className={styles.timelineContent}>
                        <span className={styles.timelineLabel}>Status Atualizado para {selectedLead.status}</span>
                        <span className={styles.timelineTime}>
                          {new Date(selectedLead.updatedAt).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* WhatsApp customizer */}
              <div className={styles.drawerSection} style={{ marginTop: "3rem" }}>
                <span className={styles.sectionTitle}>Personalizar Mensagem de Contato</span>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className={styles.messageTextarea}
                />
                <button
                  onClick={() => handleWhatsappRedirect(selectedLead.phone, customMessage)}
                  className={`btn ${styles.whatsappDrawerBtn}`}
                  style={{ marginTop: "1rem" }}
                >
                  💬 Enviar via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Add Lead Modal */}
      {modalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>Novo Lead Externo</h2>
              <button 
                onClick={() => setModalOpen(false)} 
                className={styles.modalClose}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAdd}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="modal-name">Nome Completo</label>
                <input
                  id="modal-name"
                  type="text"
                  placeholder="Nome do cliente"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="modal-phone">Telefone / WhatsApp</label>
                <input
                  id="modal-phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(maskPhone(e.target.value))}
                  required
                />
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="modal-product">Produto de Interesse</label>
                <select
                  id="modal-product"
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  required
                >
                  <option value="">Selecione o produto...</option>
                  <option value="Energia Solar Residencial">Energia Solar Residencial</option>
                  <option value="Energia Solar Comercial">Energia Solar Comercial</option>
                  <option value="Assinatura de Energia Livre">Assinatura de Energia Livre</option>
                  <option value="Adequação Tarifária / Demanda">Adequação Tarifária / Demanda</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label htmlFor="modal-obs">Observações</label>
                <textarea
                  id="modal-obs"
                  rows={3}
                  placeholder="Detalhes como consumo mensal..."
                  value={newObs}
                  onChange={(e) => setNewObs(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", padding: "0.85rem" }}
                disabled={modalLoading}
              >
                {modalLoading ? "Salvando..." : "Salvar Lead"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
