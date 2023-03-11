[home](/readme.md) / [commands](../readme.md) / [rbac](./readme.md) / verify

# rbac verify

Verify that current Azure Role Based Access Control assignments are in sync with a given input file.

```
azex rbac verify --path ./rbac-definitions.min.json [--out ...] [--subscription ...]
```

Checks wether existing Azure Role Based Access Control assignments are in sync with the given input file.

example input file
```json
[
  {
    "scope": "/subscriptions/00000000-0000-0000-0000-000000000000",
    "roleDefinitionId": "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Microsoft.Authorization/roleDefinitions/11111111-1111-1111-1111-111111111111",
    "principalId": "22222222-2222-2222-2222-222222222222"
  }
]
```