Write-Host "Packaging deployment..."
tar --exclude="node_modules" --exclude="target" -czf deployment.tar.gz backend frontend docker-compose.uat.yml

Write-Host "Transferring to VM..."
scp -o StrictHostKeyChecking=no -i C:\Users\Vedant\.gemini\antigravity-ide\scratch\oracle_key2.pem deployment.tar.gz ubuntu@80.225.192.171:/home/ubuntu/futane-agro-app/futane-agro-app/

Write-Host "Extracting and building UAT containers on VM..."
ssh -o StrictHostKeyChecking=no -i C:\Users\Vedant\.gemini\antigravity-ide\scratch\oracle_key2.pem ubuntu@80.225.192.171 "cd /home/ubuntu/futane-agro-app/futane-agro-app && tar -xzf deployment.tar.gz; sudo docker stop futane_agro_frontend_uat || true; sudo docker rm futane_agro_frontend_uat || true; sudo docker rmi -f futane-agro-app_frontend-uat || true; sudo docker-compose -f docker-compose.uat.yml build --no-cache frontend-uat; sudo docker-compose -f docker-compose.uat.yml up -d"

Write-Host "UAT Deployment completed."
