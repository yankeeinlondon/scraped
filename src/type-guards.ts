import { QueryAll, QueryFirst, QuerySelector, QuerySome, RefinedQueryAll, RefinedQueryFirst, QueryRoot, RefinedQuerySome } from "./types";


export function isQueryAll(q: QuerySelector): q is QueryAll | RefinedQueryAll {
  return "all" in q;
 }

 export function isQuerySome(q: QuerySelector): q is QuerySome | RefinedQuerySome {
  return "some" in q  && "where" in q;
 }

 export function isQueryFirst(q: QuerySelector): q is QueryFirst | RefinedQueryFirst {
  return "first" in q;
 }

 export function isRefinedQuery(q: QuerySelector): q is RefinedQueryAll | RefinedQueryFirst | RefinedQuerySome {
  return "refine" in q;
 }

 export function isRefinedQueryRoot(q: QuerySelector): q is QueryRoot {
  return "root" in q;
 }

export function isThenable(val: unknown): val is Promise<any> {
  return typeof val === "object" && "then" in (val as object);
}