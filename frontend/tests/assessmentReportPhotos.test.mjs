import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const positions = ["front", "right", "left", "back"];
const labels = ["Frontal", "Lateral direita", "Lateral esquerda", "Posterior"];
const assessment = (id, date) => ({ id, assessed_on: date, version: 1, status: "finalized", inputs: {}, results: { values: {} } });
const photosFor = (id) => ({ photo_consent: true, data: positions.map((position, index) => ({ id: id * 10 + index, position, version: "test" })) });

test("assessment PDFs include all four distinct photo positions", async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  try {
    const { AssessmentReport, AssessmentComparisonReport } = await vite.ssrLoadModule("/src/shared/reports/ReportDocuments.jsx");
    const first = assessment(1, "2026-09-01");
    const second = assessment(2, "2026-09-24");
    const individual = renderToStaticMarkup(React.createElement(AssessmentReport, { student: { name: "Aluno Teste" }, assessment: first, schema: [], photos: photosFor(1) }));
    const comparison = renderToStaticMarkup(React.createElement(AssessmentComparisonReport, { student: { name: "Aluno Teste" }, first, second, schema: [], photos: { 1: photosFor(1), 2: photosFor(2) } }));
    const partial = renderToStaticMarkup(React.createElement(AssessmentReport, { student: { name: "Aluno Teste" }, assessment: first, schema: [], photos: { photo_consent: true, data: photosFor(1).data.slice(0, 1) } }));

    for (const label of labels) {
      assert.match(individual, new RegExp(`alt="${label} da avaliação de 01/09/2026"`));
      assert.match(comparison, new RegExp(`alt="${label} da avaliação de 01/09/2026"`));
      assert.match(comparison, new RegExp(`alt="${label} da avaliação de 24/09/2026"`));
    }
    assert.equal((individual.match(/<img[^>]+alt="(?:Frontal|Lateral direita|Lateral esquerda|Posterior) da avaliação/g) ?? []).length, 4);
    assert.equal((comparison.match(/<img[^>]+alt="(?:Frontal|Lateral direita|Lateral esquerda|Posterior) da avaliação/g) ?? []).length, 8);
    assert.equal((individual.match(/data-report-photo="true"/g) ?? []).length, 4);
    assert.equal((comparison.match(/data-report-photo="true"/g) ?? []).length, 8);
    assert.equal((partial.match(/Foto não cadastrada/g) ?? []).length, 3);
  } finally {
    await vite.close();
  }
});
