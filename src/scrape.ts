import { IElement, select } from "@yankeeinlondon/happy-wrapper";
import {  Keys, keys } from "inferred-types";
import {  FromSelectors, QuerySelector, ScrapedNameAndUrl, ScrapedPage,  ScrapeOptions,  Url } from "src/types";
import { loadPage } from "src/loadPage";
import { isQueryAll, isQueryFirst, isQuerySome, isRefinedQuery } from "./type-guards";

export async function scrape<
  TUrl extends Url, 
  TSelectors extends Record<string, QuerySelector>, 
  TName extends string | undefined
>(
  url: TUrl,
  targets: TSelectors,
  options: ScrapeOptions<TName> = {}
) {
  const page = await loadPage(url);

  const nameAndUrl = {
    _from: options.from || "__immediate__",
    _url: url,
  } as ScrapedNameAndUrl<TName, TUrl>;

  let results: Record<Keys<TSelectors>, any> = {
    ...({} as unknown as FromSelectors<TSelectors>)
  } ;

  for (const key of keys(targets)) {
    const target: QuerySelector = targets[key];

    if (isQueryAll(target)) {
      const elements = select(page).findAll(target.all);
      results = isRefinedQuery(target)
        ? { ...results, [key]: elements.map(el => target.refine(el)) }
        : { ...results, [key]: elements };
    } else if (isQuerySome(target)) {
      const elements = select(page).findAll(target.some).filter(i => target.where(i));
      results = isRefinedQuery(target)
        ? { ...results, [key]: elements.map(el => target.refine(el)) }
        : { ...results, [key]: elements };
    } else if (isQueryFirst(target)) {
      const el = select(page).findFirst(target.first);
      results = el === null
        ? target?.handleNull === "null-value"
          ? { ...results, [key]: null }
          : target?.handleNull === "undefined-value" || target?.handleNull === undefined
            ? { ...results, [key]: undefined }
            : { ...results, [key]: target?.handleNull() }
        : isRefinedQuery(target)
        ? { ...results, [key]: target.refine(el) }
        : { ...results, [key]: el };
    }

  }

  return {
    ...nameAndUrl,
    ...results
  } as Awaited<ScrapedPage<TName, TSelectors, TUrl>>;
}
