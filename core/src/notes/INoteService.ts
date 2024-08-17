import { AsObject, NsActivityStreams } from "../ld/ActivityStreams.js";
import { LangString } from "../ld/Rdf.js";
import { Assign } from "../types/Assign.js";

export type INote = Assign<AsObject, {
  "@id": string;
  "@type": `${NsActivityStreams}Note`;
  "https://www.w3.org/ns/activitystreams#attributedTo": string | AsObject;
  "https://www.w3.org/ns/activitystreams#content": string | LangString;
  "https://www.w3.org/ns/activitystreams#published": {
    "@type": "https://www.w3.org/2001/XMLSchema#dataTime";
    "@value": string;
  }
}>

export interface INoteService {
  fetch(id: string): Promise<INote | null>;
  getFromId(id: string): Promise<INote | null>;
  getFromNoteId(noteId: string): Promise<INote | null>;
  create(note: INote): Promise<INote>;
  delete(id: string): Promise<void>;
}
