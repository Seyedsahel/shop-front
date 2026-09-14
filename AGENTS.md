# Frontend instructions

This repository follows the `nuxt-frontend-architecture` skill.

Use specialized skills when relevant:

- `nuxt-resource-crud` for server-backed resource/list/detail/create/edit/delete work.
- `nuxt-form-pattern` for form drafts, validation, dirty state, submit/reset, and field behavior.
- `nuxt-ui-component` for reusable domain-free components in `components/ui`.
- `nuxt-api-integration` for shared HTTP/API/auth/error/query/upload behavior.

Preserve the dependency direction:

`pages -> domain components -> base UI`, and `pages/stores -> composables/API -> backend`.

Before creating a new store, API wrapper, UI primitive, helper, or type, search for the existing project equivalent. Keep repository exploration narrow and run the smallest meaningful checks after changes.

## RTK

Use RTK for shell operations whenever it has an equivalent command
to reduce context/token usage.

Prefer:

- `rtk git status` instead of `git status`
- `rtk git diff` instead of `git diff`
- `rtk grep` instead of `rg`/`grep`
- `rtk find` instead of `find`
- `rtk read` instead of `cat` for inspecting files
- RTK-supported test/lint/typecheck wrappers where applicable

Do not bypass RTK for supported shell commands unless raw output
is specifically required.
