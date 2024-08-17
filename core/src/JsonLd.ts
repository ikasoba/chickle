import { Assign } from "./types/Assign.js";

export type More<T> = T | T[];

export type IRI<NS extends string = string, Name extends string = string> = `${NS}:${Name}`

export type LDContext = More<string | LDNode>

export type LDNode =
  { [K: string]: More<string | number | boolean | null | LDNode> }

export type ResolveIRI<K extends string, Context extends LDContext, D extends string = K> =
  Context extends string
  ? D
  : Context extends [infer T extends LDContext, ...(infer X extends (string | LDNode)[])]
  // 末尾から先頭へ評価していく
  ? ResolveIRI<K, X, never> extends infer R
  ? [R] extends [never]
  ? ResolveIRI<K, T>
  : ResolveIRI<R & string, T>
  : never
  : Context extends []
  ? D
  : K extends IRI<infer NS extends keyof Context & string, infer Name>
  ? Context[NS] extends string
  ? `${ResolveIRI<Context[NS], Context>}${Name}`
  : D
  : K extends keyof Context & string
  ? Context[K] extends infer T extends string
  ? ResolveIRI<T, Context>
  : Context[K] extends { "@id": infer Id extends string }
  ? ResolveIRI<Id, Context>
  : D
  : D

type UnionToIntersection<U> =
  (U extends infer T ? (_: T) => void : never) extends ((_: infer T) => void) ? T : never;

type Get<O, K extends string | symbol | number, T, D extends T = never> = O extends { [_ in K]: infer R extends T } ? R : D;

type PrimitiveType =
  | string
  | number
  | boolean
  | null

type ResolvedKeyMap<T extends {}, Context extends LDContext> =
  UnionToIntersection<{ [K in keyof T & string]: { [R in ResolveIRI<K, Context>]: K } }[keyof T & string]>

export type GetFromIRI<Context extends LDContext, K extends string, GlobalContext extends LDContext = Context, D = never> =
  Context extends string
  ? D
  : Context extends [infer T extends (string | LDNode), ...infer X extends (string | LDNode)[]]
  ? GetFromIRI<T, K, GlobalContext, D> | GetFromIRI<X, K, GlobalContext, D>
  : Context extends []
  ? D
  : Context extends { [_ in K]: infer V }
  ? V
  : { [I in keyof Context]: Context[I] extends { "@id": infer Id extends string } ? ResolveIRI<Id, Context> extends ResolveIRI<K, Context> ? Context[I] : never : never }[keyof Context]

export type StringToIdObj<T, Context extends LDContext> = T extends string ? { "@id": ResolveIRI<T, Context> & string } : T

type LdTypedValue<TypeIRI extends string, T> =
  [T] extends [never] ? never : { "@type": TypeIRI; "@value": T }

type Compact<V, R, Context extends LDContext> =
  GetFromIRI<Context, R & string, Context> extends infer T
  ? [T] extends [never]
  ? CompactValue<V, R, Context>
  : T extends { "@type": infer TypeId extends string }
  ? ResolveIRI<TypeId, Context> extends infer TypeId
  ? TypeId extends "@id"
  ? V extends string
  ? { "@id": ResolveIRI<V, Context> }
  : V extends PrimitiveType
  ? CompactValue<V, R, Context>
  : V extends unknown[]
  ? {
    [I in keyof V]: StringToIdObj<V[I], Context>
  }
  : CompactValue<V, R, Context>
  : V extends { "@type": TypeId; "@value": infer V }
  ? LdTypedValue<TypeId & string, LD<V, Context>>
  : LdTypedValue<TypeId & string, LD<V, Context>>
  : never
  : CompactValue<V, R, Context>
  : never

type CompactValue<V, R, Context extends LDContext> =
  [R, V] extends ["@type", infer V extends string]
  ? ResolveIRI<V, Context>
  : V extends PrimitiveType
  ? V
  : V extends infer V extends unknown[]
  ? { [I in keyof V]: V[I] }
  : V

/** JSON-LD を Compact するやつ */
// deno-fmt-ignore
type LD<T, Context extends LDContext> =
  T extends PrimitiveType
  ? T
  : T extends unknown[]
  ? { [K in keyof T]: LD<T[K], Context> }
  : T extends {}
  ? ResolvedKeyMap<T, Context> extends infer RK
  ?
  { [R in keyof RK]:
    T extends { [_ in RK[R] & string]: infer V }
    ? Compact<V, R, Context>
    : T extends { [_ in RK[R] & string]?: infer V }
    ? Compact<Exclude<V, null | undefined>, R, Context> | Extract<V, null> | undefined
    : "Bug1" }
  : "Bug2"
  : never

export type CollectContext<T> =
  T extends { "@context": infer X extends LDContext } ? X : {}

