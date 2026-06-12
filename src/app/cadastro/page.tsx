"use client";

import { useState } from "react";
import styles from "./cadastro.module.css";

export default function Cadastro() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [product, setProduct] = useState("");
  const [observations, setObservations] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = maskPhone(e.target.value);
    setPhone(formatted);
    if (fieldErrors.phone) {
      setFieldErrors((prev) => ({ ...prev, phone: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    
    // Client-side validations
    const errors: { [key: string]: string } = {};
    if (!name.trim()) errors.name = "O nome é obrigatório.";
    
    const rawPhone = phone.replace(/\D/g, "");
    if (!rawPhone) {
      errors.phone = "O telefone/WhatsApp é obrigatório.";
    } else if (rawPhone.length < 10 || rawPhone.length > 11) {
      errors.phone = "Por favor, digite um telefone válido (10 ou 11 dígitos).";
    }
    
    if (!product) errors.product = "Selecione um produto de interesse.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          product,
          observations: observations.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocorreu um erro ao cadastrar o lead.");
      }

      setSuccess(true);
      setName("");
      setPhone("");
      setProduct("");
      setObservations("");
      setFieldErrors({});
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className={styles.wrapper}>
        <div className={`${styles.card} glass-card`}>
          <div className={styles.successWrapper}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Lead Cadastrado!</h2>
            <p className={styles.successMessage}>
              As informações foram enviadas com sucesso para o painel administrativo da empresa.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="btn btn-primary reset-btn"
            >
              Cadastrar Novo Cliente
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.wrapper}>
      <div className={`${styles.card} glass-card`}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>⚡</div>
          <h1 className={styles.logoText}>Syntaxis</h1>
          <span className={styles.logoSubtitle}>Captador de Leads</span>
        </div>

        <form onSubmit={handleSubmit}>
          {errorMsg && (
            <div style={{ color: "var(--status-perdido)", marginBottom: "1rem", fontSize: "0.9rem", textAlign: "center" }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="name">Nome Completo</label>
            <input
              id="name"
              type="text"
              placeholder="Digite o nome do interessado"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
              }}
              disabled={loading}
            />
            {fieldErrors.name && <span className={styles.errorText}>{fieldErrors.name}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone">Telefone / WhatsApp</label>
            <input
              id="phone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={handlePhoneChange}
              disabled={loading}
            />
            {fieldErrors.phone && <span className={styles.errorText}>{fieldErrors.phone}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="product">Produto de Interesse</label>
            <select
              id="product"
              value={product}
              onChange={(e) => {
                setProduct(e.target.value);
                if (fieldErrors.product) setFieldErrors((prev) => ({ ...prev, product: "" }));
              }}
              disabled={loading}
            >
              <option value="">Selecione o produto...</option>
              <option value="Energia Solar Residencial">Energia Solar Residencial</option>
              <option value="Energia Solar Comercial">Energia Solar Comercial</option>
              <option value="Assinatura de Energia Livre">Assinatura de Energia Livre</option>
              <option value="Adequação Tarifária / Demanda">Adequação Tarifária / Demanda</option>
              <option value="Outro">Outro Serviço / Consultoria</option>
            </select>
            {fieldErrors.product && <span className={styles.errorText}>{fieldErrors.product}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="observations">Observações</label>
            <textarea
              id="observations"
              rows={4}
              placeholder="Detalhes adicionais, consumo médio, melhor horário para ligar..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary submit-btn"
            disabled={loading}
          >
            {loading ? <span className={styles.spinner}></span> : "Salvar e Enviar"}
          </button>
        </form>
      </div>
    </main>
  );
}
