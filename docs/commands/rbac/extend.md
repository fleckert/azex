[home](/readme.md) / [commands](../readme.md) / [rbac](./readme.md) / extend

# rbac extend

Extends an input file to contain properties as in 

```
azex rbac extend --path ./rbac-definitions.json [--out ...] [--subscription ...]
```

sample input files

```json
[
  {
    "scope"             : "/subscriptions/00000000-0000-0000-0000-000000000000",
    "roleDefinitionId"  : "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Microsoft.Authorization/roleDefinitions/11111111-1111-1111-1111-111111111111",,
    "principalId"       : "22222222-2222-2222-2222-222222222222"
  }
]
```

```json
[
  {
    "scope"             : "/subscriptions/00000000-0000-0000-0000-000000000000",
    "roleDefinitionName": "Contributor",
    "principalType"     : "ServicePrincipal",
    "principalName"     : "myServicePrincipal"
  }
]
```

sample output

```json
[
  {
    "scope"             : "/subscriptions/00000000-0000-0000-0000-000000000000",
    "roleDefinitionId"  : "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Microsoft.Authorization/roleDefinitions/11111111-1111-1111-1111-111111111111",
    "principalId"       : "22222222-2222-2222-2222-222222222222",
    "roleDefinitionName": "Contributor",
    "principalType"     : "ServicePrincipal",
    "principalName"     : "myServicePrincipal"
  }
]
```