Write-Host "Deploying Grafana Dashboard JSON..."
scp -o StrictHostKeyChecking=no -i C:\Users\Vedant\.gemini\antigravity-ide\scratch\oracle_key2.pem c:\Users\Vedant\.gemini\antigravity-ide\scratch\futane-agro-app\l1-command-center.json ubuntu@80.225.192.171:/home/ubuntu/futane-agro-app/futane-agro-app/monitoring/grafana/dashboards/

Write-Host "Restarting Grafana Container..."
ssh -o StrictHostKeyChecking=no -i C:\Users\Vedant\.gemini\antigravity-ide\scratch\oracle_key2.pem ubuntu@80.225.192.171 "cd /home/ubuntu/futane-agro-app/futane-agro-app/monitoring && sudo docker-compose restart grafana"

Write-Host "Dashboard Deployed Successfully."
