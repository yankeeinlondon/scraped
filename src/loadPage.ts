import fetch from "node-fetch";
import { createDocument, HappyDoc } from "@yankeeinlondon/happy-wrapper";
import { Url } from "./types";

/**
 * Loads a page into the `@yankeeinlondon/happy-wrapper` (aka, the
 * **Happy DOM** API with some nice utilities wrapping it)
 */
export async function loadPage(url: Url): Promise<HappyDoc> {
  const res = await fetch(url);
  if (res.ok) {
    const html = createDocument(await res.text()) as HappyDoc;
    return html;
  } else {
    throw new Error(
      `Unable to load the page for the URL: ${url} [${res.status}, ${res.statusText}].`
    );
  }
}
