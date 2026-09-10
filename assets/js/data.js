/* Dati dei book — usati sia dalla home che dal lettore */
const BOOKS = [
  {
    slug: "casa-pantera",
    title: "Casa Pantera",
    subtitle: "Esame di progettazione · secondo anno",
    discipline: "Interior Design",
    year: "2025 / 2026",
    pages: 60,
    tavole: "18 tavole",
    teachers: ["Miriana Abate — progettazione", "Alessandro Ferrante — illuminotecnica", "Marco Pacucci — impianti"],
    blurb:
      "Una casa per tre persone che amano ricevere: Assunta, avvocato e lettrice, Vittorio, fotografo, e il figlio Fausto. Prugna profondo, ottone e radica di noce tengono insieme un percorso che va dalle demolizioni all’illuminotecnica.",
    palette: ["#2A1233", "#4B2159", "#C6A15B", "#F2E9DC"],
    materials: ["Velluto prugna", "Ottone brunito", "Radica di noce", "Marmo Emperador"]
  },
  {
    slug: "aurum",
    title: "Aurum",
    subtitle: "Progetto residenziale completo",
    discipline: "Interior Design",
    year: "2025 / 2026",
    pages: 90,
    tavole: "23 tavole",
    teachers: [],
    blurb:
      "Il book più lungo: novanta pagine che seguono un appartamento dallo stato dei luoghi agli esecutivi degli impianti. Verde foresta e oro, carte da parati disegnate a mano, arredi quotati stanza per stanza.",
    palette: ["#0C1F17", "#1B3A2A", "#C9A227", "#EFE7D2"],
    materials: ["Verde foresta", "Foglia oro", "Carta da parati", "Rovere fumé"]
  },
  {
    slug: "arcano-xiii",
    title: "Arcano XIII",
    subtitle: "Metamorfibra — Recycled Denim Stool",
    discipline: "Industrial Design",
    year: "2025 / 2026",
    pages: 40,
    tavole: "concept, moodboard, prototipo",
    teachers: ["Floriana Giorgio — industrial design"],
    blurb:
      "Uno sgabello nato dagli scarti del fast fashion. Il denim dismesso viene sfibrato e ricompattato in una fibra nuova; il nome arriva dal tredicesimo arcano dei tarocchi, la carta della trasformazione.",
    palette: ["#101722", "#2E4668", "#8AA7C9", "#E7E3D9"],
    materials: ["Denim rigenerato", "Metamorfibra", "Acciaio grezzo", "Rivetti"]
  },
  {
    slug: "opuntia-terrace",
    title: "Opuntia Terrace",
    subtitle: "Progetto di garden design",
    discipline: "Garden Design",
    year: "2025 / 2026",
    pages: 52,
    tavole: "15 tavole",
    teachers: ["Filomena Rossiello — garden design"],
    blurb:
      "Un terrazzo mediterraneo costruito attorno al fico d’India. Planimetrie quotate, schede botaniche e tre sezioni — A-A’, B-B’, C-C’ — ciascuna restituita a colori e in render.",
    palette: ["#F3DCCD", "#E08A63", "#8FA05C", "#3E5039"],
    materials: ["Intonaco terracotta", "Opuntia ficus-indica", "Salvia", "Pietra di Trani"]
  }
];

const BOOK_BY_SLUG = Object.fromEntries(BOOKS.map(b => [b.slug, b]));
const pageSrc  = (slug, n) => `assets/books/${slug}/p${String(n).padStart(3, "0")}.webp`;
const thumbSrc = (slug, n) => `assets/books/${slug}/thumb/p${String(n).padStart(3, "0")}.webp`;
