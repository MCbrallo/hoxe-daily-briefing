import * as xlsx from 'xlsx';

function flatten() {
  const filePath = 'C:/Users/34646/Downloads/on_this_day_april_20_26.xlsx';
  const outPath = 'C:/Users/34646/Downloads/on_this_day_april_20_26_flat.xlsx';

  const wb = xlsx.readFile(filePath);
  
  // 1. Read Daily Events
  const dailySheet = wb.Sheets["Daily_Events"];
  const dailyRows = xlsx.utils.sheet_to_json(dailySheet, { defval: "" }) as any[];
  
  // Fix the empty column header bug
  const fixedDaily = dailyRows.map(r => {
    if (r[""]) r.app_date = r[""];
    return r;
  });

  // 2. Read Viral
  const viralSheet = wb.Sheets["Viral"];
  const viralRows = xlsx.utils.sheet_to_json(viralSheet, { defval: "" }) as any[];
  const fixedViral = viralRows.map(r => {
    if (r[""]) r.app_date = r[""];
    // rename viral_type to category to match flat structure expected by import_excel_v3
    if (r.viral_type) {
      const dbCategoryMap: Record<string, string> = {
        "music #1": "viral_music",
        "internet milestone": "viral_milestone",
        "tweet": "viral_tweet",
        "video": "viral_video",
        "news / scandal": "viral_scandal",
        "box office #1": "viral_film",
        "world record": "viral_record",
        "birth of internet trope": "viral_trope",
        "quote": "viral_quote"
      };
      
      const vtype = String(r.viral_type).toLowerCase().trim();
      r.category = dbCategoryMap[vtype] || "viral_moment";
    }
    return r;
  });

  // 3. Combine
  const combined = [...fixedDaily, ...fixedViral];

  // 4. Save to new workbook
  const newWb = xlsx.utils.book_new();
  const newSheet = xlsx.utils.json_to_sheet(combined);
  xlsx.utils.book_append_sheet(newWb, newSheet, "AllData");
  
  xlsx.writeFile(newWb, outPath);
  console.log(`Saved flat Excel file to ${outPath} with ${combined.length} rows`);
}

flatten();
