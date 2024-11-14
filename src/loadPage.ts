import fetch from "node-fetch";
import {  createElement, createFragment, Fragment } from "@yankeeinlondon/happy-wrapper";
import { RootBlocks, Url } from "./types";

/**
 * Loads a page into the `@yankeeinlondon/happy-wrapper` (aka, the
 * **Happy DOM** API with some nice utilities wrapping it)
 */
export async function loadPage(url: Url): Promise<[Fragment, RootBlocks]> {
  const res = await fetch(url);
  // const h = (await res.text()).split("\n").slice(0,8).join("\n");
  // console.log("HTML\n", h);

  if (res.ok) {
    const text = await res.text();
    const html = text.replace(/.*(<html.*<\/html>).*/, "$1");
    const frag = createFragment(html);
    const head = html.replace(/.*(<head.*<\/head>).*/, "$1");
    const body = html.replace(/.*(<body.*<\/body>).*/, "$1");
    const root: RootBlocks = {
      text: createFragment(text),
      html: createFragment(html),
      head: createFragment(head),
      body: createFragment(body)
    };
    
    return [frag, root]; 
  } else {
    throw new Error(
      `Unable to load the page for the URL: ${url} [${res.status}, ${res.statusText}].`
    );
  }
}
