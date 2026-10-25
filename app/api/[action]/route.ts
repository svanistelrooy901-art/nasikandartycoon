import {env} from 'cloudflare:workers';
import {createApi} from '../../../lib/server.mjs';
export const dynamic='force-dynamic';
export const GET=(request:Request,context:any)=>createApi(env)(request,context);
export const POST=GET;
