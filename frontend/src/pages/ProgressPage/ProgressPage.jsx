import { useEffect, useMemo, useState } from "react";
import ScreenHeader from "../../shared/components/ScreenHeader/ScreenHeader.jsx";
import AssessmentDetails from "../../shared/components/AssessmentDetails.jsx";
import AssessmentPhotos from "../../shared/components/AssessmentPhotos.jsx";
import AssessmentComparison from "../../shared/components/AssessmentComparison.jsx";
import { apiRequest } from "../../services/http/apiClient.js";
import styles from "./ProgressPage.module.css";

const metrics = [
  { key:"weight", label:"Peso", unit:"kg", read:(item) => item?.inputs?.general?.weight },
  { key:"waist", label:"Cintura", unit:"cm", read:(item) => item?.inputs?.measurements?.waist },
  { key:"bmi", label:"IMC", unit:"kg/m²", read:(item) => item?.results?.values?.bmi },
  { key:"bodyFat", label:"Gordura corporal", unit:"%", read:(item) => item?.results?.values?.body_fat_percentage },
];
const isPublishedAssessment = ({ status } = {}) => status === "finalized" || status === "corrected";
const numeric = (value) => value !== null && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
const dateLabel = (value) => value?.split("-").reverse().join("/") ?? "—";
const format = (value) => numeric(value)?.toLocaleString("pt-BR", { maximumFractionDigits:2 }) ?? "—";

function TrendChart({ assessments, metric }) {
  const points = assessments.map((assessment) => ({ assessment,value:numeric(metric.read(assessment)) })).filter(({value}) => value !== null);
  if(points.length < 2) return <p className={styles.empty}>São necessárias duas avaliações com este dado para formar o gráfico.</p>;
  const values=points.map(({value}) => value), min=Math.min(...values), max=Math.max(...values), hasVariation=max !== min, span=hasVariation ? max-min : 1;
  const coordinates=points.map((point,index) => ({...point,x:17+(index*86)/(points.length-1),y:hasVariation ? 74-((point.value-min)/span)*56 : 46}));
  const ticks=hasVariation ? Array.from({length:5},(_,index) => min+(span*index)/4).reverse() : [max];
  const tickY=(value) => hasVariation ? 74-((value-min)/span)*56 : 46;
  return <div className={styles.chartWrap}><div className={styles.chartTitle}><strong>{metric.label}</strong><span>Valores em {metric.unit}</span></div><svg className={styles.chart} viewBox="0 0 110 92" role="img" aria-label={`Evolução de ${metric.label}`}><title>{`Evolução de ${metric.label}, em ${metric.unit}`}</title>{ticks.map((tick) => <g key={tick}><line x1="17" y1={tickY(tick)} x2="103" y2={tickY(tick)} className={styles.gridLine}/><text x="14" y={tickY(tick)+1.5} textAnchor="end" className={styles.tickLabel}>{format(tick)}</text></g>)}<line x1="17" y1="76" x2="103" y2="76" className={styles.axis}/><polyline points={coordinates.map((point) => `${point.x},${point.y}`).join(" ")} className={styles.line}/>{coordinates.map((point) => <g key={point.assessment.id}><circle cx={point.x} cy={point.y} r="2.8" className={styles.point}><title>{`${dateLabel(point.assessment.assessed_on)}: ${format(point.value)} ${metric.unit}`}</title></circle><text x={point.x} y={Math.max(9,point.y-5)} textAnchor="middle" className={styles.valueLabel}>{format(point.value)}</text></g>)}</svg><div className={styles.chartValues}>{points.map((point) => <div key={point.assessment.id}><span>{dateLabel(point.assessment.assessed_on)}</span><strong>{format(point.value)} <small>{metric.unit}</small></strong></div>)}</div></div>;
}

export default function ProgressPage() {
  const [data,setData]=useState({data:[],schema:[]}), [loading,setLoading]=useState(true), [message,setMessage]=useState(""), [metricKey,setMetricKey]=useState("weight");
  useEffect(() => { let active=true; apiRequest("/v1/student/assessments").then((response) => { if(active) setData({ data: Array.isArray(response?.data) ? response.data : [], schema: Array.isArray(response?.schema) ? response.schema : [] }); }).catch((error) => { if(active) setMessage(error.message); }).finally(() => { if(active) setLoading(false); }); return () => { active=false; }; },[]);
  const published=useMemo(() => data.data.filter(isPublishedAssessment),[data.data]);
  const chronological=useMemo(() => [...published].reverse(),[published]);
  const latest=published[0], previous=published[1], selectedMetric=metrics.find(({key}) => key === metricKey) ?? metrics[0];
  return <main className={styles.page}><ScreenHeader/><header className={styles.heading}><p className="eyebrow">Acompanhe seu progresso</p><h1>Evolução</h1></header>{loading && <p>Carregando avaliações…</p>}{message && <p role="alert">{message}</p>}{!loading && !message && !published.length && <section className={styles.section}>Seu professor ainda não publicou uma avaliação.</section>}{latest && <><section className={styles.section}><div className={styles.last}><div><span>Última avaliação</span><strong>{dateLabel(latest.assessed_on)}</strong></div><small>{published.length} {published.length === 1 ? "avaliação publicada" : "avaliações publicadas"}</small></div><div className={styles.summary}>{metrics.map((metric) => { const value=numeric(metric.read(latest)), prior=numeric(metric.read(previous)), delta=value === null || prior === null ? null : value-prior; return <div key={metric.key}><small>{metric.label}</small><strong>{format(value)} <em>{value === null ? "" : metric.unit}</em></strong><b>{delta === null ? "Sem histórico" : `${delta > 0 ? "+" : ""}${format(delta)} desde a anterior`}</b></div>; })}</div></section><section className={styles.section}><div><p className="eyebrow">Dados reais das avaliações</p><h2>Gráfico de evolução</h2></div><div className={styles.metricTabs}>{metrics.map((metric) => <button type="button" key={metric.key} data-active={metric.key === metricKey} onClick={() => setMetricKey(metric.key)}>{metric.label}</button>)}</div><TrendChart assessments={chronological} metric={selectedMetric}/></section>{data.schema.length > 0 ? <AssessmentComparison assessments={published} schema={data.schema} showPdf={false}/> : <section className={styles.section}><p role="status">Os resultados da avaliação estão disponíveis, mas os detalhes dos campos aguardam a sincronização do servidor.</p></section>}<section className={styles.history}><div><p className="eyebrow">Registros completos</p><h2>Histórico de avaliações</h2></div>{data.data.map((assessment) => <article className={styles.assessment} key={assessment.id}><h3>{dateLabel(assessment.assessed_on)} · Versão {assessment.version}</h3><p>{assessment.status === "corrected" ? "Histórico: esta versão foi corrigida." : "Avaliação finalizada pelo professor."}</p><AssessmentDetails assessment={assessment} schema={data.schema}/><AssessmentPhotos assessmentId={assessment.id}/></article>)}</section></>}</main>;
}
