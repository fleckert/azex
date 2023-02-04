[home](/readme.md)

## Commands

|Command|Sample|
|-|-|
|[devops            ](/docs/commands/devops/readme.md            )||
|&emsp;[permissions ](/docs/commands/devops/permissions/readme.md)||
|&emsp;&emsp;[export](/docs/commands/devops/permissions/export.md)|`azex devops permissions export --organization ... --project ... [--out ...]`|
|&emsp;&emsp;[show  ](/docs/commands/devops/permissions/show.md  )|`azex devops permissions show --organization ... --principalName ... [--project ...] [--out ...]`|
|                                                                ||
|[rbac              ](/docs/commands/rbac/readme.md              )||
|&emsp;[export      ](/docs/commands/rbac/export.md              )|`azex rbac export [--subscription ...] [--out ...]`|
|&emsp;[extend      ](/docs/commands/rbac/extend.md              )|`azex rbac extend --path path-to-rbac-definitions.json [--subscription ...]  [--out ...]`|
|&emsp;[verify      ](/docs/commands/rbac/verify.md              )|`azex rbac verify --path path-to-rbac-definitions.json [--subscription ...] [--out ...]`|
|&emsp;[apply       ](/docs/commands/rbac/apply.md               )|`azex rbac apply --path path-to-rbac-definitions.json [--subscription ...]`|
