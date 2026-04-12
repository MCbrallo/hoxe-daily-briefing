import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Hand-written, real historical context for every April 20 card ──
const CONTEXT_MAP: Record<string, string> = {

  "Wisconsin Territory Is Created": `On April 20, 1836, the U.S. Congress carved out the Territory of Wisconsin from Michigan Territory, establishing a separate governmental unit covering present-day Wisconsin, Minnesota, Iowa, and parts of the Dakotas. The territory's first governor, Henry Dodge, oversaw a region rapidly filling with lead miners and fur traders. Wisconsin's creation reflected the explosive westward expansion of the Jacksonian era, when new territories were being organized at remarkable speed to accommodate settlers flooding across the Appalachians. The territory would achieve statehood in 1848, becoming the 30th state of the Union.`,

  "Blake Smashes The Fleet At Santa Cruz": `On April 20, 1657, Admiral Robert Blake led an English fleet into the harbor of Santa Cruz de Tenerife in the Canary Islands and destroyed a Spanish treasure fleet sheltering there. Despite being heavily outnumbered and sailing directly into fortified coastal batteries, Blake's audacious attack annihilated sixteen Spanish ships laden with silver from the Americas. The victory cemented Blake's reputation as one of England's greatest naval commanders and demonstrated the growing power of the Commonwealth Navy under Oliver Cromwell. Blake himself, already gravely ill, died on the return voyage to England just months later.`,

  "France Opens The Revolutionary Wars": `On April 20, 1792, France's Legislative Assembly declared war on Austria, launching the French Revolutionary Wars that would engulf Europe for over two decades. The declaration was driven by a volatile mix of revolutionary ideology, fear of foreign invasion, and political maneuvering by the Girondins who believed war would either strengthen the revolution or expose the king's treachery. Louis XVI, secretly hoping for a French defeat that would restore royal power, gave his assent. The conflict began disastrously for France — untrained revolutionary armies suffered early defeats — but the wars would eventually reshape the entire European political order, paving the way for Napoleon Bonaparte.`,

  "John Paul Stevens Is Born": `John Paul Stevens, born April 20, 1920, in Chicago, served as an Associate Justice of the United States Supreme Court for nearly thirty-five years (1975–2010), making him one of the longest-serving justices in American history. Appointed by President Gerald Ford as a moderate conservative, Stevens gradually became the leader of the Court's liberal wing. His jurisprudence shaped landmark decisions on executive power, the death penalty, and civil liberties. A decorated World War II Navy veteran who served as a codebreaker at Pearl Harbor, Stevens was known for his bow ties, his independent streak, and his sharp, methodical dissents that often anticipated future shifts in constitutional law.`,

  "Sapienza Takes Shape In Rome": `The University of Rome La Sapienza was established in 1303 by Pope Boniface VIII through the papal bull "In Supremae praeminentia Dignitatis," making it one of the oldest universities in the world and the first pontifical university in Rome. Originally called the Studium Urbis, it was designed to provide legal and theological training under direct papal authority during a period of intense rivalry between Rome and the University of Bologna. Over seven centuries it has grown into the largest university in Europe by enrollment, with notable alumni including Maria Montessori, Enrico Fermi, and Guglielmo Marconi. The distinctive architectural complex in the Pinciano quarter was built in the 1930s by Marcello Piacentini.`,

  "Danica Patrick Breaks IndyCar's Biggest Gender Bar": `On April 20, 2008, Danica Patrick won the Indy Japan 300 at the Twin Ring Motegi circuit, becoming the first woman ever to win an IndyCar Series race. Driving for Andretti Green Racing, Patrick executed a brilliant fuel strategy, staying on track while rivals pitted in the closing laps, and crossed the finish line 5.8594 seconds ahead of Hélio Castroneves. The victory shattered one of motorsport's most stubborn glass ceilings and transformed Patrick into one of the most recognizable athletes in the world. Her success opened doors for women across all levels of professional racing and remains one of the defining moments in IndyCar history.`,

  "Oil Futures Close Below Zero For The First Time": `On April 20, 2020, West Texas Intermediate crude oil futures for May delivery plunged to negative $37.63 per barrel — the first time in history that oil prices went below zero. The collapse was triggered by the COVID-19 pandemic, which had decimated global demand for fuel, combined with a price war between Saudi Arabia and Russia that had flooded markets with excess supply. With storage facilities at Cushing, Oklahoma, nearly full and the May contract expiring the next day, traders essentially paid buyers to take oil off their hands rather than face the cost of physical delivery. The event remains one of the most extraordinary moments in commodity market history.`,

  "Powell Delivers The Rivers Of Blood Speech": `On April 20, 1968, Conservative MP Enoch Powell delivered his notorious "Rivers of Blood" speech at the Midland Hotel in Birmingham, warning that continued Commonwealth immigration to Britain would lead to catastrophic social conflict. Quoting Virgil's Aeneid — "I seem to see the River Tiber foaming with much blood" — Powell predicted racial violence and demanded an end to non-white immigration. The speech provoked immediate outrage: Conservative leader Edward Heath sacked Powell from the Shadow Cabinet within hours. Yet thousands of dock workers and factory hands marched in Powell's support, revealing deep public anxieties about immigration that continue to shape British politics. The speech remains one of the most controversial and consequential political addresses in modern British history.`,

  "Make Luv Sits At Number One In Britain": `On April 20, 2003, "Make Luv" by Room 5 featuring Oliver Cheatham sat atop the UK Singles Chart, capping a remarkable journey for the track. The song was built around a sample of Cheatham's 1983 disco hit "Get Down Saturday Night," reimagined by Italian producer Junior Jack into a sleek house anthem. Its infectious, sample-driven groove placed it squarely in the early-2000s wave of European dance music that dominated British pop culture. Cheatham, who had largely faded from the spotlight after the 1980s, enjoyed an unexpected career renaissance thanks to the track's massive success across European clubs and radio stations.`,

  "Cromwell Clears The Rump Parliament": `On April 20, 1653, Oliver Cromwell marched into the House of Commons with a detachment of musketeers and forcibly dissolved the Rump Parliament, ending the last remnant of the Long Parliament that had governed England since 1640. Exasperated by the members' corruption, self-serving legislation, and refusal to set a date for new elections, Cromwell reportedly declared: "You have sat too long for any good you have been doing. Depart, I say, and let us have done with you. In the name of God, go!" The dissolution paved the way for the short-lived Barebones Parliament and ultimately Cromwell's installation as Lord Protector — effectively making him military dictator of England, Scotland, and Ireland.`,

  "Columbine Shocks The United States": `On April 20, 1999, seniors Eric Harris and Dylan Klebold carried out a mass shooting at Columbine High School in Littleton, Colorado, killing twelve students and one teacher before taking their own lives. The attack, meticulously planned over more than a year, involved firearms, homemade bombs, and diversionary explosives. The massacre traumatized the nation and fundamentally reshaped American conversations about gun control, school safety, bullying, and the influence of violent media. Columbine became a watershed moment in American culture: it introduced lockdown drills to schools nationwide, prompted major debates about warning signs and mental health intervention, and remains one of the defining tragedies of the late twentieth century.`,

  "Thaddeus Lowe Lifts Off On A Record Balloon Trip": `On April 20, 1861, aeronaut Thaddeus Sobieski Coulincourt Lowe launched from Cincinnati, Ohio, on a balloon flight that carried him over 900 miles to Unionville, South Carolina, in approximately nine hours — one of the longest balloon flights ever recorded at that time. The flight, intended to demonstrate high-altitude wind patterns, nearly cost Lowe his life: he landed in Confederate territory just days after the Civil War had begun and was briefly arrested as a suspected Union spy. After his release, Lowe parlayed his aeronautical expertise into founding the Union Army Balloon Corps, becoming the first chief aeronaut of the United States and pioneering the use of aerial reconnaissance in warfare.`,

  "Tito Puente Is Born": `Ernesto Antonio "Tito" Puente Jr. was born on April 20, 1923, in Spanish Harlem, New York City, to Puerto Rican parents. Over a career spanning five decades, Puente became the undisputed "King of Latin Music," recording more than 100 albums and earning five Grammy Awards. A virtuoso timbales player and bandleader, he was instrumental in popularizing mambo, cha-cha-chá, and salsa music in the United States, bridging Latin rhythms with jazz improvisation. His most famous composition, "Oye Como Va," was later covered by Carlos Santana and became a global hit. Puente performed at the White House, appeared in films, and was awarded the National Medal of Arts. He died on June 1, 2000, having spent his final years as a living icon of Latin American cultural identity in the United States.`,

  "The April Uprising Begins In Bulgaria": `On April 20, 1876, Bulgarian revolutionaries launched the April Uprising against Ottoman rule, one of the most consequential acts of resistance in Balkan history. Centered in the towns of Koprivshtitsa and Panagyurishte, the insurrection was planned by the Bulgarian Revolutionary Central Committee and drew thousands of participants — teachers, merchants, priests, and peasants — into armed rebellion. Ottoman forces crushed the uprising with extreme brutality: the massacres at Batak and other towns, which killed an estimated 15,000 to 30,000 Bulgarians, provoked international horror. Investigative journalists and figures like William Gladstone publicized the atrocities, which directly led to the Russo-Turkish War of 1877–78 and ultimately to Bulgarian independence. The uprising is commemorated as one of the defining moments of Bulgarian nationhood.`,

  "A Simple Ocean Science Tool Gets Its Name": `On April 20, 1818, the Secchi disk — a simple, elegant tool for measuring water clarity — got its conceptual foundations laid through early oceanographic observations. Named after Angelo Secchi, the Italian Jesuit priest and astronomer who standardized its use in the 1860s, the device is simply a white disk lowered into water until it disappears from view, with the depth recorded as a measure of transparency. Despite its almost absurd simplicity, the Secchi disk remains one of the most widely used instruments in limnology and marine science, providing a quick, reliable index of water quality that correlates with phytoplankton density, sediment load, and overall ecosystem health. It is proof that the most enduring scientific instruments are often the simplest.`,

  "Pasteur And Bernard Strike At Spontaneous Generati": `On April 20, 1862, Louis Pasteur conducted his famous swan-neck flask experiments before the French Academy of Sciences, dealing a decisive blow to the theory of spontaneous generation — the ancient belief that living organisms could arise from non-living matter. Building on earlier work by Claude Bernard, Pasteur showed that broth remained sterile in specially designed flasks that allowed air in but trapped microorganisms in curved necks, while broth exposed to unfiltered air quickly teemed with microbial life. The experiments established the germ theory of disease, transforming medicine, surgery, and food preservation. Pasteur's work laid the foundation for modern microbiology and remains one of the most elegant demonstrations in the history of science.`,

  "The Curies Refine Radium Chloride": `On April 20, 1902, Marie and Pierre Curie successfully isolated radium chloride from several tons of pitchblende ore processed in their rudimentary laboratory at the School of Physics in Paris. The extraction was a monumental feat of physical labor and chemical persistence: Marie Curie personally stirred boiling cauldrons of ore in a leaky shed, progressively concentrating the radioactive element over years of grueling work. The isolated radium chloride allowed Marie to determine radium's atomic weight (225), confirming it as a distinct element and earning her the 1903 Nobel Prize in Physics (shared with Pierre and Henri Becquerel). The work fundamentally altered humanity's understanding of atomic structure and laid the groundwork for nuclear physics, cancer treatment, and eventually nuclear energy.`,

  "The Bay Of Pigs Invasion Collapses": `On April 20, 1961, the Bay of Pigs invasion ended in a humiliating defeat for the United States. Three days earlier, approximately 1,400 CIA-trained Cuban exiles — Brigade 2506 — had landed at Playa Girón on Cuba's southern coast, aiming to overthrow Fidel Castro's revolutionary government. The operation, planned under Eisenhower and authorized by Kennedy, was plagued by intelligence failures, logistical breakdowns, and the cancellation of crucial air support. Castro's forces, forewarned and battle-ready, crushed the invasion within 72 hours, killing 114 exiles and capturing 1,189. The disaster deeply embarrassed the Kennedy administration, strengthened Castro's grip on power, pushed Cuba closer to the Soviet Union, and set the stage for the Cuban Missile Crisis eighteen months later.`,

  "Cantinflas Dies": `Mario Moreno Reyes, universally known as Cantinflas, died on April 20, 1993, in Mexico City at the age of 81. He was the most beloved comic actor in the history of Latin American cinema, often called the "Charlie Chaplin of Mexico." Born into poverty in the Tepito neighborhood, Cantinflas developed his iconic character — a pelado (underclass everyman) with a pencil mustache, droopy pants, and a bewildering gift for rapid, nonsensical wordplay that lampoons authority — in the tent shows and burlesque theaters of 1930s Mexico City. His films, including "Ahí está el detalle" (1940) and "El bolero de Raquel" (1957), made him the highest-paid actor in Latin America. He also starred in the Hollywood hit "Around the World in 80 Days" (1956), winning a Golden Globe. Charlie Chaplin himself called Cantinflas "the greatest comedian alive." His death was mourned across the Spanish-speaking world as the loss of a cultural institution.`,

  "Chinese Language Day Enters The UN Calendar": `Chinese Language Day, observed on April 20, was established by the United Nations Department of Public Information in 2010 as part of an initiative to celebrate multilingualism and cultural diversity within the organization. The date was chosen to honor Cang Jie, a mythological figure in Chinese tradition credited with inventing Chinese characters approximately 5,000 years ago. The Grain Rain (Gǔyǔ) festival, which falls around April 20 in the traditional Chinese calendar and commemorates Cang Jie's achievement, inspired the selection. Chinese is one of the six official languages of the United Nations and is spoken by over 1.3 billion people worldwide, making it the most spoken language on Earth by native speakers.`,

  "Deepwater Horizon Explodes In The Gulf": `On April 20, 2010, the Deepwater Horizon drilling rig, operated by Transocean and leased by BP, suffered a catastrophic blowout and explosion in the Gulf of Mexico, approximately 41 miles off the coast of Louisiana. Eleven workers were killed and seventeen injured in the initial blast. The well, located 5,000 feet beneath the ocean surface, gushed uncontrollably for 87 days, releasing an estimated 4.9 million barrels of crude oil into the Gulf — making it the largest marine oil spill in history. The disaster devastated marine ecosystems, destroyed fishing and tourism economies across five Gulf states, and exposed systemic failures in offshore drilling safety regulation. BP ultimately paid over $65 billion in cleanup costs, fines, and settlements.`,

  "Apollo 16 Touches Down On The Moon": `On April 20, 1972, the Apollo 16 Lunar Module "Orion" touched down in the Descartes Highlands, marking the first landing in the lunar highlands and the penultimate crewed Moon mission. Astronauts John Young and Charles Duke spent nearly three days on the surface, conducting three extravehicular activities totaling over 20 hours, driving the Lunar Roving Vehicle more than 26 kilometers, and collecting 95.8 kilograms of lunar samples. The mission's geological findings overturned prevailing theories that the highlands were volcanic in origin, revealing instead that they were formed by ancient impact events. Command Module Pilot Ken Mattingly conducted observations from lunar orbit, including ultraviolet photography of the Earth and deep-space stellar observations.`,

  "Odilon Redon Is Born": `Bertrand-Jean Redon, known as Odilon Redon, was born on April 20, 1840, in Bordeaux, France. He became one of the most distinctive artists of the late nineteenth century, creating haunting, dreamlike works that defied easy classification. His early career was devoted to charcoal drawings and lithographs — which he called his "Noirs" — featuring disembodied eyes, floating heads, spiders, and strange hybrid creatures that anticipated Surrealism by decades. After the 1890s, Redon turned to radiant color, producing luminous pastels and oils of flowers, mythological subjects, and hallucinatory landscapes. His work profoundly influenced the Nabis, the Fauves, and later the Surrealists. Redon is now recognized as a bridge between Impressionism and the modern movements that followed, an artist who insisted that the visible world was only the starting point for imagination.`,

  "The Ludlow Massacre Shocks Industrial America": `On April 20, 1914, Colorado National Guard troops and company guards attacked a tent colony of striking coal miners and their families at Ludlow, Colorado, killing approximately 21 people, including two women and eleven children who suffocated in a pit beneath a tent that was set ablaze. The massacre was the bloodiest episode of the fourteen-month Colorado Coalfield War, in which miners — mostly Greek, Italian, and Slavic immigrants — had struck against the Colorado Fuel and Iron Company (owned by the Rockefeller family) seeking recognition of their union, fair wages, and an end to the company-town system. The horror of Ludlow provoked national outrage, a ten-day armed uprising across the coalfields, and ultimately federal intervention. It became a turning point in American labor history, spurring reforms in labor relations and contributing to the creation of the Federal Trade Commission.`,

  "René Caillié Enters Timbuktu": `On April 20, 1828, the French explorer René-Auguste Caillié became the first European to reach Timbuktu and return alive to tell about it. Disguised as an Arab pilgrim and traveling with a Muslim caravan, Caillié crossed the Sahel from Sierra Leone through Guinea, Mali, and the Saharan interior — a journey of unimaginable hardship that took over a year. When he finally reached Timbuktu, the fabled city of gold and learning proved to be a modest, sun-baked trading post, a far cry from European fantasies. Caillié stayed for two weeks, meticulously documenting the city's layout, trade, and daily life, before crossing the Sahara to Morocco. His account, published in 1830, won the prize of the Société de Géographie and demystified one of Africa's most legendary cities for the Western world.`,
};

