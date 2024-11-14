import { pathJoin } from "inferred-types";
import { scrape } from "./scrape";
import { Page, PageOptions, PrimaryQueries, QueryDefn, ResultSet, RouteSuggestions, SecondaryQueryDefn, Url } from "./types";

/**
 * **page(** name, selectors, options **)**
 * 
 * Creates a fully configured **page** scraper but does not perform the actual
 * scraping until later when the returned `scrape()` method is used.
 * 
 * @param name the **name** of the configuration settings
 * @param primaryQueries the **selectors** you will look for on the page
 * ```ts
 * const selectors: Record<string, QuerySelector> = {
 *    title: { first: "head title" }
 * }
 * ```
 * @param options **options** including setting a default URL
 */
export const page = <
  TName extends string, 
  TPrimary extends PrimaryQueries, 
  TBaseUrl extends Url = Url,
  TSecondary extends SecondaryQueryDefn<TPrimary> = {},
  TResultSet extends ResultSet = "primary + secondary",
  TRoutes extends readonly string[] = []
>(
  name: TName, 
  primaryQueries: TPrimary, 
  options?: PageOptions<TBaseUrl, TPrimary, TSecondary, TResultSet, TRoutes>
) => {  
  const o = {
    baseUrl: "http" as Url,
    secondaryQueries: {},
    resultSet: "primary + secondary",
    routes: [],

    ...options
  } as PageOptions<TBaseUrl, TPrimary, TSecondary, TResultSet>;

  const p = {
    kind: "page template",
    name,
    primaryQueries,
    secondaryQueries: options?.secondaryQueries,
    scrape:  async <
      TUrl extends TBaseUrl & RouteSuggestions<TBaseUrl, TRoutes>, 
      TRest extends readonly string[] = []
    >(url: TUrl, ...rest: TRest ) => {
        const result = await scrape(
          pathJoin(url as Url, ...rest), 
          primaryQueries,
          o
        );
        
        return result;
    }
  } as Page<
    TName, 
    QueryDefn<TPrimary>, 
    QueryDefn<TSecondary>, 
    TBaseUrl,
    TResultSet
  >;

  return p;
};
