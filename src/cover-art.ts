import type {Title} from './domain.ts';

// Original abstract graphics, not depictions of scenes or a safety assessment.
// Seeded by stable ID: covers vary across the catalog, never on each render.
const palettes = {
  cosmic: [['#252449','#8c82ce','#d4bced'],['#193745','#438da4','#bce3d7'],['#34304e','#b57aaa','#edc1c7'],['#28304a','#6289ba','#ced8eb']],
  layers: [['#173d49','#429399','#b5d8ab'],['#353d32','#84966a','#d4d4a1'],['#403237','#bc7e68','#eed0a0'],['#24364c','#658fa6','#bed7d2']],
  playful: [['#56364b','#d58378','#efc889'],['#35364f','#a393cf','#ecd0a8'],['#29413f','#75b5a0','#e4d691'],['#4c3444','#b987b3','#f0bca1']],
  lines: [['#293f3d','#699d86','#c1d1a4'],['#323e4b','#789db1','#d4d7bd'],['#453c35','#b69b75','#e7d2ae'],['#3c3548','#9c8dac','#d9c3bd']],
  arcs: [['#343451','#827baf','#d3b0a5'],['#253e45','#6a9fa5','#c6d6b6'],['#433346','#a97896','#dfb9a5'],['#403c30','#a89969','#d9cda8']],
} as const;
const patterns = ['rings','orbits','waves','ribbons','prisms','mosaic','petals','steps','dots','arches','weave','fans'] as const;

export function generatedCoverArt(title: Pick<Title, 'id' | 'genres'>): string {
  let seed=2166136261;
  for(const c of title.id) seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
  const next=()=>{
    seed=(seed+0x6d2b79f5)>>>0;
    let n=Math.imul(seed^(seed>>>15),seed|1);
    n^=n+Math.imul(n^(n>>>7),n|61);
    return ((n^(n>>>14))>>>0)/4294967296;
  };
  const int=(min:number,max:number)=>min+Math.floor(next()*(max-min+1));
  const genres=title.genres.join(' ').toLowerCase();
  const theme=/science fiction|sci-fi|fantasy/.test(genres)?'cosmic':/adventure|action/.test(genres)?'layers':/comedy|animation|family/.test(genres)?'playful':/documentary|history/.test(genres)?'lines':'arcs';
  const palette=int(0,palettes[theme].length-1);
  const [background,accent,light]=palettes[theme][palette];
  const pattern=patterns[int(0,patterns.length-1)];
  const x=int(110,490),y=int(170,430),rotation=int(-55,55),scale=int(80,120)/100;
  const color=(i:number)=>i%2?accent:light;
  const repeat=(count:number,draw:(i:number)=>string)=>Array.from({length:count},(_,i)=>draw(i)).join('');
  let shapes='';
  switch(pattern){
    case 'rings': {
      const gap=int(40,75),count=int(3,5);
      shapes=repeat(count,i=>`<circle cx="${x}" cy="${y}" r="${70+i*gap}" fill="none" stroke="${color(i)}" stroke-width="${int(12,30)}" opacity=".65"/>`);
      break;
    }
    case 'orbits':
      shapes=repeat(int(2,4),i=>`<ellipse cx="${x}" cy="${y}" rx="${140+i*45}" ry="${55+i*20}" fill="none" stroke="${color(i)}" stroke-width="${int(8,18)}" transform="rotate(${rotation+i*30} ${x} ${y})" opacity=".7"/>`)+`<circle cx="${x+40}" cy="${y-65}" r="${int(35,80)}" fill="${light}"/>`;
      break;
    case 'waves':
      shapes=repeat(int(4,7),i=>`<path d="M-180 ${80+i*85} Q${x-150} ${y-200+i*85} ${x} ${y+i*55} T800 ${220+i*70}" fill="none" stroke="${color(i)}" stroke-width="${int(12,32)}" opacity=".7"/>`);
      break;
    case 'ribbons':
      shapes=repeat(int(3,5),i=>`<path d="M-150 ${200+i*95} C100 ${-100+i*80} 420 ${650+i*60} 770 ${180+i*110}" fill="none" stroke="${color(i)}" stroke-width="${int(30,65)}" opacity=".65"/>`);
      break;
    case 'prisms':
      shapes=repeat(int(3,6),i=>{const px=int(-60,420),py=int(40,420),w=int(110,240);return `<path d="M${px} ${py+w} L${px+w/2} ${py} L${px+w} ${py+w}Z" fill="${color(i)}" opacity="${i%2?'.45':'.75'}"/>`;});
      break;
    case 'mosaic':
      shapes=repeat(int(5,9),i=>`<rect x="${int(-70,420)}" y="${int(30,460)}" width="${int(70,200)}" height="${int(90,220)}" rx="${int(5,45)}" fill="${color(i)}" opacity="${i%2?'.45':'.75'}"/>`);
      break;
    case 'petals':
      shapes=repeat(int(5,8),i=>`<ellipse cx="${x+100}" cy="${y}" rx="${int(90,145)}" ry="${int(25,50)}" fill="${color(i)}" opacity=".5" transform="rotate(${i*45} ${x} ${y})"/>`)+`<circle cx="${x}" cy="${y}" r="${int(30,50)}" fill="${light}"/>`;
      break;
    case 'steps':
      shapes=repeat(int(4,7),i=>`<path d="M${x-300+i*65} ${y-260+i*55} H${x-100+i*65} V${y-70+i*55} H${x+100+i*65}" fill="none" stroke="${color(i)}" stroke-width="${int(20,45)}" opacity=".7"/>`);
      break;
    case 'dots':
      shapes=repeat(int(9,16),i=>`<circle cx="${int(-30,620)}" cy="${int(20,570)}" r="${int(15,85)}" fill="${color(i)}" opacity="${i%3?'.45':'.8'}"/>`);
      break;
    case 'arches':
      shapes=repeat(int(3,5),i=>`<path d="M${x-170+i*40} ${y+230} V${y} a${170-i*35} ${170-i*35} 0 0 1 ${340-i*70} 0 V${y+230}" fill="none" stroke="${color(i)}" stroke-width="${int(16,30)}" opacity=".65"/>`);
      break;
    case 'weave':
      shapes=repeat(int(4,7),i=>`<path d="M${-150+i*120} -80 L${300+i*120} 650 M${650-i*120} -80 L${200-i*120} 650" fill="none" stroke="${color(i)}" stroke-width="${int(18,40)}" opacity=".45"/>`);
      break;
    case 'fans':
      shapes=repeat(int(5,8),i=>`<path d="M${x} ${y+180} L${x-360+i*100} ${y-220} L${x-290+i*100} ${y-220}Z" fill="${color(i)}" opacity=".6"/>`);
      break;
  }
  // Transform the whole motif for more distinct silhouettes; SVG clips edges.
  // Existing cover shading protects the title text at the bottom of the card.
  return `<svg class="generated-art" data-art-pattern="${pattern}" data-art-palette="${theme}-${palette}" aria-hidden="true" viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice"><rect width="600" height="900" fill="${background}"/><g transform="translate(300 310) rotate(${rotation}) scale(${scale}) translate(-300 -310)">${shapes}</g></svg>`;
}
