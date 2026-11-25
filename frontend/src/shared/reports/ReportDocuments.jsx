import { useState } from "react";
import { apiRequest, appPath } from "../../services/http/apiClient.js";
import { formatWorkoutDuration } from "../formatWorkoutDuration.js";
import PrintableReport, { ReportButton } from "./PrintableReport.jsx";
import { categorizeWorkoutMovements } from "./workoutReportSections.js";
import styles from "./PrintableReport.module.css";

const weekdayLabels = { monday: "Segunda-feira", tuesday: "Terça-feira", wednesday: "Quarta-feira", thursday: "Quinta-feira", friday: "Sexta-feira", saturday: "Sábado", sunday: "Domingo" };
const activityLabels = { cardio: "Cardio", mobility: "Mobilidade", vacuum: "Vacuum" };
const photoPositions = { front: "Frontal", right: "Lateral direita", left: "Lateral esquerda", back: "Posterior" };
const resultFields = {
  bmi: ["IMC", "kg/m²"], waist_hip_ratio: ["Relação cintura/quadril", ""], skinfolds_seven: ["Soma de 7 dobras", "mm"], body_density: ["Densidade corporal", "g/cm³"],
  body_fat_percentage: ["Gordura corporal", "%"], fat_mass: ["Massa gorda", "kg"], fat_free_mass: ["Massa livre de gordura", "kg"], muscle_mass: ["Massa muscular", "kg"],
  arm_difference: ["Diferença entre braços", "cm"], forearm_difference: ["Diferença entre antebraços", "cm"], thigh_difference: ["Diferença entre coxas", "cm"], calf_difference: ["Diferença entre panturrilhas", "cm"],
};

const dateLabel = (value) => value ? String(value).slice(0, 10).split("-").reverse().join("/") : "-";
const numberLabel = (value, digits = 2) => value === null || value === undefined || value === "" ? "-" : Number(value).toLocaleString("pt-BR", { maximumFractionDigits: digits });
const valueLabel = (value, unit = "") => value === null || value === undefined || value === "" ? "-" : `${typeof value === "number" ? numberLabel(value, 3) : value}${unit ? ` ${unit}` : ""}`;
const studentName = (student) => student?.name ?? "Aluno";
const generatedOn = () => new Date().toLocaleDateString("pt-BR");
const chunkRows = (rows, size) => rows.length ? Array.from({ length: Math.ceil(rows.length / size) }, (_, index) => rows.slice(index * size, (index + 1) * size)) : [[]];
const recipeParts = (recipe) => {
  const lines = String(recipe).split(/\r?\n/).flatMap((sourceLine) => {
    const wrapped = [];
    let remaining = sourceLine;
    while (remaining.length > 76) {
      const space = remaining.lastIndexOf(" ", 76);
      const end = space > 30 ? space : 76;
      wrapped.push(remaining.slice(0, end).trimEnd());
      remaining = remaining.slice(end).trimStart();
    }
    return [...wrapped, remaining];
  });
  return chunkRows(lines, 36).map((part) => part.join("\n"));
};
const studentInfo = (student, extra = []) => [
  { label: student?.external ? "Pessoa avaliada" : "Aluno", value: studentName(student) },
  { label: "E-mail", value: student?.email },
  { label: "Data de nascimento", value: dateLabel(student?.profile?.birth_date) },
  { label: "Sexo", value: student?.profile?.sex },
  ...extra,
];

function ReportTitle({ title, subtitle }) {
  return <header className={styles.assessmentTitle}><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</header>;
}

function ReportInfoGrid({ items }) {
  return <dl className={styles.assessmentInfo}>{items.filter((item) => item.value !== null && item.value !== undefined && item.value !== "").map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.label === "Sexo" ? sexLabel(item.value) : item.value || "-"}</dd></div>)}</dl>;
}

function ReportSummary({ items }) {
  return <div className={styles.reportSummary}>{items.map(([value, label]) => <div key={label}><strong>{value ?? "-"}</strong><span>{label}</span></div>)}</div>;
}

