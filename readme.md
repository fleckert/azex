## Authentication

see [Authentication](/docs/authentication.md)

## Commands

## Examples

### [rbac export](/docs/commands/rbac/export.md)


```
azex rbac export --subscription <subscription-id> --pathOut ./rbac-export
```

### [rbac extend](/docs/commands/rbac/extend.md)


```
azex rbac extend --subscription <subscription-id> --pathIn ./rbac-export-<subscription-id>.min.json --pathOut ./rbac-extend
```


### [rbac verify](/docs/commands/rbac/verify.md)


```
azex rbac verify --subscription <subscription-id> --pathIn ./rbac-export-<subscription-id>.min.json --pathOut ./rbac-verify
```


### [rbac apply](/docs/commands/rbac/apply.md)


```
azex rbac apply --subscription <subscription-id> --path ./rbac-apply-<subscription-id>.min.json
```