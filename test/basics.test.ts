import { scrape } from "src/scrape";
import { isElement, select } from "@yankeeinlondon/happy-wrapper";
import { describe, it, expect} from "vitest";

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
});