function DesignTable({ columns, rows, className = "", emptyLabel = "Nenhum dado registrado." }) {
  return <table className={`${styles.designTable} ${className}`}><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={row.key ?? index}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? "-"}</td>)}</tr>) : <tr><td className={styles.emptyCell} colSpan={columns.length}>{emptyLabel}</td></tr>}</tbody></table>;
}

export function WorkoutReport({ student, plans }) {
  const visiblePlans = plans ?? [];
  const groupedPlans = visiblePlans.map((plan) => ({ plan, ...categorizeWorkoutMovements(plan.exercises ?? []) }));
  const totalExercises = groupedPlans.reduce((total, { exercises }) => total + exercises.length, 0);
  const totalMobilities = groupedPlans.reduce((total, { mobilities }) => total + mobilities.length, 0);
  const totalDuration = visiblePlans.reduce((total, plan) => total + Number(plan.estimated_duration_minutes ?? 0), 0);
  const exerciseColumns = [
    { key: "group", label: "Grupo", render: (item) => item.exercise?.muscle_group?.name ?? "-" },
    { key: "exercise", label: "Movimento", render: (item) => <><strong>{item.exercise?.name ?? "Movimento"}</strong>{item.notes && <div className={styles.reportMuted}>{item.notes}</div>}</> },
    { key: "sets", label: "Séries" },
    { key: "reps", label: "Meta por série", render: (item) => item.measurement_type === "time" ? formatWorkoutDuration(item.target_seconds) : `${item.reps_min}-${item.reps_max} reps` },
    { key: "rest", label: "Pausa", render: (item) => `${item.rest_seconds}s` },
    { key: "load", label: "Carga", render: (item) => item.target_load == null ? "Livre" : `${numberLabel(item.target_load)} kg` },
    { key: "video", label: "Vídeo", render: (item) => item.exercise?.video_url ? <a href={item.exercise.video_url}>Abrir</a> : "Sem vídeo" },
  ];
  const contentPages = groupedPlans.flatMap(({ plan, exercises, mobilities }) => {
    const exercisePages = (exercises.length || !mobilities.length ? chunkRows(exercises, 10) : []).map((rows, index) => ({ type: "exercises", category: "exercise", label: "Exercícios", plan, rows, continued: index > 0, part: index + 1 }));
    const mobilityPages = mobilities.length ? chunkRows(mobilities, 10).map((rows, index) => ({ type: "exercises", category: "mobility", label: "Mobilidades", plan, rows, continued: index > 0, part: index + 1 })) : [];
    const activityPages = (plan.activities ?? []).length ? chunkRows(plan.activities, 12).map((rows, index) => ({ type: "activities", plan, rows, continued: index > 0, part: index + 1 })) : [];
    return [...exercisePages, ...mobilityPages, ...activityPages];
  });
  const planRows = groupedPlans.map(({ plan, exercises, mobilities }) => ({ key: plan.id, name: plan.name, weekday: plan.weekdays?.length ? plan.weekdays.map((day) => weekdayLabels[day]).join(", ") : plan.weekday ? weekdayLabels[plan.weekday] : "Rotação", duration: plan.estimated_duration_minutes ? formatWorkoutDuration(plan.estimated_duration_minutes * 60) : "-", exercises: exercises.length, mobilities: mobilities.length }));
  return <div className={styles.assessmentReport}>
    <AssessmentPage page={1} variant="cover" footerTitle="Programa de Treino">
      <AssessmentBrand />
      <ReportTitle title="Programa de treino" subtitle="Prescrição individual" />
      <AssessmentSection title="Identificação do aluno"><ReportInfoGrid items={studentInfo(student, [{ label: "Treinador", value: "Igor Santos" }, { label: "Gerado em", value: generatedOn() }])} /></AssessmentSection>
      <AssessmentSection title="Resumo do programa"><ReportSummary items={[[visiblePlans.length, "Treinos"], [totalExercises, "Exercícios"], [totalMobilities, "Mobilidades"], [totalDuration ? formatWorkoutDuration(totalDuration * 60) : "-", "Duração semanal"]]} /></AssessmentSection>
      <AssessmentSection title="Programa prescrito"><DesignTable columns={[{ key: "name", label: "Treino" }, { key: "weekday", label: "Dia" }, { key: "duration", label: "Duração" }, { key: "exercises", label: "Exercícios" }, { key: "mobilities", label: "Mobilidades" }]} rows={planRows} emptyLabel="Nenhum treino cadastrado." /></AssessmentSection>
    </AssessmentPage>
    {contentPages.map((content, index) => <AssessmentPage key={`${content.plan.id}-${content.category ?? content.type}-${content.part}`} page={index + 2} variant="data" footerTitle="Programa de Treino">
      <AssessmentSection title={`${content.plan.name} · ${content.label ?? "Atividades complementares"}${content.plan.weekdays?.length ? ` · ${content.plan.weekdays.map((day) => weekdayLabels[day]).join(", ")}` : content.plan.weekday ? ` · ${weekdayLabels[content.plan.weekday]}` : ""}${content.continued ? " · Continuação" : ""}`}>
        {!content.continued && content.type === "exercises" && (content.plan.subtitle || content.plan.estimated_duration_minutes) && <p className={styles.reportNote}>{content.plan.subtitle}{content.plan.subtitle && content.plan.estimated_duration_minutes ? " · " : ""}{content.plan.estimated_duration_minutes ? `Duração estimada: ${formatWorkoutDuration(content.plan.estimated_duration_minutes * 60)}` : ""}</p>}
        {content.type === "exercises" ? <DesignTable className={styles.workoutTable} columns={exerciseColumns} rows={content.rows} emptyLabel="Nenhum movimento cadastrado." /> : <DesignTable columns={[{ key: "type", label: "Tipo", render: (item) => activityLabels[item.type] ?? item.type }, { key: "name", label: "Atividade", render: (item) => <><strong>{item.name}</strong>{item.instructions && <div className={styles.reportMuted}>{item.instructions}</div>}{item.video_url && <a href={item.video_url}>Ver vídeo</a>}</> }, { key: "duration", label: "Duração", render: (item) => item.duration_minutes ? formatWorkoutDuration(item.duration_minutes * 60) : "-" }, { key: "rounds", label: "Voltas/séries" }, { key: "notes", label: "Orientações" }]} rows={content.rows} />}
      </AssessmentSection>
    </AssessmentPage>)}
  </div>;
}

