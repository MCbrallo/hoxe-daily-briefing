import * as xlsx from 'xlsx';
import * as fs from 'fs';

function check() {
  const result: any = {};
  const files = [
    'on_this_day_may_4_to_10_database.xlsx',
    'on_this_day_may11_17_2026_app_database.xlsx',
    'on_this_day_april27_may3_master.xlsx',
    'on_this_day_april_20_26_flat.xlsx'
  ];
  for(const file of files) {
    try {
      const wb = xlsx.readFile(`C:/Users/34646/Downloads/${file}`);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet) as any[];
      if(rows.length > 0) {
        result[file] = {
           keys: Object.keys(rows[0]),
           hasSong: rows.some(r => r.song_id || r.song_to_add || r.spotify_track_id)
        };
      }
    } catch(e) {}
  }
  fs.writeFileSync('C:/tmp/out_keys.json', JSON.stringify(result, null, 2));
}

check();
