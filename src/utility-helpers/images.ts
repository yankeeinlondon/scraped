import { IElement, select } from "@yankeeinlondon/happy-wrapper";
import { ifString, Keys } from "inferred-types";
import { refine } from "src/refine";

const IMAGE_FORMATS = [
  "png", "jpg", "gif", "avif", "webp"
] as const;
type ImageFormat = Keys<typeof IMAGE_FORMATS> | "unknown";

/**
 * The meta data retrieved from h2,h3,h4 heading utilities
 */
 export interface ImageMeta {
  /** the source reference to the image */
  src: string;
  /** The "alt text" for the image */
  alt: string;
  /**
   * The image format (if known)
   */
  format: ImageFormat;
  /** any other attributes that were attached to the image tag */
  attrs: Record<string, string>;
}

/**
 * **ImageFilter**
 * 
 * Receives `ImageMeta` structure and is required to return a boolean value
 */
 export type ImageFilter = (meta: ImageMeta) => boolean;

export interface ImageOptions<T extends string | null = null> {
  /**
   * If you want to search only a _section_ of the page
   * then provide a "selector" to first reduce the scope of
   * search.
   */
  selector?: T;
  /**
   * After all images are identified, you can filter the list
   * based on the values found in `ImageMeta`
   */  
  filter?: ImageFilter;
}

function elementToMeta(el: IElement): ImageMeta {
  return {
    src: el.getAttribute("src"),
    alt: el.getAttribute("alt"),
    format: (IMAGE_FORMATS.find(i => el.getAttribute("src").endsWith(`.${i}`) || "unknown")) as ImageFormat,
    attrs: el.getAttributeNames().reduce((acc, key) => {
      acc = ["src", "alt"].includes(key)
        ? acc
        : { ...acc, [key]: el.getAttribute(key) };
      return acc;
    }, {} as Record<string, string>)
  };
}

/**
 * **images**
 * 
 * A scraper utility to succinctly scrape all images from a page.
 * 
 * @param options optionally choose from the typed/documented options
 */
export const images = <
  T extends string | null = null
>(options?: ImageOptions<T>) => {
  const o: Required<ImageOptions<T>> = {
    selector: (options?.selector || null) as T,
    filter: () => true,
    ...options
  };

  return ifString(
    options?.selector as T,
    href => refine(
      { first: href }, 
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