import { select } from "@yankeeinlondon/happy-wrapper";
import { getAttributesOfElement, hrefAndAttrs, inlineBlock, nameValueOther, removeUndefinedProps } from "src/utils";
import { AppleApp, HrefAndAttrs, InlineBlock, MicrosoftApp, MultiSourceText, MultiSourceUrl, OpenGraph, RefinedQueryRoot, TwitterMeta } from "src/types";

export interface FontInfo {
  type: string;
  href: string;
  preloaded: boolean;
  deferred: boolean;
  /** other attributes found on the script tag */
  attrs: Record<string, string>;
}


export interface ValueOther<V extends string = string> {
  value: V;
  other: Record<string, string>;
}

export type ScriptInfo = {
  type: string;
  deferred: boolean;
  /** other attributes found on the script tag */
  attrs: Record<string, string>;
} & (
  {  
    /** a reference to the URI location where the script can be found */
    src: string;
  } | {
    /**
     * The interior text found inside an inline script block
     */
    code: string;
  }
);

export interface MetaProps {
  /**
   * Sources the "title" from a page from from the listed sources (in order of precedence)
   */
  title?: MultiSourceText<"title" | "og:title" | "twitter:title" | "og:site_name">;
  /**
   * Retrieves the _description_ from the `<meta name="description" ...>` if available
   * but then will backfill it with `og:description` or then `twitter:description` if not found.
   */
  description?: MultiSourceText<"description" | "og:description" | "twitter:description">;
  icon?: HrefAndAttrs;
  mask_icon?: HrefAndAttrs;

  /**
   * Pages which want to be Microsoft Apps sometimes provide meta
   * tags with `name` set to the dasherized version of these props
   * and the _value_ provided in the `content` property.
   */
  microsoft?: MicrosoftApp;

  /**
   * Pages which want to be Apple Apps sometimes provide meta
   * tags with `name` set to the dasherized version of these props
   * and the _value_ provided in the `content` property.
   */
  apple?: AppleApp;

  author?: ValueOther;
  viewport?: string;
  charset?: string;
  manifest?: HrefAndAttrs;

  htmlAttrs: Record<string, string>;
  bodyAttrs: Record<string, string>;

  /**
   * Attempts to fill in with `og:image` and `twitter:img:src`
   */
  image?: MultiSourceUrl<"og:image" | "twitter:img:src">;
  /** the "alt" description for the image (if available) */
  image_alt?: MultiSourceText<"og:image:alt" | "twitter:img:alt">;

  /**
   * a boolean flag which indicates whether any OG (Open Graph)
   * tags were found
   */
  has_og_props: boolean;
  /**
   * Any OpenGraph meta-data that was found on page's meta tags
   */
  og: OpenGraph;

  /**
   * a boolean flag which indicates whether any twitter meta tags
   * were found
   */
  has_twitter_props: boolean;
  /**
   * Any Twitter meta data tags found in the page's meta tags
   */
  twitter: TwitterMeta;

  /** any style references to a URI via the link tag */
  styleRefs: HrefAndAttrs[];
  /** any inline styling found on the page */
  styleInlineBlocks: InlineBlock[];
  /** any inline script blocks found on the page */
  scriptInlineBlocks: InlineBlock[];
  /** any script references to a URI via the link tag */
  scriptRefs: HrefAndAttrs[];
  /** any font references to a URI via the link tag */
  fonts: HrefAndAttrs[];
  /**
   * the innerHTML of any `noscript` blocks if it exists
   */
  noscript: string[];
}

export interface MetaOptions {
  includeStylesheets?: boolean;
  includeInlineStyle?: boolean;
  includeScripts?: boolean;
  includeFonts?: boolean;
  includeDnsPrefetch?: boolean;
  includePreConnect?: boolean;
}

