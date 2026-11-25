const weekOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// Os treinos chegam na ordem em que o professor os criou (A, B, C…).
// Sequência: começa no treino atual ou no próximo e segue a ordem, voltando ao início no fim.
// Dias fixos: começa pelo treino de hoje e segue pelos próximos dias da semana.
export function orderPlansForStudent(plans, schedule, currentPlanId = null, today = new Date()) {
  if (schedule.mode === "fixed") {
    const todayIndex = (today.getDay() + 6) % 7;
    const daysUntil = (plan) => {
      const days = plan.weekdays?.length ? plan.weekdays : plan.weekday ? [plan.weekday] : [];
      return days.length ? Math.min(...days.map((day) => (weekOrder.indexOf(day) - todayIndex + 7) % 7)) : 7;
    };
    return plans.map((plan, index) => ({ plan, index, wait: daysUntil(plan) }))
      .sort((left, right) => left.wait - right.wait || left.index - right.index)
      .map(({ plan }) => plan);
  }
  const anchor = plans.findIndex((plan) => plan.id === (currentPlanId ?? schedule.next_plan_id ?? schedule.recommended_plan_id));
  return anchor > 0 ? [...plans.slice(anchor), ...plans.slice(0, anchor)] : [...plans];
}
