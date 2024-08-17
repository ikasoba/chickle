import { PigmoCollection } from "@ikasoba000/pigmo/PigmoCollection";
import { INote, INoteService } from "../../notes/INoteService.js";
import { QueryFn } from "./helper.js";
import { escapeRegexp } from "../utils.js";
import { IConfigService } from "../../config/IConfigService.js";
import { $extends, $guard, $object, $union, Schema, createValidator } from "../../JsonLd.js";
import { AsObject } from "../../ld/ActivityStreams.js";
import { $const, $string } from "lizod";
import { LangString } from "../../ld/Rdf.js";
import { IWebService } from "../../web/IWebService.js";
import { $filter, $insert, $remove, $upsert } from "@ikasoba000/pigmo/PigmoQuery";

export const AsNote: Schema<INote> = $extends(AsObject, $object({
  "@id": $guard($string),
  "@type": $guard($const("https://www.w3.org/ns/activitystreams#Note")),
  "https://www.w3.org/ns/activitystreams#attributedTo": $union([$guard($string), AsObject]),
  "https://www.w3.org/ns/activitystreams#content":$union([$guard($string), LangString]),
  "https://www.w3.org/ns/activitystreams#published":$object({
    "@type": $guard($const("https://www.w3.org/2001/XMLSchema#dataTime")),
    "@value": $guard($string)
  })
}))

export class NoteService implements INoteService {
  private $INote;
  
  constructor(
    private config: IConfigService,
    private web: IWebService,
    private db: PigmoCollection<INote>
  ) {
    this.$INote = createValidator(AsNote, this.config.documents);
  }

  async create(note: INote): Promise<INote> {
      return (await this.db.exec(
        $insert({
          values: [ note ]
        })
      ))[0]
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

  async getFromId(id: string): Promise<INote | null> {
    return (await this.db.exec(
      $filter({
        where: {
          "@id": {
            $eq: id
          },
        },
        max: 1
      }))
    )[0] ?? null
  }

  async getFromNoteId(noteId: string): Promise<INote | null> {
    return (await this.db.exec(
      $filter({
        where: {
          "@id": {
            $eq: new URL(`/notes/${noteId}`, this.config.url).toString()
          }
        }
      })
    ))[0] ?? null
  }

  async fetch(id: string): Promise<INote | null> {
      const res = await this.web.request(id, {});
      const status = this.$INote(await res.json())
      if (status?.value == null) return null;

    return (await this.db.exec(
      $upsert({
        values: [ status.value ]
      })
    ))[0] ?? null
  }
}


