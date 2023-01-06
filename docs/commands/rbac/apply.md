[home](/readme.md)

# rbac apply

Add and delete Azure Role Based Access Control assignments to align with a given input file.

```
azex rbac apply --subscription <subscription-id> --path ./rbac-apply-<subscription-id>.min.json
```

Sync existing Azure Role Based Access Control assignments with the given input file.

```
example input file
[
  {
    "scope": "/subscriptions/00000000-0000-0000-0000-000000000000",
    "roleDefinitionId": "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Microsoft.Authorization/roleDefinitions/11111111-1111-1111-1111-111111111111",
    "principalId": "22222222-2222-2222-2222-222222222222"
  }
]
```