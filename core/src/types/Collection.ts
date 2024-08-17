import { LDContext, Schema, createValidator } from "../JsonLd.js";
import { AsCollection, AsCollectionPage, LdActivityStreams } from "../ld/ActivityStreams.js";
import { LdW3idSecurity } from "../ld/w3id.js";

export async function fetchCollection<T extends object>(url: string, schema: Schema<T>, _documents: Record<string,LDContext> = {}, fetch = globalThis.fetch) {
  const documents = {
    "https://www.w3.org/ns/activitystreams": LdActivityStreams,
    "https://www.w3id.org/security": LdW3idSecurity,
    ..._documents
  }  
  
  const $collection = createValidator(AsCollection(schema), documents)
  
  let status = $collection((await fetch(url)).json())
  if (status == null) return null;

  return status.value
}

export async function fetchCollectionPage<T extends object>(url: string, schema: Schema<T>, _documents: Record<string, LDContext> = {}, fetch = globalThis.fetch) {
  const documents = {
    "https://www.w3.org/ns/activitystreams": LdActivityStreams,
    "https://www.w3id.org/security": LdW3idSecurity,
    ..._documents
  }  
  
  const $collectionPage = createValidator(AsCollectionPage(schema), documents)
  
  let status = $collectionPage((await fetch(url)).json())
  if (status == null) return null;

  return status.value
}

export async function createCollectionReader<T extends object>(url: string, schema: Schema<T>, documents: Record<string, LDContext> = {}, fetch = globalThis.fetch) {
  const collection = await fetchCollection(url, schema, documents, fetch);
  if (collection == null) return null;

  const items: ({ "@id": string } | T)[] = collection["https://www.w3.org/ns/activitystreams#items"] ?? [];

  async function* reader(page?: AsCollectionPage<T>, items: ({ "@id": string } | T)[] = []): AsyncGenerator<({ "@id": string } | T)[]> {
    yield items;

    if (page == null) return;

    const pageItems: ({ "@id": string } | T)[] = page["https://www.w3.org/ns/activitystreams#items"] ?? [];

    yield pageItems;

    if (page["https://www.w3.org/ns/activitystreams#next"]) {
      const nextPageOrId = page["https://www.w3.org/ns/activitystreams#next"]
      const nextPage = "@type" in nextPageOrId ? nextPageOrId : await fetchCollectionPage(nextPageOrId["@id"], schema, documents, fetch)
      if (nextPage == null) return;
      
      yield* reader(nextPage)
    }
  }

  const nextPageOrId = collection["https://www.w3.org/ns/activitystreams#last"]
  const nextPage = nextPageOrId && ("@type" in nextPageOrId ? nextPageOrId : await fetchCollectionPage(nextPageOrId["@id"], schema, documents, fetch))

  return reader(nextPage ?? undefined, items)
}

