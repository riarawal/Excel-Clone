const electron=require("electron");
const app=electron.app;

function createWindow()
{
    const win=new electron.BrowserWindow({
        width: 800,
        height: 600
    })
}
app.whenReady().then(createWindow);