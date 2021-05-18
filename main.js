const { app, BrowserWindow, systemPreferences, ipcMain } = require('electron')
const activeWin = require('active-win')
const {hasScreenCapturePermission,
  hasPromptedForPermission, openSystemPreferences} = require('mac-screen-capture-permissions')
const Activity = require('./Activity') 
var activity = new Activity()



function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1200,
    height: 1200,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    }
  })

  if (systemPreferences.isTrustedAccessibilityClient(false) && systemPreferences.getMediaAccessStatus('screen') == "granted") {
    const mainLoop = setInterval(function(){
      let activeWindow = async () => { return await activeWin()}
      activeWindow().then((value) => { if (activity.save(value)) { win.webContents.send('updateView', 'update') } })
    },1000)

    win.loadFile('index.html')
  } else {
    hasScreenCapturePermission()
    win.loadFile('setup.html')
  }
  
  win.webContents.openDevTools()

  win.on("close", (e) => {
    activity.save({
      "bounds": {      
      },
      "title": "Not tracked",    
      "owner": {      
        "name": "Not tracked",            
      },        
      "time": "2020-10-02T23:55:07.125Z"
    })
  })
 
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('get-permissions', (event, arg) => {  
  event.returnValue = {accessibility: systemPreferences.isTrustedAccessibilityClient(false), screen: systemPreferences.getMediaAccessStatus('screen')}
})

ipcMain.on('request-accessability', (event, arg) => {  
  systemPreferences.isTrustedAccessibilityClient(true)
})

ipcMain.on('request-screen', (event, arg) => {  
  openSystemPreferences()
})