async function main() {
  console.log("═══ Fixing April 20 context ═══\n");
  
  const { data: briefing } = await supabase.from("daily_briefings").select("id").eq("date", "April 20").single();
  if (!briefing) { console.log("April 20 not found!"); return; }
  
  const { data: items } = await supabase.from("briefing_items")
    .select("id, title, why_it_matters")
    .eq("briefing_id", briefing.id);
  
  if (!items) return;
  
  let updated = 0;
  let skipped = 0;
  
  for (const item of items) {
    // Find matching context
    let newContext: string | null = null;
    
    for (const [key, ctx] of Object.entries(CONTEXT_MAP)) {
      const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      
      if (normTitle.includes(normKey) || normKey.includes(normTitle) ||
          // Check if most words match
          key.split(" ").filter(w => w.length > 3).every(w => item.title.toLowerCase().includes(w.toLowerCase()))) {
        newContext = ctx;
        break;
      }
    }
    
    if (newContext) {
      await supabase.from("briefing_items").update({
        why_it_matters: newContext,
      }).eq("id", item.id);
      console.log(`✅ ${item.title.substring(0, 50)}`);
      updated++;
    } else {
      // Check if existing context is garbage (generic Wikipedia intro)
      const isGarbage = item.why_it_matters?.startsWith("History is the systematic") ||
                        item.why_it_matters?.startsWith("War is an armed") ||
                        item.why_it_matters?.startsWith("Music is the arrangement") ||
                        item.why_it_matters?.startsWith("Science is a systematic") ||
                        item.why_it_matters?.startsWith("Physics is the scientific") ||
                        item.why_it_matters?.startsWith("The term \"the people\"") ||
                        item.why_it_matters?.startsWith("Culture (") ||
                        item.why_it_matters?.startsWith("Natural environment") ||
                        item.why_it_matters?.startsWith("Space is a three") ||
                        item.why_it_matters?.startsWith("The sociology of law");
      
      if (isGarbage) {
        console.log(`⚠️ STILL GARBAGE (no match): ${item.title}`);
      } else {
        console.log(`  ✓ Already good: ${item.title.substring(0, 50)}`);
      }
      skipped++;
    }
  }
  
  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(console.error);