export function NutritionReport({ student, plan }) {
  const macros = [
    [numberLabel(plan.target_calories, 0), "kcal"], [numberLabel(plan.target_protein_g), "Proteínas (g)"],
    [numberLabel(plan.target_carbohydrates_g), "Carboidratos (g)"], [numberLabel(plan.target_fat_g), "Gorduras (g)"],
  ];
  const mealPages = (plan.meals ?? []).flatMap((meal, mealIndex) => {
    const foodPages = chunkRows(meal.foods ?? [], 8).map((rows, index) => ({ type: "meal", meal, mealIndex, rows, continued: index > 0, part: index + 1 }));
    const recipePages = (meal.foods ?? []).flatMap((food, foodIndex) => [
      ...(food.recipe?.trim() ? recipeParts(food.recipe).map((recipe, part) => ({ type: "recipe", meal, mealIndex, recipeKey: `${foodIndex}-main-${part}`, foodName: food.name, recipe, continued: part > 0 })) : []),
      ...(food.substitutions ?? []).flatMap((substitution, substitutionIndex) => substitution.recipe?.trim() ? recipeParts(substitution.recipe).map((recipe, part) => ({ type: "recipe", meal, mealIndex, recipeKey: `${foodIndex}-${substitutionIndex}-${part}`, foodName: food.name, substitutionName: substitution.name, recipe, continued: part > 0 })) : []),
    ]);
    return [...foodPages, ...recipePages];
  });
  const guidancePages = [
    ...chunkRows(plan.supplements ?? [], 12).filter((rows) => rows.length).map((rows, index) => ({ type: "guidance", title: `Suplementos${index ? " · Continuação" : ""}`, rows })),
    ...chunkRows(plan.ergogenic_resources ?? [], 12).filter((rows) => rows.length).map((rows, index) => ({ type: "guidance", title: `Recursos ergogênicos${index ? " · Continuação" : ""}`, rows })),
  ];
  const contentPages = [...mealPages, ...guidancePages, ...(plan.hydration_target_ml || plan.notes ? [{ type: "orientation" }] : [])];
  return <div className={styles.assessmentReport}>
    <AssessmentPage page={1} variant="cover" footerTitle="Protocolo Nutricional">
      <AssessmentBrand />
      <ReportTitle title="Protocolo nutricional" subtitle={plan.name} />
      <AssessmentSection title="Identificação do aluno"><ReportInfoGrid items={studentInfo(student, [{ label: "Situação", value: plan.status === "active" ? "Ativo" : "Arquivado" }, { label: "Atualizado em", value: dateLabel(plan.created_at ?? plan.published_at) }])} /></AssessmentSection>
      <AssessmentSection title="Resumo nutricional"><ReportSummary items={macros} /></AssessmentSection>
      <AssessmentSection title="Organização do plano"><DesignTable columns={[{ key: "name", label: "Plano" }, { key: "meals", label: "Refeições" }, { key: "water", label: "Meta de água" }, { key: "status", label: "Situação" }]} rows={[{ key: "plan", name: plan.name, meals: plan.meals?.length ?? 0, water: plan.hydration_target_ml ? `${numberLabel(plan.hydration_target_ml, 0)} ml` : "-", status: plan.status === "active" ? "Ativo" : "Arquivado" }]} /></AssessmentSection>
    </AssessmentPage>
    {contentPages.map((content, index) => <AssessmentPage key={`${content.type}-${content.mealIndex ?? content.title ?? index}-${content.recipeKey ?? content.part ?? 1}`} page={index + 2} variant="data" footerTitle="Protocolo Nutricional">
      {content.type === "meal" && <AssessmentSection title={`${content.meal.name}${content.meal.time ? ` · ${content.meal.time}` : ""}${content.continued ? " · Continuação" : ""}`}>
        <DesignTable className={styles.nutritionTable} columns={[{ key: "name", label: "Alimento" }, { key: "quantity", label: "Quantidade", render: (food) => `${numberLabel(food.quantity)} ${food.unit}` }, { key: "substitutions", label: "Substituições", render: (food) => food.substitutions?.length ? food.substitutions.map((item) => `${item.name} (${numberLabel(item.quantity)} ${item.unit})`).join(" / ") : "-" }, { key: "notes", label: "Observações" }]} rows={content.rows} emptyLabel="Nenhum alimento cadastrado." />
        {!content.continued && content.meal.notes && <p className={styles.reportNote}>{content.meal.notes}</p>}
      </AssessmentSection>}
      {content.type === "recipe" && <AssessmentSection title={`Receita - ${content.substitutionName ?? content.foodName}${content.continued ? " · Continuação" : ""}`}>
        <p className={styles.reportNote}>Refeição: {content.meal.name}{content.substitutionName ? ` · Substituição de ${content.foodName}` : ""}</p>
        <div className={styles.reportRecipe}>{content.recipe}</div>
      </AssessmentSection>}
      {content.type === "guidance" && <AssessmentSection title={content.title}><DesignTable columns={[{ key: "name", label: "Item" }, { key: "dose", label: "Dose/quantidade" }, { key: "schedule", label: "Horário/frequência" }, { key: "notes", label: "Orientações" }]} rows={content.rows} /></AssessmentSection>}
      {content.type === "orientation" && <><AssessmentSection title="Consumo de líquidos"><p className={styles.reportNote}><strong>Meta diária de água:</strong> {plan.hydration_target_ml ? `${(plan.hydration_target_ml / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} L` : "Não informada"}</p></AssessmentSection>{plan.notes && <AssessmentSection title="Orientações gerais"><p className={styles.reportNote}>{plan.notes}</p></AssessmentSection>}</>}
    </AssessmentPage>)}
  </div>;
}

