/* eslint-disable no-use-before-define */
import {  IElement } from "@yankeeinlondon/happy-wrapper";
import { IsStringLiteral, SimplifyObject } from "inferred-types";

export type Url = `http${string}`;

export interface QueryAll {
 all: string;
}
export interface QueryFirst {
 first: string;
 /**
  * Since when you are looking for a singular value with a query, you 
  * can not have _any_ matches and the result from the DOM is `null`. Often,
  * in these cases, it's better to have the result be `undefined` (which is
  * the default for these queries) but you can set it to null, undefined, or
  * specify a default value with a callback function.) 
  */
 handleNull?: "undefined-value" | "null-value" | (<T>() => T);
}
export interface QuerySome {
  some: string;
  where: (i: IElement) => boolean;
}

export interface RefinedQueryFirst {
  first: string;
  /**
  * Since when you are looking for a singular value with a query, you 
  * can not have _any_ matches and the result from the DOM is `null`. Often,
  * in these cases, it's better to have the result be `undefined` (which is
  * the default for these queries) but you can set it to null, undefined, or
  * specify a default value with a callback function.) 
  */
  handleNull?: "undefined-value" | "null-value" | (<T>() => T);
  refine: <T>(el: IElement) => T;
}
export interface RefinedQueryAll {
  all: string;
  refine: <T>(el: IElement) => T;
}
export interface RefinedQuerySome {
  some: string;
  where: (i: IElement) => boolean;
  refine: <T>(el: IElement) => T;
}

export type QuerySelector = QueryAll | QueryFirst | RefinedQueryFirst | RefinedQueryAll | QuerySome | RefinedQuerySome;

/** converts a dictionary of Query Selectors into a signature for a secondary query */
export type SecondaryQuery<
  T extends Record<string, QuerySelector>
> = (<V>(q: FromSelectors<T>) => V);

/**
 * Defines the basic dictionary structure of the secondary queries configuration. 
 */
export type SecondaryQueries<T extends Record<string, QuerySelector>> = Record<string, SecondaryQuery<T>>;

export interface ScrapeOptions<
  TName extends string | undefined = undefined, 
  TSecondary extends SecondaryQueries<Record<string, QuerySelector>> | undefined = undefined
> {
  /** 
   * The configuration template this scrape was derived from.
   * 
   * Note: _this will be filled in automatically by `Page`'s scrape()
   * method.
   **/
  from?: TName;
  /**
   * Secondary queries which are built off inputs from the primary query results
   */
  secondary?: TSecondary;
}

export interface PageOptions<
  TUrl extends Url = never,
  TSecondary extends SecondaryQueries<Record<string, QuerySelector>> | undefined = undefined
> {
  defaultUrl?: TUrl;
  /**
   * Secondary queries which are built off inputs from the primary query results
   */
  secondary?: TSecondary;
}

export type ScrapedNameAndUrl<N extends string | undefined, U extends Url = "https://unknown"> = {
  _from: N extends string ? N : "__immediate__";
  _url: U;
};

/** 
 * Type utility which converts a hashmap of selectors into a hashmap with the same keys
 * but where the _value_ is what the value of the given selector will be after scraping.
 */
 export type FromSelectors<TSelectors extends Record<string, QuerySelector>> = {
  [K in keyof TSelectors]: TSelectors[K] extends { refine: (el: IElement) => infer R }
    ? R
    : IElement;
};

/**
 * The page after it has been scraped. This should represent a 1:1 mapping of selectors
 * chosen in _configuration_ as well as a few meta props like `_url` and `_from` props
 * which indicate the URL scraped and the configuration used (if used in lazy loading).
 */
export type ScrapedPage<
  TName extends string | undefined,
  TSelectors extends Record<string, QuerySelector>,
  TUrl extends Url
> = Promise<SimplifyObject< ScrapedNameAndUrl<TName, TUrl> & FromSelectors<TSelectors> >>;

/**
 * **Page**
 * 
 * A scraping configuration for a page (or set of pages of similar structure). This configuration
 * can be used to scrape content by calling the provided `scrape` method on this dictionary.
 */
export interface Page<
  TName extends string, 
  TSelectors extends Record<string, QuerySelector>,
  TDefaultUrl extends Url,
>  {
  /**
   * The _name_ of the selector configuration
   */
  name: TName;
  /**
   * A definition of all the _selectors_ you are looking for on the page when it's scraped
   */
  selectors: TSelectors;
  /**
   * Call `scrape` to scrape the content from the URL with the current selectors
   */
  scrape: IsStringLiteral<TDefaultUrl> extends true 
    ? <T extends Url = TDefaultUrl>(url?: T) => ScrapedPage<TName, TSelectors, T>
    : <T extends Url>(url: T) => ScrapedPage<TName, TSelectors, T>;
  /**
   * The _default_ URL to use for this configuration; if not stated than calls to 
   * the `scrape()` method will require that a URL be stated.
   */
  defaultUrl: IsStringLiteral<TDefaultUrl> extends true ? TDefaultUrl : never;
};

