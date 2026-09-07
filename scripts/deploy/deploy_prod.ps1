Write-Host "Packaging deployment..."
tar --exclude="node_modules" --exclude="target" -czf deployment.tar.gz .env backend frontend docker-compose.prod.yml

Write-Host "Transferring to PROD VM..."
scp -o StrictHostKeyChecking=no -i C:\Users\Vedant\.gemini\antigravity-ide\scratch\oracle_key2.pem deployment.tar.gz ubuntu@80.225.192.171:/home/ubuntu/futane-agro-app/futane-agro-app/

Write-Host "Extracting and building PROD containers on VM..."
ssh -o StrictHostKeyChecking=no -i C:\Users\Vedant\.gemini\antigravity-ide\scratch\oracle_key2.pem ubuntu@80.225.192.171 "cd /home/ubuntu/futane-agro-app/futane-agro-app && tar -xzf deployment.tar.gz && sudo docker stop futane_agro_frontend_prod 2>/dev/null || true && sudo docker rm futane_agro_frontend_prod 2>/dev/null || true && sudo docker rmi -f futane-agro-app_frontend-prod 2>/dev/null || true && sudo docker-compose -f docker-compose.prod.yml build --no-cache frontend-prod && sudo docker-compose -f docker-compose.prod.yml up -d --remove-orphans"

Write-Host "PROD Deployment completed."
