# PowerSync Web SDK

This monorepo contains the packages for PowerSync's Web SDK.

## Structure

### Demos

Demo applications are located in the `/demos/` directory.

 - [demos/powersync-nextjs-demo](./demos/powersync-nextjs-demo/README.md): A NextJS 14 Todo list application.


### Packages

SDK packages are located in the `/packages/` directory.

 - [packages/powersync-sdk-web](./packages/powersync-sdk-web/README.md) contains the core PowerSync Web SDK code.

## Getting started

This monorepo uses PNPM.

```bash
pnpm install
```

```bash 
pnpm build:packages
```

To run a demo app follow the [getting started](./demos/powersync-nextjs-demo/README.md#getting-started) instructions.