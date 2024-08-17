import { $string, $undefined, $const, $number, $numberRange, $null } from "lizod";
import { $array, $guard, $union, $object, $schema, JsonLd, SchemaKind, Schema, GetFromIRI, ResolveIRI, $ref, ObjectSchema, CollectIRI, $extends, StringToIdObj } from "../JsonLd.js"
import { LangString } from "./Rdf.js"
import { LdW3idSecurity, W3idKey } from "./w3id.js";
import { Assign } from "../types/Assign.js";

export type NsActivityStreams = "https://www.w3.org/ns/activitystreams#";
export const NsActivityStreams = "https://www.w3.org/ns/activitystreams#" as const;

export type LdActivityStreams = typeof LdActivityStreams
export const LdActivityStreams = {
  "@vocab": "_:",
  "xsd": "http://www.w3.org/2001/XMLSchema#",
  "as": "https://www.w3.org/ns/activitystreams#",
  "ldp": "http://www.w3.org/ns/ldp#",
  "vcard": "http://www.w3.org/2006/vcard/ns#",
  "id": "@id",
  "type": "@type",
  "Accept": "as:Accept",
  "Activity": "as:Activity",
  "IntransitiveActivity": "as:IntransitiveActivity",
  "Add": "as:Add",
  "Announce": "as:Announce",
  "Application": "as:Application",
  "Arrive": "as:Arrive",
  "Article": "as:Article",
  "Audio": "as:Audio",
  "Block": "as:Block",
  "Collection": "as:Collection",
  "CollectionPage": "as:CollectionPage",
  "Relationship": "as:Relationship",
  "Create": "as:Create",
  "Delete": "as:Delete",
  "Dislike": "as:Dislike",
  "Document": "as:Document",
  "Event": "as:Event",
  "Follow": "as:Follow",
  "Flag": "as:Flag",
  "Group": "as:Group",
  "Ignore": "as:Ignore",
  "Image": "as:Image",
  "Invite": "as:Invite",
  "Join": "as:Join",
  "Leave": "as:Leave",
  "Like": "as:Like",
  "Link": "as:Link",
  "Mention": "as:Mention",
  "Note": "as:Note",
  "Object": "as:Object",
  "Offer": "as:Offer",
  "OrderedCollection": "as:OrderedCollection",
  "OrderedCollectionPage": "as:OrderedCollectionPage",
  "Organization": "as:Organization",
  "Page": "as:Page",
  "Person": "as:Person",
  "Place": "as:Place",
  "Profile": "as:Profile",
  "Question": "as:Question",
  "Reject": "as:Reject",
  "Remove": "as:Remove",
  "Service": "as:Service",
  "TentativeAccept": "as:TentativeAccept",
  "TentativeReject": "as:TentativeReject",
  "Tombstone": "as:Tombstone",
  "Undo": "as:Undo",
  "Update": "as:Update",
  "Video": "as:Video",
  "View": "as:View",
  "Listen": "as:Listen",
  "Read": "as:Read",
  "Move": "as:Move",
  "Travel": "as:Travel",
  "IsFollowing": "as:IsFollowing",
  "IsFollowedBy": "as:IsFollowedBy",
  "IsContact": "as:IsContact",
  "IsMember": "as:IsMember",
  "subject": {
    "@id": "as:subject",
    "@type": "@id"
  },
  "relationship": {
    "@id": "as:relationship",
    "@type": "@id"
  },
  "actor": {
    "@id": "as:actor",
    "@type": "@id"
  },
  "attributedTo": {
    "@id": "as:attributedTo",
    "@type": "@id"
  },
  "attachment": {
    "@id": "as:attachment",
    "@type": "@id"
  },
  "bcc": {
    "@id": "as:bcc",
    "@type": "@id"
  },
  "bto": {
    "@id": "as:bto",
    "@type": "@id"
  },
  "cc": {
    "@id": "as:cc",
    "@type": "@id"
  },
  "context": {
    "@id": "as:context",
    "@type": "@id"
  },
  "current": {
    "@id": "as:current",
    "@type": "@id"
  },
  "first": {
    "@id": "as:first",
    "@type": "@id"
  },
  "generator": {
    "@id": "as:generator",
    "@type": "@id"
  },
  "icon": {
    "@id": "as:icon",
    "@type": "@id"
  },
  "image": {
    "@id": "as:image",
    "@type": "@id"
  },
  "inReplyTo": {
    "@id": "as:inReplyTo",
    "@type": "@id"
  },
  "items": {
    "@id": "as:items",
    "@type": "@id"
  },
  "instrument": {
    "@id": "as:instrument",
    "@type": "@id"
  },
  "orderedItems": {
    "@id": "as:items",
    "@type": "@id",
    "@container": "@list"
  },
  "last": {
    "@id": "as:last",
    "@type": "@id"
  },
  "location": {
    "@id": "as:location",
    "@type": "@id"
  },
  "next": {
    "@id": "as:next",
    "@type": "@id"
  },
  "object": {
    "@id": "as:object",
    "@type": "@id"
  },
  "oneOf": {
    "@id": "as:oneOf",
    "@type": "@id"
  },
  "anyOf": {
    "@id": "as:anyOf",
    "@type": "@id"
  },
  "closed": {
    "@id": "as:closed",
    "@type": "xsd:dateTime"
  },
  "origin": {
    "@id": "as:origin",
    "@type": "@id"
  },
  "accuracy": {
    "@id": "as:accuracy",
    "@type": "xsd:float"
  },
  "prev": {
    "@id": "as:prev",
    "@type": "@id"
  },
  "preview": {
    "@id": "as:preview",
    "@type": "@id"
  },
  "replies": {
    "@id": "as:replies",
    "@type": "@id"
  },
  "result": {
    "@id": "as:result",
    "@type": "@id"
  },
  "audience": {
    "@id": "as:audience",
    "@type": "@id"
  },
  "partOf": {
    "@id": "as:partOf",
    "@type": "@id"
  },
  "tag": {
    "@id": "as:tag",
    "@type": "@id"
  },
  "target": {
    "@id": "as:target",
    "@type": "@id"
  },
  "to": {
    "@id": "as:to",
    "@type": "@id"
  },
  "url": {
    "@id": "as:url",
    "@type": "@id"
  },
  "altitude": {
    "@id": "as:altitude",
    "@type": "xsd:float"
  },
  "content": "as:content",
  "contentMap": {
    "@id": "as:content",
    "@container": "@language"
  },
  "name": "as:name",
  "nameMap": {
    "@id": "as:name",
    "@container": "@language"
  },
  "duration": {
    "@id": "as:duration",
    "@type": "xsd:duration"
  },
  "endTime": {
    "@id": "as:endTime",
    "@type": "xsd:dateTime"
  },
  "height": {
    "@id": "as:height",
    "@type": "xsd:nonNegativeInteger"
  },
  "href": {
    "@id": "as:href",
    "@type": "@id"
  },
  "hreflang": "as:hreflang",
  "latitude": {
    "@id": "as:latitude",
    "@type": "xsd:float"
  },
  "longitude": {
    "@id": "as:longitude",
    "@type": "xsd:float"
  },
  "mediaType": "as:mediaType",
  "published": {
    "@id": "as:published",
    "@type": "xsd:dateTime"
  },
  "radius": {
    "@id": "as:radius",
    "@type": "xsd:float"
  },
  "rel": "as:rel",
  "startIndex": {
    "@id": "as:startIndex",
    "@type": "xsd:nonNegativeInteger"
  },
  "startTime": {
    "@id": "as:startTime",
    "@type": "xsd:dateTime"
  },
  "summary": "as:summary",
  "summaryMap": {
    "@id": "as:summary",
    "@container": "@language"
  },
  "totalItems": {
    "@id": "as:totalItems",
    "@type": "xsd:nonNegativeInteger"
  },
  "units": "as:units",
  "updated": {
    "@id": "as:updated",
    "@type": "xsd:dateTime"
  },
  "width": {
    "@id": "as:width",
    "@type": "xsd:nonNegativeInteger"
  },
  "describes": {
    "@id": "as:describes",
    "@type": "@id"
  },
  "formerType": {
    "@id": "as:formerType",
    "@type": "@id"
  },
  "deleted": {
    "@id": "as:deleted",
    "@type": "xsd:dateTime"
  },
  "inbox": {
    "@id": "ldp:inbox",
    "@type": "@id"
  },
  "outbox": {
    "@id": "as:outbox",
    "@type": "@id"
  },
  "following": {
    "@id": "as:following",
    "@type": "@id"
  },
  "followers": {
    "@id": "as:followers",
    "@type": "@id"
  },
  "streams": {
    "@id": "as:streams",
    "@type": "@id"
  },
  "preferredUsername": "as:preferredUsername",
  "endpoints": {
    "@id": "as:endpoints",
    "@type": "@id"
  },
  "uploadMedia": {
    "@id": "as:uploadMedia",
    "@type": "@id"
  },
  "proxyUrl": {
    "@id": "as:proxyUrl",
    "@type": "@id"
  },
  "liked": {
    "@id": "as:liked",
    "@type": "@id"
  },
  "oauthAuthorizationEndpoint": {
    "@id": "as:oauthAuthorizationEndpoint",
    "@type": "@id"
  },
  "oauthTokenEndpoint": {
    "@id": "as:oauthTokenEndpoint",
    "@type": "@id"
  },
  "provideClientKey": {
    "@id": "as:provideClientKey",
    "@type": "@id"
  },
  "signClientKey": {
    "@id": "as:signClientKey",
    "@type": "@id"
  },
  "sharedInbox": {
    "@id": "as:sharedInbox",
    "@type": "@id"
  },
  "Public": {
    "@id": "as:Public",
    "@type": "@id"
  },
  "source": "as:source",
  "likes": {
    "@id": "as:likes",
    "@type": "@id"
  },
  "shares": {
    "@id": "as:shares",
    "@type": "@id"
  },
  "alsoKnownAs": {
    "@id": "as:alsoKnownAs",
    "@type": "@id",
  }
} as const;

