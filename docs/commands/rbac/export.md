[home](/readme.md)

# rbac export

Export the Azure Role Based Access Control assignments and roleDefinitions to json and markdown files.

```
azex rbac export --subscription <subscription-id> --pathOut ./rbac-export
```

This combines `az role assignment list --all` and `az role definition list` and creates 'optinionated' json output files.