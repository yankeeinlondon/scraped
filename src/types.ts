/* eslint-disable no-use-before-define */
import { Fragment, IElement } from "@yankeeinlondon/happy-wrapper";
import { SimplifyObject, Suggest, Narrowable, IfUndefined, TupleToUnion, PathJoin} from "inferred-types";

export type RouteSuggestions<
  TBaseUrl extends Url,
  TRoutes extends readonly string[]
> = Suggest<TupleToUnion<{
  [K in keyof TRoutes]: `${TBaseUrl}${TRoutes[K]}`
}>> | `${TBaseUrl}`;

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

/** The three DOM blocks returned to a `RefinedQueryRoot` */
export type RootBlocks = {
  text: Fragment;
  /**
   * The page contents within `<html>...</html>`
   */
  html: Fragment;
  /**
   * The page contents within `<head>...</head>`
   */
  head: Fragment;
  /**
   * The page contents within `<body>...</body>`
   */
  body: Fragment;
};

/**
 * **RefinedQueryRoot**
 * 
 * A refined query with a slightly different signature than
 * the other refined queries and designed to allow you to
 * explore three distinct blocks:
 * 
 * 1. The top-level `<html>` element (very useful for picking of props on it)
 * 2. The `<head>...</head>` block
 * 3. The `<body>...</body>` block
 * 
 * All three are provided to the `refine()` modifier.
 */
