[home](/readme.md) / [commands](/docs/commands/readme.md) / [devops](/docs/commands/devops/readme.md) / [permissions](/docs/commands/devops/permissions/readme.md) / show

# devops permissions tokens

see https://learn.microsoft.com/en-us/azure/devops/organizations/security/security-glossary?view=azure-devops#token

> Tokens are arbitrary strings representing resources in Azure DevOps. Token format differs per resource type, however hierarchy and separator characters are common between all tokens. For details, see REST API Security.
>Each family of Azure DevOps resources (work items, Git repositories, an so on) is secured using a different namespace. Each security namespace contains zero or more ACLs. Each ACL contains a token, an inherit flag and a set of zero or more ACEs. Each ACE contains an identity descriptor, an allowed permissions bitmask and a denied permissions bitmask.

> For Azure DevOps Services, you can manage tokens and namespaces using the [az devops security permission](https://learn.microsoft.com/en-us/cli/azure/devops/security/permission?view=azure-cli-latest) commands. 

The [az devops security permission](https://learn.microsoft.com/en-us/cli/azure/devops/security/permission?view=azure-cli-latest) commands use the  `--token` parameter.

The command `azex devops permissions tokens --organization ... --project ... [--out ...]` helps to resolve the values for these tokens.

