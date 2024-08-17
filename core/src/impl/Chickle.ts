import { Context, Hono } from "hono";
import { IActorService } from "../actors/IActorService.js";
import { Schema, createValidator, normalize } from "../JsonLd.js";
import { LdActivityStreams } from "../ld/ActivityStreams.js";
import { LdW3idSecurity } from "../ld/w3id.js";
import { IActivity, IInboxService } from "../inbox/IInboxSeervice.js";
import { AsActivity } from "./rxdb/inbox.js";
import { IOutboxService } from "../outbox/IOutboxService.js";
import { INoteService } from "../notes/INoteService.js";
import { IWebService } from "../web/IWebService.js";
import { ISignatureService } from "../signatures/ISignatureService.js";
import { logger } from "hono/logger";
import { IConfigService } from "../config/IConfigService.js";

export interface ChickleDependencies {
  actors: IActorService;
  notes: INoteService;
  inbox: IInboxService;
  outbox: IOutboxService;
  web: IWebService;
  signature: ISignatureService;
  config: IConfigService;
}

export const ChickleDocuments = {
  "https://www.w3.org/ns/activitystreams": LdActivityStreams,
  "https://w3id.org/security/v1": LdW3idSecurity
} as const;

function jsonAp<C extends Context>(ctx: C, value: unknown) {
  ctx.header("Content-Type", "application/activity+json")
  
  return ctx.body(JSON.stringify(value))
}

export function Chickle({ actors, notes, inbox, outbox, web, signature, config }: ChickleDependencies) {
  const $AsActivity: Schema<IActivity> = createValidator(AsActivity, ChickleDocuments);

  return new Hono()
    .get("/users/:name", async ctx => {
      const actor = await actors.getFromName(ctx.req.param("name"))
      if (actor == null) return ctx.status(404);

      return jsonAp(ctx, normalize(actor, ChickleDocuments));
    })
    .post("/users/:name/inbox", async ctx => {
      const target = await actors.getFromName(ctx.req.param("name"))
      if (target == null) return ctx.status(404);

      const raw = await ctx.req.raw.clone().json()
      
      const status = $AsActivity(raw)
      if (status == null) return ctx.status(400);


      const activity = status.value;
      const actor = activity["https://www.w3.org/ns/activitystreams#actor"]
      const actorId = !Array.isArray(actor) ? target["@id"] : null;
      
      if (actorId == null) return ctx.status(400);

      const key = await signature.getFromId(target["https://w3id.org/security#publicKey"]["@id"]);
      if (key == null) return ctx.status(500);

      try {
        if (!web.verify(key, ctx.req.raw)) {
          return ctx.status(401);
        }
      } catch(e) {
        return ctx.status(401);
      }

      await inbox.pushTo(target["http://www.w3.org/ns/ldp#inbox"]["@id"], [activity])

      return ctx.status(204);
    })
    .get("/users/:name/outbox", async ctx => {
      const actor = await actors.getFromName(ctx.req.param("name"))
      if (actor == null) return ctx.status(404);

      const rawUntilAt = ctx.req.query("until_at")
      const untilAt = rawUntilAt ? new Date(rawUntilAt) : null

      if (untilAt == null) {
        const activities = await outbox.getFromId(actor["https://www.w3.org/ns/activitystreams#outbox"]["@id"], new Date(), 1)

        const rawPublished = activities?.[0]?.["https://www.w3.org/ns/activitystreams#published"]?.["@value"];
        const published = rawPublished ? new Date(rawPublished) : new Date()

        const url = new URL(ctx.req.url)

        return jsonAp(ctx, normalize({
          "type": "Collection",
          "last": new URL(`/users/${encodeURIComponent(ctx.req.param("name"))}/outbox?until_at=${encodeURIComponent(published.toJSON())}`, config.url).toString(),
        }, ChickleDocuments))
      } else {
        const activities = await outbox.getFromId(actor["https://www.w3.org/ns/activitystreams#outbox"]["@id"], untilAt, 50);

        const rawFirstPublished = activities?.at(-1)?.["https://www.w3.org/ns/activitystreams#published"]?.["@value"]
        const firstPublished = rawFirstPublished ? new Date(rawFirstPublished) : null;

        return jsonAp(ctx, normalize({
          "type": "CollectionPage",
          "prev": firstPublished ? new URL(`/users/${encodeURIComponent(ctx.req.param("name"))}/outbox?until_at=${encodeURIComponent(firstPublished.toJSON())}`, config.url).toString() : undefined,
          "totalItems": activities?.length,
          "items": activities
        }, ChickleDocuments))
      }
    })
    .get("/notes/:id", async ctx => {
      const note = await notes.getFromNoteId(ctx.req.param("id"))
      if (note == null) return ctx.status(404);
      
      return jsonAp(ctx, normalize(note, ChickleDocuments))
    })
}
