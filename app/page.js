import { redirect } from "next/navigation";
import sql, { initSettingsDb, initAdminDb } from "../lib/db";

export default async function Home() {
  let target = null;

  try {
    await initSettingsDb();
    await initAdminDb();

    const settings = await sql`SELECT value FROM settings WHERE key = 'default_exercise_id'`;
    const defaultId = settings[0]?.value;

    if (defaultId) {
      const [ex] = await sql`SELECT slug FROM exercises WHERE id = ${parseInt(defaultId)}`;
      if (ex?.slug) target = `/e/${ex.slug}`;
    }

    if (!target) {
      const [first] = await sql`SELECT slug FROM exercises ORDER BY created_at LIMIT 1`;
      if (first?.slug) target = `/e/${first.slug}`;
    }
  } catch {
    // DB not reachable yet — fall through to the placeholder below
  }

  // Call redirect outside try/catch so Next.js's redirect mechanism isn't swallowed
  if (target) redirect(target);

  return (
    <div style={{
      minHeight: "100vh", background: "#FAFAF8",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: 36, fontWeight: 800, color: "#6B1A1A",
          fontFamily: "Georgia,serif", letterSpacing: 1, marginBottom: 8,
        }}>
          SHARP
        </div>
        <p style={{ fontSize: 14, color: "#6B6672", margin: 0 }}>
          No exercise configured. Set a default exercise in the admin panel.
        </p>
      </div>
    </div>
  );
}
