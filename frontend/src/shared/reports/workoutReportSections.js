export function categorizeWorkoutMovements(movements = []) {
  const exercises = [];
  const mobilities = [];

  for (const movement of movements) {
    if ((movement.category ?? movement.exercise?.category) === "mobility") {
      mobilities.push(movement);
    } else {
      exercises.push(movement);
    }
  }

  return { exercises, mobilities };
}
