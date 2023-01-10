[Configuration](/docs/configuration/index.md)

Resolving the `subscriptionId` works as in

1. the `--subscription` parameter value is used<br/><br/>
1. the environment variable AZURE_SUBSCRIPTION_ID is used<br/>
[PowerShell documentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables)<br/>
[Bash documentation](https://www.shell-tips.com/bash/environment-variables)<br/><br/>
1. the current Azure CLI context is used<br/>
`az account show --query id --output tsv`<br/><br/>
1. the current Azure PowerShell Core context is used<br/>
`pwsh -Command "Get-AzContext | Select-Object -Expand Subscription | Select-Object -Expand Id`<br/><br/>
1. the current Azure PowerShell context is used<br/>
`powershell -Command "Get-AzContext | Select-Object -Expand Subscription | Select-Object -Expand Id`<br/><br/>