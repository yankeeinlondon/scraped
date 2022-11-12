import { QueryAll, QueryFirst, QuerySelector, QuerySome, RefinedQueryAll, RefinedQueryFirst, RefinedQueryRoot, RefinedQuerySome } from "./types";

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

 export function isRefinedQueryRoot(q: QuerySelector): q is RefinedQueryRoot {
  return "root" in q && (q as RefinedQueryRoot).root === true;
 }