const $more = <T>(schema: Schema<T>) => $union([$array(schema), schema])
const $opt = <T>(schema: Schema<T>): Schema<T | undefined | null> => $union([$guard($undefined), $guard($null), schema])

export type AsObject = JsonLd<{
  "@context": [LdActivityStreams, LdW3idSecurity]
  "@type": string
  "@id"?: string | null
  "attachment"?: string | AsObject | (string | AsObject)[] | null
  "attributedTo"?: string | AsObject | (string | AsObject)[] | null
  "audience"?: string | AsObject | (string | AsObject)[] | null
  "name"?: string | LangString | (string | LangString)[] | null
  "preferredUsername"?: string | LangString | (string | LangString)[] | null
  "content"?: string | LangString | (string | LangString)[] | null
  "inReplyTo"?: string | AsObject | (string | AsObject)[] | null
  "published"?: string | null
  "summary"?: string | LangString | (string | LangString)[] | null
  "updated"?: string | null
  url?: string | string[] | null
  to?: string | AsObject | (string | AsObject)[] | null
  cc?: string | AsObject | (string | AsObject)[] | null
  "publicKey"?: W3idKey | null
  "inbox"?: string | null
  "outbox"?: string | null
}>

export const AsObjectRef: Schema<AsObject> = $ref<AsObject>(() => AsObject)

