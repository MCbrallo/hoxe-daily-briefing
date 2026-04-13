async function test(q: string) {
  try {
    const r = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=1`);
    const d = await r.json();
    const t = d.data?.[0];
    console.log(q.padEnd(50), '→', t ? `${t.artist.name} - ${t.title} (ID:${t.id})` : 'NOT FOUND');
  } catch(e: any) {
    console.log(q.padEnd(50), '→ ERROR:', e.message);
  }
}

async function main() {
  const queries = [
    "50 Cent Candy Shop",
    "Gotye Somebody That I Used To Know",
    "Uptown Funk Bruno Mars",
    "Lil Nas X Old Town Road",
    "Glenn Miller Pennsylvania 6-5000",
    "Duke Ellington",
    "Usher Yeah Lil Jon",
    "Aretha Franklin Respect",
    "Paul McCartney",
    "Frank Sinatra Strangers In The Night"
  ];
  
  for (const q of queries) {
    await test(q);
  }
}

main();
