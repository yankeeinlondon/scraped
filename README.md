# Scraped

> A type-safe API to scrape web content

## Installation

Install using your favorite **npm** package manager:

```bash
pnpm add scraped
```

## Usage

The basic usage pattern can be done in a lazy or immediate fashion:

1. Lazily configure a page you want to scrape with `page`:

    Imagine we will want to scrape a site on some interval or based on a user event but we want to configure the information we're interested in up front `https://example.com`. We could that with code something like this:

    ```ts
    import { page } from "scraped";
    const example = page("example", {
        title: { first: "head title" },
        image: { first: `meta[property="og:image"]` },
        hrefs: { all: `a` }
    });
    ```

    This will turn `example` into a strongly typed _configuration_ for the scraping you'd like to perform but will not actually perform the scraping operation until the provided `scrape` method is called:

    ```ts
    const results = await example.scrape("https://example.com");
    ```

2. Scrape and Configure as one step:

    Sometimes the partial application / lazy loading approach isn't of particular value and in those cases you can simply jump to the action with:

    ```ts
    import { scrape } from "scraped";
    const results = await scrape("https://example.com", {
        title: { first: "head title" },
        image: { first: `meta[property="og:image"]` },
        hrefs: { all: `a` }
    });
    ```

## The Scraping API

### Building Blocks

In the **Usage** section we showed two _types_ of queries which are easy to perform for your scraping needs but didn't explicitly call this out so let's start with that. As you already saw, you create a key-value pair of things you'd like to extract from the page:

- the _keys_ in the key-value pair are the names of the things you'd like to refer to
- the _values_ are the "query" you're performing
- in the Usage section we saw the following query types:
  - **`QueryFirst`** - identified by the `{ first: selector }` property; this will return either a DOM Element or null depending on whether the selector can be found.
  - **`QueryAll`** - identified by the `{ all: selector }` property; this will always return an array of DOM Elements (though if the selector is not found the array will be empty)

These two query types are probably all you really need as once you have the DOM's element you can drill down further into the details you're explicitly interested in. That said, it's often nice get back the _precise_ attribute, text, html, etc. that you're looking for as a strongly typed return type. In the next section we'll cover how you can achieve this.

### `el` Based Refinement

Since the two building block queries we covered in the prior section both attempt to provide the user with a DOM Element (specifically it will be typed using the [Happy Dom](https://github.com/capricorn86/happy-dom)'s `IElement` structure) there are two _refinements_ which can get you a lot further in extracting _exactly_ what you want: `RefinedQueryFirst` and `RefinedQueryAll`. Let's use the same example code but more _refined_ (imagine dijon mustard versus yellow mustard):

```ts
const result = await scrape("https://example.com", {
    title: { first: "head title", refine: el => el?.textContent },
    image: { first: `meta[property="og:image"]`, refine: el => el?.textContent },
    hrefs: { all: `a`, refine: el => el.getAttribute("href") }
});
```

Now with this simple addition to our querying skills we get back useful _final_ content for the scraping. The _type_ of result will be:

```ts
interface Result {
    _from: "__immediate__"; // if you'd used a lazy-loaded template then the name of it
    _url: "https://example.com";
    title: string | undefined;
    image: string | undefined;
    hrefs: string[]
}
```

In this example we had a very simple job of converting an `IElement` into a scalar value but you can pass in any function you like and assuming the function is strongly typed we'll assign your resulting output in as the typed result type of your function.

### `some` Filtering

We talked about the `QueryAll` filter and it provides _all_ elements which meet your selector criterion. There is a mild variant on the `QueryAll` and `RefinedQueryAll` which are the `QuerySome` and `RefinedQuerySome`. Let's use our prior "all" example and change it to a "some" example:

```ts
const result = await scrape("https://example.com", {
    hrefs: { 
        some: `a`, 
        where: el => el.className.split(" ").includes("foobar"),
        refine: el => el.getAttribute("href") 
    }
});
```

Now we have the **hrefs** of links on the page which contain the class "foobar" but not the others.

### Secondary Queries

When a page is scraped and all selectors are turned into values you are given another opportunity to refine your results with _secondary queries_. A secondary query is simply a callback function which receives all the values of the primary values to work with.

To illustrate this let's use the case where we expect a unique **id** of `modules` to exist as a heading on the page but rather than the content we're interested in being _nested_ inside this element it is actually the next sibling element which contains the actual module definitions:

```ts
import { page, select } from "scraped";

const crateModules = page("crate", {
    modules: { first: "#modules", refine: el => el.nextElementSibling },
}, {
    secondary: {
        moduleList: ()
    }
})
```
