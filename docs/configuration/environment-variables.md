[home](/readme.md) / [Configuration](/docs/configuration/index.md)

# Environment Variables
 

| Variable name                       | Value                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `AZURE_CLIENT_CERTIFICATE_PASSWORD` | password of the certificate file, if any                                      |
| `AZURE_CLIENT_CERTIFICATE_PATH`     | path to a PEM-encoded certificate file including private key                  |
| `AZURE_CLIENT_ID`                   | ID of an Azure AD application                                                 |
| `AZURE_CLIENT_SECRET`               | one of the application's client secrets                                       |
| `AZURE_PASSWORD`                    | that user's password                                                          |
| `AZURE_TENANT_ID`                   | ID of the application's Azure AD tenant                                       |
| `AZURE_USERNAME`                    | a username (usually an email address)                                         |
| `AZURE_SUBSCRIPTION_ID`             | Azure Subscription id                                                         |
| `AZURE_DEVOPS_EXT_PAT`              | Azure DevOps scopes [Graph (read), Project and team (Read), Identity (Read), Code(Read), Work(Read)] <br/> see https://learn.microsoft.com/en-us/azure/devops/cli/log-in-via-pat  |
| `AZURE_DEVOPS_EXT_TENANTID`         | Azure DevOps Active Directory tenant <br/> see https://dev.azure.com/your-organization/_settings/organizationAad |
| `AZURE_DEVOPS_EXT_ORGANIZATION`     | Azure DevOps organization name                                                |
| `AZURE_DEVOPS_EXT_PROJECT`          | Azure DevOps project name                                                     |