export function AssessmentReport({ student, assessment, schema, photos, photoBase, localPhotos }) {
  const values = assessment.results?.values ?? {};
  const rowsFor = (groupKey) => {
    const group = schema.find((item) => item.key === groupKey);
    if (!group) return [];
    return group.fields.filter((field) => !field.hidden && assessment.inputs?.[groupKey]?.[field.key] !== null && assessment.inputs?.[groupKey]?.[field.key] !== undefined && assessment.inputs?.[groupKey]?.[field.key] !== "").map((field) => ({ key: field.key, label: field.label, value: valueLabel(assessment.inputs[groupKey][field.key], field.unit) }));
  };
  const generalRows = rowsFor("general");
  const skinfoldRows = rowsFor("skinfolds");
  const measurementRows = rowsFor("measurements");
  const postureGroups = schema.filter((group) => group.key.startsWith("posture_")).map((group) => ({ ...group, rows: rowsFor(group.key) })).filter((group) => group.rows.length);
  const calculatedKeys = ["body_density", "skinfolds_seven", "arm_difference", "forearm_difference", "thigh_difference", "calf_difference"];
  const resultRows = calculatedKeys.filter((key) => values[key] !== null && values[key] !== undefined && values[key] !== "").map((key) => ({ key, label: resultFields[key][0], value: valueLabel(values[key], resultFields[key][1]) }));
  const summary = [
    [valueLabel(assessment.inputs?.general?.weight, "kg"), "Peso"],
    [valueLabel(values.bmi), "IMC"],
    [valueLabel(values.body_fat_percentage, "%"), "Gordura corporal"],
    [valueLabel(values.muscle_mass, "kg"), "Massa muscular"],
    [valueLabel(values.fat_mass, "kg"), "Massa gorda"],
    [valueLabel(values.fat_free_mass, "kg"), "Massa livre de gordura"],
    [valueLabel(values.waist_hip_ratio), "Relação cintura/quadril"],
  ];
  const status = assessment.status === "finalized" ? "Finalizada" : assessment.status === "corrected" ? "Versão corrigida" : "Rascunho";
  const hasLocalPhotos = Object.values(localPhotos ?? {}).some(Boolean);
  const showPhotoPage = !student?.external || hasLocalPhotos;
  const compactFields = new Set(["weight", "height", "systolic", "diastolic", "resting_heart_rate"]);
  const compactExternal = student?.external && !showPhotoPage && !postureGroups.length && !skinfoldRows.length && !measurementRows.length && generalRows.length > 0 && generalRows.every((row) => compactFields.has(row.key));
  const totalPages = compactExternal ? 1 : 2 + Number(postureGroups.length > 0) + Number(showPhotoPage);
  const photoPage = 2 + Number(postureGroups.length > 0) + Number(showPhotoPage);

  if (compactExternal) return <div className={`${styles.assessmentReport} ${styles.physicalAssessmentReport}`}>
    <AssessmentPage page={1} total={1} stripe>
      <AssessmentBrand />
      <header className={styles.assessmentTitle}>
        <h1>Avaliação física</h1>
        <p>{dateLabel(assessment.assessed_on)} · Versão {assessment.version} · Situação: {status}</p>
      </header>
      <AssessmentSection title="Identificação da pessoa avaliada">
        <dl className={styles.assessmentInfo}>{studentInfo(student, [
          { label: "Data da avaliação", value: dateLabel(assessment.assessed_on) },
          { label: "Versão", value: assessment.version },
        ]).map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.label === "Sexo" ? sexLabel(item.value) : item.value || "-"}</dd></div>)}</dl>
      </AssessmentSection>
      <AssessmentSection title="Dados gerais"><AssessmentTable rows={generalRows} /></AssessmentSection>
      {summary[1][0] !== "-" && <AssessmentSection title="Índice de massa corporal"><p className={styles.reportNote}>IMC: {summary[1][0]} kg/m²</p></AssessmentSection>}
    </AssessmentPage>
  </div>;

  return <div className={`${styles.assessmentReport} ${styles.physicalAssessmentReport}`}>
    <AssessmentPage page={1} total={totalPages} stripe>
      <AssessmentBrand />
      <header className={styles.assessmentTitle}>
        <h1>Avaliação física</h1>
        <p>{dateLabel(assessment.assessed_on)} · Versão {assessment.version} · Situação: {status}</p>
      </header>
      <AssessmentSection title={student?.external ? "Identificação da pessoa avaliada" : "Identificação do aluno"}>
        <dl className={styles.assessmentInfo}>{studentInfo(student, [
          { label: "Data da avaliação", value: dateLabel(assessment.assessed_on) },
          { label: "Versão", value: assessment.version },
        ]).map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.label === "Sexo" ? sexLabel(item.value) : item.value || "-"}</dd></div>)}</dl>
      </AssessmentSection>
      <AssessmentSection title="Resumo corporal">
        <div className={styles.assessmentSummary}>{summary.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
      </AssessmentSection>
      <AssessmentSection title="Resultados calculados">
        <AssessmentTable rows={resultRows} />
      </AssessmentSection>
    </AssessmentPage>

    <AssessmentPage page={2} total={totalPages} variant="data">
      <div className={styles.assessmentColumns}>
        <AssessmentSection title="Dados gerais"><AssessmentTable rows={generalRows} /></AssessmentSection>
        <AssessmentSection title="Dobras cutâneas"><AssessmentTable rows={skinfoldRows} /></AssessmentSection>
      </div>
      <AssessmentSection title="Medidas e perímetros"><AssessmentTable rows={measurementRows} /></AssessmentSection>
    </AssessmentPage>

    {postureGroups.length > 0 && <AssessmentPage page={3} total={totalPages} variant="standard">
      <div className={styles.assessmentPostureGrid}>{postureGroups.map((group) => <AssessmentSection title={group.label} key={group.key}><AssessmentTable rows={group.rows} /></AssessmentSection>)}</div>
    </AssessmentPage>}

    {showPhotoPage && <AssessmentPage page={photoPage} total={totalPages} stripe>
      <AssessmentSection title="Fotos da avaliação" className={styles.assessmentPhotosSection}>
        <AssessmentPhotoLayout assessment={assessment} photos={photos} photoBase={photoBase} localPhotos={localPhotos} />
      </AssessmentSection>
      <div className={styles.assessmentSignature}><strong>IS COACH</strong><span>Treinamento · Avaliação Física · Acompanhamento</span></div>
    </AssessmentPage>}
  </div>;
}

