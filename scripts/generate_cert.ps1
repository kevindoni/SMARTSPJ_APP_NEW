$cert = New-SelfSignedCertificate -Type Custom -Subject "CN=SmartSPJ-Local" -KeyUsage DigitalSignature -FriendlyName "SmartSPJ Local Cert" -CertStoreLocation "Cert:\CurrentUser\My" -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3", "2.5.29.19={text}")
$password = ConvertTo-SecureString -String "123456" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "smartspj_reborn.pfx" -Password $password
Write-Host "Certificate created: smartspj_reborn.pfx"
