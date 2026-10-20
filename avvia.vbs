Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strPath

' Avvia Sossoldi in modo 100% invisibile in background (zero finestre CMD, nessun browser automatico)
WshShell.Run "javaw -jar backend\target\backend-0.0.1-SNAPSHOT.jar", 0, False
