// Original vector illustrations. No provider artwork or copyrighted characters.
// Regenerate with npm run artwork; keep this source with the runtime SVG exports.
import { mkdirSync, writeFileSync } from "node:fs";
import { TITLES } from "../src/catalog.ts";

const destination = new URL("../public/artwork/", import.meta.url);
mkdirSync(destination, { recursive: true });
const stars = (seed) =>
  Array.from({ length: 55 }, (_, index) => {
    const x = (index * 97 + seed * 31) % 600;
    const y = (index * 43 + seed * 17) % 560;
    return `<circle cx="${x}" cy="${y}" r="${index % 3 ? 1.2 : 2.2}" fill="#fff4d1" opacity="${index % 3 ? ".4" : ".7"}"/>`;
  }).join("");
const trees = (color, y, scale = 1) =>
  Array.from(
    { length: 12 },
    (_, i) =>
      `<path d="m${i * 59 - 22} ${y} ${25 * scale} ${-115 * scale} ${25 * scale} ${115 * scale}z" fill="${color}"/>`,
  ).join("");

function scene(title, index) {
  const [a, b] = title.palette;
  const sun = `<circle cx="410" cy="260" r="105" fill="${b}" opacity=".92"/>`;
  const landscapes = {
    ocean: `${sun}<path d="M0 560 130 280 230 530 310 455 410 575Z" fill="#224f55"/><path d="m25 565 104-285 49 234-49-95-24 101z" fill="#7b9d77"/><path d="M0 556 Q230 532 600 570V900H0Z" fill="#277e91"/><path d="M0 637Q180 590 380 640t220-3M0 707Q130 665 315 703t285-10M0 789Q200 748 440 786t180 0" fill="none" stroke="#a1d2c4" stroke-width="4" opacity=".5"/><path d="m345 560 79 10-13 15h-60z" fill="#d19857"/><path d="m374 570 1-132 58 118z" fill="#f5ddac"/><path d="m374 439-43 118 42 4z" fill="#ead2a3"/>`,
    garden: `${sun}<path d="M0 540Q180 468 330 550T600 492V900H0Z" fill="#335c56"/><path d="M80 590V404l82-62 76 62v185M237 589V460l68-42 71 42v131M373 590V402l66-44 62 44v188" fill="${b}" opacity=".8"/><path d="M110 505h95v25h-95M132 430h29v42h-29M175 430h29v42h-29M399 445h21v45h-21M457 445h21v45h-21" fill="#563f69"/><path d="M0 780q99-281 253-127t347-121V900H0Z" fill="#275b53"/><g fill="#d9a189">${Array.from({ length: 18 }, (_, i) => `<ellipse cx="${(i * 79 + 24) % 600}" cy="${480 + ((i * 47) % 250)}" rx="${8 + (i % 7)}" ry="${13 + (i % 9)}" transform="rotate(${i * 23} ${(i * 79 + 24) % 600} ${480 + ((i * 47) % 250)})"/>`).join("")}</g><path d="M0 700Q120 590 145 460M600 630Q473 523 515 393" stroke="#325c58" stroke-width="20" fill="none"/>`,
    space: `${stars(index)}<circle cx="420" cy="255" r="125" fill="${b}"/><path d="M280 273q140-104 283-21" stroke="#394d5d" stroke-width="15" fill="none" opacity=".4"/><ellipse cx="418" cy="262" rx="186" ry="24" fill="none" stroke="#ebcaa0" stroke-width="13" transform="rotate(-22 418 262)"/><path d="M0 616 168 476 332 593 456 430 600 596V900H0Z" fill="#3a5b63"/><path d="M0 714Q251 587 600 691V900H0Z" fill="#284651"/><path d="m250 491 87 16-32 11-53-11z" fill="#f1d4ac"/><path d="m271 503 12-28 13 31" fill="#d9b990"/>`,
    city: `<circle cx="420" cy="231" r="90" fill="${b}" opacity=".9"/><path d="M0 627V380h71v-79h81v186h42V337h90v119h46V257h80v176h32V337h85v75h73V627Z" fill="#2c414e" opacity=".55"/><g>${Array.from(
      { length: 8 },
      (_, i) => {
        const x = i * 82 - 20,
          top = 375 + ((i * 29 + index * 13) % 155);
        return `<rect x="${x}" y="${top}" width="70" height="${800 - top}" rx="2" fill="${i % 2 ? "#344452" : "#263944"}"/>${Array.from({ length: 6 }, (_, j) => `<rect x="${x + 12}" y="${top + 20 + j * 44}" width="15" height="24" fill="${b}" opacity="${(i + j) % 3 ? ".7" : ".25"}"/><rect x="${x + 42}" y="${top + 20 + j * 44}" width="15" height="24" fill="${b}" opacity="${(i + j) % 2 ? ".35" : ".8"}"/>`).join("")}`;
      },
    ).join("")}</g><path d="M0 776 600 748V900H0Z" fill="#172b35"/>`,
    moon: `${stars(index)}<circle cx="330" cy="310" r="145" fill="${b}" opacity=".78"/><circle cx="378" cy="280" r="143" fill="${a}"/><path d="M0 659Q90 548 194 613T440 587T600 606V900H0Z" fill="#3c4b60"/><path d="M0 743Q175 633 389 700T600 674V900H0Z" fill="#253a4a"/><path d="M80 600V460l48-44 48 44v140" fill="#34475a"/><path d="M110 470h35v60h-35" fill="${b}" opacity=".65"/>`,
    forest: `${sun}<path d="M0 592 115 403 270 574 420 416 600 550V900H0Z" fill="#4b7071"/>${trees("#315256", 666, 1.7)}<path d="M0 740Q246 622 600 715V900H0Z" fill="#213f46"/>${trees("#19333c", 750, 2.0)}<path d="M260 890Q205 690 315 580" stroke="${b}" stroke-width="32" fill="none" opacity=".25"/>`,
    mountain: `${sun}<path d="M-50 650 190 277 351 564 467 344 675 685Z" fill="#41636a"/><path d="m141 354 49-77 70 125-72-31-29 25zM410 424l57-80 61 103-64-25-23 24z" fill="#e2dac0" opacity=".8"/><path d="M0 718Q115 625 324 703T600 669V900H0Z" fill="#284d50"/><path d="M280 900q-80-94-12-197t-26-58" stroke="#c6cda4" stroke-width="27" fill="none" opacity=".32"/>${trees("#254747", 760, 0.8)}`,
    desert: `<circle cx="396" cy="287" r="115" fill="${b}"/><circle cx="203" cy="215" r="22" fill="#f8e0b2" opacity=".65"/><path d="M0 606Q279 396 600 527V900H0Z" fill="#9b643f"/><path d="M0 698Q283 528 600 641V900H0Z" fill="#d4a16e"/><path d="M0 816Q274 599 600 748V900H0Z" fill="#71513d"/><path d="M0 812Q214 658 600 748" stroke="#efd2a2" stroke-width="3" fill="none" opacity=".6"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${a}"/><stop offset=".75" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient><radialGradient id="light"><stop stop-color="#fff0c1" stop-opacity=".35"/><stop offset="1" stop-color="#fff0c1" stop-opacity="0"/></radialGradient></defs><rect width="600" height="900" fill="url(#sky)"/><ellipse cx="340" cy="280" rx="400" ry="340" fill="url(#light)"/>${landscapes[title.art]}<rect width="600" height="900" fill="#0b2037" opacity=".05"/></svg>`;
}
TITLES.forEach((title, index) =>
  writeFileSync(new URL(`${title.id}.svg`, destination), scene(title, index)),
);
console.log(`Generated ${TITLES.length} original SVG illustrations.`);