function sexLabel(value) {
  return ({ feminino: "Feminino", masculino: "Masculino", outro: "Outro", prefiro_nao_informar: "Prefiro não informar" })[String(value ?? "").toLowerCase()] ?? value ?? "-";
}

function AssessmentBrand() {
  return <div className={styles.assessmentBrand}><img src="/images/igor-santos-logo.webp" alt="Logo IS Coach" /><div><strong>IS COACH</strong><span>Treinamento · Avaliação · Performance</span></div></div>;
}

function AssessmentPage({ page, total, variant, footerTitle = "Avaliação Física", children }) {
  const resolvedVariant = variant ?? (page === 1 ? "cover" : page === total ? "photo" : page === 2 ? "data" : "standard");
  const pageClass = resolvedVariant === "cover" ? styles.assessmentCoverPage : resolvedVariant === "photo" ? styles.assessmentPhotoPage : resolvedVariant === "data" ? styles.assessmentDataPage : "";
  return <article className={`${styles.assessmentPage} ${pageClass}`}><div className={styles.assessmentStripe} />{children}<footer className={styles.assessmentFooter}><span>IS Coach Treinamento&nbsp; · &nbsp;{footerTitle}</span><span>Página {page}</span></footer></article>;
}

function AssessmentSection({ title, children, className = "" }) {
  return <section className={`${styles.assessmentSection} ${className}`}><h2>{title}</h2>{children}</section>;
}

