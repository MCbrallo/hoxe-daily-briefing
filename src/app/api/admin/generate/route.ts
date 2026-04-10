import { NextResponse } from "next/server";
import { generateForDate } from "../../../../../scripts/generate_daily";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { password, date } = await req.json();

    if (password !== "hoxe2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!date) {
      return NextResponse.json({ error: "Missing date parameter" }, { status: 400 });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    // Call the generation script for the specified date
    await generateForDate(targetDate);

    // Let's verify it actually saved by checking the DB real quick
    const dateString = targetDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    const { data } = await supabase
      .from("daily_briefings")
      .select("id, briefing_items(count)")
      .eq("date", dateString)
      .limit(1)
      .single();

    if (!data) {
       return NextResponse.json({ error: "Pipeline ran but no items committed. Likely Wikipedia API rate limit or empty date." }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Generated ${dateString} successfully.` 
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
