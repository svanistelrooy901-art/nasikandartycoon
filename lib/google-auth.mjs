import {createRemoteJWKSet,jwtVerify} from 'jose';
const keys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
export function createGoogleVerifier(keySet=keys){return async function verifyGoogleToken(token,clientId,nonce){
 const {payload}=await jwtVerify(token,keySet,{algorithms:['RS256'],issuer:['https://accounts.google.com','accounts.google.com'],audience:clientId,requiredClaims:['sub','exp','iat','nonce'],maxTokenAge:'10m'});
 if(payload.nonce!==nonce||typeof payload.sub!=='string'||!payload.sub||payload.sub.length>255)throw Error('Invalid Google identity');
 return {sub:payload.sub};
}
}
export const verifyGoogleToken=createGoogleVerifier();
