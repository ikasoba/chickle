import { QueryFn } from "./helper.js";
import { ISignatureService, SignatureKey } from "../../signatures/ISignatureService.js";
import { decodeBase64 } from "../utils.js"
import { IActorService } from "../../actors/IActorService.js";
import { PigmoCollection } from "@ikasoba000/pigmo/PigmoCollection";
import { $filter, $insert, $remove } from "@ikasoba000/pigmo/PigmoQuery";

export const trimPemHeadAndFooter = (pem: string) => pem.replace(/^-----BEGIN [A-Z]+ KEY-----\n|\n-----END [A-Z]+ KEY-----\n?$/g, "")

export class SignatureService implements ISignatureService {
  constructor(private actors: IActorService, private db: PigmoCollection<SignatureKey>) {}
  
  async create(key: SignatureKey): Promise<SignatureKey | null> {
    return (await this.db.exec(
      $insert({
        values: [key]
      })
    ))[0] ?? key;
  }

  async fetch(k: SignatureKey | null, id: string): Promise<SignatureKey | null> {
    if (!URL.canParse(id)) return null;
    
    const url = new URL(id)

    if (url.hash == "#main-key") {
      const actorId = url.toString().replace(/#.+$/, "");
      const actor = await this.actors.fetch(k, actorId);
      if (actor == null) return null;

      const key = actor["https://w3id.org/security#publicKey"]
      if (key["@id"] == null) return null;

      const ownerId = key["https://w3id.org/security#owner"]["@id"];
      if (!URL.canParse(ownerId) || ownerId != actorId) return null;
      
      return await this.create({
        id: key["@id"],
        algorithm: "RSA",
        ownerId: key["https://w3id.org/security#owner"]["@id"],
        publicKeyPem: key["https://w3id.org/security#publicKeyPem"],
      })
    }

    return null;
  }

  async delete(id: string): Promise<void> {
    await this.db.exec(
      $remove({
        where: {
          id: {
            $eq: id
          }
        }
      })
    )
  }

  async getFromId(id: string): Promise<SignatureKey | null> {
    return (await this.db.exec(
      $filter({
        where: {
          id: {
            $eq: id
          }
        },
        max: 1
      })
    ))[0] ?? null
  }

  async getFromOwnerId(ownerId: string): Promise<SignatureKey | null> {
    return (await this.db.exec(
      $filter({
        where: {
          ownerId: {
            $eq: ownerId
          }
        },
        max: 1
      })
    ))[0] ?? null
      
  }

  async sign(key: SignatureKey, data: BufferSource): Promise<ArrayBuffer | null> {
    if (key.privateKeyPem == null) return null;
    
    const privateKey = decodeBase64(trimPemHeadAndFooter(key.privateKeyPem));
    if (privateKey == null) return null;
    
    const k = await crypto.subtle.importKey("pkcs8", privateKey, key.algorithm, false, ["sign"])

    return crypto.subtle.sign(key.algorithm, k, data);
  }
  
  async verify(key: SignatureKey, sign: BufferSource, data: BufferSource): Promise<boolean> {
    const publicKey = decodeBase64(trimPemHeadAndFooter(key.publicKeyPem));
    if (publicKey == null) return false;
    
    const k = await crypto.subtle.importKey("pkcs8", publicKey, key.algorithm, false, ["verify"])

    return crypto.subtle.verify(key.algorithm, k, sign, data);
  }
}
