# API Integration Guide

This document covers how to properly use OpenRouter and Groq APIs, common pitfalls, and how to avoid them.

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Request Format](#request-format)
4. [Model IDs](#model-ids)
5. [Common Errors & Solutions](#common-errors--solutions)
6. [Rate Limits](#rate-limits)
7. [Best Practices](#best-practices)

---

## API Overview

Both OpenRouter and Groq use **OpenAI-compatible** APIs, meaning the request/response format is nearly identical.

| Provider | Base URL | Models Endpoint |
|----------|----------|-----------------|
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | `https://openrouter.ai/api/v1/models` |
| Groq | `https://api.groq.com/openai/v1/chat/completions` | `https://api.groq.com/openai/v1/models` |

---

## Authentication

### OpenRouter
```bash
# Get your key from: https://openrouter.ai/keys
Authorization: Bearer sk-or-v1-xxxxxxxxxxxx
```

Required headers:
```javascript
{
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'http://localhost:3000',  // Your app URL
    'X-Title': 'Your App Name'                 // Optional but recommended
}
```

### Groq
```bash
# Get your key from: https://console.groq.com/keys
Authorization: Bearer gsk_xxxxxxxxxxxx
```

Required headers:
```javascript
{
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${GROQ_API_KEY}`
}
```

---

## Request Format

Both APIs accept the same request body:

```javascript
{
    "model": "model-id-here",
    "messages": [
        { "role": "system", "content": "You are a helpful assistant" },
        { "role": "user", "content": "Hello!" }
    ],
    "temperature": 0.7,      // 0-2, controls randomness
    "max_tokens": 1024       // Maximum response length
}
```

### Response Format

```javascript
{
    "choices": [
        {
            "message": {
                "role": "assistant",
                "content": "Hello! How can I help you today?"
            }
        }
    ],
    "usage": {
        "prompt_tokens": 25,
        "completion_tokens": 10,
        "total_tokens": 35
    },
    "model": "actual-model-used"
}
```

---

## Model IDs

### OpenRouter Model IDs

Format: `vendor/model-name` or `vendor/model-name:free`

```
meta-llama/llama-3.3-70b-instruct:free
google/gemma-3-27b-it:free
mistralai/mistral-small-3.1-24b-instruct:free
qwen/qwen3-coder:free
xiaomi/mimo-v2-flash:free
```

**Important:** The `:free` suffix indicates the free tier. Without it, you may be charged.

### Groq Model IDs

Format: `model-name` or `vendor/model-name`

```
llama-3.1-8b-instant
llama-3.3-70b-versatile
meta-llama/llama-4-scout-17b-16e-instruct
meta-llama/llama-4-maverick-17b-128e-instruct
qwen/qwen3-32b
moonshotai/kimi-k2-instruct
```

**Important:** Groq model IDs do NOT have a `:free` suffix.

---

## Common Errors & Solutions

### 1. Model Does Not Exist

```json
{
    "error": {
        "message": "The model `xyz` does not exist or you do not have access to it."
    }
}
```

**Causes:**
- Typo in model ID
- Model was removed or renamed
- Using OpenRouter model ID on Groq (or vice versa)

**Solution:**
- Fetch available models from `/models` endpoint first
- Use exact model IDs from the API response

### 2. Data Policy Restriction (OpenRouter)

```json
{
    "error": {
        "message": "No endpoints available that match your data policy"
    }
}
```

**Causes:**
- Some free models have data policy restrictions
- Model may use your data for training

**Solution:**
- Use a different model
- Models known to have this issue:
  - `moonshotai/kimi-k2:free` (on OpenRouter)

### 3. Rate Limit Exceeded

```json
{
    "error": {
        "message": "Rate limit exceeded"
    }
}
```

**Groq Rate Limits (as of 2024):**

| Model | Requests/Min | Tokens/Min |
|-------|--------------|------------|
| llama-3.1-8b-instant | 30 | 6,000 |
| llama-3.3-70b-versatile | 30 | 12,000 |
| llama-4-scout/maverick | 30 | 6,000-30,000 |
| qwen3-32b | 60 | 6,000 |
| kimi-k2-instruct | 60 | 10,000 |

**OpenRouter:** Varies by model, generally more lenient for free tier.

**Solution:**
- Implement exponential backoff
- Switch to a different model temporarily
- Reduce request frequency

### 4. Invalid API Key

```json
{
    "error": {
        "message": "Invalid API key"
    }
}
```

**Solution:**
- Check your `.env` file has the correct key
- Ensure no extra spaces or newlines
- Verify the key is active in your dashboard

### 5. Provider Error (OpenRouter)

```json
{
    "error": {
        "message": "Provider returned error"
    }
}
```

**Causes:**
- The underlying model provider (Meta, Google, etc.) is having issues
- Model is temporarily unavailable

**Solution:**
- Try again after a few seconds
- Use a different model
- Models known to have intermittent issues:
  - `meta-llama/llama-3.1-405b-instruct:free`

### 6. Context Length Exceeded

```json
{
    "error": {
        "message": "This model's maximum context length is X tokens"
    }
}
```

**Solution:**
- Reduce your prompt length
- Use a model with larger context window
- Truncate or summarize input

---

## Rate Limits

### Implementing Backoff

```javascript
async function callWithRetry(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (error.message.includes('rate limit') && i < maxRetries - 1) {
                // Exponential backoff: 1s, 2s, 4s
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
                continue;
            }
            throw error;
        }
    }
}
```

### Respecting Limits

```javascript
// Simple rate limiter
class RateLimiter {
    constructor(requestsPerMinute) {
        this.interval = 60000 / requestsPerMinute;
        this.lastRequest = 0;
    }

    async wait() {
        const now = Date.now();
        const timeSinceLast = now - this.lastRequest;
        if (timeSinceLast < this.interval) {
            await new Promise(r => setTimeout(r, this.interval - timeSinceLast));
        }
        this.lastRequest = Date.now();
    }
}

// Usage
const limiter = new RateLimiter(30); // 30 requests per minute
await limiter.wait();
await callApi();
```

---

## Best Practices

### 1. Validate Models Before Use

```javascript
// Fetch and cache available models on startup
const availableModels = await fetch('/api/v1/models').then(r => r.json());
const modelIds = new Set(availableModels.data.map(m => m.id));

// Validate before calling
if (!modelIds.has(requestedModel)) {
    throw new Error(`Model ${requestedModel} not available`);
}
```

### 2. Use a Curated Allowlist

Don't just show all free models - many don't work reliably. Maintain a tested list:

```javascript
const VERIFIED_MODELS = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemma-3-27b-it:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    // ... tested and working models
];
```

### 3. Handle Errors Gracefully

```javascript
function parseApiError(error) {
    const msg = error.message.toLowerCase();

    if (msg.includes('rate limit')) {
        return { type: 'rate_limit', retry: true, delay: 5000 };
    }
    if (msg.includes('does not exist')) {
        return { type: 'invalid_model', retry: false };
    }
    if (msg.includes('data policy')) {
        return { type: 'policy', retry: false };
    }

    return { type: 'unknown', retry: true, delay: 1000 };
}
```

### 4. Log Everything

```javascript
console.log(`[${provider}] Request: model=${model}, tokens=${inputLength}`);
console.log(`[${provider}] Response: ${latency}ms, ${usage.total_tokens} tokens`);
console.error(`[${provider}] Error:`, error.message);
```

### 5. Provide Fallbacks

```javascript
const FALLBACK_MODELS = {
    'groq': 'llama-3.1-8b-instant',
    'openrouter': 'meta-llama/llama-3.2-3b-instruct:free'
};

async function callWithFallback(model, provider, ...args) {
    try {
        return await callApi(model, ...args);
    } catch (error) {
        console.warn(`Primary model failed, using fallback`);
        return await callApi(FALLBACK_MODELS[provider], ...args);
    }
}
```

### 6. Don't Trust Model Names

Model IDs can change. Always:
- Fetch fresh model list from API
- Cross-reference with your allowlist
- Handle "model not found" errors gracefully

---

## Quick Reference

### Minimum Viable Request (OpenRouter)

```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/llama-3.2-3b-instruct:free",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Minimum Viable Request (Groq)

```bash
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-8b-instant",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

---

## Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter Models](https://openrouter.ai/models)
- [Groq Documentation](https://console.groq.com/docs)
- [Groq Models & Limits](https://console.groq.com/docs/models)
