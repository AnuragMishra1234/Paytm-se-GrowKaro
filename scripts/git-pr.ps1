param (
    [Parameter(Mandatory=$false)]
    [string]$Branch,
    [Parameter(Mandatory=$false)]
    [string]$Message = "Update changes"
)

# If no branch name given, auto-generate one
if (-not $Branch) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $Branch = "feature/update-$timestamp"
}

Write-Host "Creating separate branch: $Branch" -ForegroundColor Cyan
git checkout -b $Branch

Write-Host "Staging all changes..." -ForegroundColor Cyan
git add -A

Write-Host "Committing changes with message: '$Message'..." -ForegroundColor Cyan
git commit -m $Message

Write-Host "Pushing $Branch to origin..." -ForegroundColor Cyan
git push -u origin $Branch

Write-Host "Creating Pull Request into main..." -ForegroundColor Cyan
try {
    $token = (echo "protocol=https`nhost=github.com`n" | git credential fill | Select-String "^password=(.*)$").Matches.Groups[1].Value
    $headers = @{
        "Authorization" = "Bearer $token"
        "Accept" = "application/vnd.github+json"
        "User-Agent" = "PowerShell"
    }
    $body = @{
        title = $Message
        head = $Branch
        base = "main"
        body = "Automated PR for branch: $Branch`n`nCommit: $Message"
    } | ConvertTo-Json

    $pr = Invoke-RestMethod -Uri "https://api.github.com/repos/AnuragMishra1234/Paytm-se-GrowKaro/pulls" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "`nSuccessfully created Pull Request!" -ForegroundColor Green
    Write-Host "PR URL: $($pr.html_url)" -ForegroundColor Green
} catch {
    Write-Host "`nCould not create PR automatically via API: $_" -ForegroundColor Yellow
    Write-Host "Direct PR creation link:" -ForegroundColor Cyan
    Write-Host "https://github.com/AnuragMishra1234/Paytm-se-GrowKaro/compare/main...$($Branch)?expand=1" -ForegroundColor Cyan
}
