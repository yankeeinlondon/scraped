
import { describe, it } from "vitest";
import { IElement } from "@yankeeinlondon/happy-wrapper";
import type { Expect, Equal, ExpectExtends } from "@type-challenges/utils";
import { page } from "src/page";
import { Page, QueryFirst,  RefinedQueryFirst, RefinedQuerySome, Url } from "src/types";
import { h2, HeadingMeta, ImageMeta, images,  LinkMeta,  links } from "src/utility-helpers";

describe("design-time type testing", () => {

  it("QueryFirst and RefinedQueryFirst", async () => {
    const t = page("testing", {
      title: { first: "head title", refine: el => el.textContent},
      description: { first: "#description" }
    }, {defaultUrl: "https://example.com"});
    type T = typeof t;
    type TSR =  Awaited<ReturnType<T["scrape"]>>;

    type cases = [
      Expect<ExpectExtends<
        T, 
        Page<
          "testing", 
          { title: RefinedQueryFirst<string>; description: QueryFirst },
          "https://example.com"
        >
      >>,
      Expect<Equal<TSR["title"], string>>,
      ExpectExtends<TSR["description"], IElement>
    ];
    const cases: cases = [true, true, true];

  });

  it("using a refinement utility provides correct types", () => {
    const t1 = page("images", {
     images: images()
    });
    const t2 = page("images", {
      images: images({selector: ".sidebar"})
    });

    // const t3 = page("next", {
    //   something: next({all: "h2"})
    // });
    // const t4 = page("next", {
    //   something: next({all: "h2"}, el => el.textContent)
    // });

    const t5 = page("links", {
      links: links(),
    });
    const t6 = page("links", {
      links: links({selector: "foobar"}),
    });

    const t7 = page("h2", {
      h2: h2(),
    });
    const t8 = page("h2", {
      h2: h2({selector: "foobar"}),
    });

    type T1 = typeof t1;
    type T2 = typeof t2;
    // type T3 = typeof t3;
    // type T4 = typeof t4;
    type T5 = typeof t5;
    type T6 = typeof t6;
    type T7 = typeof t7;
    type T8 = typeof t8;

    type cases = [
      Expect<Equal<
        T1, 
        Page<"images", { images: RefinedQuerySome<ImageMeta> }, Url>
      >>,
      Expect<Equal<
        T2, Page<"images", { images: RefinedQueryFirst<ImageMeta[]> }, Url>
      >>,
      Expect<Equal<
        T5, //
        Page<"links", { links: RefinedQuerySome<LinkMeta> }, Url>
      >>,
      Expect<Equal<
        T6, //
        Page<"links", { links: RefinedQueryFirst<LinkMeta[]> }, Url>
      >>,
        Expect<Equal<
        T7, //
        Page<"h2", { h2: RefinedQuerySome<HeadingMeta> }, Url>
      >>,
      Expect<Equal<
        T8, //
        Page<"h2", { h2: RefinedQueryFirst<HeadingMeta[]> }, Url>
      >>,
    ];

    const cases: cases = [true, true, true, true, true, true ];

  });
});