function AssessmentTable({ rows }) {
  return <table className={styles.assessmentTable}><thead><tr><th>Dado</th><th>Valor</th></tr></thead><tbody>{rows.map((row) => <tr key={row.key}><td>{row.label}</td><td>{row.value}</td></tr>)}</tbody></table>;
}

export function AssessmentReportButton({ student, assessment, schema, photoBase }) {
  const [photos, setPhotos] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const show = async () => {
    setBusy(true); setMessage("");
    try {
      const response = await apiRequest(photoBase ?? `/v1/assessments/${assessment.id}/photos`);
      setPhotos(response); setOpen(true);
    } catch (error) {
      if (error.status === 403) { setPhotos(null); setOpen(true); }
      else setMessage(error.message);
    } finally { setBusy(false); }
  };
  return <><ReportButton disabled={busy} onClick={show}>{busy ? "Preparando…" : "Gerar PDF"}</ReportButton>{message && <small role="alert">{message}</small>}{open && <PrintableReport title={`avaliacao-${studentName(student)}-${assessment.assessed_on}`} variant="assessment" onClose={() => setOpen(false)}><AssessmentReport student={student} assessment={assessment} schema={schema} photos={photos} photoBase={photoBase} /></PrintableReport>}</>;
}

function AssessmentPhotoLayout({ assessment, photos, photoBase, localPhotos }) {
  const consent = Boolean(localPhotos || photos?.photo_consent);
  return <div className={styles.assessmentPhotoGrid}>{Object.entries(photoPositions).map(([position, label]) => {
    const photo = consent ? photos?.data?.find((item) => item.position === position) : null;
    const localUrl = localPhotos?.[position];
    return <figure key={position}>
      {localUrl || photo ? <img data-report-photo src={localUrl ?? appPath(`api${photoBase ?? `/v1/assessments/${assessment.id}/photos`}/${photo.id}?v=${photo.version}`)} alt={`${label} da avaliação de ${dateLabel(assessment.assessed_on)}`} /> : <div className={styles.assessmentPhotoPlaceholder}>{consent ? "Foto não cadastrada" : "Foto não autorizada"}</div>}
      <figcaption>{label.toUpperCase()} · {dateLabel(assessment.assessed_on)}</figcaption>
    </figure>;
  })}</div>;
}

