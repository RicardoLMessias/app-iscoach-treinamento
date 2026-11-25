import { useState } from "react";
import { mobilePlatform } from "./installApp.js";
import styles from "./InstallGuide.module.css";

const instructions = {
  android: [
    "Abra o IS Coach no Google Chrome.",
    "Toque nos três pontos (⋮) ao lado da barra de endereço.",
    "Escolha “Instalar e criar atalho” ou “Adicionar à tela inicial”.",
    "Confirme em “Criar atalho” e “Adicionar”.",
  ],
  ios: [
    "Abra o IS Coach no Safari do iPhone.",
    "Toque em Compartilhar (quadrado com seta para cima).",
    "Escolha “Adicionar à Tela de Início”.",
    "Confirme o nome IS Coach e toque em “Adicionar”.",
  ],
};

export default function InstallGuide({ compact = false }) {
  const [platform, setPlatform] = useState(() => mobilePlatform(navigator.userAgent, navigator.maxTouchPoints) ?? "android");

  return <div className={`${styles.guide} ${compact ? styles.compact : ""}`}>
    <div className={styles.platforms} aria-label="Escolha o celular">
      <button type="button" aria-pressed={platform === "android"} onClick={() => setPlatform("android")}>Android</button>
      <button type="button" aria-pressed={platform === "ios"} onClick={() => setPlatform("ios")}>iPhone</button>
    </div>
    <ol>{instructions[platform].map((instruction) => <li key={instruction}>{instruction}</li>)}</ol>
    <p>O ícone será criado na tela inicial. O IS Coach continua precisando de internet para carregar os dados.</p>
  </div>;
}
