import { SignatureKey } from "../signatures/ISignatureService.js"

export type Fetch = typeof globalThis.fetch;

export const createFetch = (web: IWebService): Fetch => {
  function fetch(urlOrReq: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const req = new Request(urlOrReq, init);
    
    return web.request(req.url, req);
  }

  return fetch;
}

export interface IWebService {
  request(url: string, req?: RequestInit): Promise<Response>;
  requestSigned(key: SignatureKey, url: string, req?: RequestInit): Promise<Response | null>;
  verify(key: SignatureKey, req: Request): Promise<boolean>;
}