export function AssessmentComparisonReport({ student, first, second, schema, photos }) {
  const rows = [
    ...Object.entries(resultFields).map(([key, [label, unit]]) => ({ key: `result.${key}`, group: "Resultados calculados", label, unit, before: first.results?.values?.[key], after: second.results?.values?.[key] })),
    ...schema.flatMap((group) => group.fields.filter((field) => !field.hidden).map((field) => ({ key: `${group.key}.${field.key}`, group: group.label, label: field.label, unit: field.unit ?? "", before: first.inputs?.[group.key]?.[field.key], after: second.inputs?.[group.key]?.[field.key] }))),
  ].filter((row) => row.before !== null && row.before !== undefined && row.before !== "" || row.after !== null && row.after !== undefined && row.after !== "");
  const delta = (row) => {
    const before = Number(row.before), after = Number(row.after);
    if (!Number.isFinite(before) || !Number.isFinite(after)) return row.before === row.after ? "Sem alteração" : "Alterado";
    const difference = after - before;
    return `${difference > 0 ? "+" : ""}${numberLabel(difference, 3)}${row.unit ? ` ${row.unit}` : ""}`;
  };
  const columns = [
    { key: "label", label: "Dado", render: (row) => <>{row.group && <small className={styles.reportMuted}>{row.group}<br /></small>}{row.label}</> },
    { key: "before", label: dateLabel(first.assessed_on), render: (row) => valueLabel(row.before, row.unit) },
    { key: "after", label: dateLabel(second.assessed_on), render: (row) => valueLabel(row.after, row.unit) },
    { key: "delta", label: "Diferença", render: delta },
  ];
  const importantKeys = new Set(["result.bmi", "result.body_fat_percentage", "result.muscle_mass", "general.weight"]);
  const summaryRows = rows.filter((row) => importantKeys.has(row.key));
  const comparisonPages = chunkRows(rows, 18).map((pageRows, index) => ({ type: "data", rows: pageRows, part: index + 1 }));
  const photoGroups = Object.entries(photoPositions).map(([position, label]) => ({ position, label, entries: [first, second].map((assessment) => ({ assessment, photo: photos?.[String(assessment.id)]?.data?.find((item) => item.position === position), consent: photos?.[String(assessment.id)]?.photo_consent })) }));
  const hasPhotos = photoGroups.some((group) => group.entries.some((entry) => entry.photo));
  const interval = Math.abs(new Date(second.assessed_on) - new Date(first.assessed_on)) / 86400000;
  const contentPages = [...comparisonPages, ...(hasPhotos ? photoGroups.map((group) => ({ type: "photos", group })) : [])];
  return <div className={styles.assessmentReport}>
    <AssessmentPage page={1} variant="cover" footerTitle="Comparativo de Avaliações">
      <AssessmentBrand />
      <ReportTitle title="Comparativo de avaliações" subtitle={`${dateLabel(first.assessed_on)} × ${dateLabel(second.assessed_on)}`} />
      <AssessmentSection title="Identificação do aluno"><ReportInfoGrid items={studentInfo(student, [{ label: "Primeira avaliação", value: dateLabel(first.assessed_on) }, { label: "Segunda avaliação", value: dateLabel(second.assessed_on) }])} /></AssessmentSection>
      <AssessmentSection title="Resumo do comparativo"><ReportSummary items={[[dateLabel(first.assessed_on), "Avaliação inicial"], [dateLabel(second.assessed_on), "Avaliação atual"], [rows.length, "Dados comparados"], [Number.isFinite(interval) ? `${numberLabel(interval, 0)} dias` : "-", "Intervalo"]]} /></AssessmentSection>
      <AssessmentSection title="Principais resultados"><DesignTable className={styles.comparisonTable} columns={columns} rows={summaryRows} /></AssessmentSection>
    </AssessmentPage>
    {contentPages.map((content, index) => <AssessmentPage key={content.type === "data" ? `data-${content.part}` : `photo-${content.group.position}`} page={index + 2} variant={content.type === "photos" ? "photo" : "data"} footerTitle="Comparativo de Avaliações">
      {content.type === "data" ? <AssessmentSection title={`Comparativo completo${content.part > 1 ? " · Continuação" : ""}`}><DesignTable className={styles.comparisonTable} columns={columns} rows={content.rows} /></AssessmentSection> : <AssessmentSection title={`Fotos comparativas · ${content.group.label}`} className={styles.comparisonPhotosSection}><ComparisonPhotoLayout entries={content.group.entries} label={content.group.label} /></AssessmentSection>}
    </AssessmentPage>)}
  </div>;
}

function ComparisonPhotoLayout({ entries, label }) {
  return <div className={styles.comparisonPhotoGrid}>{entries.map(({ assessment, photo, consent }, index) => <figure key={`${assessment.id}-${index}`}>
    {photo ? <img data-report-photo src={appPath(`api/v1/assessments/${assessment.id}/photos/${photo.id}?v=${photo.version}`)} alt={`${label} da avaliação de ${dateLabel(assessment.assessed_on)}`} /> : <div className={styles.assessmentPhotoPlaceholder}>{consent ? "Foto não cadastrada" : "Foto não autorizada pelo aluno"}</div>}
    <figcaption>{label.toUpperCase()} · {dateLabel(assessment.assessed_on)}</figcaption>
  </figure>)}</div>;
}
