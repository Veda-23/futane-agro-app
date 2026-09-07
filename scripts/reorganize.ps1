New-Item -ItemType Directory -Force -Path 'scripts/deploy', 'scripts/dev', 'scripts/testing', 'scripts/monitoring', 'docs/sop', 'archives' | Out-Null

$deployFiles = @('deploy.sh', 'deploy-vm.sh', 'deploy-local.ps1', 'deploy_prod.ps1', 'deploy_uat.ps1', 'deploy_clean_10_dashboards.ps1', 'deploy_grafana.ps1', 'setup-local-domain.ps1', 'setup-ssl.sh', 'renew-ssl.sh', 'watch-dns-ssl.sh')
foreach ($f in $deployFiles) {
    if (Test-Path $f) { Move-Item -Force $f 'scripts/deploy/' }
}

$devFiles = @('start_new_backend.ps1', 'rebuild-backend.bat', 'drop_fks.sh', 'backup-db.ps1', 'backup_strategy.sh')
foreach ($f in $devFiles) {
    if (Test-Path $f) { Move-Item -Force $f 'scripts/dev/' }
}

$testFiles = @('run_e2e_test.py', 'run_full_system_test.ps1', 'test_keys.py', 'test_prod_health.py', 'test_razorpay_order.py')
foreach ($f in $testFiles) {
    if (Test-Path $f) { Move-Item -Force $f 'scripts/testing/' }
}

$monFiles = @('generate_10_dashboards.js', 'generate_10_enterprise_dashboards.js', 'generate_clean_master_dashboard.js', 'generate_dashboard.js', 'generate_dynatrace_master_dashboard.js', 'import_grafana_dashboards.py', 'l1-command-center.json')
foreach ($f in $monFiles) {
    if (Test-Path $f) { Move-Item -Force $f 'scripts/monitoring/' }
}

$docFiles = @('project_sop_documentation.md', 'uat_production_sop.md')
foreach ($f in $docFiles) {
    if (Test-Path $f) { Move-Item -Force $f 'docs/sop/' }
}

$archFiles = @('deployment.tar.gz', 'grafana.zip')
foreach ($f in $archFiles) {
    if (Test-Path $f) { Move-Item -Force $f 'archives/' }
}

$delFiles = @('null', 'favicon-16.png', 'favicon-32.png', 'logo-64.png', 'logo-192.png', 'logo-256.png', 'logo-512.png', 'logo.svg', 'monochrome-dark.svg', 'monochrome-light.svg')
foreach ($f in $delFiles) {
    if (Test-Path $f) { Remove-Item -Force $f }
}

Write-Host "Directory reorganization completed successfully."
