/* eslint-disable unicorn/consistent-function-scoping */
import { describe, expect, it } from "vitest";
import { IElement } from "@yankeeinlondon/happy-wrapper";
import type { Expect, Equal, ExpectExtends } from "@type-challenges/utils";
import { page } from "src/page";
import {  Page, PrimaryResults, QueryDefn, QueryFirst,  QueryResults,  QuerySelector,  RefinedQueryFirst, RefinedQuerySome, RouteSuggestions, SecondaryQuery, SecondaryQueryDefn } from "src/types";
import { h2, HeadingMeta,  LinkMeta,  links } from "src/utility-helpers";
import { pathJoin } from "inferred-types";


describe("design-time type testing", () => {
  it("compress a user configured query dictionary with QueryDefn<T>", () => {

    const build = <D extends Record<string, QuerySelector>>(dict: D) => dict;
    const queries = build({
      title: { first: "head title", refine: el => el.textContent },
      h2: h2() 
    });
    type Q = typeof queries;
    type R = QueryDefn<Q>;

    type cases = [
      //
      Expect<Equal<
        R,
        { title: RefinedQueryFirst<string>; h2: RefinedQuerySome<HeadingMeta> }
      >>
    ];
    const cases: cases = [true];
  });

  
  it("PrimaryResults<T> transforms a QueryDefn into results type", () => {
    const build = <D extends Record<string, QuerySelector>>(dict: D) => dict;
    const queries = build({
      title: { first: "head title", refine: el => el.textContent },
      h2: h2() 
    });
    type Q = typeof queries;
    type QD = QueryDefn<Q>;
    type R = PrimaryResults<QD>;
    
    type cases = [
      Expect<Equal<
        R,
        { title: string; h2: HeadingMeta[] }
      >>
    ];
    const cases: cases = [ true ];
  });

  
  it("QueryDefn<T> transforms the user's secondary queries into a more visually compact form", () => {
    const primary = <D extends Record<string, QuerySelector>>(dict: D) => dict;
    const primaryQueries = primary({
      title: { first: "head title", refine: el => el.textContent },
      h2: h2(),
      links: links(),
    });
    type Q = typeof primaryQueries;
    type QD = QueryDefn<Q>;

    const s = <S extends SecondaryQueryDefn<QD>>(s: S) => s;

    const secondary = s({
      numbers: async () => {
        return [1,2,3];
      },
      strings: () => {
        return ["foo", "bar"];
      },
      internalLinks: p => p.links.filter(i => i.kind === "internal").map(i => i.href)
    });

    type S = typeof secondary;
    type S2 = QueryDefn<S>;

    type cases = [
      Expect<Equal<S2, {
        numbers: SecondaryQuery<"async", number[]>;
        strings: SecondaryQuery<"sync", string[]>;
        internalLinks: SecondaryQuery<"sync", string[]>;
      }>>
    ];
    const cases: cases = [true ];
  });

  
  it("QueryResults<T> transforms all page/scrape params into the final result shape", () => {
    const p = <D extends Record<string, QuerySelector>>(dict: D) => dict;
    const primary = p({
      title: { first: "head title", refine: el => el.textContent },
      h2: h2(),
      links: links(),
    });
    type P = typeof primary;
    type PQ = QueryDefn<P>;

    const s = <S extends SecondaryQueryDefn<P>>(s: S) => s;
    const secondary = s({
      numbers: async () => {
        return [1,2,3];
      },
      strings: () => {
        return ["foo", "bar"];
      },
      internalLinks: p => p.links.filter(i => i.kind === "internal").map(i => i.href)
    });
    type S = typeof secondary;
    type SQ = QueryDefn<S>;

    type R1 = QueryResults<PQ, SQ, "primary + secondary">;
    type R2 = QueryResults<PQ, SQ, "secondary-only">;
    
    type cases = [
      Expect<Equal<R1, {
        title: string;
        h2: HeadingMeta[];
        links: LinkMeta[];
        numbers: number[];
        strings: string[];
        internalLinks: string[];
      }>>,
      Expect<Equal<R2, {
        numbers: number[];
        strings: string[];
        internalLinks: string[];
      }>>,
    ];
    const cases: cases = [true ,true ];
  });

  it("QueryFirst and RefinedQueryFirst", async () => {
    const t = page("testing", {
      title: { first: "head title", refine: el => el.textContent },
      description: { first: "#description" }
    }, {baseUrl: "https://example.com"});
    
    type T = typeof t;
    type TSR = T["scrapeResultsType"];

    type cases = [
      Expect<ExpectExtends<
        T, 
        Page<
          "testing", 
          { title: RefinedQueryFirst<string>; description: QueryFirst },
          {},
          "https://example.com",
          "primary + secondary"
        >
      >>,
      Expect<Equal<TSR["title"], string>>,
      ExpectExtends<TSR["description"], IElement>
    ];
    const cases: cases = [true, true, true];

  });

  it("Secondary queries and a default URL", () => {
    const linkorama = page(
        "links", 
        {
          anchor: links({filter: i => i.kind === "anchor"}),
          internal: links({filter: i => i.kind === "internal"})
        },
        {
          secondaryQueries: {
            internalCount: l => l.internal.length,
            anchorCount: l => l.anchor.length
          },
          baseUrl: "https://link.o.rama"
        }
    );
    type L = typeof linkorama;
    type S = L["scrapeResultsType"];

    type cases = [
      Expect<Equal<S, {
        _url: `https://link.o.rama${string}`;
        _template: "links";
        anchor: LinkMeta[];
        internal: LinkMeta[];
        internalCount: number;
        anchorCount: number;
      }>>
    ];
    const cases: cases = [true];
    
  });

  it("RouteSuggestions utility works as expected", () => {
    type S =  RouteSuggestions<
      "https://site.com/", 
      readonly ["foo", "bar", "baz"]
    >;
    const fn = <T extends S, R extends readonly string[]>(i: T, ...rest: R) => pathJoin(i, ...rest);
    // secondary param is added
    const v1 = fn("https://site.com/foo", "foo");
    const v2 = fn("https://site.com/bar", "/foo");
    // can ignore suggestions
    const v3 = fn("https://site.com/", "root", "path");
    // can extend a suggestion
    const v4 = fn("https://site.com/baz/boo");

    // runtime
    expect(v1).toBe("https://site.com/foo/foo");
    expect(v2).toBe("https://site.com/bar/foo");
    expect(v3).toBe("https://site.com/root/path");
    expect(v4).toBe("https://site.com/baz/boo");

    // design time
    type cases = [
      //
      Expect<Equal<typeof v1, "https://site.com/foo/foo">>,
      Expect<Equal<typeof v2, "https://site.com/bar/foo">>,
      Expect<Equal<typeof v3, "https://site.com/root/path">>,
      Expect<Equal<typeof v4, "https://site.com/baz/boo">>,
    ];
    
    const c: cases = [ true, true, true, true ];
    expect(c).toBe(c);
  });

  
  it("Routes configured in page setup, made available when scraping.", () => {
    const routes = page("routes", {
      links: links()
    }, {
      baseUrl: "https://site.com",
      routes: ["foo", "bar", "baz"]
    });
    routes.scrape("https://site.com");
    
    type cases = [
      /** type tests */
    ];
    const cases: cases = [];
  });
  
});
