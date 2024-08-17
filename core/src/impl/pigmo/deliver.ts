import { IDeliverService } from "../../deliver/IDeliverService.js";
import { IActivity } from "../../inbox/IInboxSeervice.js";
import { ISignatureService, SignatureKey } from "../../signatures/ISignatureService.js";
import { IWebService } from "../../web/IWebService.js";
import { IConfigService } from "../../config/IConfigService.js"
import { normalize } from "../../JsonLd.js";

const sleep = (duration: number) => new Promise<void>(resolve => setTimeout(resolve, duration));

export class DeliverService implements IDeliverService {
  private lastTaskPromise: Promise<void> = Promise.resolve();
  
  constructor(
    private config: IConfigService,
    private signature: ISignatureService,
    private web: IWebService
  ) {}

  private pushTask(fn: () => Promise<void>) {
    return this.lastTaskPromise = this.lastTaskPromise.then(fn).then(() => sleep(this.config.deliverInterval));
  }

  async deliverTo(actorId: string, inboxId: string, activities: IActivity[]): Promise<void> {
      const key = await this.signature.getFromOwnerId(actorId);
      if (key == null || key.privateKeyPem == null) return;

      const size = this.config.deliverSize;

      for (let i = 0; i < activities.length; i += size) {
        await this.pushTask(() => this._deliverTo(key, inboxId, activities.slice(i, i + size)))
      }
  }
  
  async _deliverTo(key: SignatureKey, inboxId: string, activities: IActivity[]): Promise<void> {
    if (key.privateKeyPem == null) return;

    for (const activity of activities) {
      const normalized =normalize(activity, this.config.documents);
      await this.web.requestSigned(key, inboxId, {
        method: "POST",
        headers: {
          "Content-Type": "application/activity+json"
        },
        body: JSON.stringify(normalized)
      })
    }
  }
}

