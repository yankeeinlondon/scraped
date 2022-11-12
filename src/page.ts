import { scrape } from "./scrape";
import { Page, PageOptions,  QuerySelector, ScrapedPage, Url } from "./types";

/**
 * **page(** name, selectors, options **)**
 * 
 * Creates a fully configured **page** scraper but does not perform the actual
 * scraping until later when the returned `scrape()` method is used.
 * 
 * @param name the **name** of the configuration settings
 * @param selectors the **selectors** you will look for on the page
 * ```ts
 * const selectors: Record<string, QuerySelector> = {
 *    title: { first: "head title" }
 * }
 * ```
 * @param options **options** including setting a default URL
 */
export const page = <
  N extends string, 
  C extends Record<string, QuerySelector<any>>, 
  U extends Url
>(
  name: N, 
  selectors: C, 
  options: PageOptions<U> = {} as PageOptions<never>
) => {
  const p = {
    name,
    selectors,
    scrape: options.defaultUrl
      ? async <T extends Url = U>(url?: T) => {
        // accept override URL if provided
        const target = (url || options.defaultUrl as Url) as T;
        const result = await scrape<T, C, N>(target, selectors) as ScrapedPage<N, C, T>;
        
        return result;
      }
      : async <T extends Url>(url: T) => {
        const result = await scrape(url, selectors) as ScrapedPage<N, C, T>;

        return result;
      }
  } as Page<N,C,U>;

  return p as Page<N,C,U>;
};
