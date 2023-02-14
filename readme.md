
| [Commands](/docs/commands/readme.md) | |
|-|-|
|[devops permissions](/docs/commands/devops/permissions/readme.md) [export      ](/docs/commands/devops/permissions/export.md)|`azex devops permissions export --organization ... --project ... [--out ...]`|
|[devops permissions](/docs/commands/devops/permissions/readme.md) [show        ](/docs/commands/devops/permissions/show.md  )|`azex devops permissions show --organization ... --principalName ... [--project ...] [--out ...]`|
|[devops permissions tokens  ](/docs/commands/devops/permissions/tokens.md  )|`azex devops permissions tokens --organization ... --project ... [--out ...]`|
|                                                                              ||
|[rbac](/docs/commands/rbac/readme.md) [export                    ](/docs/commands/rbac/export.md              )|`azex rbac export [--subscription ...] [--out ...]`|
|[rbac](/docs/commands/rbac/readme.md) [extend                    ](/docs/commands/rbac/extend.md              )|`azex rbac extend --path path-to-rbac-definitions.json [--subscription ...]  [--out ...]`|
|[rbac](/docs/commands/rbac/readme.md) [verify                    ](/docs/commands/rbac/verify.md              )|`azex rbac verify --path path-to-rbac-definitions.json [--subscription ...] [--out ...]`|
|[rbac](/docs/commands/rbac/readme.md) [apply                     ](/docs/commands/rbac/apply.md               )|`azex rbac apply --path path-to-rbac-definitions.json [--subscription ...]`|

<br/>

|[Authentication](/docs/authentication/readme.md)| |
|-|-|
|Azure CLI|[how to...](/docs/authentication/readme.md#authenticate-via-the-azure-cli)|
|Azure PowerShell|[how to...](/docs/authentication/readme.md#authenticate-via-azure-powershell)|
|Environment variables|[Service principal with secret](/docs/authentication/readme.md#service-principal-with-secret)<br/>[Service principal with certificate](/docs/authentication/readme.md#service-principal-with-certificate)<br/>[Username and password](/docs/authentication/readme.md#username-and-password)|
| DeviceLogin|[how to...](/docs/authentication/readme.md#authenticate-with-devicelogin)|

<br/>

|[Configuration](/docs/configuration/index.md)| |
|-|-|
|[subscription](/docs/configuration/subscription.md)| how the Azure subscription id is resolved |
|[tenantId](/docs/configuration/tenantId.md)| how the Azure Active Directory tenant id is resolved |
|[Environment Variables](/docs/configuration/environment-variables.md)| what environment variables are used |

<br/>

| How Tos | |
|-|-|
|[Installation](/docs//installation/readme.md)| `npm install && npm run build && npm install -g`|
|[Testing](/docs//testing/readme.md)| `npm run test` |

<br/>

|Motivation ||
|-|-|
| this is a hobby project                                                                        | #1 motivation, play around, it might be useful, it might not be ... it's just my time  |
| gain experience with the [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js) | I am experienced in [.Net](https://dotnet.microsoft.com/), [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/), [Azure PowerShell](https://learn.microsoft.com/en-us/powershell/azure/get-started-azureps), [ARM](https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/), [Bicep](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview?tabs=bicep), [Terraform](https://learn.microsoft.com/en-us/azure/developer/terraform/overview), ...|
| provide command line functionality with Azure related helpers                                  | these helpers are opinionated... product owner, sponsor, development, testing, ... all (we/myself and I) share the same opinion |


happy hacking,
Florian