export type ResolveContext<T, Documents extends Record<string, LDContext> = {}> =
  T extends string
  ? Get<Documents, T, LDContext, T>
  : T extends [infer T, ...infer X]
  ? [ResolveContext<T, Documents>, ...ResolveContext<X, Documents>]
  : T extends []
  ? []
  : T extends LDContext
  ? T
  : never

/** 型レベルでの JsonLd を Compact するやつ */
export type JsonLd<T, Documents extends Record<string, LDContext> = {}> = LD<Omit<T, "@context">, ResolveContext<CollectContext<T>, Documents>>

/** jsonld context から定義された iri を抽出する */
export type CollectIRI<Context extends LDContext> =
  Context extends string
  ? never
  : Context extends [infer T extends (string | LDNode), ...infer X extends (string | LDNode)[]]
  ? CollectIRI<T> | CollectIRI<X>
  : Context extends []
  ? never
  : ResolveIRI<keyof Context & string, Context>

export function createIRIResolver<Context extends LDContext, Docs extends Record<string, LDContext>>(context: Context, documents: Docs): (name: string) => [key: string, val: unknown] | null {
  if (Array.isArray(context)) {
    const resolvers = context.map(x => createIRIResolver(x, documents)).sort(() => -1)

    return name => {
      let res: [string, unknown] | null = null;

      for (const resolver of resolvers) {
        const m: RegExpMatchArray | null = (res?.[0] ?? name).match(/^([^:]+):(.+)$/);

        if (m == null) {
          const resolved = resolver(res?.[0] ?? name)
          if (resolved != null) {
            res = resolved
          }
        } else {
          const resolved = resolver(m[1]);
          if (resolved != null) {
            res = [resolved[0] + m[2], resolved[1]];
          }
        }
      }

      return res
    }
  } else if (typeof context == "string") {
    const prop = Object.getOwnPropertyDescriptor(documents, context)

    return prop?.enumerable && prop.value ? createIRIResolver(prop.value, documents) : () => null
  } else {
    const entries = Object.entries(context).sort(() => -1)

    return name => {
      let res: [string, unknown] | null = null;

      for (const [key, value] of entries) {
        const m: RegExpMatchArray | null = (res?.[0] ?? name).match(/^([^:]+):(.+)$/);

        if (m == null) {
          if (key != (res?.[0] ?? name)) continue;

          if (typeof value == "string") {
            res = [value, value];
          } else if (typeof value == "object" && value && "@id" in value && typeof value["@id"] == "string") {
            res = [value["@id"], value];
          }
        } else {
          if (key == m[1] && typeof value == "string") {
            res = [value + m[2], res?.[1] ?? value];
            continue
          }

          if (!(typeof value == "object" && value && !Array.isArray(value))) continue;

          if ("@id" in value && value["@id"] == m[0]) {
            res = [m[0], value]
          }
        }
      }

      return res;
    }
  }
}

