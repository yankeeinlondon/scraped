import { refine } from "src/refine";
import { ifUndefined, Narrowable } from "inferred-types";
import { QueryFirst, QueryAll, QuerySome, RefinedQuery } from "../types";

/**
 * **next**
 * 
 * A scraper utility which lets you target a "selector" and then state _another_ query on 
 * **next** sibling in the DOM tree.
 * 
 */
 export const next = <
 Q extends QueryAll | QueryFirst | QuerySome,
 N extends Narrowable
>(query: Q, refineNext?: RefinedQuery<N>) => ifUndefined(
    refineNext,
    refine(query, el => el.nextElementSibling),
    refine(query, el => (refineNext as RefinedQuery<N>)(el.nextElementSibling))
  );
 