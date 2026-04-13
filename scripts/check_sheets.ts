import * as xlsx from "xlsx";

function check(file: string) {
  try {
    const wb = xlsx.readFile(`C:/Users/34646/Downloads/${file}`);
    console.log(`[${file}] -> Sheets: ${wb.SheetNames.join(", ")}`);
  } catch(e) {
    console.log(`Failed to read ${file}`);
  }
}

check("on_this_day_april27_may3_master.xlsx");
check("on_this_day_may_4_to_10_database.xlsx");
check("on_this_day_may11_17_2026_app_database.xlsx");
check("on_this_day_may_18_24_2026.xlsx");
check("on_this_day_april_20_26.xlsx");
