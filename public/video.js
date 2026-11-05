const canvas=document.getElementById('video-canvas');
const ctx=canvas.getContext('2d');
const status=document.getElementById('video-status');
const button=document.getElementById('export-video');
const download=document.getElementById('video-download');
const storyboard=document.getElementById('export-storyboard');
const colors={bg:'#f5f4ed',ink:'#202b27',green:'#245b42',muted:'#657066',line:'#d5ddce',card:'#fffef8'};
const duration=120;
let frames;
let baseline,controls;

function text(value,x,y,size=24,color=colors.ink,weight='400') {
  ctx.font=`${weight} ${size}px Arial, sans-serif`;ctx.fillStyle=color;ctx.fillText(value,x,y);
}
function wrap(value,x,y,maxWidth,size=24,color=colors.ink,lineHeight=34,weight='400') {
  ctx.font=`${weight} ${size}px Arial, sans-serif`;
  let line='';let row=y;
  for(const word of value.split(/\s+/)) {
    const next=line ? `${line} ${word}` : word;
    if(line && ctx.measureText(next).width>maxWidth) {text(line,x,row,size,color,weight);line=word;row+=lineHeight;}
    else line=next;
  }
  if(line) text(line,x,row,size,color,weight);
  return row+lineHeight;
}
function panel(x,y,w,h) {ctx.fillStyle=colors.card;ctx.fillRect(x,y,w,h);ctx.strokeStyle=colors.line;ctx.strokeRect(x,y,w,h);}
function heading(kicker,title) {text(kicker,60,135,18,colors.green,'700');wrap(title,60,185,1150,38,colors.ink,45,'500');}
function footer(caption,time) {
  ctx.fillStyle='#e6ecdf';ctx.fillRect(0,570,1280,150);
  wrap(caption,60,615,1150,23,colors.ink,31);
  text('SN2.0 · Captioned visualization of saved real API responses · Not a screen recording',60,700,13,colors.muted);
  ctx.fillStyle=colors.green;ctx.fillRect(0,716,1280*Math.min(time/duration,1),4);
}
function draw(time) {
  ctx.fillStyle=colors.bg;ctx.fillRect(0,0,1280,720);
  text('SN2.0',60,57,32,colors.green,'700');
  text('RECORDED REAL API RUNS  /  FICTIONAL DATA',650,53,17,colors.muted,'700');
  const scene=Math.min(6,Math.floor(time/18));
  if(scene===0) {
    heading('01 / THE THESIS','If AI reads our conversations, it should work for us.');
    panel(60,250,550,240);panel(640,250,580,240);
    text('A career conversation brief',88,300,28,colors.green);
    wrap('Help someone explain how they think and what they have described doing—with inspectable evidence.',88,348,490,25,colors.ink,36);
    text('A reason to meet another mind',668,300,28,colors.green);
    wrap('Find a shared intellectual question across rooms, then offer a question to start a conversation.',668,348,520,25,colors.ink,36);
    footer('This walkthrough uses real saved Muse Spark responses. It is a replay, not a new API request.',time);
  } else if(scene===1) {
    heading('02 / THE INPUT','Three people. Three separate rooms.');
    const cards=[['Alex / systems-room','What is lost when AI compresses conversation memory?','Self-reported debugging and experimental controls.'],['Priya / learning-room','What should an AI tutor remember about confusion?','How can we separate recall from reconstruction?'],['Sam / garden-room','Balcony tomatoes, soil moisture, and sunlight.','A deliberately unrelated intellectual topic.']];
    cards.forEach((c,i)=>{const x=60+i*395;panel(x,250,370,270);text(c[0],x+20,287,20,colors.green,'700');wrap(c[1],x+20,335,325,25,colors.ink,34);wrap(c[2],x+20,440,325,20,colors.muted,28);});
    footer('These people and conversations are fictional. The example demonstrates a workflow, not matching accuracy.',time);
  } else if(scene===2) {
    heading('03 / WHAT ACTUALLY RAN','One Meta API call. Shared evidence for both outputs.');
    panel(60,245,1160,290);
    text('Model',90,288,20,colors.muted);text(baseline.result.meta.model,270,288,25,colors.green,'700');
    text('Response',90,340,20,colors.muted);text(baseline.result.meta.responseId,270,340,23);
    text('Time',90,390,20,colors.muted);text(baseline.result.meta.generatedAt,270,390,23);
    wrap('Conversation → interests and strength candidates → career brief + cross-room connection',90,450,1080,27,colors.ink,36);
    footer('The server checks exact quotes, authorship, claim references, and evidence from both people. Interpretation still needs human review.',time);
  } else if(scene===3) {
    heading('04 / BENEFIT ONE','A career conversation brief grounded in messages.');
    panel(60,250,1160,280);
    let y=295;
    baseline.result.brief.points.slice(1,3).forEach(p=>{y=wrap(p.text,90,y,1090,25,colors.ink,34)+14;text(`Evidence: ${p.claimIds.join(', ')}`,90,y,17,colors.green);y+=38;});
    footer('Described actions remain self-reported. This is a starting point for a professional conversation, not a verified reference letter.',time);
  } else if(scene===4) {
    heading('05 / BENEFIT TWO','Alex ↔ Priya: a shared question about AI memory.');
    panel(60,240,550,180);panel(640,240,580,180);
    text('Alex / a1',85,280,20,colors.green,'700');wrap('“what is lost when an AI compresses its conversation memory”',85,325,490,25,colors.ink,34);
    text('Priya / p1',665,280,20,colors.green,'700');wrap('“A compressed summary may preserve a topic but lose the reason the learner was confused”',665,325,520,25,colors.ink,34);
    wrap(baseline.result.connections[0].openingQuestion,65,470,1150,27,colors.green,36);
    footer('The connection cites both people. Sam is not included just to fill a slot. No one is contacted automatically.',time);
  } else if(scene===5) {
    heading('06 / REAL CONTROL RUNS','Change the evidence. The result should change.');
    panel(60,250,550,275);panel(640,250,580,275);
    text('Sparse subject evidence',85,295,27,colors.green,'700');
    wrap('Alex says only “Hi.”',85,345,490,26,colors.ink,35);
    text(`Brief: ${controls.sparse.result.brief.status}`,85,415,23);
    text(`Connections: ${controls.sparse.result.connections.length}`,85,455,23);
    text('Changed candidate interest',665,295,27,colors.green,'700');
    wrap('Priya discusses ceramic glazes instead.',665,345,520,26,colors.ink,35);
    text(`Connections: ${controls.changed.result.connections.length}`,665,430,23);
    footer('These are separate real API runs with synthetic inputs. They are useful controls, not a benchmark or a guarantee.',time);
  } else {
    heading('07 / THE NEXT STEP','The value belongs to the people who made it.');
    panel(60,250,1160,275);
    wrap('Inspect the evidence. Change the input. Choose what to do next.',90,310,1080,34,colors.green,46);
    wrap('SN2.0 is a minimal working sketch: a Node.js API, one browser screen, and real Meta Muse Spark responses.',90,390,1080,28,colors.ink,39);
    wrap('No automatic outreach. No forced match. No claim of verified employment.',90,470,1080,23,colors.muted,32);
    footer('What would it take for AI that reads our conversations to owe us a useful next step?',time);
  }
}

