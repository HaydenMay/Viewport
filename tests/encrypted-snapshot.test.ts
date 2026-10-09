import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {encryptSnapshot,decryptSnapshot} from '../scripts/catalog-trial/encrypted-snapshot.ts';
import {TITLES} from '../src/catalog.ts';
test('private catalog transfer hides records and rejects a wrong key or altered ciphertext',()=>{
  const keys=generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
  const snapshot={version:1 as const,generatedAt:new Date().toISOString(),titles:[{...TITLES[0],name:'PRIVATE_TEST_SENTINEL'}],offers:[],links:[]};
  const envelope=encryptSnapshot(snapshot,keys.publicKey);
  assert.ok(!JSON.stringify(envelope).includes('PRIVATE_TEST_SENTINEL'));
  assert.deepEqual(decryptSnapshot(envelope,keys.privateKey),snapshot);
  const other=generateKeyPairSync('rsa',{modulusLength:2048});
  assert.throws(()=>decryptSnapshot(envelope,other.privateKey.export({type:'pkcs8',format:'pem'}).toString()));
  const altered=Buffer.from(envelope.ciphertext,'base64');altered[0]^=1;
  assert.throws(()=>decryptSnapshot({...envelope,ciphertext:altered.toString('base64')},keys.privateKey));
});
