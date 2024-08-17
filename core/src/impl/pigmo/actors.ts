import { PigmoCollection } from "@ikasoba000/pigmo/PigmoCollection";
import { $filter, $insert, $remove, $upsert } from "@ikasoba000/pigmo/PigmoQuery";
import { IActor, IActorService } from "../../actors/IActorService.js"
import { IConfigService } from "../../config/IConfigService.js";
import { IWebService } from "../../web/IWebService.js";
import { AsObject } from "../../ld/ActivityStreams.js";
import { $extends, $guard, $object, $union, ObjectSchema, Validator, createValidator } from "../../JsonLd.js";
import { LangString } from "../../ld/Rdf.js";
import { $const, $string, $undefined } from "lizod";
import { W3idKey } from "../../ld/w3id.js";
import { QueryFn } from "./helper.js";
import { escapeRegexp } from "../utils.js";
import { SignatureKey } from "../../signatures/ISignatureService.js";

export const AsActor: ObjectSchema<IActor> = $extends(AsObject, $object({
  "@id": $guard($string),
  "https://www.w3.org/ns/activitystreams#preferredUsername": $guard($string),
  "https://w3id.org/security#publicKey": $extends(W3idKey, $object({
    "@id": $guard($string),
    "https://w3id.org/security#publicKeyPem": $guard($string)
  })),
  "http://www.w3.org/ns/ldp#inbox": $object({
    "@id": $guard($string)
  }),
  "https://www.w3.org/ns/activitystreams#outbox": $object({
    "@id": $guard($string)
  })
}))

export class ActorService implements IActorService {
  private $AsActor: Validator<IActor>;

  constructor(
    private config: IConfigService,
    private web: IWebService,
    private db: PigmoCollection<IActor>
  ) {
    this.$AsActor = createValidator(AsActor, this.config.documents)
  }

  async create(actor: IActor<string>): Promise<IActor<string>> {
    return (await this.db.exec(
      $insert({
        values: [actor]
      })
    ))[9] ?? actor
  }

  async delete(id: string): Promise<void> {
    await this.db.exec(
      $remove({
        where: {
          "@id": {
            $eq: id
          }
        }
      })
    )
  }

  async getFromId(id: string): Promise<IActor<string> | null> {
    return (await this.db.exec(
      $filter({
        where: {
          "@id": {
            $eq: id
          }
        },
        max: 1
      })
    ))[0] ?? null
  }

  async getFromName(name: string): Promise<IActor<string> | null> {
    return (await this.db.exec(
      $filter({
        where: {
          "@id": {
            $eq: new URL("/users/" + name, this.config.url).toString()
          }
        }
      })
    ))[0] ?? null
  }

  async fetch(k: SignatureKey | null, uri: string): Promise<IActor<string> | null> {
    const req = {
      headers: {
        "Accept": "application/activity+json"
      }
    }
    const res = k ? await this.web.requestSigned(k, uri, req) : await this.web.request(uri, req);
    if (res == null) return null;

    const rawActor = await res.json()

    const status = this.$AsActor(rawActor);
    if (status == null || status.value["@type"] != "https://www.w3.org/ns/activitystreams#Person") return null;

    return (await this.db.exec(
      $upsert({
        values: [ status.value ],
      })
    ))[0] ?? null
  }
}
