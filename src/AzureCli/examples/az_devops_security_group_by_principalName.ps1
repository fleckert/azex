# continuationTokens are not used, therefore might not resolve the entity if not within the first 'page' of results

$Organization='https://dev.azure.com/org'
$ProjectName='projName'
$PrincipalName = "[projName]\Readers"

$descriptor = az devops security group list `
--organization $Organization `
--project $ProjectName `
--detect false `
--scope  project `
--query "graphGroups | [?principalName=='$PrincipalName'].descriptor | [0]" `
--output tsv

az devops security group show `
--organization $Organization `
--detect false `
--id $descriptor