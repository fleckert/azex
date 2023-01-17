[home](/readme.md)

# Authentication


The commands use the [Azure Identity client library for JavaScript](https://www.npmjs.com/package/@azure/identity) for authentication.

Please have a look at https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/identity/identity/README.md for documentation.

## Authenticate via the Azure CLI

To authenticate with the [Azure CLI](https://github.com/Azure/azure-cli) users can run the command `az login` or `az login --use-device-code`.
<br/><br/><br/>
## Authenticate via Azure PowerShell

To authenticate with [Azure PowerShell](https://github.com/Azure/azure-powershell) users can run the `Connect-AzAccount` or `Connect-AzAccount -UseDeviceAuthentication` cmdlet.
<br/><br/><br/>
## Authenticate with Environment variables
[PowerShell documentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables)<br/>
[Bash documentation](https://www.shell-tips.com/bash/environment-variables)

### Service principal with secret

| Variable name         | Value                                   |
| --------------------- | --------------------------------------- |
| `AZURE_CLIENT_ID`     | ID of an Azure AD application           |
| `AZURE_TENANT_ID`     | ID of the application's Azure AD tenant |
| `AZURE_CLIENT_SECRET` | one of the application's client secrets |

### Service principal with certificate

| Variable name                       | Value                                                        |
| ----------------------------------- | ------------------------------------------------------------ |
| `AZURE_CLIENT_ID`                   | ID of an Azure AD application                                |
| `AZURE_TENANT_ID`                   | ID of the application's Azure AD tenant                      |
| `AZURE_CLIENT_CERTIFICATE_PATH`     | path to a PEM-encoded certificate file including private key |
| `AZURE_CLIENT_CERTIFICATE_PASSWORD` | password of the certificate file, if any                     |

### Username and password

| Variable name     | Value                                   |
| ----------------- | --------------------------------------- |
| `AZURE_CLIENT_ID` | ID of an Azure AD application           |
| `AZURE_TENANT_ID` | ID of the application's Azure AD tenant |
| `AZURE_USERNAME`  | a username (usually an email address)   |
| `AZURE_PASSWORD`  | that user's password                    |

<br/><br/><br/>
## Authenticate with DeviceLogin

If the previous methods are not successful, then the [Microsoft identity platform and the OAuth 2.0 device authorization grant flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-device-code) is used.