export interface QueryRoot<R = unknown>{
  root: (doc: RootBlocks) => R;
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

/**
 * **QuerySelector**
 * 
 * A discriminated union of all the primary query types
 */
export type QuerySelector = QueryAll 
  | QueryFirst 
  | RefinedQueryFirst 
  | RefinedQueryAll 
  | QuerySome 
  | RefinedQuerySome 
  | QueryRoot;

/**
 * **QueryLookup**
 * 
 * A type utility which receives one of the query types and is resolved
 * to the specific query type that is represented.
 */
export type QueryLookup<T extends QuerySelector> = T extends RefinedQueryFirst<infer R>
  ? RefinedQueryFirst<R>   
    : T extends RefinedQueryAll<infer R>
      ? RefinedQueryAll<R>
      : T extends RefinedQuerySome<infer R>
        ? RefinedQuerySome<R>
        : T extends QueryRoot<infer R>
          ? QueryRoot<R>
          : T extends QueryFirst
            ? QueryFirst
            : T extends QuerySome
              ? QuerySome
              : T extends QueryAll
              ? QueryAll
              : never;

/**
 * Takes a user's primary or secondary query definitions as input and returns a more
 * compact/elegant representation. The type is not truly changes but it's more manageable 
 * when viewed by humans.
 */
export type QueryDefn<T extends Narrowable> = T extends Record<string, QuerySelector> 
  ? {
    [K in keyof T]: QueryLookup<T[K]>
  }
  : T extends SecondaryQueryDefn<infer P>
    ? {
    [K in keyof T]: T[K] extends Query<P, infer R> 
      ? R extends Awaited<R>
        ? SecondaryQuery<"sync", R>
        : SecondaryQuery<"async", Awaited<R>>
      : unknown;
    }
    :never;


/**
 * Type utility which receives the primary queries as an input and converts type
 * to the expected payload of these queries once executed.
 */
export type PrimaryResults<T extends PrimaryQueries> = {
  [K in keyof T]: T[K] extends { refine: (el: IElement) => infer R }
    ? T[K] extends RefinedQueryFirst<R> ? R : R[]
    : T[K] extends { root: (blocks: RootBlocks) => infer R }
      ? R
      : T[K] extends IElement[]
        ? IElement[]
        : IElement;
};

/**
 * Receives the secondary queries in compact form (e.g., 
 * QueryDefn<SecondaryQueries>) and the transforms that
 * into the actual result payload once the page has been scraped.
 */
export type SecondaryResults<
  TSecondary extends SecondaryQueryDefn<any>
> = {
  [K in keyof TSecondary]: TSecondary[K] extends SecondaryQuery<any, infer R>
    ? R
    : never
};


export type ResultSet = "secondary-only" | "primary + secondary";


/**
 * Type utility which determines the final payload of the
 * queries.
 */
export type QueryResults <
  TPrimary extends PrimaryQueries, 
  TSecondary extends SecondaryQueryDefn<TPrimary>,
  TResultSet extends ResultSet = "primary + secondary"
> = TResultSet extends "secondary-only" 
    ? SimplifyObject< SecondaryResults<TSecondary> >
    : SimplifyObject<
      PrimaryResults<TPrimary> & SecondaryResults<TSecondary>
      >;

/**
 * `SecondaryQueries<T>` are a structured as a dictionary where the keys represent the properties
 * to return in the result set and the values are a function which receives the _results_ of the primary queries 
 * as an input and then can return synchronously or asynchronously.
 */
export type SecondaryQueryDefn<TPrimary extends PrimaryQueries> = Record<
  string,
  Query<TPrimary, any>
> | {};

/**
 * Provides a compact definition of the secondary query and is
 * done after the user has expressed the details as visual 
 * cleanup exercise. It is no different in function to what
 * the user expressed but the generic type expresses
 * more clearly what the queries are doing.
 * 
 * This type can then be also easily converted to it's final
 * form of the actual payload/result once the scrape is done.
 */
export type SecondaryQuery<
  _A extends "sync" | "async", 
  R extends Narrowable
> = <P extends PrimaryResults<PrimaryQueries>>(primary: P) => R;


export type Query<T extends PrimaryQueries, R extends Narrowable> = (primary: PrimaryResults<T>) => R;


export interface ScrapeOptions<
  TName extends string | undefined = undefined,
  TBaseUrl extends Url | undefined = undefined,
  TPrimary extends PrimaryQueries = {},
  TSecondary extends Narrowable = {},
  TResultSet extends ResultSet = "primary + secondary",
> {
  /** 
   * The configuration template this scrape was derived from.
   * 
   * Note: _this will be filled in automatically by `Page`'s scrape()
   * method.
   **/
  from?: TName;

  /**
   * Typically found when scraping from a page template.
   */
   baseUrl?: TBaseUrl;

  /**
   * Secondary queries which are built off inputs from the primary query results
   */
  secondary?: TSecondary & SecondaryQueryDefn<TPrimary>;

  /**
   * By default, if you add **secondary queries** they will be _additive_ to the primary
   * query results but this option let's you decide
   * which behavior you want.
   */
  resultSet?: TResultSet;
}

/**
 * The options available to a consumer who is building a page template
 */
export interface PageOptions<
  TBaseUrl extends Url | undefined,
  TPrimary extends PrimaryQueries,
  TSecondary extends Narrowable,
  TResultSet extends ResultSet,
  TRoutes extends readonly string[] = []
> {
  /**
   * If this template is going to be used across pages
   * with the same starting URL then you can set this 
   * and allow users to use full or partially qualified
   * URLs.
   */
  baseUrl?: TBaseUrl;
  /**
   * Secondary queries which are built off inputs from the primary query results
   */
  secondaryQueries?: TSecondary & SecondaryQueryDefn<TPrimary>;

  /**
   * By default, if you add **secondary queries** they will be _additive_ to the primary
   * query results but if you set this to `true` then only the secondary results will
   * be returned.
   */
  resultSet?: TResultSet;

  routes?: TRoutes;
}

/** 
 * The basic structure which the primary queries
 * extends from 
 */
export type PrimaryQueries = Record<
  string, 
  QuerySelector
>;


/**
 * The default secondary function returns an empty object synchronously
 */
export type EmptySecondary<TPrimary extends PrimaryQueries> = (_: PrimaryResults<TPrimary>) => ({});

/**
 * **ScrapedPage**
 * 
 * The payload/contents of a scraped page.
 */
export type ScrapedPage<
  TName extends string, // name of page template
  TUrl extends Url | undefined, // actual URL used to scrape
  TPrimary extends PrimaryQueries,
  TSecondary extends SecondaryQueryDefn<TPrimary>,
  TResultSet extends ResultSet,
  TBaseUrl extends Url
> = SimplifyObject<
  {
    _url: IfUndefined<
      TUrl,
      `${TBaseUrl}${string}`,
      Exclude<TUrl, undefined>
    >;
    _template: TName;
  } & 
  QueryResults<TPrimary, TSecondary, TResultSet>
>;


/**
 * **Page**
 * 
 * A scraping configuration for a page (or set of pages of similar structure). This configuration
 * can be used to scrape content by calling the provided `scrape` method on this dictionary.
 */
export interface Page<
  TName extends string, 
  TPrimary extends PrimaryQueries,
  TSecondary extends SecondaryQueryDefn<TPrimary> | {},
  TBaseUrl extends Url,
  TResultSet extends ResultSet = "primary + secondary",
  TRoutes extends readonly string[] = []
>  {
  kind: "page template";
  /**
   * The _name_ of the page scraper template
   */
  name: TName;
  /**
   * A definition of all the _selectors_ you are looking for on the page when it's scraped.
   * This is also sometimes referred to as the _primary queries_.
   */
  primaryQueries: QueryDefn<TPrimary>;

  /**
   * You may optionally define _secondary queries_ which are run after the _primary queries_ and
   * receive their values as an input.
   */
  secondaryQueries: QueryDefn<TSecondary>;

  /**
   * By default if secondary queries are defined then their results are _additive_ to the results from
   * the _primary_ queries. If, however, you only need the primary results to feed your secondary queries
   * you can set this flag to `true` to only get back the secondary queries.
   */
  resultSet: TResultSet;

  /**
   * This is just a _reference field_ because while the **type** represents the type you'll get back from
   * the scraping operation the **run time** value is set to null.
   */
  scrapeResultsType: ScrapedPage<
    TName,
    undefined,
    QueryDefn<TPrimary>,
    QueryDefn<TSecondary>,
    TResultSet,
    TBaseUrl
  >;

  /**
   * Call `scrape` to scrape the content from the URL with the current selectors
   */
  scrape: <
    TUrl extends TBaseUrl & RouteSuggestions<TBaseUrl, TRoutes>,
    TRest extends readonly string[] = []
  >(
    /**
     * Specify the URL you are scraping. If the page template
     * has a **base URL** _and_ **routes** then you'll choose the
     * route as a first step and then add an additional sub-route
     * info into the second param.
     */
    url: TUrl,
    ...rest: TRest
  ) => ScrapedPage<TName, PathJoin<TUrl, TRest> & Url, TPrimary, TSecondary, TResultSet, TBaseUrl>;


  /**
   * The _default_ URL to use for this configuration; if not stated than calls to 
   * the `scrape()` method will require that a URL be stated.
   */
  baseUrl: TBaseUrl;

  /**
   * if you want to add commonly used _routes_ off of the base URL then
   * you can do this here and they will be turned into suggestions
   * when some uses the page template to scrape.
   */
  routes: TRoutes;
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

export interface MultiSourceText<T extends string, V extends string = string> {
  source: T;
  value: V;
}