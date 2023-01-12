[Configuration](/docs/configuration/index.md)

Resolving the `tenantId` works as in

1. the environment variable AZURE_TENANT_ID is used<br/>
[PowerShell documentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables)<br/>
[Bash documentation](https://www.shell-tips.com/bash/environment-variables)<br/><br/>
1. the current Azure CLI context is used<br/>
`az account show --query tenantId --output tsv`<br/><br/>
1. the current Azure PowerShell Core context is used<br/>
`pwsh -Command "Get-AzContext | Select-Object -Expand Subscription | Select-Object -Expand TenantId`<br/><br/>
1. the current Azure PowerShell context is used<br/>
`powershell -Command "Get-AzContext | Select-Object -Expand Subscription | Select-Object -Expand TenantId`<br/><br/>
1. the accessToken for https://management.azure.com is evaluated