try {
  [baseline,controls]=await Promise.all([fetch('/recorded-run.json').then(r=>r.json()),fetch('/recorded-controls.json').then(r=>r.json())]);
  draw(0);status.textContent='Ready. Export takes 120 seconds. Keep this tab open.';
} catch {status.textContent='Unable to load recorded runs.';button.disabled=true;}

storyboard.addEventListener('click',async()=>{
  const sheet=document.createElement('canvas');sheet.width=640;sheet.height=2520;
  const sheetCtx=sheet.getContext('2d');
  for(let i=0;i<7;i++){draw(i*18);sheetCtx.drawImage(canvas,0,i*360,640,360);}
  draw(0);
  const link=document.getElementById('storyboard-download');link.href=sheet.toDataURL('image/png');link.hidden=false;
  try {
    const blob=await new Promise(resolve=>sheet.toBlob(resolve,'image/png'));
    const response=await fetch('/api/demo-artifact',{method:'POST',headers:{'Content-Type':'image/png'},body:blob});
    const saved=await response.json();if(!response.ok)throw new Error(saved.error);
    status.textContent=`Storyboard saved locally: ${saved.saved}. Ready for video export.`;
  } catch(error){status.textContent=`Local save unavailable: ${error.message}. Browser download is still available.`;}
});

button.addEventListener('click',()=>{
  try {
    button.disabled=true;storyboard.disabled=true;download.hidden=true;
    const stream=canvas.captureStream(5);
    const type=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
    if(!type) throw new Error('WebM recording is unavailable in this browser.');
    const recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:2000000});
    const chunks=[];let lastSecond=-1;
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onerror=()=>{status.textContent='Video encoding failed.';button.disabled=false;storyboard.disabled=false;stream.getTracks().forEach(t=>t.stop());clearInterval(frames);};
    recorder.onstop=async()=>{
      stream.getTracks().forEach(t=>t.stop());
      const blob=new Blob(chunks,{type:'video/webm'});
      download.href=URL.createObjectURL(blob);download.hidden=false;
      status.textContent=`Export complete: 120 seconds, ${(blob.size/1024/1024).toFixed(1)} MB. Saving locally…`;
      try {
        const response=await fetch('/api/demo-artifact',{method:'POST',headers:{'Content-Type':'video/webm'},body:blob});
        const saved=await response.json();if(!response.ok)throw new Error(saved.error);
        status.textContent=`Export complete. Saved locally: ${saved.saved} (${(blob.size/1024/1024).toFixed(1)} MB).`;
      } catch(error){status.textContent=`Local save unavailable: ${error.message}. Use the download link.`;}
      button.disabled=false;storyboard.disabled=false;
    };
    recorder.start(1000);
    const started=performance.now();
    frames=setInterval(()=>{
      const seconds=(performance.now()-started)/1000;
      draw(seconds);
      if(Math.floor(seconds)!==lastSecond){lastSecond=Math.floor(seconds);status.textContent=`Exporting captioned demo: ${Math.min(lastSecond,120)} / 120 seconds…`;}
      if(seconds>=duration){clearInterval(frames);recorder.stop();}
    },200);
  } catch(error) {status.textContent=error.message;button.disabled=false;storyboard.disabled=false;}
});
