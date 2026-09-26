import http from 'node:http';
import net from 'node:net';
const blocked=new Set(['/api/lead','/api/report','/api/booking','/api/event']);
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1:3108');
  if(blocked.has(url.pathname) || (req.method==='POST' && url.pathname!=='/api/analyze')){
    req.resume();
    console.log('LOCAL DEMO BLOCK: '+req.method+' '+url.pathname);
    res.writeHead(200,{'Content-Type':'application/json'});
    res.end(JSON.stringify({ok:true,delivered:true,routingEnsured:true,demoOnly:true}));return;
  }
  const upstream=http.request({hostname:'127.0.0.1',port:3107,path:req.url,method:req.method,headers:{...req.headers,host:'127.0.0.1:3107'}},response=>{
    res.writeHead(response.statusCode,response.headers);response.pipe(res);
  });
  upstream.on('error',()=>{res.writeHead(502);res.end('Local demo unavailable');});req.pipe(upstream);
});
server.on('upgrade',(req,socket,head)=>{
  const upstream=net.connect(3107,'127.0.0.1',()=>{
    const headers=Object.entries({...req.headers,host:'127.0.0.1:3107'}).map(([k,v])=>`${k}: ${v}`).join('\r\n');
    upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${headers}\r\n\r\n`);
    if(head.length)upstream.write(head);socket.pipe(upstream);upstream.pipe(socket);
  });
  upstream.on('error',()=>socket.destroy());socket.on('error',()=>upstream.destroy());
});
server.listen(3108,'127.0.0.1',()=>console.log('Local isolated demo: http://127.0.0.1:3108'));
