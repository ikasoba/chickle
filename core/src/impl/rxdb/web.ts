import { ISignatureService, SignatureKey } from "../../signatures/ISignatureService.js";
import { Fetch, IWebService } from "../../web/IWebService.js";
import { RequestLike, genDigestHeaderBothRFC3230AndRFC9530, parseRequestSignature, signAsDraftToRequest, verifyDraftSignature  } from "@misskey-dev/node-http-message-signatures";

export class WebService implements IWebService {
  constructor(private signature: ISignatureService, private fetch: Fetch) {}
  
  request(url: string, req?: RequestInit | undefined): Promise<Response> {
      return this.fetch(url, req);
  }

  async requestSigned(key: SignatureKey, url: string, req?: RequestInit | undefined): Promise<Response | null> {
    if (key.privateKeyPem == null) return null;
    
    const u = new URL(url);

    const headers = new Map<string, string[] | string>();

    const rawHeaders = new Headers(req?.headers)

    if (!rawHeaders.has("Date")) {
      rawHeaders.set("Date", new Date().toUTCString())
    }
    
    if (!rawHeaders.has("Host")) {
      rawHeaders.set("Host", u.host)
    }
    
    if (!rawHeaders.has("Accept")) {
      rawHeaders.set("Accept", "*/*")
    }

    const allowedHeaders = [
      "date",
      "host",
      "digest",
    ]
    
    for (const [name, value] of rawHeaders) {
        const prev = headers.get(name);
      
      if (prev != null) {
        headers.set(name.toLowerCase(), Array.isArray(prev) ? prev.concat(value) : [prev, value])
      } else {
        headers.set(name.toLowerCase(), value);
      }
    }

    const r = new Request(url, req);

    const body = r.method == "GET" || r.method == "HEAD" ? undefined : new Uint8Array(await r.arrayBuffer());

    const request: RequestLike = {
      url: u.href,
      method: r.method,
      headers: Object.fromEntries(headers),
    }

    if (body != undefined) {
      await genDigestHeaderBothRFC3230AndRFC9530(request, body, "SHA-256");
    }

    request.headers = Object.fromEntries(Object.entries(request.headers).map(([k, v]) => [k.toLowerCase(), v] as const))
    
    const { signingString, signatureHeader } = await signAsDraftToRequest(request, {
      keyId: key.id,
      privateKeyPem: key.privateKeyPem
    }, ["(request-target)", ...allowedHeaders]);

    for (const k in request.headers ?? {}) {
      request.headers[k] = "" + request.headers[k]
    }

    return this.fetch(u, {
      method: request.method,
      headers: request.headers as Record<string, string>,
      body: body
    })
  }

  async verify(k: SignatureKey | null, req: Request) {
    const parsed = parseRequestSignature(req)
    if (Array.isArray(parsed.value)) return false;
    
    const key = await this.signature.getFromId(parsed.value.keyId) ?? await this.signature.fetch(k, parsed.value.keyId)
    if (key == null) return false;
    
    return await verifyDraftSignature(parsed.value, key.publicKeyPem, console.error);
  }
}

