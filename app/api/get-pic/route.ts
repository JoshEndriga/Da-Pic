import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  try {
    // Initialize Neon with your existing POSTGRES_URL
    const sql = neon(process.env.POSTGRES_URL!);

    // 1. Calculate the cutoff time (24 hours ago)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // 2. Query the database using the new Neon syntax
    // Neon handles the template literal safely to prevent SQL injection
    const rows = await sql`
      SELECT url FROM pics 
      WHERE code = ${code} 
      AND created_at > ${twentyFourHoursAgo.toISOString()}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Code expired or not found" }, { status: 404 });
    }

    return NextResponse.json({ url: rows[0].url });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}