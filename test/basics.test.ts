import { scrape } from "src/scrape";
import { createElement, isElement, select } from "@yankeeinlondon/happy-wrapper";
import { describe, it, expect} from "vitest";
import { meta } from "src/utility-helpers";
import { getAttributesOfElement } from "src/utils";

const URL = "https://docs.rs/tauri/latest/tauri" as const;

describe("basics", () => {
  it("scraping known site with just 'first' query param", async () => {
    const results = await scrape(URL, {
      modules: { first: "#main-content" },
      macros: { first: "#macros" }
    });

    expect(results.modules).toBeTruthy();
    expect(results.macros).toBeTruthy();
    expect(isElement(results.modules)).toBeTruthy();
    expect(isElement(results.macros)).toBeTruthy();
  });

  it("scraping with 'first' and refining with 'el'", async () => {
    const results = await scrape(URL, {
      modules: { first: "#modules", refine: el => el.nextElementSibling.className },
    });
  
    expect(results.modules).toBe("item-table");
  });

  it("getAttributesOfElement", () => {
    const el = createElement(`<script nonce>
  function hello() { return "hello" }
</script>`);
    const props = getAttributesOfElement(el);
    expect("nonce" in props).toBeTruthy();
  });

  it("scraping with 'first', refining with 'el' with select", async () => {
    const results = await scrape(URL, {
      modules: { 
        first: "#modules", 
        refine: el => select(el.nextElementSibling).mapAll(".item-row")(i => ({
            name: select(i).findFirst(".item-left a")?.textContent,
            href: select(i).findFirst(".item-left a")?.getAttribute("href"),
            description: select(i).findFirst(".item-right")?.textContent
        }))
      },
    });
    
    expect(Array.isArray( results.modules)).toBeTruthy();
    expect(results.modules.length).toBeGreaterThan(0);
    for (const m of results.modules) {
      expect("name" in m).toBeTruthy();
    }
  });

  it("using the supplied 'meta' composition returns expected results", async() => {
    const docs_rs = await scrape("https://docs.rs", {
      meta: meta()
    });

    expect(typeof docs_rs.meta?.title?.value).toBe("string");
    expect(docs_rs.meta?.title?.source).toBe("title");
    expect(docs_rs.meta?.title?.value).toBe("Docs.rs");
    // eslint-disable-next-line unicorn/text-encoding-identifier-case
    expect(docs_rs.meta?.charset).toBe("UTF-8");
    // has a nonce embedded
    expect(docs_rs.meta.scriptInlineBlocks.length).greaterThan(0);


    const github = await scrape("https://github.com", {
      meta: meta()
    });

    expect(github.meta.apple?.apple_itunes_app).toBeTruthy();
    expect(github.meta.manifest).toBeTruthy();
    expect(github.meta.twitter).toBeTruthy();
    expect(github.meta.has_twitter_props).toBe(true);
    expect(github.meta.og).toBeTruthy();
    expect(github.meta.has_og_props).toBe(true);
    expect(github.meta.icon?.href).toBeTruthy();
    expect(github.meta.image?.value).toBeTruthy();
  });
});
