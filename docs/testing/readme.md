[home](/readme.md)

# Testing

Please [log in](../authentication/readme.md) and set the Azure Context subscription id

example:
```
az login
```

and set the [subscription id](/docs/configuration/subscription.md)

and set the environemtVariable `AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN` with Azure DevOps scopes [Graph (read), Project and team (Read)] in the shell to debug the tests or in the settings.json to run the tests
```
"jest.nodeEnv": {
    "AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN": "...."
}
```

and run
```
npm run test
```