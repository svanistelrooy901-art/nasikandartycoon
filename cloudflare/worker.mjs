import { createApi } from '../lib/server.mjs';

export default {
 async fetch(request, env) {
  const url = new URL(request.url);
  const match = /^\/api\/([a-z]+)$/.exec(url.pathname);
  if (match) {
   if (!['GET', 'POST'].includes(request.method)) return new Response('Method not allowed', {status:405,headers:{Allow:'GET, POST'}});
   return createApi(env)(request, {params:{action:match[1]}});
  }
  if (url.pathname.startsWith('/api/')) return new Response('Not found', {status:404});
  const response = await env.ASSETS.fetch(request);
  if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
   const headers = new Headers(response.headers);
   headers.delete('content-length');headers.delete('etag');
   const html = (await response.text()).replaceAll('https://joki-nasi-kandar.muddyotter33.chatgpt.site',url.origin);
   return new Response(html,{status:response.status,headers});
  }
  return response;
 }
};
