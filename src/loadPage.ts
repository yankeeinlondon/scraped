import fetch from "node-fetch";
import {  createFragment, Fragment } from "@yankeeinlondon/happy-wrapper";
import { Url } from "./types";

/**
 * Loads a page into the `@yankeeinlondon/happy-wrapper` (aka, the
 * **Happy DOM** API with some nice utilities wrapping it)
 */
export async function loadPage(url: Url): Promise<Fragment> {
  const res = await fetch(url);
  // const h = (await res.text()).split("\n").slice(0,8).join("\n");
  // console.log("HTML\n", h);

  if (res.ok) {
    const text = await res.text();
    const trimmed = text.replace(/.*(<html.*<\/html>).*/, "$1");
    const doc = createFragment(trimmed);
    
    return doc;
  } else {
    throw new Error(
      `Unable to load the page for the URL: ${url} [${res.status}, ${res.statusText}].`
    );
  }
}
