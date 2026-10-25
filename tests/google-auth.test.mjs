import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
import {createGoogleVerifier} from '../lib/google-auth.mjs';
const pair=await generateKeyPair('RS256'),jwk=await exportJWK(pair.publicKey);jwk.kid='test';
const verify=createGoogleVerifier(createLocalJWKSet({keys:[jwk]}));
const now=Math.floor(Date.now()/1000);
const token=(overrides={},key=pair.privateKey)=>new SignJWT({sub:'google-user',nonce:'nonce',iss:'https://accounts.google.com',aud:'client',iat:now,exp:now+300,...overrides}).setProtectedHeader({alg:'RS256',kid:'test'}).sign(key);
test('Google verifier accepts valid RSA signature and rejects altered claims/identity/replay context',async()=>{
 assert.deepEqual(await verify(await token(),'client','nonce'),{sub:'google-user'});
 for(const claims of [{aud:'attacker-client'},{iss:'https://attacker.test'},{exp:now-10},{iat:now-1000},{nonce:'wrong'},{sub:''}])await assert.rejects(()=>token(claims).then(t=>verify(t,'client','nonce')));
 const other=await generateKeyPair('RS256');await assert.rejects(()=>token({},other.privateKey).then(t=>verify(t,'client','nonce')));
 await assert.rejects(()=>verify('forged.payload.signature','client','nonce'));
});
