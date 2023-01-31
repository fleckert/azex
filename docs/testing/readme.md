[home](/readme.md)

# Testing

Please [log in](../authentication/readme.md) and set the Azure Context subscription id

example:
```
az login
```

and set the [subscription id](/docs/configuration/subscription.md)
and set the environemtVariable `AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN` with Azure DevOps scopes [Graph (read), Project and team (Read)]

and run
```
npm run test
```