export type MongoOp<T> =
  | { $not: MongoOp<T> }
  | { $and: MongoOp<T>[] }
  | { $or: MongoOp<T>[] }
  | { $eq: T }
  | { $lt: T }
  | { $gt: T }
  | { $lte: T }
  | { $gte: T }
  | { $regex: T }
  | { $in: T[] }
  | { $nin: T[] }

export type MongoQuery<T> =
  | T | MongoOp<T> | { [ K in keyof T ]?: MongoQuery<T[K]> }

export type QueryFn<T, F extends (...args: any) => any> = (q: MongoQuery<T>) => ReturnType<F>
