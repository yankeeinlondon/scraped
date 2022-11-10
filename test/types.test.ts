
import { describe, it } from "vitest";
import { IElement } from "@yankeeinlondon/happy-wrapper";
import type { Expect, Equal, ExpectExtends } from "@type-challenges/utils";
import { page } from "src/page";
import { Page, QueryFirst, RefinedQueryFirst } from "src/types";

describe("design-time type testing", () => {

  it("QueryFirst and RefinedQueryFirst", async () => {
    const t = page("testing", {
      title: { first: "head title", refine: el => el.textContent},
      description: { first: "#description" }
    }, {defaultUrl: "https://example.com"});
    type T = typeof t;
    type TSR =  Awaited<ReturnType<T["scrape"]>>;

    type cases = [
      ExpectExtends<
        T, 
        Page<
          "testing", 
          { title: RefinedQueryFirst; description: QueryFirst },
          "https://example.com"
        >
      >,
      Expect<Equal<TSR["title"], string>>,
      ExpectExtends<TSR["description"], IElement>
    ];
    const cases: cases = [true, true, true];

  });
});
