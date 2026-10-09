import type {Title} from './domain.ts';
// Abstract original graphics: never infer scenes, characters, or artwork safety
// from a title. No fetched images, IDs in markup, or per-title asset files.
export function generatedCoverArt(title: Pick<Title, 'id' | 'genres'>): string {
  let seed=2166136261;
  for(const c of title.id) seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
  const genres=title.genres.join(' ').toLowerCase();
  const theme=/science fiction|sci-fi|fantasy/.test(genres)?'cosmic':/adventure|action/.test(genres)?'layers':/comedy|animation|family/.test(genres)?'playful':/documentary|history/.test(genres)?'lines':'arcs';
  const palettes={cosmic:['#26244c','#8279db','#d1b4ef'],layers:['#173d49','#429399','#b5d8ab'],playful:['#56364b','#d58378','#efc889'],lines:['#293f3d','#699d86','#c1d1a4'],arcs:['#343451','#827baf','#d3b0a5']};
  const [background,accent,light]=palettes[theme];
  const x=150+seed%200,y=240+(seed>>>8)%170,rotation=(seed>>>16)%70-35;
  let shapes='';
  if(theme==='cosmic') shapes=`<ellipse cx="${x}" cy="${y}" rx="210" ry="95" fill="none" stroke="${accent}" stroke-width="30" transform="rotate(${rotation} ${x} ${y})"/><circle cx="${x+60}" cy="${y-90}" r="64" fill="${light}"/>`;
  else if(theme==='layers') shapes=[0,1,2].map(i=>`<path d="M-80 ${360+i*100} L${x} ${y+i*80} L680 ${430+i*85} V900 H-80Z" fill="${i===0?light:i===1?accent:background}"/>`).join('');
  else if(theme==='playful') shapes=`<circle cx="${x}" cy="${y}" r="130" fill="${accent}"/><rect x="${x-40}" y="${y-60}" width="190" height="190" rx="45" fill="${light}" transform="rotate(${rotation+25} ${x} ${y})"/><circle cx="${x-90}" cy="${y+140}" r="55" fill="${light}" opacity=".55"/>`;
  else if(theme==='lines') shapes=[0,1,2,3,4].map(i=>`<path d="M-40 ${180+i*85} Q${x} ${y+i*50} 640 ${160+i*95}" fill="none" stroke="${i%2?accent:light}" stroke-width="22" opacity=".65"/>`).join('');
  else shapes=[0,1,2].map(i=>`<circle cx="${x}" cy="${y}" r="${110+i*70}" fill="none" stroke="${i%2?accent:light}" stroke-width="26" opacity=".7"/>`).join('');
  return `<svg class="generated-art" aria-hidden="true" viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice"><rect width="600" height="900" fill="${background}"/>${shapes}</svg>`;
}
