---
'@journeyapps/powersync-sdk-web': patch
---

Improved Server Side Rendering support: Client now does not throw exceptions if used Server Side. DB calls will return empty results, allowing pages to be constructed server side and hydrated with data on the client side.

Improved TypeScript typings from `@journeyapps/wa-sqlite`.
