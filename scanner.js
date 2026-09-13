(function(){'use strict';
const video=document.getElementById('video'),scanBtn=document.getElementById('scanBtn'),input=document.getElementById('words'),result=document.getElementById('result'),status=document.getElementById('status'),openBtn=document.getElementById('openBtn');
let worker=null,busy=false,timer=null;
function setStatus(m,e){status.textContent=m;status.className=e?'status error':'status'}
function extractAll(t){
 t=(t||'').toLowerCase().replace(/[’'`]/g,'').replace(/[|]/g,'i').replace(/[^a-z.;\s/_-]/g,' ').replace(/\s+/g,' ').trim();
 const out=[],re=/(?:\/\s*\/\s*\/\s*)?([a-z-]+)\s*\.\s*([a-z-]+)\s*\.\s*([a-z-]+)(?:\s*;)?/gi;let m;
 while((m=re.exec(t))!==null){const a=`///${m[1]}.${m[2]}.${m[3]}`;if(!out.includes(a))out.push(a)}
 return out;
}
function frame(mode){
 const w=video.videoWidth,h=video.videoHeight,cw=Math.floor(w*.96),ch=Math.floor(h*.62),sx=Math.floor((w-cw)/2),sy=Math.floor((h-ch)/2),scale=2,c=document.createElement('canvas');
 c.width=cw*scale;c.height=ch*scale;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(video,sx,sy,c.width,c.height);const d=x.getImageData(0,0,c.width,c.height);
 for(let i=0;i<d.data.length;i+=4){const g=.299*d.data[i]+.587*d.data[i+1]+.114*d.data[i+2];let v=mode==='contrast'?Math.max(0,Math.min(255,(g-128)*2+128)):mode==='binary'?(g>145?255:0):g;d.data[i]=d.data[i+1]=d.data[i+2]=v}x.putImageData(d,0,0);return c;
}
function showAddresses(addresses){
 result.innerHTML='';
 if(!addresses.length){result.textContent='No address yet';openBtn.disabled=true;return}
 addresses.forEach(a=>{const row=document.createElement('div');row.style.marginBottom='10px';const text=document.createElement('div');text.textContent=a+';';text.style.marginBottom='8px';const b=document.createElement('button');b.type='button';b.textContent='Open '+a+' in Google Maps';b.addEventListener('click',()=>{window.location.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(a)});row.append(text,b);result.appendChild(row)});
 openBtn.disabled=true;
}
async function scan(){
 if(busy||!video.videoWidth||!worker)return;busy=true;
 try{for(const mode of ['normal','contrast','binary']){const r=await worker.recognize(frame(mode));const found=extractAll(r.data.text);if(found.length){showAddresses(found);setStatus(found.length===1?'Found a what3words address. Scanning continues automatically.':`Found ${found.length} what3words addresses.`);return}}
 }catch(e){console.error(e)}finally{busy=false}
}
async function startAutoScan(){
 if(worker)return;try{setStatus('Loading text scanner…');worker=await Tesseract.createWorker('eng');await worker.setParameters({tessedit_pageseg_mode:'6',preserve_interword_spaces:'1'});setStatus('Scanning automatically…');scan();timer=setInterval(scan,1800)}catch(e){console.error(e);setStatus('OCR could not load. You can still enter the address manually.',true)}
}
scanBtn.style.display='none';
const originalStart=document.getElementById('startBtn');originalStart.addEventListener('click',()=>{setTimeout(startAutoScan,500)});
})();