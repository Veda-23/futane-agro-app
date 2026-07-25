Write-Host "========================================================="
Write-Host "DEPLOYING EXACT 10 TARGET ENTERPRISE GRAFANA DASHBOARDS"
Write-Host "========================================================="

$SSH_KEY = "C:\Users\Vedant\.gemini\antigravity-ide\scratch\oracle_key2.pem"
$SERVER = "ubuntu@80.225.192.171"
$REMOTE_PATH = "/home/ubuntu/futane-agro-app/futane-agro-app/monitoring/grafana/dashboards"

Write-Host "1. Wiping remote dashboards folder..."
ssh -o StrictHostKeyChecking=no -i $SSH_KEY $SERVER "rm -f $REMOTE_PATH/*.json"

Write-Host "2. Uploading 10 target Enterprise dashboards..."
scp -o StrictHostKeyChecking=no -i $SSH_KEY c:\Users\Vedant\.gemini\antigravity-ide\scratch\futane-agro-app\grafana_dashboards_clean\*.json "${SERVER}:${REMOTE_PATH}/"

Write-Host "3. Deleting legacy DB dashboards and importing target 10..."
scp -o StrictHostKeyChecking=no -i $SSH_KEY import_grafana_dashboards.py "${SERVER}:/home/ubuntu/import_grafana_dashboards.py"
ssh -o StrictHostKeyChecking=no -i $SSH_KEY $SERVER "python3 /home/ubuntu/import_grafana_dashboards.py"

Write-Host "========================================================="
Write-Host "DEPLOYMENT COMPLETED SUCCESSFULLY"
Write-Host "========================================================="
