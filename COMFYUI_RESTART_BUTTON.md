# ComfyUI Restart Button Feature - October 6, 2025

## New Feature
Added a **Restart ComfyUI** button to the Web UI for easy service recovery when image generation isn't working.

## Why This is Useful

### Common Scenarios:
- ComfyUI crashes or becomes unresponsive
- Image generation requests time out
- VRAM issues cause ComfyUI to hang
- After system updates or changes
- When switching between different workflows

### Before:
```bash
# Had to SSH into server and run commands
./service.sh restart comfyui
```

### After:
- 🖱️ Click "Model Manager" in Web UI
- 🔄 Click "Restart ComfyUI" button
- ✅ Done! (takes ~10 seconds)

## Implementation

### Backend Endpoint (main.py)
Added `POST /comfyui/restart` endpoint:

```python
@app.post("/comfyui/restart")
async def restart_comfyui():
    """Restart ComfyUI service using service.sh script"""
    # Calls ./service.sh restart comfyui
    # Returns success/failure status
```

**Features:**
- Uses the service.sh script (proven reliable)
- Proper error handling
- Returns success/failure status
- Logs restart attempts

### Frontend UI (index.html)
Added service control section at top of Model Manager modal:

```html
<div class="setting-group">
    <h3>🔧 Service Control</h3>
    <p class="setting-description">Restart ComfyUI if image generation isn't working</p>
    <button class="btn btn-secondary" id="restartComfyuiBtn">
        <i class="fas fa-sync-alt"></i> Restart ComfyUI
    </button>
</div>
```

**Placement:** First section in Model Manager modal (easy to find)

### Frontend Logic (app.js)
Added `restartComfyUI()` method with:

**User Experience:**
1. Confirmation dialog before restart
2. Button shows spinning icon during restart
3. System message confirms success
4. Button shows checkmark when done
5. Automatic 10-second wait for ComfyUI to fully start

**Code:**
```javascript
async restartComfyUI() {
    // Confirm action
    // Disable button and show spinner
    // Call API endpoint
    // Wait for ComfyUI to start
    // Show success state
}
```

## User Flow

1. **Problem**: "Image generation isn't working"
2. **Action**: Click "Model Manager" → "Restart ComfyUI"
3. **Confirmation**: Dialog asks to confirm
4. **Waiting**: Button shows "Restarting..." with spinner (~10s)
5. **Success**: Button shows checkmark, system message confirms
6. **Result**: ComfyUI is fresh and ready

## Technical Details

### API Endpoint
- **URL**: `POST /comfyui/restart`
- **Auth**: None (internal service)
- **Response**: `{"success": true, "message": "ComfyUI restarted successfully"}`
- **Method**: Calls `./service.sh restart comfyui` subprocess
- **Timeout**: 30 seconds

### Button States
1. **Normal**: 🔄 "Restart ComfyUI" (enabled, secondary button)
2. **Loading**: ⏳ "Restarting..." (disabled, spinner icon)
3. **Success**: ✅ "Restarted!" (disabled, checkmark, 2s duration)
4. **Back to Normal**: Returns to normal state after success

### Error Handling
- API errors shown as toast notification
- Button returns to normal state on error
- Console error logging for debugging
- Subprocess errors captured and returned

## Files Modified

1. **main.py** (+42 lines)
   - Added `/comfyui/restart` POST endpoint
   - Subprocess call to service.sh
   - Error handling and logging

2. **static/index.html**
   - Added Service Control section
   - Restart button with icon
   - Cache version bumped to v13

3. **static/app.js** (+52 lines)
   - Added event listener for restart button
   - Implemented `restartComfyUI()` method
   - Button state management
   - User feedback messages

4. **service.sh**
   - Improved process detection for API service
   - More reliable working directory checks

## Testing

### Manual Test:
```bash
# 1. Verify ComfyUI is running
./service.sh status

# 2. Test API endpoint
curl -X POST http://localhost:8000/comfyui/restart

# 3. Verify restart worked
./service.sh status

# Result: ✅ All services running
```

### Web UI Test:
1. Open http://localhost:8000
2. Click "Model Manager" 
3. Click "Restart ComfyUI"
4. Confirm dialog
5. Wait ~10 seconds
6. See success message
7. Try generating an image

## Benefits

✅ **User-Friendly**: No terminal access needed  
✅ **Fast Recovery**: Quick fix for common issues  
✅ **Safe**: Confirmation dialog prevents accidents  
✅ **Visual Feedback**: Clear status during restart  
✅ **Reliable**: Uses proven service.sh script  
✅ **Accessible**: Available in Web UI where users work  

## Future Enhancements

Potential additions:
- Restart button for other services (TTS, API)
- Auto-restart on failure detection
- Service health monitoring dashboard
- Automatic recovery for common errors
- Restart history/logs viewer

## Status
🎉 **COMPLETE** - Restart ComfyUI button fully functional in Web UI!
