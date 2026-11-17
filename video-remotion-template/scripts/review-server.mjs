import path from 'node:path';
import {createServer} from 'vite';
import sirv from 'sirv';
import {ROOT} from './files.mjs';
export async function reviewServer(port=8738){
 const server=await createServer({root:ROOT,publicDir:false,plugins:[{name:'prepared-media',configureServer(server){server.middlewares.use('/prepared',sirv(path.join(ROOT,'public/prepared'),{dev:true,etag:true}));}}],server:{host:'127.0.0.1',port,strictPort:port!==0,open:false,watch:{ignored:['**/.cache/**','**/outputs/**','**/public/prepared/**']}}});
 await server.listen();return server;
}
