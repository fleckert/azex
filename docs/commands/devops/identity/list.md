[home](/readme.md) / [commands](/docs/commands/readme.md) / [devops](/docs/commands/devops/readme.md) / [identity](/docs/commands/devops/identity/readme.md) / list

# devops identity list

`azex devops identity list --tenantId ... --organization ... [--project ...] [--out ...]`

```
{
  "tenantId"    : "...",
  "organization": "...",
  "project"     : "...",
  "files": {
    "json"    : "<out>-<organization>-<project>-identities.json",
    "markdown": "<out>-<organization>-<project>-identities.md",
    "html"    : "<out>-<organization>-<project>-identities.html"
  }
}
```

this command lists the identities for graphSubjects within the organization (and project) in json, markdown and html formats.

|PrincipalName|Identity|
|-|-|
|some-group|Microsoft.TeamFoundation.Identity;xxx|
|some-user |Microsoft.TeamFoundation.Identity;yyy|