export const meta = (_options?: MetaOptions): RefinedQueryRoot<MetaProps> => {
  return { 
    root: true, 
    doc: doc => {
      const html = select(doc).findFirst("html", "Couldn't find <html></html> block!");
      const head = select(doc).findFirst("head", "Couldn't find <head></head> section!");
      const body = select(doc).findFirst("body", "Couldn't find <body></body> section!");
      const htmlAttrs = getAttributesOfElement(html);
      const bodyAttrs = getAttributesOfElement(body);
      const meta = select(head).findAll("meta");
      const links = select(head).findAll("link");
      const has_og_props = meta.some(m => m.getAttribute("property")?.startsWith("og:"));
      const has_twitter_props = meta.some(m => m.getAttribute("name")?.startsWith("twitter:"));
      const title = select(head).findFirst("title")?.innerHTML;
      const ogTitle = meta.find(el => el.getAttribute("property")?.startsWith("og:title"))?.getAttribute("content");
      const ogSiteName = meta.find(el => el.getAttribute("property")?.startsWith("og:site_name"))?.getAttribute("content");
      const twitterTitle = meta.find(el => el.getAttribute("name")?.startsWith("twitter:title"))?.getAttribute("content");
      const description = meta.find(el => el.getAttribute("name") === "description")?.getAttribute("content");
      const ogDescription = meta.find(el => el.getAttribute("property")?.startsWith("og:description"))?.getAttribute("content");
      const twitterDescription = meta.find(el => el.getAttribute("name")?.startsWith("twitter:description"))?.getAttribute("content");

      const ogImage = meta.find(el => el.getAttribute("property")?.startsWith("og:image"))?.getAttribute("content");
      const ogImageAlt = meta.find(el => el.getAttribute("property")?.startsWith("og:image:alt"))?.getAttribute("content");
      const ogUrl = meta.find(el => el.getAttribute("property")?.startsWith("og:url"))?.getAttribute("content");

      const og: OpenGraph = removeUndefinedProps({
        title: ogTitle,
        description: ogDescription,
        site_name: ogSiteName,
        image: ogImage,
        image_alt: ogImageAlt,
        image_width: meta.find(el => el.getAttribute("property")?.startsWith("og:image_width"))?.getAttribute("content"),
        image_height: meta.find(el => el.getAttribute("property")?.startsWith("og:image_height"))?.getAttribute("content"),
        type: meta.find(el => el.getAttribute("property")?.startsWith("og:type"))?.getAttribute("content"),
        url: ogUrl
      });

      const twitter: TwitterMeta = removeUndefinedProps({
        title: twitterTitle,
        description: twitterDescription,
        image: meta.find(el => el.getAttribute("name")?.startsWith("twitter:image:src"))?.getAttribute("content"),
        image_alt: meta.find(el => el.getAttribute("name")?.startsWith("twitter:image:alt"))?.getAttribute("content"),
        site: meta.find(el => el.getAttribute("name")?.startsWith("twitter:site"))?.getAttribute("content"),
        card: meta.find(el => el.getAttribute("name")?.startsWith("twitter:card"))?.getAttribute("content"),
      });

      const apple: AppleApp = removeUndefinedProps({
        apple_itunes_app: nameValueOther(meta, ["name", "apple-itunes-app"], "content"),
        apple_mobile_web_app_capable: nameValueOther(meta, ["name", "apple-mobile-web-app-capable"], "content"),
        apple_mobile_web_app_status_bar_style: nameValueOther(meta, ["name", "apple-mobile-web-app-status-bar-style"], "content"),
        apple_mobile_web_app_title: nameValueOther(meta, ["name", "apple-mobile-web-app-title"], "content"),
        apple_touch_icon: hrefAndAttrs(links.find(el => el.getAttribute("rel") === "apple-touch-icon")),
      });

      const microsoft: MicrosoftApp = removeUndefinedProps({
        msapplication_square70x70logo: nameValueOther(meta, ["name", "msapplication-square70x70logo"], "content"),
        msapplication_square150x150logo: nameValueOther(meta, ["name", "msapplication-square150x150logo"], "content"),
        msapplication_wide310x150logo: nameValueOther(meta, ["name", "msapplication-wide310x150logo"], "content"),
        msapplication_square310x310logo: nameValueOther(meta, ["name", "msapplication-square310x310logo"], "content"),
        msapplication_TileColor: nameValueOther(meta, ["name", "msapplication-TileColor"], "content"),
      });

      const author = meta.find(el => el.getAttribute("name") === "author");

      return removeUndefinedProps({
        htmlAttrs,
        bodyAttrs,
        title: title 
          ? { source: "title", text: title }
          : ogTitle
            ? { source: "og:title", text: ogTitle }
            : twitterTitle
              ? { source: "twitter:title", text: twitterTitle }
              : ogSiteName
              ? { source: "og:site_name", text: ogSiteName }
              : undefined
        ,
        description: description
          ? { source: "description", text: description }
          : ogDescription
            ? {source: "og:description", text: ogDescription }
            : twitterDescription
              ? { source: "twitter:description", text: twitterDescription }
              : undefined,
        image: ogImage
          ? { source: "og:image", url: ogImage }
          : twitter.image
            ? { source: "twitter:img:src", url: twitter.image }
            : undefined,
        image_alt: ogImageAlt
          ? { source: "og:image:alt", text: ogImageAlt}
          : twitter.image_alt
            ? { source: "twitter:img:alt", text: twitter.image_alt }
            : undefined,
        icon: hrefAndAttrs(links.find(el => el.getAttribute("rel") === "icon")),
        mask_icon: hrefAndAttrs(links.find(el => el.getAttribute("rel") === "mask-icon")),
        has_og_props,
        has_twitter_props,
        og,
        twitter,

        viewport: meta.find(el => el.getAttribute("name") === "viewport")?.getAttribute("content"),
        charset: meta.find(el => el.getAttribute("charset").length > 0)?.getAttribute("charset"),
        manifest: hrefAndAttrs(links.find(el => el.getAttribute("rel") === "manifest")),
        author: author
          ? { 
            value: author.getAttribute("content"),
            other: getAttributesOfElement(author, "content")
          }
          : undefined,

        apple,
        microsoft,

        noscript: select(head).mapAll("noscript")(el => el.innerHTML),
        styleRefs: links.filter(el => el.getAttribute("rel") === "style").map(hrefAndAttrs),
        styleInlineBlocks: select(head).findAll("style").map(inlineBlock),
        scriptInlineBlocks: select(head).findAll("script").map(inlineBlock),
        scriptRefs: links.filter(el => el.getAttribute("rel") === "script").map(hrefAndAttrs),
        fonts: links.filter(el => el.getAttribute("rel") === "font").map(hrefAndAttrs),
      }) as MetaProps;
    }
  };
};