
// source: https://w3c-ccg.github.io/security-vocab/contexts/security-v1.jsonld

import { $const, $string, $undefined } from "lizod";
import { $guard, $object, $union, JsonLd } from "../JsonLd.js";

export type LdW3idSecurity = typeof LdW3idSecurity;

export const LdW3idSecurity = {
  "id": "@id",
  "type": "@type",

  "dc": "http://purl.org/dc/terms/",
  "sec": "https://w3id.org/security#",
  "xsd": "http://www.w3.org/2001/XMLSchema#",

  "EcdsaKoblitzSignature2016": "sec:EcdsaKoblitzSignature2016",
  "Ed25519Signature2018": "sec:Ed25519Signature2018",
  "EncryptedMessage": "sec:EncryptedMessage",
  "GraphSignature2012": "sec:GraphSignature2012",
  "LinkedDataSignature2015": "sec:LinkedDataSignature2015",
  "LinkedDataSignature2016": "sec:LinkedDataSignature2016",
  "CryptographicKey": "sec:Key",

  "authenticationTag": "sec:authenticationTag",
  "canonicalizationAlgorithm": "sec:canonicalizationAlgorithm",
  "cipherAlgorithm": "sec:cipherAlgorithm",
  "cipherData": "sec:cipherData",
  "cipherKey": "sec:cipherKey",
  "created": { "@id": "dc:created", "@type": "xsd:dateTime" },
  "creator": { "@id": "dc:creator", "@type": "@id" },
  "digestAlgorithm": "sec:digestAlgorithm",
  "digestValue": "sec:digestValue",
  "domain": "sec:domain",
  "encryptionKey": "sec:encryptionKey",
  "expiration": { "@id": "sec:expiration", "@type": "xsd:dateTime" },
  "expires": { "@id": "sec:expiration", "@type": "xsd:dateTime" },
  "initializationVector": "sec:initializationVector",
  "iterationCount": "sec:iterationCount",
  "nonce": "sec:nonce",
  "normalizationAlgorithm": "sec:normalizationAlgorithm",
  "owner": { "@id": "sec:owner", "@type": "@id" },
  "password": "sec:password",
  "privateKey": { "@id": "sec:privateKey", "@type": "@id" },
  "privateKeyPem": "sec:privateKeyPem",
  "publicKey": { "@id": "sec:publicKey", "@type": "@id" },
  "publicKeyBase58": "sec:publicKeyBase58",
  "publicKeyPem": "sec:publicKeyPem",
  "publicKeyWif": "sec:publicKeyWif",
  "publicKeyService": { "@id": "sec:publicKeyService", "@type": "@id" },
  "revoked": { "@id": "sec:revoked", "@type": "xsd:dateTime" },
  "salt": "sec:salt",
  "signature": "sec:signature",
  "signatureAlgorithm": "sec:signingAlgorithm",
  "signatureValue": "sec:signatureValue"
} as const

export type W3idKey = JsonLd<{
  "@context": LdW3idSecurity,
  "@id"?: string;
  "@type": "sec:Key";
  owner: string;
  privateKeyPem?: string;
  publicKeyPem?: string;
}>

export const W3idKey = $object<W3idKey>({
  "@id": $union([$guard($undefined), $guard($string)]),
  "@type": $guard($const("https://w3id.org/security#Key")),
  "https://w3id.org/security#owner": $object({
    "@id": $guard($string)
  }),
  "https://w3id.org/security#publicKeyPem": $union([$guard($undefined), $guard($string)]),
  "https://w3id.org/security#privateKeyPem": $union([$guard($undefined), $guard($string)])
})
