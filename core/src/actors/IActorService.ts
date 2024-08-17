import { W3idKey } from "../ld/w3id.js";
import { AsObject, NsActivityStreams } from "../ld/ActivityStreams.js";
import { Assign } from "../types/Assign.js";
import { SignatureKey } from "../signatures/ISignatureService.js";

export interface IActor<T extends string = string> extends AsObject {
  "@type": T;
  "@id": string;
  "https://www.w3.org/ns/activitystreams#preferredUsername": string;
  "https://w3id.org/security#publicKey": Assign<W3idKey, {
    "@id": string;
    "https://w3id.org/security#publicKeyPem": string
  }>
  "http://www.w3.org/ns/ldp#inbox": {
    "@id": string
  }
  "https://www.w3.org/ns/activitystreams#outbox": {
    "@id": string
  }
}

export interface IPerson extends IActor<`${NsActivityStreams}Person`> {}

export interface IActorService {
  fetch(k: SignatureKey | null, uri: string): Promise<IActor | null>;
  getFromId(id: string): Promise<IActor | null>;
  getFromName(name: string): Promise<IActor | null>;
  create(actor: IActor): Promise<IActor>;
  delete(id: string): Promise<void>;
}
