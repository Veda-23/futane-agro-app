' FUTANE AGRO ERP — SILENT BACKGROUND DATABASE UI LAUNCHER
' Launches PostgreSQL Database UI (port 5433) with zero console window popups (< 25MB RAM)

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
strProjectDir = fso.GetParentFolderName(strScriptDir)

WshShell.CurrentDirectory = strProjectDir

' Check if node is running postgres-ui-server.mjs already
Dim objWMIService, colProcesses
Set objWMIService = GetObject("winmgmts:\\.\root\cimv2")
Set colProcesses = objWMIService.ExecQuery("Select * from Win32_Process Where Name = 'node.exe' AND CommandLine Like '%postgres-ui-server.mjs%'")

If colProcesses.Count = 0 Then
    ' Start server silently (0 = hide window)
    WshShell.Run "node scripts\postgres-ui-server.mjs", 0, False
    WScript.Sleep 1500
End If

' Always open http://localhost:5433 in default browser
WshShell.Run "http://localhost:5433", 1, False
