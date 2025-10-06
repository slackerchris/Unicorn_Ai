# Prompt Weighting Quick Reference

## Syntax Cheat Sheet

```
(text)          = ×1.1  (10% more attention)
((text))        = ×1.21 (21% more)
(((text)))      = ×1.33 (33% more)

[text]          = ×0.9  (10% less attention)
[[text]]        = ×0.81 (19% less)

(text:1.5)      = ×1.5  (50% more - exact value)
(text:0.7)      = ×0.7  (30% less - exact value)
(text:2.0)      = ×2.0  (100% more - double)
```

## Recommended Values

| Strength | Value | Use Case |
|----------|-------|----------|
| **Subtle** | 1.1-1.2 | Minor emphasis, supporting details |
| **Moderate** | 1.3-1.4 | Important features, quality terms |
| **Strong** | 1.5-1.6 | Key features, focal points |
| **Very Strong** | 1.7-2.0 | Critical elements (use sparingly) |
| **Reduce** | 0.7-0.9 | De-emphasize, backgrounds |

## Common Use Cases

### Emphasize Face/Eyes
```
(detailed face:1.5), (perfect eyes:1.4), (natural skin:1.2)
```

### Boost Quality
```
(photorealistic:1.4), (8k uhd:1.2), (high quality:1.3)
```

### Focus on Subject
```
(beautiful woman:1.3), (background:0.7)
```

### Style Control
```
(professional photography:1.3), (natural lighting:1.2)
```

## Quick Examples

### Simple Portrait
```
(photorealistic:1.3), young woman, (detailed face:1.5), 
(blue eyes:1.4), long hair, smiling
```

### Quality Focus
```
(photorealistic:1.5), (8k uhd:1.3), (professional photography:1.3),
portrait, natural lighting, (detailed:1.4)
```

### Character Emphasis
```
(Luna:1.3), (beautiful young woman:1.3), (detailed face:1.5),
(long flowing hair:1.2), casual outfit, natural setting
```

### Background Reduction
```
(woman:1.4), (detailed face:1.5), portrait, 
(background:0.7), (blur:0.8)
```

## Luna's Updated Image Style

**Before**:
```
photorealistic, 8k uhd, professional photography, 
beautiful young woman, fit body, long hair, detailed face
```

**After (with weighting)**:
```
(photorealistic:1.4), (8k uhd:1.2), (professional photography:1.3), 
(beautiful young woman:1.3), (fit body:1.2), (long hair:1.1), 
(detailed face:1.5), (perfect skin:1.2), (natural beauty:1.2), 
warm expression, natural lighting
```

## Tips

✅ **DO**: Focus weights on 3-5 key elements  
✅ **DO**: Use 1.3-1.5 for most important features  
✅ **DO**: Test and iterate  

❌ **DON'T**: Weight everything  
❌ **DON'T**: Use values over 2.0  
❌ **DON'T**: Stack too many parentheses  

## How to Apply

1. **Edit Persona** → Visual Appearance field
2. Add weights to key terms: `(term:1.3)`
3. Save and generate image
4. Adjust weights based on results

## Test It Now!

Try with Luna:
```bash
# Chat with Luna and ask: "Can you send me a selfie?"
# Her image will now use the weighted prompt
# Compare with old unweighted versions
```

---

**Status**: ✅ Already supported, no code changes needed!  
**Luna Updated**: ✅ Enhanced with optimal weights  
**Documentation**: PROMPT_WEIGHTING_GUIDE.md (full guide)
