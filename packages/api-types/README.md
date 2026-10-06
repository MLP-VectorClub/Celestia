# MLP VectorClub API type definitions

These type definitions are generated based on the MLP Vector Club's public OpenAPI specifications.

They can be utilized in any TypeScript-based applications to refer to the latest types provided by the application.

## Usage

Make sure TypeScript is configured in your project, then simply install the type definitions package with your favourite package manager:

```shell
# Via NPM
$ npm install @mlp-vectorclub/api-types
# Via YARN
$ yarn add @mlp-vectorclub/api-types
```

In your TypeScript code, simply import the necessary types from the package:

```ts
import { Appearance } from '@mlp-vectorclub/api-types';

const value: Appearance = {/* … */};
```

## Building

By default the types are built from the OpenAPI document of the Luna commit pinned in `luna-api.lock` (the file `docs/openapi/api-docs.json` that Luna keeps in source control, downloaded from GitHub and checked against the lock's sha256), so builds and tests do not depend on what is deployed. Run `pnpm build`.

- Pin another Luna commit (after Luna changed its API and was pushed): `pnpm --filter @mlp-vectorclub/api-types lock <commit>` (a branch or tag works too, the default is the tip of `main`), then commit `luna-api.lock` together with the Celestia change that needs it.
- To build against something else (a locally running Luna, a document that is not pushed yet) make a copy of `.env.example` named `.env` and set `API_JSON_PATH` to a URL or file path; it takes precedence over the lock.

Check the build output for the location of the generated files. The process also creates an optimized copy of the schema JSON alongside the type definition file.
