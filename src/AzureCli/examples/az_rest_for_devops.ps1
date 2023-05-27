$tenant='tenant.onmicrosoft.com'
$organization='org'

az login `
    --tenant $tenant `
    --allow-no-subscriptions

az rest `
    --uri      "https://dev.azure.com/$organization/_apis/projects" `
    --method   'GET' `
    --resource '499b84ac-1321-427f-aa17-267ca6975798' `
    --output   json