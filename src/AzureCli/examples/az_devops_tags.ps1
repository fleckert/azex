# list existing tags

$tenant='tenant.onmicrosoft.com'
$organization='org'
$project='project'

az login `
   --tenant $tenant `
   --allow-no-subscriptions

az rest `
    --uri      "https://dev.azure.com/$organization/$project/_apis/wit/tags" `
    --method   'GET' `
    --resource '499b84ac-1321-427f-aa17-267ca6975798' `
    --output   json `
    --query    'value | [].name'