# @journeyapps/powersync-sdk-web

## 0.1.1

### Patch Changes

- 0e17713: Added ignore directives for Vite to enable bundling the workers correctly.

## 0.1.0

### Minor Changes

- 1fa25e6: Added mock SSR implementation for sync stream client.
  Added better worker and multiple tabs support.
  Added support for Android (without multiple tab support).
  Fixed race conditions in Safari by disabling Shared web workers (multiple tab support).

## 0.0.3

### Patch Changes

- 0bc3758: Improved Server Side Rendering support: Client now does not throw exceptions if used Server Side. DB calls will return empty results, allowing pages to be constructed server side and hydrated with data on the client side.

  Improved TypeScript typings from `@journeyapps/wa-sqlite`.

## 0.0.2

### Patch Changes

- 5d9cbb9: Update package readme

## 0.0.1

### Patch Changes

- af78f76: Initial Alpha version
