import { IConfigService } from "../config/IConfigService.js";
import { Chickle, ChickleDocuments } from "../impl/Chickle.js";
import { WebService } from "../impl/pigmo/web.js";
import { ActorService } from "../impl/pigmo/actors.js";
import { SignatureService } from "../impl/pigmo/signature.js";
import { NsActivityStreams } from "../ld/ActivityStreams.js";
import { ISignatureService, SignatureKey } from "../signatures/ISignatureService.js";
import { NoteService } from "../impl/pigmo/notes.js";
import { InboxItem, InboxService } from "../impl/pigmo/inbox.js";
import { serve } from "@hono/node-server";
import { exportPrivateKeyPem, exportPublicKeyPem, importPrivateKey, importPublicKey } from "@misskey-dev/node-http-message-signatures";
import { IActor } from "../actors/IActorService.js";

import { Pigmo, schema } from "@ikasoba000/pigmo";
import { Sqlite3Engine } from "@ikasoba000/pigmo/engines/sqlite3";
import { OutboxItem, OutboxService } from "../impl/pigmo/outbox.js";
import { INote } from "../notes/INoteService.js";

import { DeliverService } from "../impl/pigmo/deliver.js";

const config: IConfigService = {
  port: "8080",
  host: "localhost:8080",
  url: "https://localhost:8080/",
  deliverInterval: 1000 * 10,
  deliverSize: 3,
  documents: ChickleDocuments
}

const delayed = <T extends object>(fn: () => T): T => {
  let value: T | null = null;
  
  return new Proxy<T>({} as T, {
    get(target, p, receiver) {
        return Reflect.get(value ??= fn(), p, receiver)
    },
  })
}

const db = await Pigmo.create({
  engine: new Sqlite3Engine({
    path: ".db"
  }),
  collections: {
    actors: schema<IActor>({
      primaryKey: "@id",
      properties: {
        "@id": {
          isIndexed: true
        }
      }
    }),
    notes: schema<INote>({
      primaryKey: "@id",
      properties: {
        "@id": {
          isIndexed: true
        }
      }
    }),
    inbox: schema<InboxItem>({
      primaryKey: "",
      properties: {
        id: {
          isIndexed: true
        }
      }
    }),
    outbox: schema<OutboxItem>({
      primaryKey: "",
      properties: {
        id: {
          isIndexed: true
        }
      }
    }),
    signatures: schema<SignatureKey>({
      primaryKey: "id",
      properties: {
        id: {
          isIndexed: true
        }
      }
    })
  }
})

const collections = {
  actors: await db.getCollection("actors"),
  notes: await db.getCollection("notes"),
  inbox: await db.getCollection("inbox"),
  outbox: await db.getCollection("outbox"),
  signatures: await db.getCollection("signatures")
}
const signature: ISignatureService = delayed(() => new SignatureService(actors, collections.signatures));

const web = new WebService(signature, fetch);

const actors = new ActorService(config, web, collections.actors);

const notes = new NoteService(config, web, collections.notes);

const inbox = new InboxService(config, notes, collections.inbox);

const deliver = new DeliverService(config, signature, web);
const outbox = new OutboxService(config, notes, actors, deliver, signature, collections.outbox);

const app = Chickle({
  actors: actors,
  notes: notes,
  web: web,
  inbox,
  outbox,
  signature,
  config
})

let keys = await crypto.subtle.generateKey({
  name: "RSASSA-PKCS1-v1_5",
  hash: "SHA-256",
  publicExponent: new Uint8Array([1, 0, 1]),
  modulusLength: 2048
}, true, ["sign", "verify"]);

type KeyOfA<T, A> =
  { [K in keyof T]: A extends T[K] ? K : never }[keyof T]

type KeyOfB<T, A> =
  { [K in keyof T]: T[K] extends A ? never : K }[keyof T]

type Decl<T> =
  {
    [K in KeyOfA<T, undefined>]?: T[K];
  } | {
    [K in KeyOfB<T, undefined>]: T[K];
  }

const decl = <T, D extends Decl<T>>(value: D) => value as any as T

const example: IActor = (await actors.getFromId(new URL("/users/example", config.url).toString())) ?? (await actors.create(decl({
  "@id": new URL("/users/example", config.url).toString(),
  "@type": `${NsActivityStreams}Person`,
  "https://www.w3.org/ns/activitystreams#name": "example",
  "https://www.w3.org/ns/activitystreams#preferredUsername": "example",
  "https://www.w3.org/ns/activitystreams#summary": "Hello, world!",
  "http://www.w3.org/ns/ldp#inbox": {
    "@id": new URL("/users/example/inbox", config.url).toString()
  },
  "https://www.w3.org/ns/activitystreams#outbox": {    
    "@id": new URL("/users/example/outbox", config.url).toString()
  },
  "https://w3id.org/security#publicKey": {
    "@type": "https://w3id.org/security#Key",
    "@id": new URL("/users/example#main-key", config.url).toString(),
    "https://w3id.org/security#owner": {
      "@id": new URL("/users/example", config.url).toString(),
    },
    "https://w3id.org/security#publicKeyPem": await exportPublicKeyPem(keys.publicKey),
  },
  "https://www.w3.org/ns/activitystreams#published": {
    "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
    "@value": (new Date()).toJSON()
  }
})))

