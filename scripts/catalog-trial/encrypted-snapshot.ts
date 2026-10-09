import { createCipheriv, createDecipheriv, publicEncrypt, privateDecrypt, randomBytes, constants } from 'node:crypto';
import type { CatalogSnapshot } from '../../src/snapshot.ts';
import { SnapshotSource } from '../../src/snapshot.ts';

export interface EncryptedSnapshot {
  version: 1;
  algorithm: 'RSA-OAEP-SHA256+A256GCM';
  key: string;
  iv: string;
  tag: string;
  ciphertext: string;
}
export function encryptSnapshot(snapshot: CatalogSnapshot, publicKey: string): EncryptedSnapshot {
  new SnapshotSource(snapshot);
  const key = randomBytes(32), iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from('viewport-private-catalog-v1'));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(snapshot),'utf8'),cipher.final()]);
  const wrapped = publicEncrypt({key:publicKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},key);
  return {version:1,algorithm:'RSA-OAEP-SHA256+A256GCM',key:wrapped.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')};
}
export function decryptSnapshot(envelope: EncryptedSnapshot, privateKey: string): CatalogSnapshot {
  if(envelope.version!==1||envelope.algorithm!=='RSA-OAEP-SHA256+A256GCM')throw new Error('Unsupported encrypted snapshot');
  const key=privateDecrypt({key:privateKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},Buffer.from(envelope.key,'base64'));
  const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(envelope.iv,'base64'));
  decipher.setAAD(Buffer.from('viewport-private-catalog-v1'));
  decipher.setAuthTag(Buffer.from(envelope.tag,'base64'));
  const snapshot=JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext,'base64')),decipher.final()]).toString('utf8')) as CatalogSnapshot;
  new SnapshotSource(snapshot);
  return snapshot;
}
