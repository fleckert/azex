$tenant       = 'myTenant.onmicrosoft.com'
$organization = 'myOrganizationName'
$projectName  = 'myProjectName'
$repoName     = 'myRepoName'

az login --tenant $tenant --allow-no-subscriptions

$accessToken = az account get-access-token --resource '499b84ac-1321-427f-aa17-267ca6975798' --query accessToken --output tsv --tenant microsoft.com

git clone "https://$accessToken@dev.azure.com/$organization/$projectName/_git/$repoName"
