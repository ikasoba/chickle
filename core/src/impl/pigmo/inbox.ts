import { PigmoCollection } from "@ikasoba000/pigmo/PigmoCollection";
import { IActivity, IInboxService, PushEvent } from "../../inbox/IInboxSeervice.js";
import { QueryFn } from "../pigmo/helper.js";
import { INote, INoteService } from "../../notes/INoteService.js";
import { AsNote } from "./notes.js";
import { IConfigService } from "../../config/IConfigService.js";
import { AsActivity as AsActivityBase, NsActivityStreams } from "../../ld/ActivityStreams.js";
import { $extends, $guard, $object, Schema, Validator, createValidator } from "../../JsonLd.js";
import { $const, $string } from "lizod";
import { $filter, $insert } from "@ikasoba000/pigmo/PigmoQuery";
import { EventListener } from "../../types/Event.js";

export const AsActivity: Schema<IActivity> = AsActivityBase

export interface InboxItem {
  id: string;
  activity: IActivity;
  publishedAt: number;
}

export class InboxService extends EventTarget implements IInboxService {
  private $AsNote: Validator<INote>;

  constructor(
    private config: IConfigService,
    private notes: INoteService,
    private db: PigmoCollection<InboxItem>
  ) {
    super();
  
    this.$AsNote = createValidator(AsNote, this.config.documents)
  }
  
  dispatchEvent(evt: PushEvent): boolean {
    return super.dispatchEvent(evt);
  }
  
  addEventListener(event: "push", callback: EventListener<PushEvent> | null): void;
  addEventListener(event: string, callback: EventListenerOrEventListenerObject | null): void {
    return super.addEventListener(event, callback)
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
        max: amount
      })
    )).map(x => x.activity) ?? null;
  }

  async pushTo(id: string, objects: IActivity[]): Promise<void> {
    for (const activity of objects) {
      const actor = activity["https://www.w3.org/ns/activitystreams#actor"]
      const actorId = typeof actor == "object" && actor && "@id" in actor && typeof actor["@id"] == "string" ? actor?.["@id"] : null;
      if (actorId == null || actorId != id) continue;

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

      if (!isPublic && audiences.length && !audiences.includes(id)) continue;

      const object = activity["https://www.w3.org/ns/activitystreams#object"]
      const status = this.$AsNote(object)
      if (status == null) continue;

      const note = status.value;

      const attributedTo = note["https://www.w3.org/ns/activitystreams#attributedTo"]

      const authorId = typeof attributedTo == "object" && "@id" in attributedTo && typeof attributedTo["@id"] == "string" && URL.canParse(attributedTo["@id"]) ? attributedTo["@id"] : null;
      if (authorId == null) continue;

      if (actorId != authorId) continue;

      if (activity["@type"] == `${NsActivityStreams}Create`) {
        await this.notes.create(note);
      } else if (activity["@type"] == `${NsActivityStreams}Delete`) {
        await this.notes.delete(note["@id"]);
      }
    }

    await this.db.exec(
      $insert({
        values: objects.map(activity => ({
          id,
          activity,
          publishedAt: new Date(activity["https://www.w3.org/ns/activitystreams#published"]?.["@value"] ?? Date.now()).getTime()
        }))
      })
    );

    this.dispatchEvent(new CustomEvent("push", {
      detail: {
        to: id,
        activities:objects
      }
    }))
  }  
}
