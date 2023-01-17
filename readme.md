## Motivation

This is a hobby project
- to gain experience with the [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js) and the [Node](https://nodejs.org) ecosystem and 
- to provide command line functionality with Azure related helpers (az with extensions)


## Authentication

see [Authentication](/docs/authentication/readme.md)



## Configuration

see [Configuration](/docs/configuration/index.md)


|Parameter|Comments|
|-|-|
|[subscription](/docs/configuration/subscription.md)| how to set the subscription id |
|[tenantId](/docs/configuration/tenantId.md)| how the tenant id is resolved |

## Commands

|Command|Sample|
|-|-|
|[rbac export](/docs/commands/rbac/export.md)|`azex rbac export [--subscription ...] [--out ...]`|
|[rbac extend](/docs/commands/rbac/extend.md)|`azex rbac extend --path path-to-rbac-definitions.json [--subscription ...]  [--out ...]`|
|[rbac verify](/docs/commands/rbac/verify.md)|`azex rbac verify --path path-to-rbac-definitions.json [--subscription ...] [--out ...]`|
|[rbac apply ](/docs/commands/rbac/apply.md )|`azex rbac apply --path path-to-rbac-definitions.json [--subscription ...]`|

## Testing

see [Testing](/docs//testing/readme.md)
