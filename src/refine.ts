import { QueryAll, QueryFirst, QuerySome, Refine, RefinedQuery } from "./types";

export const refine = <Q extends QueryAll | QueryFirst | QuerySome, R>(query: Q, refine: RefinedQuery<R>) => {
  return {
    ...query,
    refine
  } as unknown as Refine<Q, R>;
};