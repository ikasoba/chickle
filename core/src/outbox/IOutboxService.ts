import { IActivity } from "../inbox/IInboxSeervice.js";

export interface IOutboxService {
  getFromId(id: string, untilAt: Date, amount: number): Promise<IActivity[] | null>;
  pushTo(id: string, objects: IActivity[]): Promise<void>;
  create(id: string, ownerId: string): Promise<void>;
  delete(id: string, ownerId: string): Promise<void>;
}
