import { Component } from "react";
import styles from "./AppErrorBoundary.module.css";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Falha inesperada na interface do IS Coach.", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return <main className={styles.page}><section className={styles.card}><span className={styles.mark}>IS</span><p className="eyebrow">IS Coach</p><h1>Não foi possível mostrar esta tela</h1><p>Seus dados continuam salvos. Atualize o aplicativo para tentar carregar novamente.</p><button type="button" className="primary-button" onClick={() => window.location.reload()}>Atualizar aplicativo</button></section></main>;
  }
}
