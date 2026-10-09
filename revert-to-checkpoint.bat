@echo off
echo =======================================================
echo REVERTING TO CHECKPOINT: checkpoint-before-all-tabs-update
echo =======================================================
git reset --hard checkpoint-before-all-tabs-update
echo.
echo Revert completed successfully! Your workspace is back to the checkpoint state.
pause