export const AsObjectOrLink = $ref(() =>
  $opt($more($union([AsObjectRef, $object({
    "@id": $guard($string)
  })])))
)

export const AsObject: ObjectSchema<AsObject> = $object<AsObject>({
  "@id": $opt($guard($string)),
  "@type": $guard($string),
  "https://www.w3.org/ns/activitystreams#attachment": AsObjectOrLink,
  "https://www.w3.org/ns/activitystreams#attributedTo": AsObjectOrLink,
  "https://www.w3.org/ns/activitystreams#audience": AsObjectOrLink,
  "https://www.w3.org/ns/activitystreams#name": $opt($more($union([
    $guard($string),
    LangString
  ]))),
  "https://www.w3.org/ns/activitystreams#preferredUsername": $opt($more($union([
    $guard($string),
    LangString
  ]))),
  "https://www.w3.org/ns/activitystreams#content": $opt($more($union([
    $guard($string),
    LangString
  ]))),
  "https://www.w3.org/ns/activitystreams#inReplyTo": AsObjectOrLink,
  "https://www.w3.org/ns/activitystreams#published": $opt($object({
    "@type": $guard($const("http://www.w3.org/2001/XMLSchema#dateTime")),
    "@value": $guard($string)
  })),
  "https://www.w3.org/ns/activitystreams#summary": $opt($more($union([
    $guard($string),
    LangString
  ]))),
  "https://www.w3.org/ns/activitystreams#updated": $opt($object({
    "@type": $guard($const("http://www.w3.org/2001/XMLSchema#dateTime")),
    "@value": $guard($string)
  })),
  "https://www.w3.org/ns/activitystreams#url": $opt($more($object({
    "@id": $guard($string),
  }))),
  "https://w3id.org/security#publicKey": $union([$guard($undefined), W3idKey]),
  "https://www.w3.org/ns/activitystreams#to": AsObjectOrLink,
  "https://www.w3.org/ns/activitystreams#cc": AsObjectOrLink,
  "http://www.w3.org/ns/ldp#inbox": $opt($object({
    "@id": $guard($string)
  })),
  "https://www.w3.org/ns/activitystreams#outbox": $opt($object({
    "@id": $guard($string)
  }))
})

