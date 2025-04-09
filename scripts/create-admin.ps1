# Prompt for admin credentials
$email = Read-Host "Enter admin email"
$password = Read-Host "Enter admin password" -AsSecureString
$password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

# Run the TypeScript script
npx ts-node scripts/create-admin.ts $email $password 