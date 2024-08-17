import { AsActivity } from "../ld/ActivityStreams.js";
import { EventListener } from "../types/Event.js";

export interface IActivity extends AsActivity {}

export interface PushEvent extends CustomEvent {
  detail: {
    to: string;
    activities: IActivity[];
  }
}

export interface IInboxService extends EventTarget {
  getFromId(id: string, untilAt: Date, amount: number): Promise<IActivity[] | null>;
  pushTo(id: string, objects: IActivity[]): Promise<void>;
  create(id: string, ownerId: string): Promise<void>;
  delete(id: string, ownerId: string): Promise<void>;

  dispatchEvent(evt: PushEvent): boolean;

  addEventListener(event: "push", callback: EventListener<PushEvent> | null): void;
}
