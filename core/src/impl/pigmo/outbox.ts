import { IConfigService } from "../../config/IConfigService.js";
import { IOutboxService } from "../../outbox/IOutboxService.js";
import { IActivity } from "../../inbox/IInboxSeervice.js";
import { QueryFn } from "./helper.js";
import { NsActivityStreams } from "../../ld/ActivityStreams.js";
import { Validator, createValidator } from "../../JsonLd.js";
import { INote, INoteService } from "../../notes/INoteService.js";
import { AsNote } from "./notes.js";
import { Fetch, IWebService, createFetch } from "../../web/IWebService.js";
import { IActorService } from "../../actors/IActorService.js";
import { IDeliverService } from "../../deliver/IDeliverService.js";
import { createCollectionReader } from "../../types/Collection.js";
import { AsActivity } from "./inbox.js";
import { PigmoCollection } from "@ikasoba000/pigmo/PigmoCollection";
import { $filter, $insert } from "@ikasoba000/pigmo/PigmoQuery";
import { ISignatureService } from "../../signatures/ISignatureService.js";

export interface OutboxItem {
  id: string;
  activity: IActivity;
  publishedAt: number;
}

export class OutboxService implements IOutboxService {
  private $AsNote: Validator<INote>;

  constructor(
    private config: IConfigService,
    private notes: INoteService,
    private actors: IActorService,
    private deliver: IDeliverService,
    private signature: ISignatureService,
    private db: PigmoCollection<OutboxItem>
  ) {
    this.$AsNote = createValidator(AsNote, this.config.documents)
  }

  async create(id: string, ownerId: string): Promise<void> { }
  async delete(id: string, ownerId: string): Promise<void> { }

  async getFromId(id: string, untilAt: Date, amount: number): Promise<IActivity[] | null> {
    return (await this.db.exec(
      $filter({
        where: {
          id: {
            $eq: id
          },
          publishedAt: {
            $lte: untilAt.getTime()
          }
        },
        sortBy: {
          publishedAt: "DESC"
        },
        max: amount
      })
    )).map(x => x.activity)
  }

  async pushTo(id: string, objects: IActivity[]): Promise<void> {
    const publicObjects: IActivity[] = [];

    const delivers = new Map<string, IActivity[]>();

    for (const activity of objects) {
      const actor = activity["https://www.w3.org/ns/activitystreams#actor"]
      const actorId = typeof actor == "object" && actor && "@id" in actor && typeof actor["@id"] == "string" ? actor?.["@id"] : null;
      if (actorId == null || actorId != id) continue;

      const object = activity["https://www.w3.org/ns/activitystreams#object"];

      const to = activity["https://www.w3.org/ns/activitystreams#to"]
      const cc = activity["https://www.w3.org/ns/activitystreams#cc"]

      const isPublic =
        (typeof to == "object" && to && "@id" in to && to["@id"] == `${NsActivityStreams}Public`)
        || (Array.isArray(to) && to.some(to => typeof to == "object" && to && "id" in to && to["@id"] == "https://www.w3.org/ns/activitystreams#Public"))

      const audiences =
        (typeof to == "object" && to && "@id" in to && typeof to["@id"] == "string" && to["@id"] != `${NsActivityStreams}Public`
          ? [to["@id"]]
          : [])
          .concat(
            ...(Array.isArray(cc) ? cc : [cc]).flatMap(cc =>
              typeof cc == "object" && cc && "@id" in cc && typeof cc["@id"] == "string" && cc["@id"] != `${NsActivityStreams}Public`
                ? [cc["@id"]]
                : []
            )
          )

      for (const id of new Set(audiences)) {
        delivers.set(id, (delivers.get(id) ?? []).concat(activity))
      }

      if (isPublic) {
        publicObjects.push(activity);
      }

      if (activity["@type"] == `${NsActivityStreams}Create`) {
        if (typeof object == "object" && object && "@type" in object && object["@type"] == `${NsActivityStreams}Note`) {
          const status = this.$AsNote(object);
          if (status == null) continue;
          const note = status.value;

          const attributedTo = note["https://www.w3.org/ns/activitystreams#attributedTo"]
          const authorId = typeof attributedTo == "object" && "@id" in attributedTo && typeof attributedTo["@id"] == "string" && URL.canParse(attributedTo["@id"]) ? attributedTo["@id"] : null;
          if (authorId == null) continue;

          if (actorId != authorId) continue;

          await this.notes.create(note);
        }
      }
    }

    await this.db.exec(
      $insert({
        values: publicObjects.map(x => ({
          id,
          activity: x,
          publishedAt: new Date(x["https://www.w3.org/ns/activitystreams#published"]?.["@value"] ?? Date.now()).getTime()
        }))
      })
    )


    for (const [targetId, activities] of delivers) {
      const k = await this.signature.getFromOwnerId(targetId);
      const actor = await this.actors.getFromId(targetId) ?? await this.actors.fetch(k, targetId);
      if (actor == null) continue;

      await this.deliver.deliverTo(id, actor["http://www.w3.org/ns/ldp#inbox"]["@id"], activities);
    }
  }
}
