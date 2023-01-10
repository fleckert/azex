[home](/readme.md)

# rbac export

Export the Azure Role Based Access Control assignments and roleDefinitions to json and markdown files.

```
azex rbac export [--out ...] [--subscription ...]
```

This combines `az role assignment list --all` and `az role definition list` and creates 'optinionated' json and markdown output files.