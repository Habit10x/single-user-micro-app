import { redirect } from "next/navigation";
import SharpApp from "../../../components/SharpApp";
import sql, { initAdminDb } from "../../../lib/db";

export default async function ExercisePage({ params }) {
  const { id } = await params;
  const numId = parseInt(id);

  if (isNaN(numId)) redirect("/");

  try {
    await initAdminDb();

    const exercises = await sql`SELECT * FROM exercises WHERE id = ${numId}`;
    if (!exercises.length) redirect("/");

    const exercise = exercises[0];
    const scenarios = await sql`
      SELECT s.*
      FROM scenarios s
      JOIN exercise_scenarios es ON s.id = es.scenario_id
      WHERE es.exercise_id = ${numId}
      ORDER BY es.order_index
    `;

    return <SharpApp exercise={exercise} scenarios={scenarios} />;
  } catch {
    redirect("/");
  }
}
