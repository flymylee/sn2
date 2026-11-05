import test from 'node:test';
import assert from 'node:assert/strict';
import { validateInput, validateResult } from './analyze.mjs';

const input={subjectId:'a',people:[{id:'a',name:'A'},{id:'b',name:'B'}],messages:[
  {id:'a1',personId:'a',room:'one',text:'I compare memory summaries.'},
  {id:'b1',personId:'b',room:'two',text:'I study what summaries forget.'},
]};
function valid() { return {
  profiles:[
    {personId:'a',interests:[{id:'ia',label:'Memory summaries',evidence:[{messageId:'a1',quote:'memory summaries'}]}],strengths:[]},
    {personId:'b',interests:[{id:'ib',label:'Summary loss',evidence:[{messageId:'b1',quote:'what summaries forget'}]}],strengths:[]},
  ],
  brief:{status:'ready',points:[{text:'A discusses memory summaries.',claimIds:['ia']}],limitations:['No employment history supplied.']},
  connections:[{personId:'b',subjectInterestIds:['ia'],candidateInterestIds:['ib'],sharedQuestion:'What survives a summary?',openingQuestion:'How would you test recall?'}],
  connectionNote:'Shared questions are a hypothesis, not demonstrated compatibility.',
}; }

test('accepts a fully linked cross-room result',()=>assert.equal(validateResult(valid(),validateInput(input)).connections.length,1));
test('rejects a made-up quote even when the message ID exists',()=>{
  const result=valid();result.profiles[0].interests[0].evidence[0].quote='I led a research team.';
  assert.throws(()=>validateResult(result,input),{code:'EVIDENCE_VALIDATION'});
});
test('rejects another person’s quote and another person’s brief claim',()=>{
  const result=valid();result.profiles[0].interests[0].evidence=[{messageId:'b1',quote:'what summaries forget'}];
  assert.throws(()=>validateResult(result,input),{code:'EVIDENCE_VALIDATION'});
  const result2=valid();result2.brief.points[0].claimIds=['ib'];
  assert.throws(()=>validateResult(result2,input),{code:'EVIDENCE_VALIDATION'});
});
test('rejects missing references and one-sided matches',()=>{
  for(const patch of [{subjectInterestIds:['unknown']},{candidateInterestIds:[]},{candidateInterestIds:['ia']}]) {
    const result=valid();Object.assign(result.connections[0],patch);
    assert.throws(()=>validateResult(result,input),{code:'EVIDENCE_VALIDATION'});
  }
});
test('rejects a same-room candidate',()=>{
  const same=structuredClone(input);same.messages[1].room='one';
  assert.throws(()=>validateResult(valid(),same),{code:'EVIDENCE_VALIDATION'});
});
test('accepts explicit insufficient evidence without inventing outputs',()=>{
  const result=valid();result.profiles.forEach(p=>p.interests=[]);result.brief.status='insufficient_evidence';result.brief.points=[];result.connections=[];
  assert.equal(validateResult(result,input).brief.status,'insufficient_evidence');
});
test('rejects duplicate message IDs that make attribution ambiguous',()=>{
  const duplicate=structuredClone(input);duplicate.messages[1].id='a1';
  assert.throws(()=>validateInput(duplicate),{code:'INVALID_INPUT'});
});
