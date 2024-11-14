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

### The `select()` Helper

This library internally leverages the `@yankeeinlondon/happy-wrapper` repo which provides useful utilities for working with Happy DOM. One of the really nice utilities that it implements -- and this library proxies out to its users -- is the `select()` utility.

The `select(el)` utility consumes an element and then provides a useful API surface which includes:

- `findAll(sel): IElement[]`
- `findFirst(sel): IElement | null`
- `mapAll(sel)<O>(el: IElement => O)`

The entire API surface is typed and has useful doc comments to help guide you in its use.

### Scrape Composition and Provided Patterns

When you're defining a scraping _template_ with `page()` you have a high-level form of reuse for scraping but there are opportunities to gain reuse at the individual key/value pairing of a definition too.

As an example, it may be very common for pages to have "links" on the page which you want to scrape off. Let's say that you're interested in just gaining a list of all the link URLs on the page:

```ts
const template = page("example", {
    links: { all: "a", refine: el => el.getAttribute("href") }
});
```

This will work and isn't all that much text to put a future page that needs the same thing but what if you not only wanted to get links, you wanted to know the classes on each, maybe you wanted to distinguish between links _within_ the site versus externally and maybe you only wanted to match the links inside one part of the page rather then the page at large. Now a reuse pattern for `links` sounds like a better idea and you can create one for yourself very easily.

Reuse in this case is probably best attained at the `QuerySelector` level which in our example above is the _value_ of the `links` key. If we understand that every key/value pair in our definition of a page template has a _value_ of `QuerySelector` we can build a higher-level function to do our bidding.

So long as our _helper_ function returns a `QuerySelector` like we see below:

```ts
const links: (selector: string): QuerySelector = { ... };
```

we can replace our link scraping with something like this:

```ts
const template = page("example", {
    links: links(".main-content")
});
```

This simple example shows the pattern and this library exports more powerful versions of the `links` helper along with several others:

- `links(options)` - find links in all or part of the page, optionally provide a _filter_ function to eliminate some based on link attributes
- `images(options)` - find all images in some or part of the page, distinguish between "self-hosted" and external
- `h1(opt)`, `h2(opt)`, `h3(opt)`, `h4(opt)` - extract heading level text and heading attributes
- `meta(options)` - get valuable meta data that often exists on a page including:
  - `title` - the text in the title attribute
  - `description` - a description of page if found in `<meta>` tag
  - `image` - an image to represent the page if found in `<meta>` tag

All provided helpers are strongly typed with good comments to help you use them in a self-documenting manner. Also, if you're wanting to create your own abstracts have a look on Github at the source for these to help you get a good starting point.

### Secondary Queries

When you've scraped a page, you'll often have information now which leads you to want to scrape additional documents. The _secondary queries_ feature is intended to help you with this.

As a "for example", imagine we want to scrape the first page using our "home" template but then any internal links it finds in the "top stories" section, we want to to scrape with the "stories" template:

```ts
import { page, links } from "scraped";

const stories = page("stories", { ... });
const home = page(
    // template name
    "home", 
    // primary selectors
    {
        links: links({selector: ".top-stories", filter: (ctx) => ctx.kind === "internal" })
    },
    // secondary queries
    {
        secondary: h => {
            stories: await h.links
                .map(l => l.href)
                .map(href => stories.scrape(href))
        }
    }
);
```

As soon as the home page is scraped it will pass the _initial_ scrape results -- as `h` above -- to help you build the `stories` property as a _secondary_ query. When all secondary results are produced the dictionary of both the initial and secondary queries will be returned. Note that:

1. If a secondary query takes the same name of an initial query then the secondary query's result will _override_ the value of the initial query.
2. If you want to _only_ get back the secondary results you can set the option `onlySecondary` to **true**.

As a final note -- if you haven't already detected this capability/risk -- since secondary queries can call page templates that in turn have secondary queries this allows a recursive scraping process which can be both powerful as well as dangerous if not used carefully. Enjoy the matches but keep water close.