export type AsActivity = Assign<AsObject, JsonLd<{
  "@context": LdActivityStreams;
  actor?: string | AsObject | (string | AsObject)[] | null;
  object?: string | AsObject | (string | AsObject)[] | null;
  target?: string | AsObject | (string | AsObject)[] | null;
  result?: string | AsObject | (string | AsObject)[] | null;
  origin?: string | AsObject | (string | AsObject)[] | null;
  instrument?: string | AsObject | (string | AsObject)[] | null;
}>>

export const AsActivity = $extends(AsObject, $object({
  "https://www.w3.org/ns/activitystreams#actor": AsObjectOrLink,
  "https://www.w3.org/ns/activitystreams#object": AsObjectOrLink,
  "https://www.w3.org/ns/activitystreams#target": AsObjectOrLink,
  "https://www.w3.org/ns/activitystreams#result": AsObjectOrLink,
  "https://www.w3.org/ns/activitystreams#origin": AsObjectOrLink,
  "https://www.w3.org/ns/activitystreams#instrument": AsObjectOrLink,
}))

export type AsCollection<T extends object> = JsonLd<{
  "@context": LdActivityStreams
  "@id"?: string | null;
  "@type": "Collection";
  "current"?: string | AsCollectionPage<T> | null;
  "first"?: string | AsCollectionPage<T> | null;
  "last"?: string | AsCollectionPage<T> | null;
  "totalItems"?: number | null;
  "items"?: T[] | null;
}>

export function AsCollection<T extends object>(schema: Schema<T>, AsCollectionPageRef = $ref<AsCollectionPage<T>>(() => AsCollectionPage(schema))): ObjectSchema<AsCollection<T>> {
  const AsCollectionPageOrLink: Schema<{ "@id": string; } | AsCollectionPage<T>> = $union([$object({ "@id": $guard($string) }), AsCollectionPageRef])

  return $object<AsCollection<T>>({
    "@id": $opt($guard($string)),
    "@type": $guard($const("https://www.w3.org/ns/activitystreams#Collection")),
    "https://www.w3.org/ns/activitystreams#current": AsCollectionPageOrLink,
    "https://www.w3.org/ns/activitystreams#first": AsCollectionPageOrLink,
    "https://www.w3.org/ns/activitystreams#last": AsCollectionPageOrLink,
    "https://www.w3.org/ns/activitystreams#totalItems": $opt($object({
      "@type": $guard($const("http://www.w3.org/2001/XMLSchema#nonNegativeInteger")),
      "@value": $guard($numberRange(0, undefined)),
    })),
    "https://www.w3.org/ns/activitystreams#items": $opt($array($union([schema, $object({
      "@id": $guard($string)
    })]))) as Schema<(StringToIdObj<T, LdActivityStreams>)[] | undefined>
  })
}

export type AsCollectionPage<T extends object> = Assign<AsCollection<T>, JsonLd<{
  "@context": LdActivityStreams;
  "@type": "CollectionPage";
  "partOf"?: string | AsCollection<T>;
  "next"?: string | AsCollectionPage<T>;
  "prev"?: string | AsCollectionPage<T>;
}>>

export function AsCollectionPage<T extends object>(schema: Schema<T>): Schema<AsCollectionPage<T>> {
  const AsCollectionRef: Schema<AsCollection<T>> = AsCollection(schema);
  const AsCollectionPageRef: Schema<AsCollectionPage<T>> = $ref<AsCollectionPage<T>>(() => AsCollectionPage);
  const AsCollectionOrLink: Schema<{ "@id": string } | AsCollection<T>> = $union([$object({ "@id": $guard($string) }), AsCollectionRef])
  const AsCollectionPageOrLink: Schema<{ "@id": string } | AsCollectionPage<T>> = $union([$object({ "@id": $guard($string) }), AsCollectionPageRef])

  const AsCollectionPage: Schema<AsCollectionPage<T>> = $extends(AsCollectionRef, $object({
    "@type": $guard($const("https://www.w3.org/ns/activitystreams#CollectionPage")),
    "https://www.w3.org/ns/activitystreams#partOf": AsCollectionOrLink,
    "https://www.w3.org/ns/activitystreams#next": AsCollectionPageOrLink,
    "https://www.w3.org/ns/activitystreams#prev": AsCollectionPageOrLink,
  }))

  return AsCollectionPage
}
