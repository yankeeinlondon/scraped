import { IElement, select } from "@yankeeinlondon/happy-wrapper";
import { ifString } from "inferred-types";
import { refine } from "src/refine";

export interface LinkMeta {
  /**
   * The text which the link wraps
   */
  text: string;
  /**
   * The HTML which the link wraps
   */
  html: string;
  /**
   * The hyper-link reference
   */
  href: string;
  /**
   * Distinguishes links to _internal_ and _external_ sources as well as
   * "anchor links" which link to another part of the same page
   */
  kind: "internal" | "external" | "anchor";
  attrs: Record<string, string>;
}

/**
 * **LinkFilter**
 * 
 * Receives `LinkMeta` structure and is required to return a boolean value
 */
export type LinkFilter = (l: LinkMeta) => boolean;

export interface LinkOptions<T extends string | null> {
  /**
   * If you want to links from only a _section_ of the page
   * then provide a "selector" to first reduce the scope of
   * search.
   */
  selector?: T;
  /**
   * After all links are identified, you can filter the list
   * based on the values of the attributes of `LinkMeta`.
   */
  filter?: LinkFilter;
}

function elementToMeta(el: IElement): LinkMeta {
 return {
  href: el.getAttribute("href"),
  text: el.textContent,
  html: el.innerHTML,
  kind: el.getAttribute("href").startsWith("#")
    ? "anchor"
    : el.getAttribute("href").startsWith("http")
      ? "external"
      : "internal",
  attrs: el.getAttributeNames().reduce((acc, key) => {
      acc = key === "href" 
        ? acc 
        : { ...acc, [key]: el.getAttribute(key) };
      return acc;
    }, {} as Record<string, string>)
  };
}

/**
 * **links**
 * 
 * A scraper utility succinctly gather links on a page (or subset of the page) and returns
 * `LinkMeta[]` from scraper.
 * 
 * @param options use a _selector_ to only look on part of the page, _filter_ to reduce results, etc.
 */
export const links = <
  T extends string | null = null
>(options?: LinkOptions<T>) => {
  const o: Required<LinkOptions<T>> = {
    selector: (options?.selector || null) as T,
    filter: () => true,
    ...options
  };

  return ifString(
    options?.selector as T,
    i => refine(
      { first: i }, 
      el => select(el)
        .findAll("img")
        .filter(h => o.filter(elementToMeta(h)))
        .map(elementToMeta)
    ),
    refine(
      { some: "img", where: el => o.filter(elementToMeta(el)) },
      el => elementToMeta(el)
    )
  );
};