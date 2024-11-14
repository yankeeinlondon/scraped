import { IElement } from "@yankeeinlondon/happy-wrapper";
import { ifString } from "inferred-types";
import { refine } from "src/refine";
import { select } from "..";

/**
 * The meta data retrieved from h2,h3,h4 heading utilities
 */
export interface HeadingMeta {
  /** the text found in the heading block */
  text: string;
  /** any attributes that were attached to the heading block element */
  attrs: Record<string, string>;
}
/**
 * **HeaderFilter**
 * 
 * Receives `HeadingMeta` structure and is required to return a boolean value
 */
export type HeaderFilter = (meta: HeadingMeta) => boolean;

export interface HeaderOptions<T extends string | null> {
  /**
   * If you want to search only a _section_ of the page
   * then provide a "selector" to first reduce the scope of
   * search.
   */
  selector?: T;
  /**
   * After all header elements are identified, you can filter the list
   * based on the values of the attributes of `HeadingMeta`.
   */  
  filter?: HeaderFilter;
}

function elementToMeta(el: IElement): HeadingMeta {
  return {
    text: el.textContent,
    attrs: el.getAttributeNames().reduce((acc, key) => {
      acc = { ...acc, [key]: el.getAttribute(key) };
      return acc;
    }, {} as Record<string, string>)
  };
}

/**
 * **h1**
 * 
 * A scraper utility to succinctly scrape H1 elements from a page. The results
 * from scraping will be an array of `HeadingMeta` objects. 
 * 
 * @param options optionally choose from the typed/documented options
 */
 export const h1 = <T extends string | null = null>(options?: HeaderOptions<T>) => {
  const o: Required<HeaderOptions<T>> = {
    selector: (options?.selector || null) as T,
    filter: () => true,
    ...options
  };

  return ifString(
    o.selector,
    sel => refine({ first: sel }, el => select(el)
        .findAll("h1")
        .filter(h => o.filter(elementToMeta(h)))
        .map(elementToMeta)
    ),
    refine({ 
        some: "h1", 
        where: el => o.filter(elementToMeta(el))
    }, el => elementToMeta(el))
  );
};


/**
 * **h2**
 * 
 * A scraper utility to succinctly scrape H2 elements from a page. The results
 * from scraping will be an array of `HeadingMeta` objects. 
 * 
 * @param options optionally choose from the typed/documented options
 */
 export const h2 = <T extends string | null = null>(options?: HeaderOptions<T>) => {
  const o: Required<HeaderOptions<T>> = {
    selector: (options?.selector || null) as T,
    filter: () => true,
    ...options
  };

  return ifString(
    o.selector,
    sel => refine({ first: sel }, el => select(el)
        .findAll("h2")
        .filter(h => o.filter(elementToMeta(h)))
        .map(elementToMeta)
    ),
    refine({ 
        some: "h2", 
        where: el => o.filter(elementToMeta(el))
    }, el => elementToMeta(el))
  );
};

/**
 * **h3**
 * 
 * A scraper utility to succinctly scrape H3 elements from a page. The results
 * from scraping will be an array of `HeadingMeta` objects. 
 * 
 * @param options optionally choose from the typed/documented options
 */
 export const h3 = <T extends string | null = null>(options?: HeaderOptions<T>) => {
  const o: Required<HeaderOptions<T>> = {
    selector: (options?.selector || null) as T,
    filter: () => true,
    ...options
  };

  return ifString(
    o.selector,
    sel => refine({ first: sel }, el => select(el)
        .findAll("h3")
        .filter(h => o.filter(elementToMeta(h)))
        .map(elementToMeta)
    ),
    refine({ 
        some: "h3", 
        where: el => o.filter(elementToMeta(el))
    }, el => elementToMeta(el))
  );
};

/**
 * **h4**
 * 
 * A scraper utility to succinctly scrape H4 elements from a page. The results
 * from scraping will be an array of `HeadingMeta` objects. 
 * 
 * @param options optionally choose from the typed/documented options
 */
 export const h4 = <T extends string | null = null>(options?: HeaderOptions<T>) => {
  const o: Required<HeaderOptions<T>> = {
    selector: (options?.selector || null) as T,
    filter: () => true,
    ...options
  };

  return ifString(
    o.selector,
    sel => refine({ first: sel }, el => select(el)
        .findAll("h4")
        .filter(h => o.filter(elementToMeta(h)))
        .map(elementToMeta)
    ),
    refine({ 
        some: "h4", 
        where: el => o.filter(elementToMeta(el))
    }, el => elementToMeta(el))
  );
};