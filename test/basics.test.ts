import { scrape } from "src/scrape";
import { isElement } from "@yankeeinlondon/happy-wrapper";
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
});
