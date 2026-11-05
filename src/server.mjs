import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { configuration, MetaError } from './meta.mjs';
import { analyze } from './analyze.mjs';

const port = Number(process.env.PORT || 3210);
const files = new Map([
  ['/', ['index.html','text/html; charset=utf-8']],
  ['/app.js', ['app.js','text/javascript; charset=utf-8']],
  ['/style.css', ['style.css','text/css; charset=utf-8']],
  ['/sample.json', ['sample.json','application/json; charset=utf-8']],
  ['/recorded-run.json', ['recorded-run.json','application/json; charset=utf-8']],
]);
let busy = false;
function send(res,status,body,type='application/json; charset=utf-8') {
  res.writeHead(status, {'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'"});
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
async function readJson(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new MetaError('Send JSON.', 'CONTENT_TYPE',415);
  const chunks=[]; let size=0;
  for await (const chunk of req) {
    size+=chunk.length;
    if(size>100000) throw new MetaError('Input is too large.', 'INPUT_SIZE',413);
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString()); }
  catch { throw new MetaError('Input is not valid JSON.', 'INVALID_JSON',400); }
}
const server = http.createServer(async(req,res)=>{
  try {
    const allowedHosts = new Set([`127.0.0.1:${port}`,`localhost:${port}`]);
    if (!allowedHosts.has(req.headers.host)) return send(res,403,{error:'Local access only.'});
    const path = new URL(req.url,'http://localhost').pathname;
    if(req.method==='GET' && path==='/api/status') return send(res,200,{...configuration(),mode:'local'});
    if(req.method==='POST' && path==='/api/analyze') {
      const origin=req.headers.origin;
      if(origin && ![`http://localhost:${port}`,`http://127.0.0.1:${port}`].includes(origin)) return send(res,403,{error:'Origin not allowed.'});
      if(busy) return send(res,429,{error:'An analysis is already running. Wait for it to finish.'});
      const input=await readJson(req);
      busy=true;
      try { return send(res,200,await analyze(input)); }
      finally { busy=false; }
    }
    const file=files.get(path);
    if(req.method==='GET' && file) return send(res,200,await readFile(new URL(`../public/${file[0]}`,import.meta.url)),file[1]);
    return send(res,404,{error:'Not found.'});
  } catch(error) {
    return send(res,error instanceof MetaError ? error.status : 500,{error:error instanceof MetaError ? error.message : 'Unexpected server error.',code:error.code || 'SERVER_ERROR'});
  }
});
server.requestTimeout=150000;
server.listen(port,'127.0.0.1',()=>console.log(`SN2.0 local demo: http://127.0.0.1:${port}`));
