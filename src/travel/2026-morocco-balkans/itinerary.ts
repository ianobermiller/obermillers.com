export type Country =
  | "France"
  | "Morocco"
  | "Malta"
  | "Albania"
  | "Montenegro"
  | "Bosnia & Herzegovina"
  | "Spain";
type Pace = "travel" | "full" | "balanced" | "easy";

export type Activity = {
  title: string;
  duration: string;
  description: string;
  tip?: string;
  image?: string;
  imagePosition?: string;
};

export type ItineraryDay = {
  date: string;
  shortDate: string;
  weekday: string;
  place: string;
  country: Country;
  route?: string;
  drive?: string;
  sleep: string;
  pace: Pace;
  summary: string;
  logistics?: string[];
  activities: Activity[];
};

export const tripStart = new Date("2026-09-12T00:00:00-04:00");
export const tripEnd = new Date("2026-10-21T23:59:59-04:00");

export const itinerary: ItineraryDay[] = [
  {
    date: "2026-09-12",
    shortDate: "Sep 12",
    weekday: "Saturday",
    place: "Miami → Paris",
    country: "France",
    route: "Miami → Paris Orly",
    sleep: "Overnight flight",
    pace: "travel",
    summary: "The adventure begins in Miami with an overnight flight across the Atlantic.",
    logistics: [
      "French Bee BF 743 · MIA 11:05 PM → ORY 2:00 PM Sunday.",
      "Carry-on and personal bag only.",
      "Check in at the EVEN Hotel front desk before leaving the car; use Concourse E.",
    ],
    activities: [
      {
        title: "Takeoff from Miami",
        duration: "8 hr 55 min",
        description:
          "An overnight eastbound flight puts us in Paris on Sunday afternoon. The first goal is simple: sleep when possible and save energy for the drive to Normandy.",
      },
    ],
  },
  {
    date: "2026-09-13",
    shortDate: "Sep 13",
    weekday: "Sunday",
    place: "Normandy",
    country: "France",
    route: "Paris Orly → Saint-Senier-sous-Avranches",
    drive: "About 4 hr 15 min via the toll-free N12",
    sleep: "Saint-Senier-sous-Avranches · night 1 of 2",
    pace: "travel",
    summary:
      "Land at Orly, collect the first rental car, and cross France to the quiet countryside near Mont-Saint-Michel.",
    logistics: [
      "Land at ORY around 2 PM and pick up the 7–9 passenger vehicle.",
      "The N12 avoids tolls but makes this a long arrival day.",
      "Plan a supermarket or service-area dinner rather than a major stop.",
    ],
    activities: [
      {
        title: "First look at Normandy",
        duration: "Arrival evening",
        image: "/images/mont-saint-michel.webp",
        description:
          "The landscape opens into hedgerows, stone villages, and tidal flats as we approach the bay. If daylight and energy cooperate, the distant abbey makes a memorable first glimpse.",
        tip: "Do not schedule Paris sightseeing today—the landing, rental desk, and drive already fill the day.",
      },
    ],
  },
  {
    date: "2026-09-14",
    shortDate: "Sep 14",
    weekday: "Monday",
    place: "Mont-Saint-Michel",
    country: "France",
    sleep: "Saint-Senier-sous-Avranches · night 2 of 2",
    pace: "full",
    summary:
      "Spend a full day walking across the bay causeway and upward through one of Europe’s most extraordinary medieval places.",
    logistics: [
      "Visitor parking is on the mainland; the shuttle runs roughly 7:30 AM–11 PM.",
      "The abbey is currently planned for 9:30 AM–6 PM; confirm seasonal hours before the trip.",
    ],
    activities: [
      {
        title: "Mont-Saint-Michel village",
        duration: "2–3 hours",
        image: "/images/mont-saint-village.webp",
        description:
          "A tidal granite island rises from the bay in layers: ramparts and narrow lanes below, the medieval monastery crowning everything above.",
        tip: "Arrive before the tour buses or stay through evening. Tide times completely change the view.",
      },
      {
        title: "The Abbey",
        duration: "1½–2 hours",
        image: "/images/mont-saint-cloister.webp",
        imagePosition: "center 28%",
        description:
          "Gothic halls, cloisters, chapels, and stone staircases reveal how monks built vertically around the island’s summit for nearly a thousand years.",
        tip: "Expect many stairs. Reserve a timed entry if available and carry only what you need.",
      },
    ],
  },
  {
    date: "2026-09-15",
    shortDate: "Sep 15",
    weekday: "Tuesday",
    place: "Caen, Rouen & Beauvais",
    country: "France",
    route: "Normandy → Caen → Rouen → Beauvais",
    drive: "A full road day with tolls",
    sleep: "Beauvais · night 1 of 2",
    pace: "travel",
    summary:
      "Cross Normandy through two historic cities, ending close to tomorrow’s Paris route and Thursday’s flight.",
    activities: [
      {
        title: "Caen",
        duration: "Lunch stop",
        image: "/images/caen.webp",
        description:
          "William the Conqueror’s city combines a vast medieval castle, twin abbeys, and powerful Second World War history.",
        tip: "Choose one focus—the castle exterior or a quick old-center lunch—not a museum-heavy visit.",
      },
      {
        title: "Rouen Cathedral & old town",
        duration: "1½–2 hours",
        image: "/images/rouen.webp",
        description:
          "The soaring Gothic cathedral inspired Monet’s famous light studies. Timber-framed streets lead toward the Gros-Horloge and Joan of Arc’s final square.",
        tip: "Central parking is easier than threading a large vehicle through the old streets.",
      },
    ],
  },
  {
    date: "2026-09-16",
    shortDate: "Sep 16",
    weekday: "Wednesday",
    place: "Paris",
    country: "France",
    route: "Beauvais ↔ Paris",
    drive: "Leave by 7:30 AM; traffic controls the day",
    sleep: "Beauvais · night 2 of 2",
    pace: "full",
    summary: "A greatest-hits walking day from subterranean Paris to the Seine and Eiffel Tower.",
    logistics: [
      "Paris Catacombs tickets release seven days ahead at 10 AM Paris time.",
      "Preselect a garage near Denfert-Rochereau that accepts the rental vehicle’s height.",
      "Driving back to Beauvais after dinner can take well over 90 minutes.",
    ],
    activities: [
      {
        title: "Paris Catacombs",
        duration: "About 1 hour underground",
        image: "/images/paris-catacombs.webp",
        description:
          "A spiral staircase descends into former limestone quarries lined with the carefully arranged remains of millions of Parisians.",
        tip: "Timed tickets are essential. It is cool, damp, uneven, and not ideal for anyone uncomfortable underground.",
      },
      {
        title: "Notre-Dame & the Seine",
        duration: "1½–2 hours",
        image: "/images/notre-dame.webp",
        description:
          "Walk north from the Catacombs through the Latin Quarter to the restored cathedral on Île de la Cité, then follow the river west.",
        tip: "Treat the cathedral interior line as optional so the day does not stall.",
      },
      {
        title: "Eiffel Tower",
        duration: "1½–2½ hours",
        image: "/images/eiffel.webp",
        description:
          "Finish at Paris’s iron landmark, either from the Champ de Mars and Trocadéro viewpoints or with reserved tower tickets.",
        tip: "For six people, reserve any ascent well ahead. The best family photos are usually from across the river.",
      },
    ],
  },
  {
    date: "2026-09-17",
    shortDate: "Sep 17",
    weekday: "Thursday",
    place: "Tangier",
    country: "Morocco",
    route: "Beauvais → Tangier",
    drive: "Tangier coastal loop after rental pickup",
    sleep: "Tangier · 1 night",
    pace: "travel",
    summary:
      "Fly from France to Africa, collect the long-haul rental car, and trace Tangier’s Atlantic edge.",
    logistics: [
      "Ryanair FR 7744 · BVA 9:55 AM → TNG 11:40 AM.",
      "Rental period is Sep 17–29, Tangier Airport to Marrakesh Airport.",
      "Photograph the car thoroughly and verify the spare tire before leaving TNG.",
    ],
    activities: [
      {
        title: "Cape Spartel",
        duration: "45–60 minutes",
        image: "/images/cape-spartel.webp",
        description:
          "A lighthouse marks the green headland where the Strait of Gibraltar opens toward the Atlantic, with Spain visible on clear days.",
        tip: "Pair it with the nearby caves before returning to Tangier’s kasbah.",
      },
      {
        title: "Caves of Hercules",
        duration: "45 minutes",
        image: "/images/hercules-caves.webp",
        description:
          "Sea-carved chambers open through a famous Africa-shaped window. Legends connect the caves to Hercules and his eleven labors.",
        tip: "The natural opening matters more than the commercial entrance area; late light is best.",
      },
      {
        title: "Tangier Kasbah",
        duration: "1½–2 hours",
        image: "/images/tangier-kasbah.webp",
        description:
          "Whitewashed lanes climb through the old fortified quarter above the port, mixing Moroccan, Spanish, and international-era architecture.",
        tip: "Park once and explore on foot. Save the deepest medina navigation for daylight.",
      },
    ],
  },
  {
    date: "2026-09-18",
    shortDate: "Sep 18",
    weekday: "Friday",
    place: "Chefchaouen",
    country: "Morocco",
    route: "Tangier → Chefchaouen",
    drive: "About 2 hours into the Rif Mountains",
    sleep: "Chefchaouen · night 1 of 2",
    pace: "balanced",
    summary: "Climb into the Rif for blue medina lanes, mountain air, and sunset above town.",
    activities: [
      {
        title: "The Blue Medina",
        duration: "3–4 hours",
        image: "/images/chefchaouen.webp",
        description:
          "Chefchaouen’s compact old town tumbles down the mountain in cobalt steps, painted passages, small squares, and craft shops.",
        tip: "The magic is wandering, not completing a checklist. Ask before photographing residents.",
      },
      {
        title: "Spanish Mosque sunset",
        duration: "45-minute round-trip walk",
        image: "/images/spanish-mosque.webp",
        imagePosition: "center 30%",
        description:
          "A short trail climbs from Ras El Maa to an unfinished hillside mosque with the whole blue town backed by Rif peaks.",
        tip: "Bring a light for the walk down after sunset.",
      },
    ],
  },
  {
    date: "2026-09-19",
    shortDate: "Sep 19",
    weekday: "Saturday",
    place: "Akchour",
    country: "Morocco",
    route: "Chefchaouen ↔ Akchour",
    drive: "About 45 minutes each way",
    sleep: "Chefchaouen · night 2 of 2",
    pace: "full",
    summary: "Trade blue alleys for a river hike through Talassemtane National Park.",
    activities: [
      {
        title: "Akchour waterfalls",
        duration: "4–6 hours depending on route",
        image: "/images/akchour.webp",
        description:
          "A river trail winds between limestone walls, swimming pools, small cascades, and the taller Grande Cascade deeper in the gorge.",
        tip: "Do not attempt both the big waterfall and God’s Bridge unless everyone is a fast, confident hiker. Start early and carry cash.",
      },
      {
        title: "Chefchaouen evening",
        duration: "Flexible",
        image: "/images/chefchaouen-street.webp",
        description:
          "Return for dinner, shopping, and another slow loop through the medina once the day-trip crowds thin.",
      },
    ],
  },
  {
    date: "2026-09-20",
    shortDate: "Sep 20",
    weekday: "Sunday",
    place: "Fes",
    country: "Morocco",
    route: "Chefchaouen → Fes",
    drive: "About 3½–4 hours",
    sleep: "Fes · night 1 of 2",
    pace: "travel",
    summary:
      "Drive south through mountain and agricultural country, then orient above Morocco’s oldest imperial medina.",
    activities: [
      {
        title: "Borj Nord sunset",
        duration: "45–60 minutes",
        image: "/images/borj-nord.webp",
        description:
          "The hilltop fortress overlooks the immense, nearly car-free Fes el-Bali medina and its forest of minarets.",
        tip: "This is an orientation stop; tomorrow’s guide handles the lanes below.",
      },
    ],
  },
  {
    date: "2026-09-21",
    shortDate: "Sep 21",
    weekday: "Monday",
    place: "Fes el-Bali",
    country: "Morocco",
    sleep: "Fes · night 2 of 2",
    pace: "full",
    summary:
      "Spend the day with a local guide inside one of the world’s largest medieval urban mazes.",
    activities: [
      {
        title: "Fes Medina",
        duration: "Full day",
        image: "/images/fes.webp",
        description:
          "Thousands of lanes thread between souks, neighborhood ovens, fountains, workshops, mosques, and madrasas in the UNESCO-listed old city.",
        tip: "A licensed step-on guide is worth it here. Agree in advance whether shopping stops are included.",
      },
      {
        title: "Chouara Tannery",
        duration: "30–45 minutes",
        image: "/images/chouara.webp",
        description:
          "Stone vats of dye and lime fill a centuries-old leatherworking courtyard viewed from surrounding terraces.",
        tip: "Mint helps with the smell. Expect a leather sales pitch; a purchase is not required.",
      },
    ],
  },
  {
    date: "2026-09-22",
    shortDate: "Sep 22",
    weekday: "Tuesday",
    place: "Midelt",
    country: "Morocco",
    route: "Fes → Ifrane → Azrou → Midelt",
    drive: "About 3½–4 hours",
    sleep: "Midelt · 1 night",
    pace: "travel",
    summary: "Cross cedar forests and the Middle Atlas, breaking the long road to the Sahara.",
    activities: [
      {
        title: "Azrou cedar forest",
        duration: "45–75 minutes",
        image: "/images/barbary-macaque.webp",
        description:
          "Old Atlas cedars shelter wild Barbary macaques, the only macaque species found outside Asia.",
        tip: "Observe rather than feed them. Feeding changes behavior and can make the monkeys aggressive around food.",
      },
      {
        title: "Midelt",
        duration: "Arrival evening",
        image: "/images/azrou.webp",
        description:
          "An apple-growing town between the Middle and High Atlas serves as a practical pause before the desert road.",
      },
    ],
  },
  {
    date: "2026-09-23",
    shortDate: "Sep 23",
    weekday: "Wednesday",
    place: "Erg Chebbi",
    country: "Morocco",
    route: "Midelt → Merzouga",
    drive: "About 4–5 hours",
    sleep: "Sahara desert camp · 1 night",
    pace: "full",
    summary:
      "Descend through the Ziz Valley to the orange dunes, then leave the road behind for a night in the Sahara.",
    logistics: [
      "Leave the rental car in the camp operator’s secure hotel parking.",
      "Confirm the exact meeting time and luggage allowance the day before.",
    ],
    activities: [
      {
        title: "Erg Chebbi dunes",
        duration: "Late afternoon through sunrise",
        image: "/images/erg-chebbi.webp",
        description:
          "Wind-shaped dunes rise up to roughly 150 meters along Morocco’s Saharan edge, changing color from gold to red as the sun drops.",
        tip: "Choose either ATV/Jeep time or a longer camel approach so the afternoon does not feel rushed.",
      },
      {
        title: "Desert camp",
        duration: "Overnight",
        image: "/images/sahara-camp.webp",
        imagePosition: "center 68%",
        description:
          "Dinner, music, and a dark-sky night replace the road. The quiet after camp lights go out is the main event.",
        tip: "Pack a small overnight bag; sand and stairs make large luggage impractical.",
      },
    ],
  },
  {
    date: "2026-09-24",
    shortDate: "Sep 24",
    weekday: "Thursday",
    place: "Todra & Dades",
    country: "Morocco",
    route: "Merzouga → Todra Gorge → Boumalne Dades",
    drive: "About 4½–5 hours with the gorge",
    sleep: "Dades Valley · 1 night",
    pace: "travel",
    summary:
      "Watch sunrise over the dunes, reclaim the car, and follow oasis roads toward Morocco’s canyon country.",
    activities: [
      {
        title: "Sahara sunrise",
        duration: "Early morning",
        image: "/images/sahara-sunrise.webp",
        description:
          "Cool dawn light reveals ripples and long shadows across Erg Chebbi before the camel ride or 4×4 transfer back.",
      },
      {
        title: "Todra Gorge",
        duration: "1–2 hours",
        image: "/images/todra.webp",
        description:
          "Sheer limestone walls narrow around a palm-fed river, creating one of the High Atlas region’s most dramatic roadside walks.",
        tip: "Walk beyond the first crowded section. Keep valuables out of sight when the car is parked.",
      },
    ],
  },
  {
    date: "2026-09-25",
    shortDate: "Sep 25",
    weekday: "Friday",
    place: "Aït Benhaddou → Marrakesh",
    country: "Morocco",
    route: "Dades → Ouarzazate → Aït Benhaddou → Marrakesh",
    drive: "A very full 6–7 hour road day before stops",
    sleep: "Marrakesh · night 1 of 2",
    pace: "full",
    summary:
      "Movie sets, an earthen UNESCO ksar, and the winding Tizi n’Tichka pass make this the road trip’s biggest Morocco day.",
    logistics: [
      "The original plan is ambitious: Atlas Studios plus 2½–3 hours at Aït Benhaddou makes for a late Marrakesh arrival.",
      "If departure slips, shorten the studio tour—not Aït Benhaddou.",
    ],
    activities: [
      {
        title: "Atlas Studios",
        duration: "About 1 hour",
        image: "/images/atlas-studios.webp",
        description:
          "Ouarzazate’s sprawling backlots preserve sets from biblical epics, fantasy series, and desert films shot across southern Morocco.",
        tip: "Tours leave at set times. Confirm the day’s language and schedule before detouring.",
      },
      {
        title: "Aït Benhaddou",
        duration: "2–3 hours",
        image: "/images/ait-benhaddou.webp",
        description:
          "A fortified village of earthen towers rises above the Ounila Valley. Its layered kasbahs have appeared in films from Gladiator to Lawrence of Arabia.",
        tip: "Cross the footbridge, climb to the granary, and allow time for lunch with a rooftop view.",
      },
    ],
  },
  {
    date: "2026-09-26",
    shortDate: "Sep 26",
    weekday: "Saturday",
    place: "Marrakesh",
    country: "Morocco",
    sleep: "Marrakesh · night 2 of 2",
    pace: "full",
    summary:
      "A full immersion in palaces, gardens, souks, and the evening theater of Jemaa el-Fnaa.",
    activities: [
      {
        title: "Bahia Palace",
        duration: "1½–2 hours",
        image: "/images/bahia-palace.webp",
        description:
          "Painted cedar, carved plaster, zellij tile, and garden courtyards fill a sprawling 19th-century vizier’s palace.",
        tip: "Visit at opening before the courtyards fill.",
      },
      {
        title: "Majorelle Garden",
        duration: "1½ hours",
        image: "/images/majorelle.webp",
        description:
          "Cobalt architecture, palms, cactus, and bamboo form an intensely designed garden once restored by Yves Saint Laurent and Pierre Bergé.",
        tip: "Timed tickets sell out; book the garden and any museum add-ons together.",
      },
      {
        title: "Jemaa el-Fnaa & souks",
        duration: "Late afternoon and evening",
        image: "/images/jemaa-el-fnaa.webp",
        description:
          "Marrakesh’s main square shifts from juice stalls and musicians by day to smoke, food stands, storytellers, and crowds after sunset.",
        tip: "Watch from a rooftop first, then enter the square. Agree on every price before accepting a service.",
      },
    ],
  },
  {
    date: "2026-09-27",
    shortDate: "Sep 27",
    weekday: "Sunday",
    place: "Essaouira",
    country: "Morocco",
    route: "Marrakesh → Essaouira",
    drive: "About 2½–3 hours",
    sleep: "Essaouira · 1 night",
    pace: "balanced",
    summary:
      "Leave the heat for Atlantic wind, whitewashed ramparts, blue boats, and seafood at the port.",
    activities: [
      {
        title: "Essaouira medina & ramparts",
        duration: "3–4 hours",
        image: "/images/essaouira.webp",
        description:
          "A compact UNESCO medina meets 18th-century sea walls, cannon-lined bastions, and a working fishing harbor full of blue boats.",
        tip: "Wind is part of the experience. Carry a light layer even when Marrakesh is hot.",
      },
      {
        title: "Atlantic beach",
        duration: "Flexible",
        image: "/images/essaouira-beach.webp",
        imagePosition: "center 72%",
        description:
          "A long crescent of sand offers room for walking, kite watching, and—if desired—short camel rides near the dunes.",
      },
    ],
  },
  {
    date: "2026-09-28",
    shortDate: "Sep 28",
    weekday: "Monday",
    place: "Essaouira → Marrakesh",
    country: "Morocco",
    route: "Essaouira → Marrakesh",
    drive: "About 2½–3 hours",
    sleep: "Marrakesh airport area · 1 night",
    pace: "travel",
    summary:
      "Keep a slow Atlantic morning, then return inland and position close to the airport for an early departure.",
    activities: [
      {
        title: "Port & ramparts morning",
        duration: "2–3 hours",
        image: "/images/essaouira-port.webp",
        description:
          "A final loop catches fishermen unloading the morning boats, artisans opening workshops, and quieter views from the Skala.",
        tip: "Leave by mid-afternoon and fuel the rental car before the airport-area overnight.",
      },
    ],
  },
  {
    date: "2026-09-29",
    shortDate: "Sep 29",
    weekday: "Tuesday",
    place: "Toulouse",
    country: "France",
    route: "Marrakesh → Toulouse",
    drive: "Rental pickup, then a short city transfer",
    sleep: "Toulouse · night 1 of 2",
    pace: "travel",
    summary:
      "Trade Morocco’s ochre walls for Toulouse’s pink brick and begin a compact southern France stopover.",
    logistics: [
      "Leave for RAK around 6 AM and return the Morocco rental car.",
      "Ryanair FR 3903 · RAK 8:30 AM → TLS 12:00 PM.",
      "Collect the Toulouse rental car at noon.",
    ],
    activities: [
      {
        title: "Toulouse old center",
        duration: "2–4 hours",
        image: "/images/toulouse.webp",
        description:
          "The ‘Pink City’ glows in brick around Place du Capitole, the Garonne riverfront, and the Romanesque Basilica of Saint-Sernin.",
        tip: "Keep this afternoon walkable and easy after the pre-dawn airport start.",
      },
    ],
  },
  {
    date: "2026-09-30",
    shortDate: "Sep 30",
    weekday: "Wednesday",
    place: "Carcassonne",
    country: "France",
    route: "Toulouse ↔ Carcassonne",
    drive: "About 1 hour each way",
    sleep: "Toulouse · night 2 of 2",
    pace: "full",
    summary: "Walk the double walls and towers of Europe’s most complete medieval fortified city.",
    activities: [
      {
        title: "Cité de Carcassonne",
        duration: "4–6 hours",
        image: "/images/carcassonne.webp",
        description:
          "Fifty-two towers and two concentric ramparts encircle a living hilltop citadel restored by Viollet-le-Duc in the 19th century.",
        tip: "Walk the exterior lists and free lanes, then add the château and ramparts ticket for the best wall access.",
      },
    ],
  },
  {
    date: "2026-10-01",
    shortDate: "Oct 1",
    weekday: "Thursday",
    place: "Toulouse → Malta",
    country: "Malta",
    route: "Toulouse → Malta",
    sleep: "Pietà / Valletta · night 1 of 3",
    pace: "travel",
    summary:
      "Spend the morning among rockets and spacecraft, then fly south to begin the Mediterranean island leg.",
    logistics: [
      "Return the Toulouse rental car by 6 PM.",
      "Ryanair FR 3043 · TLS 6:00 PM → MLA 8:20 PM.",
      "Collect the Malta rental car around 8:30 PM; drive on the left.",
    ],
    activities: [
      {
        title: "Cité de l’Espace",
        duration: "4–5 hours",
        image: "/images/cite-espace.webp",
        description:
          "Full-scale Ariane and Mir exhibits, planetarium shows, spacecraft galleries, and hands-on science make Toulouse’s space park an excellent family finale.",
        tip: "Arrive at opening and leave a firm airport buffer. Check which shows are offered in English.",
      },
    ],
  },
  {
    date: "2026-10-02",
    shortDate: "Oct 2",
    weekday: "Friday",
    place: "Valletta & the Three Cities",
    country: "Malta",
    sleep: "Pietà / Valletta · night 2 of 3",
    pace: "full",
    summary:
      "Start with the Knights of St. John in Valletta, then cross Grand Harbour by boat for fortified waterfront lanes.",
    activities: [
      {
        title: "Valletta",
        duration: "4–5 hours",
        image: "/images/valletta.webp",
        description:
          "A UNESCO capital of honey-colored bastions, steep streets, St. John’s Co-Cathedral, and the Upper Barrakka Gardens above Grand Harbour.",
        tip: "See the noon Saluting Battery, then eat before crossing the harbor.",
      },
      {
        title: "The Three Cities",
        duration: "2–3 hours",
        image: "/images/grand-harbour.webp",
        description:
          "A traditional dgħajsa boat links Valletta to Vittoriosa, Senglea, and Cospicua—older, quieter fortified neighborhoods around the marina.",
        tip: "Focus on Vittoriosa’s lanes and Fort St. Angelo exterior rather than trying to complete all three.",
      },
    ],
  },
  {
    date: "2026-10-03",
    shortDate: "Oct 3",
    weekday: "Saturday",
    place: "Mdina & Malta’s west coast",
    country: "Malta",
    route: "Pietà → Mdina → Dingli / Blue Grotto",
    drive: "Short island drives; traffic adds time",
    sleep: "Pietà / Valletta · night 3 of 3",
    pace: "full",
    summary:
      "Walk Malta’s silent medieval capital, explore the catacombs below Rabat, and finish above the island’s western cliffs.",
    activities: [
      {
        title: "Mdina",
        duration: "2–3 hours",
        image: "/images/mdina.webp",
        description:
          "Malta’s former capital is a tiny walled city of limestone palaces, church domes, shaded alleys, and broad views from the bastions.",
        tip: "Arrive early before tour groups. Pair it with neighboring Rabat on foot.",
      },
      {
        title: "Rabat catacombs",
        duration: "1½–2 hours",
        image: "/images/rabat-catacombs.webp",
        imagePosition: "center 72%",
        description:
          "St. Paul’s Catacombs preserve an extensive Roman-era underground cemetery and a different layer of Malta’s long history.",
        tip: "Choose this if the family enjoyed Paris’s Catacombs; otherwise allow more time along the coast.",
      },
      {
        title: "Dingli Cliffs or Blue Grotto",
        duration: "1½–2½ hours",
        image: "/images/dingli.webp",
        description:
          "End with sea air: walk the high Dingli escarpment at sunset, or take the Blue Grotto boat if wind and operating hours allow.",
        tip: "Do not promise the boat—south-coast swells cancel it frequently.",
      },
    ],
  },
  {
    date: "2026-10-04",
    shortDate: "Oct 4",
    weekday: "Sunday",
    place: "Gozo",
    country: "Malta",
    route: "Pietà → Ċirkewwa ferry → Gozo",
    drive: "About 1 hour to ferry, then island touring",
    sleep: "Żebbuġ, Gozo · night 1 of 2",
    pace: "full",
    summary:
      "Take the car ferry to Malta’s greener sister island for prehistoric temples, a hilltop citadel, and a dramatic western sunset.",
    logistics: [
      "Car ferry boards at Ċirkewwa; fares are generally collected on the return from Gozo.",
      "Allow queue time, especially on Sunday.",
    ],
    activities: [
      {
        title: "Ġgantija Temples",
        duration: "1½ hours",
        image: "/images/ggantija.webp",
        description:
          "These massive freestanding stone temples predate Stonehenge and the Egyptian pyramids, built more than 5,500 years ago.",
        tip: "Go directly from the ferry before the major coach groups.",
      },
      {
        title: "Victoria Citadel",
        duration: "2 hours",
        image: "/images/gozo-citadel.webp",
        description:
          "Gozo’s fortified acropolis rises above the island’s central town, with restored walls, lanes, cathedral, and views to the sea.",
        tip: "This is the natural lunch stop between the temples and west coast.",
      },
      {
        title: "Dwejra sunset",
        duration: "1½–2 hours",
        image: "/images/dwejra.webp",
        description:
          "The collapsed Azure Window is gone, but Dwejra remains spectacular: the Inland Sea, Fungus Rock, coastal towers, and wave-cut limestone.",
        tip: "Stay back from wet cliff edges and bring a layer for the wind.",
      },
    ],
  },
  {
    date: "2026-10-05",
    shortDate: "Oct 5",
    weekday: "Monday",
    place: "Gozo’s north & west",
    country: "Malta",
    sleep: "Żebbuġ, Gozo · night 2 of 2",
    pace: "balanced",
    summary:
      "A slower Gozo day linking geometric salt pans, a landmark basilica, and whichever cove has the best weather.",
    activities: [
      {
        title: "Xwejni Salt Pans",
        duration: "45–75 minutes",
        image: "/images/gozo-salt-pans.webp",
        description:
          "A checkerboard of hand-cut coastal pans records a salt-making tradition passed through Gozitan families for generations.",
        tip: "Stay off active pans and never step across private ropes or signs.",
      },
      {
        title: "Ta’ Pinu Basilica",
        duration: "45–60 minutes",
        image: "/images/ta-pinu.webp",
        description:
          "A monumental pilgrimage church stands alone among fields near Għarb, built around a chapel associated with reported miracles.",
      },
      {
        title: "Ramla Bay or coastal walk",
        duration: "2–3 hours",
        image: "/images/ramla-bay.webp",
        imagePosition: "center 70%",
        description:
          "Use the afternoon flexibly: swim at red-sand Ramla Bay if warm, or walk the limestone coast near Marsalforn and Wied il-Għasri.",
        tip: "Let wind direction choose the beach; Gozo is small enough to pivot.",
      },
    ],
  },
  {
    date: "2026-10-06",
    shortDate: "Oct 6",
    weekday: "Tuesday",
    place: "Tirana",
    country: "Albania",
    route: "Malta → Tirana",
    sleep: "Side Airport Hotel",
    pace: "travel",
    summary: "A late flight into Albania and a short airport hotel night.",
    logistics: [
      "Wizz Air W4 5202 · MLA 11:25 PM → TIA 1:05 AM",
      "The arrival is technically early Wednesday morning.",
    ],
    activities: [
      {
        title: "Touch down in Albania",
        duration: "1 hr 40 min flight",
        description:
          "We leave Malta late Tuesday and land outside Tirana just after 1 AM. The hotel is intentionally near the airport so the road trip can begin after some sleep.",
      },
    ],
  },
  {
    date: "2026-10-07",
    shortDate: "Oct 7",
    weekday: "Wednesday",
    place: "Kotor",
    country: "Montenegro",
    route: "Tirana → Shkodër → Kotor",
    drive: "About 4 hours, plus the border",
    sleep: "Dobrota, Bay of Kotor · night 1 of 3",
    pace: "travel",
    summary:
      "Pick up the car, cross into Montenegro, and break the drive at one of Albania’s great hilltop castles.",
    logistics: [
      "Rental pickup at TIA around 9 AM.",
      "Confirm the Green Card insurance paper covers Montenegro and Bosnia.",
      "Use the Sukobin border crossing; border time is unpredictable.",
    ],
    activities: [
      {
        title: "Rozafa Castle, Shkodër",
        duration: "60–90 minutes",
        image: "/images/rozafa.webp",
        description:
          "An Illyrian–Venetian fortress perched 130 meters above the Buna and Drin rivers. From the walls, Lake Shkodër, the rivers, and the Albanian Alps all spread out below.",
        tip: "The stone is polished and exposed. Wear real shoes, carry water, and eat lunch in Shkodër afterward.",
      },
    ],
  },
  {
    date: "2026-10-08",
    shortDate: "Oct 8",
    weekday: "Thursday",
    place: "Kotor & Perast",
    country: "Montenegro",
    sleep: "Dobrota, Bay of Kotor · night 2 of 3",
    pace: "full",
    summary:
      "Climb above Kotor before breakfast crowds, explore inside the walls, then follow the bay to Perast.",
    activities: [
      {
        title: "San Giovanni Fortress walls",
        duration: "1½–2 hours",
        image: "/images/kotor-walls.webp",
        description:
          "About 1,350 stone steps trace the Venetian defenses 260 meters above the old town. The reward is the defining view of Kotor’s red roofs and folded blue bay.",
        tip: "Start when the gate opens. The upper two-thirds have little shade and the descent is slippery.",
      },
      {
        title: "Kotor Old Town & St. Tryphon",
        duration: "1½–2½ hours",
        image: "/images/kotor-cathedral.webp",
        description:
          "A compact UNESCO maze of stone lanes, pocket squares, palaces, churches, and cats. The 12th-century Cathedral of Saint Tryphon anchors the old town.",
        tip: "The streets become much calmer after cruise passengers leave in late afternoon.",
      },
      {
        title: "Perast & Our Lady of the Rocks",
        duration: "2–3 hours",
        image: "/images/our-lady-rocks.webp",
        description:
          "Baroque Perast faces two tiny islands. Our Lady of the Rocks is artificial—built over centuries from stones and scuttled ships—and reached by a five-minute boat.",
        tip: "Agree on the boat price at the quay and aim for golden hour on the bay road.",
      },
    ],
  },
  {
    date: "2026-10-09",
    shortDate: "Oct 9",
    weekday: "Friday",
    place: "Lovćen & Budva",
    country: "Montenegro",
    sleep: "Dobrota, Bay of Kotor · night 3 of 3",
    pace: "balanced",
    summary:
      "Drive the famous serpentine into Montenegro’s high country, then choose an easy Adriatic afternoon.",
    activities: [
      {
        title: "Lovćen & Njegoš Mausoleum",
        duration: "Half day",
        image: "/images/lovcen.webp",
        description:
          "Twenty-five hairpins climb above Kotor toward the mountain that gave Montenegro its name. At Jezerski vrh, 461 steps lead to the monumental tomb of poet-prince Njegoš.",
        tip: "Go early for clearer views and stop in Njeguši for smoked ham. The road rewards a confident driver.",
      },
      {
        title: "Budva or Sveti Stefan",
        duration: "1–2 hours",
        image: "/images/sveti-stefan.webp",
        description:
          "Choose between Budva’s walled lanes and the mainland viewpoint over Sveti Stefan, a fortified fishing village turned private island resort.",
        tip: "This is the schedule’s softest slot—perfect for lingering, or for adding the Kotor cable car if everyone still has energy.",
      },
    ],
  },
  {
    date: "2026-10-10",
    shortDate: "Oct 10",
    weekday: "Saturday",
    place: "Mostar",
    country: "Bosnia & Herzegovina",
    route: "Kotor → Trebinje → Mostar",
    drive: "About 3½ hours, plus the border",
    sleep: "Mostar · night 1 of 2",
    pace: "travel",
    summary:
      "Leave the coast for Herzegovina, pause in a riverside market town, and reach Mostar for evening light.",
    activities: [
      {
        title: "Trebinje old town",
        duration: "45–90 minutes",
        image: "/images/trebinje.webp",
        description:
          "Bosnia’s southernmost city is a relaxed lunch stop of plane trees, wine, Ottoman walls, and bridges along the Trebišnjica River.",
        tip: "Walk the kastel after lunch; add nearby Tvrdoš Monastery only if the border was quick.",
      },
      {
        title: "Stari Most after dark",
        duration: "45–90 minutes",
        image: "/images/mostar.webp",
        description:
          "Mostar’s 16th-century Ottoman bridge arcs over the emerald Neretva. Destroyed in 1993 and rebuilt in 2004, it is most atmospheric after day-trippers leave.",
        tip: "Cross the bridge tonight; save the bazaar and mosque climb for tomorrow morning.",
      },
    ],
  },
  {
    date: "2026-10-11",
    shortDate: "Oct 11",
    weekday: "Sunday",
    place: "Mostar & Herzegovina",
    country: "Bosnia & Herzegovina",
    drive: "Regional loop · about 2½ hours total",
    sleep: "Mostar · night 2 of 2",
    pace: "full",
    summary:
      "A full circuit of Ottoman Mostar, a river spring under a cliff, and Herzegovina’s broad waterfall.",
    activities: [
      {
        title: "Old Town & Koski Mehmed Pasha Mosque",
        duration: "2–3 hours",
        image: "/images/mostar-mosque.webp",
        description:
          "Bazaar lanes lead past the Crooked Bridge to a small Ottoman mosque whose narrow minaret delivers the classic view over Stari Most.",
        tip: "Start before coach groups. The minaret stairs are steep and tight; modest dress is required.",
      },
      {
        title: "Blagaj Tekke",
        duration: "45–60 minutes",
        image: "/images/blagaj.webp",
        description:
          "A 16th-century Dervish house clings to a cliff where the Buna River surges from one of Europe’s strongest karst springs.",
        tip: "Cover shoulders. Small boats may enter the spring cave if conditions allow.",
      },
      {
        title: "Kravica Waterfalls",
        duration: "60–90 minutes",
        image: "/images/kravica.webp",
        description:
          "A 25-meter-high curtain of tufa cascades into a broad pool on the Trebižat River. October trades swimming crowds for cooler air and greener scenery.",
        tip: "Počitelj’s walled hill village fits naturally into this loop if time remains.",
      },
    ],
  },
  {
    date: "2026-10-12",
    shortDate: "Oct 12",
    weekday: "Monday",
    place: "Sarajevo",
    country: "Bosnia & Herzegovina",
    route: "Mostar → Sarajevo",
    drive: "About 2 hours through the Neretva canyon",
    sleep: "Sarajevo · night 1 of 2",
    pace: "travel",
    summary:
      "Follow the Neretva into the mountains, then eat and wander through Sarajevo’s Ottoman heart.",
    activities: [
      {
        title: "Baščaršija, Sebilj & Latin Bridge",
        duration: "2–3 hours",
        image: "/images/sarajevo.webp",
        description:
          "Sarajevo’s 15th-century bazaar is all coppersmiths, coffee, ćevapi, and mosque courtyards. Nearby Latin Bridge marks the corner where Franz Ferdinand was assassinated in 1914.",
        tip: "Keep tonight unstructured: walk, eat, and save the heavier museums for tomorrow.",
      },
    ],
  },
  {
    date: "2026-10-13",
    shortDate: "Oct 13",
    weekday: "Tuesday",
    place: "Sarajevo",
    country: "Bosnia & Herzegovina",
    sleep: "Sarajevo · night 2 of 2",
    pace: "full",
    summary:
      "See Sarajevo from its Olympic mountain, then descend into the city’s siege history before sunset.",
    activities: [
      {
        title: "Trebević & the 1984 bobsled track",
        duration: "2½–4 hours",
        image: "/images/bobsled.webp",
        description:
          "The cable car rises from the old city to Trebević. Below the summit, the abandoned Olympic track curves through forest under layers of graffiti.",
        tip: "Stay on the concrete track; unexploded ordnance remains a risk off marked paths.",
      },
      {
        title: "Tunnel of Hope",
        duration: "60–90 minutes",
        image: "/images/tunnel.webp",
        description:
          "During the siege, this hand-dug tunnel beneath the airport runway carried food, supplies, and people into an isolated Sarajevo. The Kolar family house preserves its entrance.",
        tip: "The museum is in Butmir near the airport, not downtown. Plan roughly 25 minutes each way.",
      },
      {
        title: "Yellow Fortress at sunset",
        duration: "30–45 minutes",
        image: "/images/yellow-fortress.webp",
        description:
          "An 18th-century cannon bastion above Vratnik with a wide view over Sarajevo’s minarets, red roofs, and mountain-ringed valley.",
        tip: "Walk uphill from Baščaršija or take a short taxi, then return to the old town for dinner.",
      },
    ],
  },
  {
    date: "2026-10-14",
    shortDate: "Oct 14",
    weekday: "Wednesday",
    place: "Durmitor",
    country: "Montenegro",
    route: "Sarajevo → Foča → Žabljak",
    drive: "About 3–4 hours, plus the border",
    sleep: "Žabljak or Kolašin · 1 night",
    pace: "full",
    summary:
      "Cross back into Montenegro and spend the remaining daylight beside a glacial lake under Durmitor.",
    activities: [
      {
        title: "Black Lake (Crno Jezero)",
        duration: "1½–2½ hours",
        image: "/images/black-lake.webp",
        description:
          "Two linked glacial lakes sit at 1,416 meters beneath Međed peak, surrounded by fir forest and an easy shoreline trail.",
        tip: "October can bring cold rain or early snow. This is a taste of Durmitor—not enough time for its major hikes.",
      },
    ],
  },
  {
    date: "2026-10-15",
    shortDate: "Oct 15",
    weekday: "Thursday",
    place: "Berat",
    country: "Albania",
    route: "Žabljak → Tara → Morača Canyon → Berat",
    drive: "At least 5½–6½ hours, plus the border",
    sleep: "Berat · night 1 of 2",
    pace: "travel",
    summary:
      "Walk high above the Tara, then make the trip’s longest drive through Montenegro and into central Albania.",
    logistics: [
      "The original 4½-hour estimate is optimistic before stops and the border.",
      "Keep the Tara visit brief if zipline operations are slow.",
    ],
    activities: [
      {
        title: "Đurđevića Tara Bridge",
        duration: "30–90 minutes",
        image: "/images/tara-bridge.webp",
        description:
          "A graceful 1930s concrete arch spans the Tara roughly 170 meters above the river. The deck and nearby overlooks reveal the scale of Europe’s deepest canyon system.",
        tip: "The zipline is optional and weather-dependent. After this, Morača Canyon is scenery from the road.",
      },
    ],
  },
  {
    date: "2026-10-16",
    shortDate: "Oct 16",
    weekday: "Friday",
    place: "Berat",
    country: "Albania",
    sleep: "Berat · night 2 of 2",
    pace: "full",
    summary:
      "Walk down through a living castle and Ottoman neighborhoods, then spend the afternoon among Osumi Canyon’s cliffs.",
    activities: [
      {
        title: "Berat Castle, Mangalem & Gorica",
        duration: "3–4 hours",
        image: "/images/berat.webp",
        description:
          "The UNESCO ‘city of a thousand windows’ stacks white Ottoman houses along the Osum. Families still live inside the vast hilltop Kala, among churches and the Onufri icon museum.",
        tip: "Drive or taxi up to the castle, then walk downhill through Mangalem and cross to quieter Gorica.",
      },
      {
        title: "Osumi Canyon",
        duration: "Half day",
        image: "/images/osumi.webp",
        description:
          "The Osum cuts a narrow 13-kilometer gorge near Çorovodë. In October the draw is viewpoints and short walks; rafting season is usually over.",
        tip: "The canyon adds 2–3 hours of driving. Leave Berat promptly after lunch and prioritize the main viewpoints before daylight fades.",
      },
    ],
  },
  {
    date: "2026-10-17",
    shortDate: "Oct 17",
    weekday: "Saturday",
    place: "Tirana",
    country: "Albania",
    route: "Berat → Tirana",
    drive: "About 1½–2 hours",
    sleep: "Tirana · night 1 of 2",
    pace: "full",
    summary:
      "Return to the capital for a mountain cable car and a deep dive into communist Albania.",
    activities: [
      {
        title: "Dajti Ekspres",
        duration: "2–3 hours",
        image: "/images/dajti.webp",
        description:
          "A long cable-car ride climbs from Tirana’s edge to Mount Dajti, with city views, short ridge walks, and tandem paragliding when conditions cooperate.",
        tip: "Check the final return car before heading out on a walk. Bunk’Art 1 is beside the lower station.",
      },
      {
        title: "Bunk’Art 1",
        duration: "1½–2½ hours",
        image: "/images/bunkart.webp",
        imagePosition: "center 70%",
        description:
          "Enver Hoxha’s five-floor anti-nuclear bunker is now an immersive museum of dictatorship, isolation, surveillance, and ordinary life under communism.",
        tip: "This is the large bunker at Dajti—not smaller Bunk’Art 2 in central Tirana.",
      },
    ],
  },
  {
    date: "2026-10-18",
    shortDate: "Oct 18",
    weekday: "Sunday",
    place: "Krujë & Tirana",
    country: "Albania",
    route: "Tirana ↔ Krujë",
    drive: "About 45–60 minutes each way",
    sleep: "Tirana · night 2 of 2",
    pace: "balanced",
    summary:
      "Visit Skanderbeg’s mountain stronghold, then come back to Tirana for a final dinner in Blloku.",
    activities: [
      {
        title: "Krujë Castle & Old Bazaar",
        duration: "3–4 hours",
        image: "/images/kruje.webp",
        description:
          "Skanderbeg’s citadel resisted repeated Ottoman sieges. Today its hilltop walls hold a national museum, an ethnographic museum, and views across the coastal plain.",
        tip: "The covered bazaar is steep and polished. Krujë is a half-day, leaving a relaxed final evening.",
      },
    ],
  },
  {
    date: "2026-10-19",
    shortDate: "Oct 19",
    weekday: "Monday",
    place: "Tirana → Barcelona",
    country: "Albania",
    route: "Tirana → Barcelona",
    sleep: "Barcelona",
    pace: "travel",
    summary: "One last walk and coffee in the capital, then return the car and fly to Barcelona.",
    logistics: [
      "Return the rental car at TIA by 5 PM.",
      "Wizz Air W4 5153 · TIA 6:55 PM → BCN 9:35 PM.",
      "Leave central Tirana well before 4 PM for the airport buffer.",
    ],
    activities: [
      {
        title: "Pyramid, Grand Park & café culture",
        duration: "2–3 hours",
        image: "/images/pyramid.webp",
        description:
          "The former Hoxha museum is now a climbable cultural landmark. Pair it with a lakeside loop in Grand Park and one final Albanian coffee.",
        tip: "Keep the morning compact. Tirana traffic and a six-person car return can consume the airport buffer.",
      },
    ],
  },
  {
    date: "2026-10-20",
    shortDate: "Oct 20",
    weekday: "Tuesday",
    place: "Barcelona",
    country: "Spain",
    sleep: "Barcelona · night 2 of 2",
    pace: "full",
    summary:
      "A kid-led return to Gaudí’s two great Barcelona landmarks with plenty of neighborhood time between them.",
    activities: [
      {
        title: "Sagrada Família",
        duration: "1½–2 hours",
        image: "/images/sagrada-familia.webp",
        description:
          "Gaudí’s monumental basilica combines branching stone columns, intensely colored glass, and sculpted façades still evolving after more than a century.",
        tip: "Book a timed entry and towers well ahead. Morning light favors the Nativity-side glass.",
      },
      {
        title: "Park Güell",
        duration: "2–3 hours",
        image: "/images/park-guell.webp",
        description:
          "Mosaic creatures, curving benches, stone viaducts, and whimsical gatehouses turn a failed garden suburb into Gaudí’s most playful landscape.",
        tip: "Reserve the Monumental Zone. Taxi or bus uphill and walk down toward Gràcia.",
      },
    ],
  },
  {
    date: "2026-10-21",
    shortDate: "Oct 21",
    weekday: "Wednesday",
    place: "Barcelona → Miami",
    country: "Spain",
    route: "Barcelona → Miami",
    sleep: "Home",
    pace: "travel",
    summary:
      "One last Barcelona breakfast, then the long flight home and a shuttle back to the parked car.",
    logistics: [
      "LEVEL LV 2851 · BCN 3:50 PM → MIA 8:00 PM.",
      "Allow a generous transatlantic check-in and security buffer.",
      "After landing, request the EVEN Hotel shuttle and meet it at Door 5 or above.",
    ],
    activities: [
      {
        title: "Final Barcelona morning",
        duration: "2–3 easy hours",
        image: "/images/barcelona-gothic.webp",
        description:
          "Keep the last morning local: breakfast, one favorite neighborhood walk, and no cross-city attraction that risks the airport departure.",
        tip: "Andorra is not realistic on this short Barcelona stay—it needs roughly six hours of round-trip transport before sightseeing.",
      },
      {
        title: "Fly home to Miami",
        duration: "10 hr 10 min",
        description:
          "The final westbound flight closes forty days across Europe, Africa, the Mediterranean, and the Balkans.",
      },
    ],
  },
];

export const countries: Array<Country | "All"> = [
  "All",
  "France",
  "Morocco",
  "Malta",
  "Albania",
  "Montenegro",
  "Bosnia & Herzegovina",
  "Spain",
];
