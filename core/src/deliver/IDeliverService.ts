import { IActivity } from "../inbox/IInboxSeervice.js";

export interface IDeliverService {
  deliverTo(actorId: string, inboxId: string, ctivities: IActivity[]): Promise<void>;
}
