## Motivation

This is a hobby project
- to gain experience with the [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js) and the [Node](https://nodejs.org) ecosystem and 
- to provide command line functionality with Azure related helpers (az with extensions)

<br/>

| [Commands](/docs/commands/readme.md) | |
|-|-|
|[rbac export](/docs/commands/rbac/export.md)|`azex rbac export [--subscription ...] [--out ...]`|
|[rbac extend](/docs/commands/rbac/extend.md)|`azex rbac extend --path path-to-rbac-definitions.json [--subscription ...]  [--out ...]`|
|[rbac verify](/docs/commands/rbac/verify.md)|`azex rbac verify --path path-to-rbac-definitions.json [--subscription ...] [--out ...]`|
|[rbac apply ](/docs/commands/rbac/apply.md )|`azex rbac apply --path path-to-rbac-definitions.json [--subscription ...]`|

<br/>

|[Authentication](/docs/authentication/readme.md)| |
|-|-|
|Authenticate via the Azure CLI|[link](/docs/authentication/readme.md#authenticate-via-the-azure-cli)|
|Authenticate via Azure PowerShell|[link](/docs/authentication/readme.md#authenticate-via-azure-powershell)|
|Authenticate with Environment variables|[Service principal with secret](/docs/authentication/readme.md#service-principal-with-secret)<br/>[Service principal with certificate](/docs/authentication/readme.md#service-principal-with-certificate)<br/>[Username and password](/docs/authentication/readme.md#username-and-password)|
|Authenticate with DeviceLogin|[link](/docs/authentication/readme.md#authenticate-with-devicelogin)|

<br/>

|[Configuration](/docs/configuration/index.md)| |
|-|-|
|[subscription](/docs/configuration/subscription.md)| how the subscription id is resolved |
|[tenantId](/docs/configuration/tenantId.md)| how the tenant id is resolved |

<br/>

| How Tos | |
|-|-|
|[Installation](/docs//installation/readme.md)| `npm install && npm run build && npm install -g`|
|[Testing](/docs//testing/readme.md)| `npm run test` |