const key: SignatureKey = await signature.getFromId(new URL("/users/example#main-key", config.url).toString()) ?? (await signature.create({
  id: new URL("/users/example#main-key", config.url).toString(),
  algorithm: "RSA",
  ownerId: example["@id"],
  publicKeyPem: await exportPublicKeyPem(keys.publicKey),
  privateKeyPem: await exportPrivateKeyPem(keys.privateKey)
}))!

keys.privateKey = await importPrivateKey(key.privateKeyPem);
keys.publicKey = await importPublicKey(key.publicKeyPem);

inbox.addEventListener("push", async event => {
  if (event.detail.to != example["http://www.w3.org/ns/ldp#inbox"]["@id"]) return;

  for (const activity of event.detail.activities) {
    if (activity["@type"] == `${NsActivityStreams}Follow`) {
      const rawObject = activity["https://www.w3.org/ns/activitystreams#object"]
      if (rawObject == null) continue;
      
      const objects = Array.isArray(rawObject) ? rawObject : [rawObject];
      
      const actor =
        typeof activity["https://www.w3.org/ns/activitystreams#actor"] == "object" && activity["https://www.w3.org/ns/activitystreams#actor"] && "@id" in activity["https://www.w3.org/ns/activitystreams#actor"] && typeof activity["https://www.w3.org/ns/activitystreams#actor"]["@id"] == "string"
          ? await actors.getFromId(activity["https://www.w3.org/ns/activitystreams#actor"]["@id"]) ?? await actors.fetch(key, activity["https://www.w3.org/ns/activitystreams#actor"]["@id"])
          : null

      if (actor == null) continue;          
          
      for (const object of objects) {
        
        if (typeof object != "object") continue;

        const target =
          "@id" in object && typeof object["@id"] == "string"
            ? await actors.getFromId(object["@id"]) ?? await actors.fetch(key, object["@id"])
            : null

        if (target == null) continue;

        if (target["@id"] != example["@id"]) continue;

        await deliver.deliverTo(target["@id"], actor["http://www.w3.org/ns/ldp#inbox"]["@id"], [
          decl({
            "@type": `${NsActivityStreams}Accept`,
            "https://www.w3.org/ns/activitystreams#actor": {
              "@id": target["@id"],
            },
            "https://www.w3.org/ns/activitystreams#object": activity,
          })
        ])

        const note: INote = decl({
          "@id": new URL("/notes/" + crypto.randomUUID(), config.url).toString(),
          "https://www.w3.org/ns/activitystreams#url": {
            "@id": new URL("/notes/" + crypto.randomUUID(), config.url).toString()
          },
          "@type":"https://www.w3.org/ns/activitystreams#Note",
          "https://www.w3.org/ns/activitystreams#content": "Hello, world!",
          "https://www.w3.org/ns/activitystreams#published": {
            "@type": "https://www.w3.org/2001/XMLSchema#dataTime",
            "@value": new Date().toJSON()
          },
          "https://www.w3.org/ns/activitystreams#to": {
            "@id": "https://www.w3.org/ns/activitystreams#Public"
          },
          "https://www.w3.org/ns/activitystreams#cc": {
            "@id": new URL("./followers", target["@id"] + "/").toString()
          },
          "https://www.w3.org/ns/activitystreams#attributedTo": {
            "@id": target["@id"]
          }
        })

        await notes.create(note);

        await deliver.deliverTo(target["@id"], actor["http://www.w3.org/ns/ldp#inbox"]["@id"], [
          decl({
            "@type": `${NsActivityStreams}Create`,
            "@id": note["@id"],
            "https://www.w3.org/ns/activitystreams#actor": {
              "@id": target["@id"]
            },
            "https://www.w3.org/ns/activitystreams#object": note,
            "https://www.w3.org/ns/activitystreams#to": note["https://www.w3.org/ns/activitystreams#to"],
            "https://www.w3.org/ns/activitystreams#cc": note["https://www.w3.org/ns/activitystreams#cc"]
          })
        ])
      }
    }
  }
})

serve({
  port: +config.port,
  fetch: app.fetch,
});
