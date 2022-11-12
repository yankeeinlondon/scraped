/* eslint-disable no-use-before-define */
import {  Fragment,  IElement } from "@yankeeinlondon/happy-wrapper";
import { IsStringLiteral,  Narrowable,  SimplifyObject } from "inferred-types";

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

export type RefinedQuery<R> = (el: IElement) => R;

export interface RefinedQueryRoot<R extends Narrowable = unknown>{
  root: true;
  doc: (doc: Fragment) => R;
}

export interface RefinedQueryFirst<R = unknown>{
  first: string;
  /**
  * Since when you are looking for a singular value with a query, you 
  * can not have _any_ matches and the result from the DOM is `null`. Often,
  * in these cases, it's better to have the result be `undefined` (which is
  * the default for these queries) but you can set it to null, undefined, or
  * specify a default value with a callback function.) 
  */
  handleNull?: "undefined-value" | "null-value" | (<T>() => T);
  refine: RefinedQuery<R>;
}
export interface RefinedQueryAll<R = unknown> {
  all: string;
  refine: RefinedQuery<R>;
}
export interface RefinedQuerySome<R = unknown> {
  some: string;
  where: (i: IElement) => boolean;
  refine: RefinedQuery<R>;
}

export type QuerySelector<Q extends {}> = 
  Q extends QueryAll
    ? Q extends RefinedQueryAll<infer R>
      ? RefinedQueryAll<R>
      : QueryAll
    : Q extends QueryFirst
      ? Q extends RefinedQueryFirst<infer R>
        ? RefinedQueryFirst<R>
        : QueryFirst
      : Q extends QuerySome
        ? Q extends RefinedQuerySome<infer R>
          ? RefinedQuerySome<R>
          : QuerySome
        : Q extends RefinedQueryRoot<infer R>
          ? RefinedQueryRoot<R>
          : never;


/** converts a dictionary of Query Selectors into a signature for a secondary query */
export type SecondaryQuery<
  T extends Record<string, QuerySelector<any>>
> = (<V>(q: FromSelectors<T>) => V);

/**
 * Defines the basic dictionary structure of the secondary queries configuration. 
 */
export type SecondaryQueries<T extends Record<string, QuerySelector<any>>> = Record<string, SecondaryQuery<T>>;

export interface ScrapeOptions<
  TName extends string | undefined = undefined, 
  TSecondary extends SecondaryQueries<Record<string, QuerySelector<any>>> | undefined = undefined
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
  TSecondary extends SecondaryQueries<Record<string, QuerySelector<any>>> | undefined = undefined
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
 export type FromSelectors<TSelectors extends Record<string, QuerySelector<any>>> = {
  [K in keyof TSelectors]: TSelectors[K] extends { refine: (el: IElement) => infer R }
    ? R
    : TSelectors[K] extends { doc: (doc: Fragment) => infer R }
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
  TSelectors extends Record<string, QuerySelector<any>>,
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
  TSelectors extends Record<string, QuerySelector<any>>,
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

export type Refine<T extends QueryAll | QueryFirst | QuerySome, R> = T extends QueryAll 
? RefinedQueryAll<R>
: T extends QueryFirst
  ? RefinedQueryFirst<R>
  : T extends QuerySome
    ? RefinedQuerySome<R>
    : never;

export interface CommonAttributes {
  src?: string;
  href?: string;
  rel?: string;
  name?: string;
  property?: string;
  class?: string;
  style?: string;
  content?: string;
  crossorigin?: string;
  [key: string]: string | undefined;
}

export interface CommonMetaAttrs {
  rel?: string;
  href?: string;
  name?: string;
  content?: string;
  property?: string;
  crossorigin?: string;
  [key: string]: string | undefined;
}

export interface OpenGraph {
  title?: string;
  description?: string;
  site_name?: string;
  url?: string;
  type?: string;
  image?: string;
  image_alt?: string;
  image_height?: string;
  image_width?: string;
}

export interface TwitterMeta {
  title?: string;
  description?: string;
  site?: string;
  card?: string;
  image?: string;
  image_alt?: string;
}

/**
 * A property which features an href but where other props might be of interest
 */
 export interface HrefAndAttrs {
  href: string;
  attrs: Omit<CommonAttributes, "href">;
}

export interface NameValueOther<V extends string = string> {
  /** the properties used for the "name" and "value" */
  props: [name: string, value: string];
  /** The property name */
  name: string;
  /** the property value */
  value: V;
  /**
   * Any other properties set on the meta-tag
   */
  attrs: Record<string, string>;
}

/**
 * Pages which want to be Microsoft Apps sometimes provide meta
 * tags with `name` set to the dasherized version of these props
 * and the _value_ provided in the `content` property.
 */
 export interface MicrosoftApp {
  msapplication_square70x70logo?: NameValueOther;
  msapplication_square150x150logo?: NameValueOther;
  msapplication_wide310x150logo?: NameValueOther;
  msapplication_square310x310logo?: NameValueOther;
  msapplication_TileColor?: NameValueOther;
}

export interface AppleApp {
  apple_itunes_app?: NameValueOther;
  apple_mobile_web_app_capable?: NameValueOther<"yes" | "no">;
  apple_mobile_web_app_status_bar_style?: NameValueOther;
  apple_mobile_web_app_title?: NameValueOther;
  apple_touch_icon?: HrefAndAttrs;
}


/**
 * an inline block of code, styling, etc.
 */
 export interface InlineBlock {
  text: string;
  attrs: CommonAttributes;
}

/**
 * A text attribute which could be sourced from more than one source
 */
export interface MultiSourceText<S extends string = string> {
  source: S;
  text: string;
}

/**
 * A URL which could be sourced from more than one source
 */
export interface MultiSourceUrl<S extends string = string> {
  source: S;
  url: string;
}