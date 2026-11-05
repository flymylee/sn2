let dataset;
let revision = 0;
let running = false;
let dirty = false;
let latestRun = null;
let configured = false;
const $ = id => document.getElementById(id);
function node(tag,text,className) {
  const el=document.createElement(tag);
  if(text!==undefined) el.textContent=text;
  if(className) el.className=className;
  return el;
}
function refreshButton() { $('analyze').disabled=running || dirty || !configured || !$('consent').checked; }
function invalidate(message='Input changed. Generate a new result for this evidence.') {
  revision++; latestRun=null;
  $('result').hidden=true; $('empty').hidden=false; $('error').hidden=true;
  $('request-status').textContent=message;
}
function displayInput() {
  $('subject').replaceChildren(...dataset.people.map(person=>{
    const option=node('option',person.name); option.value=person.id; return option;
  }));
  $('subject').value=dataset.subjectId;
  $('messages').replaceChildren(...dataset.messages.map(message=>{
    const card=node('article',undefined,'message');
    const name=dataset.people.find(p=>p.id===message.personId)?.name || message.personId;
    card.append(node('div',`${name} · ${message.room} · ${message.id}`,'message-label'));
    const area=node('textarea'); area.value=message.text; area.setAttribute('aria-label',`Message ${message.id} by ${name}`);
    area.addEventListener('input',()=>{
      message.text=area.value; $('dataset').value=JSON.stringify(dataset,null,2);
      invalidate();
    });
    card.append(area); return card;
  }));
  $('dataset').value=JSON.stringify(dataset,null,2); dirty=false; refreshButton();
}
function evidenceView(claim) {
  const details=node('details',undefined,'evidence');
  details.append(node('summary',`${claim.id} · ${claim.label}`));
  for(const item of claim.evidence) details.append(node('blockquote',`“${item.quote}” — ${item.messageId}`));
  return details;
}
function render(result,input,{recorded=false}={}) {
  const allClaims=result.profiles.flatMap(profile=>[...profile.interests,...profile.strengths]);
  const byId=new Map(allClaims.map(c=>[c.id,c]));
  const subject=result.profiles.find(p=>p.personId===input.subjectId);
  $('claims').replaceChildren();
  for(const [label,items] of [['Interests',subject.interests],['Strength candidates',subject.strengths]]) {
    $('claims').append(node('h4',label));
    if(!items.length) $('claims').append(node('p','Not enough evidence yet.','muted'));
    items.forEach(c=>$('claims').append(evidenceView(c)));
  }
  $('brief').replaceChildren();
  if(result.brief.status==='insufficient_evidence') $('brief').append(node('p','Not enough evidence to write a career brief.','notice'));
  result.brief.points.forEach(point=>{
    const card=node('div',undefined,'brief-point'); card.append(node('p',point.text));
    const details=node('details'); details.append(node('summary',`Evidence: ${point.claimIds.join(', ')}`));
    point.claimIds.forEach(id=>details.append(evidenceView(byId.get(id)))); card.append(details); $('brief').append(card);
  });
  result.brief.limitations.forEach(text=>$('brief').append(node('p',text,'limitation')));
  $('connections').replaceChildren();
  if(!result.connections.length) $('connections').append(node('p','No supported connection in this dataset.','notice'));
  result.connections.forEach(match=>{
    const card=node('article',undefined,'connection');
    card.append(node('h4',input.people.find(p=>p.id===match.personId).name));
    card.append(node('p',match.sharedQuestion));
    card.append(node('p',`A question to start with: “${match.openingQuestion}”`,'opening'));
    const details=node('details'); details.append(node('summary','Evidence from both people'));
    for(const id of [...match.subjectInterestIds,...match.candidateInterestIds]) details.append(evidenceView(byId.get(id)));
    card.append(details); $('connections').append(card);
  });
  $('connections').append(node('p',result.connectionNote,'limitation'));
  $('provenance').textContent=`${recorded ? 'RECORDED REAL API RUN · NOT A NEW REQUEST' : 'LIVE META RESPONSE'} · ${result.meta.model} · ${result.meta.generatedAt} · ${(result.meta.latencyMs/1000).toFixed(1)}s · ${result.meta.responseId || 'ID unavailable'}`;
  $('empty').hidden=true; $('result').hidden=false;
}
$('subject').addEventListener('change',()=>{
  dataset.subjectId=$('subject').value; $('dataset').value=JSON.stringify(dataset,null,2); invalidate();
});
$('dataset').addEventListener('input',()=>{ dirty=true; invalidate('Dataset edited. Apply it before generating.'); refreshButton(); });
$('apply').addEventListener('click',()=>{
  try {
    const input=JSON.parse($('dataset').value);
    if(!input || !Array.isArray(input.people) || !Array.isArray(input.messages) || !input.people.some(p=>p?.id===input.subjectId) || input.people.some(p=>!p || typeof p.id!=='string' || typeof p.name!=='string') || input.messages.some(m=>!m || typeof m.text!=='string')) throw new Error('Use a dataset with people, messages, and a valid subjectId.');
    dataset=input; invalidate(); displayInput(); $('input-label').textContent='USER-PROVIDED DATA · REVIEW PERMISSION';
  } catch(error) { $('error').textContent=error.message; $('error').hidden=false; }
});
$('consent').addEventListener('change',refreshButton);
$('replay').addEventListener('click',async()=>{
  if(running) return;
  try {
    const response=await fetch('/recorded-run.json');
    if(!response.ok) throw new Error('Recorded run is unavailable.');
    const run=await response.json();
    invalidate(); dataset=run.input; displayInput();
    $('input-label').textContent='FICTIONAL DATA · RECORDED API RUN';
    latestRun={...run,viewMode:'recorded'};
    render(run.result,run.input,{recorded:true});
    $('request-status').textContent='Showing a recorded real API response. No new request was made. Edit the input and generate to run it live.';
  } catch(error) { $('error').textContent=error.message; $('error').hidden=false; }
});
$('analyze').addEventListener('click',async()=>{
  if(running || dirty || !$('consent').checked) return;
  invalidate('Sending this dataset to Meta. Waiting for a real model response…');
  const version=revision;
  const input=structuredClone(dataset);
  running=true; refreshButton();
  $('analyze').textContent='Reading the conversation…';
  try {
    const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
    const result=await response.json();
    if(version!==revision) { $('request-status').textContent='Input changed during this request. Old result discarded. Generate again.'; return; }
    if(!response.ok) throw new Error(`${result.code || response.status}: ${result.error || 'Request failed.'}`);
    latestRun={input,result}; render(result,input);
    $('request-status').textContent='Real API response received. Quote ownership and reference IDs validated. Review the interpretation yourself.';
  } catch(error) {
    if(version!==revision) return;
    $('error').textContent=error.message; $('error').hidden=false;
    $('request-status').textContent='No verified result available. Fix the error and try again.';
  } finally { running=false; $('analyze').textContent='Make this conversation work ↗'; refreshButton(); }
});
$('download').addEventListener('click',()=>{
  if(!latestRun) return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(latestRun,null,2)],{type:'application/json'}));
  const link=node('a');link.href=url;link.download='sn2-live-run.json';link.click();URL.revokeObjectURL(url);
});
try {
  const [input,status]=await Promise.all([fetch('/sample.json').then(r=>r.json()),fetch('/api/status').then(r=>r.json())]);
  dataset=input; configured=status.configured;
  $('api-status').textContent=configured ? `${status.model} · Key configured` : 'Live generation needs an API key · recorded run available';
  displayInput();
} catch { $('api-status').textContent='Local server unavailable'; refreshButton(); }
