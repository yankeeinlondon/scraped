import { IElement } from "@yankeeinlondon/happy-wrapper";
import { keys, Keys, KeysWithValue } from "inferred-types";
import { CommonAttributes, HrefAndAttrs, InlineBlock, NameValueOther } from "./types";

export const getAttributesOfElement = <
  E extends readonly string[], 
  A extends {[key: string]: string | undefined} = CommonAttributes
>(el: IElement, ...except: E): Omit<A, Keys<E>> => {
  
  return (
      el.getAttributeNames()
      .reduce((acc, key) => {
        acc = except.includes(key)
          ? acc 
          : { ...acc, [key]: el.getAttribute(key) };
        return acc;
      }, {} as any) 
  ) as unknown as Omit<A, Keys<E>>;
};

export function hrefAndAttrs(el: IElement | undefined): HrefAndAttrs | undefined {
  if (!el) {
    return undefined;
  }

  return {
    href: el.getAttribute("href"),
    attrs: getAttributesOfElement(el, "href")
  };
}

export function nameValueOther<V extends string = string>(els: IElement[], name: [prop: string, value: string], valueProp: string): NameValueOther<V> | undefined {
  const found = els.find(el => el.getAttribute(name[0]) === name[1]);
  return found
    ? {
      props: [name[0], valueProp],
      name: name[1],
      value: found.getAttribute(valueProp) as V,
      attrs: getAttributesOfElement(found, name[0], valueProp)
    } as NameValueOther<V>
    : undefined;
}

export function inlineBlock(el: IElement): InlineBlock {
  return {
    text: el.textContent,
    attrs: getAttributesOfElement(el)
  };
}

export function removeUndefinedProps<T extends {}>(dict: T) {
  const d = {} as Record<any, any>;
  for (const key of keys(dict)) {
    const val = dict[key];
    if (val !== undefined) {
      d[key] = val;
    }
  }

  return d as Omit<T, KeysWithValue<undefined, T>>;
}