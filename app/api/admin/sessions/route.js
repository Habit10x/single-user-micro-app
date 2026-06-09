import { NextResponse } from "next/server";
import sql, { initDb } from "../../../../lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const exerciseId = searchParams.get("exercise_id");
  if (!exerciseId) return NextResponse.json({ error: "exercise_id required" }, { status: 400 });

  await initDb();

  const sessions = await sql`
    SELECT
      s.id,
      s.exercise_id,
      s.label,
      s.gap_hours,
      s.force_closed,
      s.started_at,
      COUNT(sub.id)::int                                        AS participant_count,
      MAX(sub.submitted_at)                                     AS last_submission,
      ROUND(AVG((sub.sharp_results->>'score')::numeric), 1)    AS avg_score
    FROM sessions s
    LEFT JOIN submissions sub ON sub.session_id = s.id
    WHERE s.exercise_id = ${parseInt(exerciseId)}
    GROUP BY s.id
    ORDER BY s.started_at DESC
  `;

  const now = Date.now();
  const enriched = sessions.map((sess, idx, arr) => {
    const gapMs   = parseFloat(sess.gap_hours) * 3600 * 1000;
    const lastSub = sess.last_submission ? new Date(sess.last_submission).getTime() : null;
    const active  = !sess.force_closed && lastSub && (now - lastSub) < gapMs;
    return {
      ...sess,
      session_number: arr.length - idx,
      status: sess.force_closed ? "closed" : (active ? "active" : "closed"),
    };
  });

  return NextResponse.json({ sessions: enriched });
}
