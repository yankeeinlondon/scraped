import { select } from "@yankeeinlondon/happy-wrapper";
import {  keys } from "inferred-types";
import { PrimaryQueries, PrimaryResults, Query, QuerySelector, ResultSet,  ScrapedPage,  ScrapeOptions,    SecondaryQueryDefn,  SecondaryResults,  Url } from "src/types";
import { loadPage } from "src/loadPage";
import { isQueryAll, isQueryFirst, isQuerySome, isRefinedQuery, isRefinedQueryRoot, isThenable } from "./type-guards";
import { NO_TEMPLATE } from "./constants";

export async function scrape<
TUrl extends Url, 
TPrimary extends PrimaryQueries,
TSecondary extends SecondaryQueryDefn<TPrimary>,
TName extends string = typeof NO_TEMPLATE,
TResultSet extends ResultSet = "primary + secondary",
TBaseUrl extends Url = Url
>(
  url: TUrl,
  targets: TPrimary,
  options: ScrapeOptions<TName, TBaseUrl, TPrimary, TSecondary, TResultSet> = {}
) {
  const [page, root] = await loadPage(url);

  const o = {
    from: NO_TEMPLATE as TName,
    baseUrl: "http" as Url,
    resultSet: "primary + secondary",
    secondary: {},
    ...options
  } as Required<ScrapeOptions<TName, TBaseUrl, TPrimary, TSecondary, TResultSet>>;

  // primary results
  const primaryResults: Partial<Record<keyof typeof targets, any>> = {};
  for (const key of keys(targets)) {
    const target: QuerySelector = targets[key];

    if (isRefinedQueryRoot(target)) {
      primaryResults[key] = target.root(root);
    } else if (isQueryAll(target)) {
      const elements = select(page).findAll(target.all);
      primaryResults[key] = isRefinedQuery(target)
        ? elements.map(el => target.refine(el))
        : elements;
    } else if (isQuerySome(target)) {
      const elements = select(page).findAll(target.some).filter(i => target.where(i));
      primaryResults[key] = isRefinedQuery(target)
        ? elements.map(el => target.refine(el))
        : elements;
    } else if (isQueryFirst(target)) {
      const el = select(page).findFirst(target.first);
      primaryResults[key] = el === null
        ? target?.handleNull === "null-value"
          ? null
          : target?.handleNull === "undefined-value" || target?.handleNull === undefined
            ? undefined
            : target?.handleNull()
        : isRefinedQuery(target)
        ? target.refine(el)
        : el;
    }
  }

  // secondary results
  const primary = primaryResults as PrimaryResults<TPrimary>;
  const secondaryPromises: Promise<any>[] = [];
  const secondary: Partial<SecondaryResults<TSecondary>> = {};
  for (const key of keys(o.secondary)) {
    const fn = o.secondary[key] as Query<TPrimary, any>;
    const r = fn(primary);
    if (isThenable(r)) {
      r.then(v => {
        secondary[key] = v;
      });
      secondaryPromises.push(r);
    } else {
      secondary[key] = r;
    }
    // let all async functions complete
    await Promise.all(secondaryPromises);
  }

  const results = {
    _template: o.from,
    _url: url,
    ...(o.resultSet === "primary + secondary" ?  primaryResults : {}),
    ...(secondary as SecondaryResults<TSecondary>)
  } as ScrapedPage<TName, TUrl, TPrimary, TSecondary, TResultSet, TBaseUrl>;

  return results;
}
