[home](/readme.md)

# rbac export

Export the Azure Role Based Access Control assignments and roleDefinitions to json and markdown files.

```
azex rbac export [--out ...] [--subscription ...]
```

This combines `az role assignment list --all` and `az role definition list` and creates 'optinionated' json and markdown output files.

|References||
|-|-|
|Azure Role Assignments|Azure CLI<br/>https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-list-cli<br/><br/>Azure PowerShell<br/>https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-list-powershell|
|Azure Role Definitions|https://learn.microsoft.com/en-us/azure/role-based-access-control/role-definitions-list|