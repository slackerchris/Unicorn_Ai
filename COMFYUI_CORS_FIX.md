# ComfyUI CORS Fix - October 6, 2025

## Issue
ComfyUI was returning **403 Forbidden** errors when the Web UI (running on port 8000) tried to make requests to ComfyUI (port 8188).

### Error Message
```
WARNING: request with non matching host and origin localhost:8188 != localhost:8000, returning 403
```

## Root Cause
ComfyUI has built-in CORS (Cross-Origin Resource Sharing) protection that blocks requests from different origins. Since the Web UI runs on `localhost:8000` and ComfyUI runs on `localhost:8188`, they are considered different origins.

## Solution
Added the `--enable-cors-header "*"` flag to all ComfyUI startup commands to allow cross-origin requests from any origin.

## Files Modified

### 1. `start_comfyui.sh`
**Before**:
```bash
python main.py --listen 0.0.0.0 --port 8188 --lowvram
```

**After**:
```bash
python main.py --listen 0.0.0.0 --port 8188 --lowvram --enable-cors-header "*"
```

### 2. `start_all.sh`
**Before**:
```bash
nohup python main.py --normalvram --listen 0.0.0.0 --port 8188 > ../outputs/logs/comfyui.log 2>&1 &
```

**After**:
```bash
nohup python main.py --normalvram --listen 0.0.0.0 --port 8188 --enable-cors-header "*" > ../outputs/logs/comfyui.log 2>&1 &
```

### 3. `start_all_services.sh`
**Before**:
```bash
python main.py --listen 0.0.0.0 --port 8188 > ../outputs/logs/comfyui.log 2>&1 &
```

**After**:
```bash
python main.py --listen 0.0.0.0 --port 8188 --enable-cors-header "*" > ../outputs/logs/comfyui.log 2>&1 &
```

## Testing

### Verified ComfyUI is Running
```bash
$ ss -tuln | grep 8188
tcp   LISTEN 0      128      0.0.0.0:8188      0.0.0.0:*
```

### Verified No CORS Warnings
```bash
$ tail -20 outputs/logs/comfyui.log | grep -E "WARNING|CORS"
# No warnings found! ✅
```

### Verified API Works
```bash
$ curl -s http://localhost:8188/system_stats | python3 -m json.tool
{
    "system": {
        "os": "posix",
        "ram_total": 67302219776,
        "ram_free": 56319209472,
        "comfyui_version": "0.3.62",
        ...
    }
}
```

## Status
✅ **FIXED** - ComfyUI now accepts requests from the Web UI without CORS errors.

## Notes
- The `*` wildcard in `--enable-cors-header "*"` allows requests from any origin
- For production deployments, you may want to restrict this to specific domains
- This fix is required for the Web UI to generate images via ComfyUI
