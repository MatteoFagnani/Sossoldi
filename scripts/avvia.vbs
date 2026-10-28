Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
WshShell.CurrentDirectory = strPath

' Se Sossoldi e' gia' in ascolto sulla porta 10000, esci senza avviare una seconda istanza
intReturn = WshShell.Run("cmd /c netstat -ano | findstr :10000 | findstr LISTENING", 0, True)
If intReturn = 0 Then
    WScript.Quit 0
End If

' Avvia Sossoldi in modo 100% invisibile in background (zero finestre CMD, System Tray abilitato)
WshShell.Run "javaw -Xms64m -Xmx256m -XX:+UseSerialGC -jar backend\target\backend-0.0.1-SNAPSHOT.jar --logging.file.name=data/sossoldi.log", 0, False
