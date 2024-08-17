export interface SignatureKey {
  id: string;
  ownerId: string;
  algorithm: "RSA";
  privateKeyPem?: string;
  publicKeyPem: string;
}

export interface ISignatureService {
  getFromId(id: string): Promise<SignatureKey | null>;
  getFromOwnerId(ownerId: string): Promise<SignatureKey | null>;
  create(key:SignatureKey): Promise<SignatureKey | null>;
  delete(id: string): Promise<void>;
  sign(key: SignatureKey, data: BufferSource): Promise<ArrayBuffer | null>;
  verify(key: SignatureKey, sign: BufferSource, data: BufferSource): Promise<boolean>;
  fetch(k: SignatureKey | null, id: string): Promise<SignatureKey | null>;
}