export function createIRIReverseResolver<Context extends LDContext>(context: Context): (name: string) => [key: string, val: unknown] | null {
  if (Array.isArray(context)) {
    const resolvers = context.map(x => createIRIReverseResolver(x))

    return iri => {
      let res: [string, unknown] | null = null;

      for (const resolver of resolvers) {
        const resolved = resolver(res?.[0] ?? iri)
        if (resolved != null) {
          res = resolved
        }
      }

      return res
    }
  } else if (typeof context == "string") {
    return _ => null
  } else {
    const entries = Object.entries(context)

    return iri => {
      let res: [string, unknown] | null = null;

      for (const [key, value] of entries) {
        const m: RegExpMatchArray | null = (res?.[0] ?? iri).match(/^([^#]+)#(.+)$/);

        if (m == null) {
          const m: RegExpMatchArray | null = (res?.[0] ?? iri).match(/^([^:]+):(.+)$/);

          if (m && value == m[0]) {
            res = [m[2], value];
          } else if (value == (res?.[0] ?? iri)) {
            res = [key, value];
          } else if (typeof value == "object" && value && "@id" in value && value["@id"] == (res?.[0] ?? iri)) {
            res = [key, value];
          }
        } else {
          if (value == m[1] + "#") {
            res = [key + ":" + m[2], value];
          }

          if (!(typeof value == "object" && value && !Array.isArray(value))) continue;

          if ("@id" in value && value["@id"] == m[0]) {
            res = [key, value]
          }
        }
      }

      return res;
    }
  }
}

export type IRIComplession<Context extends LDContext> =
  CollectIRI<Context> | {
    [K in CollectIRI<Context>]: IRIComplession<Context>
  } | IRIComplession<Context>[]

export const enum SchemaKind {
  Array,
  Object,
  Union,
  Ref
}

export type ArraySchema<T extends unknown[]> =
  { kind: SchemaKind.Array; child: Schema<T[number]> }

export type ObjectSchema<T> =
  {
    kind: SchemaKind.Object;
    entries: {
      [K in keyof T]: Schema<T[K]>
    }
  }

export type UnionSchema<T> =
  {
    kind: SchemaKind.Union
    items: Schema<T>[]
  }

export type RefSchema<T> =
  {
    kind: SchemaKind.Ref
    schema: () => Schema<T>
  }

export type Validator<T> =
  (value: unknown, context?: LDContext) => { value: T } | null;

export type Schema<T> =
  | ArraySchema<T & unknown[]>
  | ObjectSchema<T>
  | UnionSchema<T>
  | RefSchema<T>
  | Validator<T>

export type $Schema<Context extends LDContext> = Schema<Partial<IRIComplession<Context>>>

export type $Infer<S extends Schema<unknown>> = S extends Schema<infer T> ? T : never;

export type $InferValidator<S extends Schema<unknown>> =
  S extends ArraySchema<infer T>
  ? Validator<T[number][]>
  : S extends ObjectSchema<infer T>
  ? Validator<T>
  : S extends Validator<infer T>
  ? Validator<T>
  : never

export function $schema<Context extends LDContext>(): <S extends $Schema<Context>>(schema: S) => S {
  return schema => schema
}

export function compact<T extends unknown, Docs extends Record<string, LDContext>>(value: T, documents: Docs): JsonLd<T, Docs>;
export function compact<T extends unknown, Docs extends Record<string, LDContext>>(value: T, documents: Docs) {
  if (Array.isArray(value)) {
    return value.map((x: (typeof value)[number]) => compact(x, documents));
  } else if (typeof value == "object" && value) {
    const context = "@context" in value ? value["@context"] as LDContext : undefined;

    const res: LDNode = {};

    const resolve = context ? createIRIResolver(context, documents) : null

    for (const k in value) {
      if (k == "@context") continue;

      const [resolvedKey, node] = resolve?.(k) ?? [k, k];

      const val = value[k]

      if (resolvedKey == "@type" && typeof val == "string") {
        const [resolvedId] = resolve?.(val) ?? [val]

        res[resolvedKey] = resolvedId
      } else if (typeof node == "object" && node && !Array.isArray(node) && "@type" in node && typeof node["@type"] == "string") {
        const id = node["@type"] == "@id" && "@id" in node && typeof node["@id"] == "string" ? node["@id"] : node["@type"]
        const [resolvedId] = resolve?.(id) ?? [id];

        res[resolvedKey] = {
          "@type": resolvedId,
          "@value": compact(value[k], documents)
        }
      } else {
        res[resolvedKey] = compact(value[k], documents);
      }
    }

    return res
  } else if (value == null || typeof value == "string" || typeof value == "number" || typeof value == "boolean") {
    return value
  } else {
    return null
  }
}

function _normalize<T extends unknown, Docs extends Record<string, LDContext>>(value: T, documents: Docs, context: Record<string, unknown> = {}): unknown {
  if (Array.isArray(value)) {
    return value.map((x: (typeof value)[number]) => _normalize(x, documents, context));
  } else if (typeof value == "object" && value) {
    const res: Record<string, unknown> = {};

    const resolve = createIRIReverseResolver(Object.values(documents).flat());

    for (const k in value) {
      const [resolvedKey, node] = resolve?.(k) ?? [k, k];

      const val = value[k]

      if (k == "@type" && typeof val == "string") {
        const [resolvedId] = resolve?.(val) ?? [val];
        res[resolvedKey] = resolvedId
      } else if (typeof val == "object" && val && "@value" in val) {
        res[resolvedKey] = val["@value"]
      } else if (typeof node == "object" && node && !Array.isArray(node) && "@type" in node && node["@type"] == "@id" && typeof val == "object" && val && "@id" in val) {
        if (Object.keys(val).length == 1) {
          res[resolvedKey] = _normalize(val["@id"], documents)
        } else {
          res[resolvedKey] = _normalize(val, documents)
        }
      } else {
        res[resolvedKey] = _normalize(val, documents);
      }
    }

    return res
  } else if (value == null || typeof value == "string" || typeof value == "number" || typeof value == "boolean") {
    return value
  } else {
    return null
  }
}

export function normalize<T extends unknown, Docs extends Record<string, LDContext>>(value: T, documents: Docs) {
  const res = _normalize(value, documents);

  const context: (string | LDNode)[] = Object.keys(documents)

  if (typeof res == "object" && value && !Array.isArray(res)) {
    return {
      "@context": context,
      ...res,
    }
  } else {
    return {
      "@context": context,
      "@graph": res
    }
  }
}

/** JsonLd のパーサー兼バリデーターを作成する */
export function createValidator<T, Docs extends Record<string, LDContext>>(schema: Schema<T>, documents: Docs): Validator<T> {
  if (typeof schema == "function") return (value, context) => schema(value, context);

  if (schema.kind == SchemaKind.Array) {
    const validator = createValidator(schema.child, documents);

    return (value, context) => {
      if (!Array.isArray(value)) return null;

      const res = [];

      for (const item of value) {
        const status = validator(item, context);

        if (status == null) return null;

        res.push(status.value);
      }

      return { value: res as never };
    }
  } else if (schema.kind == SchemaKind.Object) {
    const keys = new Set(Object.keys(schema.entries))
    const isKey = (k: string): k is (keyof T & string) => keys.has(k)

    const validators = Object.fromEntries(
      Object.entries<ObjectSchema<T>["entries"][keyof T]>(schema.entries)
        .map(([key, validator]) => [key, createValidator<T[keyof T], Docs>(validator, documents)] as const)
    ) as { [K in keyof T]: Validator<T[K]> }

    return (value, context) => {
      if (!(typeof value == "object" && value != null)) return null;

      const _context = "@context" in value ? value["@context"] as LDContext : undefined;
      context = Array.isArray(_context) ? [...(Array.isArray(context) ? context : context ? [context] : []), ..._context] : _context ? [...(Array.isArray(context) ? context : context ? [context] : []), _context] : context

      const res = Object.create(null);

      const resolve = context ? createIRIResolver(context, documents) : null

      const set = new Set(keys);

      for (const k in value) {
        if (set.size <= 0) break;
        if (k == "@context") continue;

        const [resolvedKey, node] = resolve?.(k) ?? [k, k];

        // キーが処理済みであるか、スキーマのキーでなければスキップ
        if (!set.has(resolvedKey) || !isKey(resolvedKey)) continue;

        const prop = Object.getOwnPropertyDescriptor(value, k);

        let raw;

        if (resolvedKey == "@type" && typeof prop?.value == "string") {
          const [resolvedId] = resolve?.(prop.value) ?? [prop.value]

          raw = resolvedId
        } else if (typeof node == "object" && node && !Array.isArray(node) && "@type" in node && node["@type"] == "@id" && typeof prop?.value == "string") {
          const [resolvedId] = resolve?.(prop.value) ?? [prop.value]

          raw = { "@id": resolvedId }
        } else if (typeof node == "object" && node && !Array.isArray(node) && "@type" in node && typeof node["@type"] == "string" && node["@type"] != "@id") {
          const [resolvedId] = resolve?.(node["@type"]) ?? [node["@type"]]

          raw = { "@type": resolvedId, "@value": prop?.value };
        } else {
          raw = prop?.value;
        }

        const validator = validators[resolvedKey];
        const status = validator(raw, context)
        if (status == null) continue;

        res[resolvedKey] = status.value;

        set.delete(resolvedKey);
      }

      for (const key of set) {
        const validate = validators[key as keyof T]

        const status = validate(undefined, context);
        if (status == null) return null;

        res[key] = status.value;
        set.delete(key)
      }

      // 未処理のキーがあれば弾く
      return set.size > 0 ? null : { value: res }
    }
  } else if (schema.kind == SchemaKind.Union) {
    const validators = schema.items.map(x => createValidator(x, documents))

    return (value, context) => {
      for (const validate of validators) {
        const status = validate(value, context)

        if (status != null) return status
      }

      return null
    }
  } else if (schema.kind == SchemaKind.Ref) {
    let ref: Validator<T> | null = null;

    return (value, context) => (ref ??= createValidator(schema.schema(), documents))(value, context)
  }

  throw new Error("Unreachable!");
}

export function $guard<T>(guard: (value: unknown) => value is T): Validator<T> {
  return value => guard(value) ? { value } : null
}

export function $union<T extends unknown[]>(schemas: { [K in keyof T]: Schema<T[K]> }): Schema<T[number]> {
  return {
    kind: SchemaKind.Union,
    items: schemas
  }
}

export function $array<T>(child: Schema<T>): Schema<T[]> {
  return {
    kind: SchemaKind.Array,
    child
  }
}

export function $object<T>(entries: { [K in keyof T]: Schema<T[K]> }): ObjectSchema<T> {
  return {
    kind: SchemaKind.Object,
    entries
  }
}

export function $ref<T>(schema: () => Schema<T>): RefSchema<T> {
  return {
    kind: SchemaKind.Ref,
    schema
  }
}

export function $extends<A, B>(a: ObjectSchema<A>, b: ObjectSchema<B>): ObjectSchema<Assign<A, B>> {
  return {
    kind: SchemaKind.Object,
    entries: {
      ...a.entries,
      ...b.entries
    } as ObjectSchema<Assign<A, B>>["entries"]
  }
}
