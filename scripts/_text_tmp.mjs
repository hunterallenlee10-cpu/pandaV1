import fs from 'fs'; import { parseDocument, DomUtils } from 'htmlparser2';
for (const f of process.argv.slice(2)) { console.log('\n#####', f);
 const d=parseDocument(fs.readFileSync(f,'utf8'));for(const el of DomUtils.findAll(e=>['script','style','noscript','svg','head'].includes(e.name),d.children)) DomUtils.removeElement(el);
 const seen=new Set();
 for (const e of DomUtils.findAll(e=>/^(h[1-4]|p)$/.test(e.name),d.children)) { const t=DomUtils.textContent(e).replace(/\s+/g,' ').trim(); if(!t||seen.has(t)||t.length<40&&e.name==='p') continue; seen.add(t); if(/Panda Exteriors is a local East Coast|As a BBB A-rated|Testimonial|Our local East Coast exterior|Online estimate|Chris Atkinson/.test(t)) continue; console.log(e.name+': '+t); }
}
