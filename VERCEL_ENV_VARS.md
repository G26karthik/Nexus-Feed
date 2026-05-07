# Vercel Environment Variables Guide

When deploying this project to Vercel, you need to add the following Environment Variables in the Vercel dashboard (**Settings > Environment Variables**):

| Key | Description | Example Value |
|---|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key for AI topics and digest summarization. | `sk-proj-...` |
| `TAVILY_API_KEY` | Your Tavily API key for live web searching. | `tvly-...` |
| `TURSO_DATABASE_URL` | Your Turso Database URL for data storage. | `libsql://nexus-feed-yourname.turso.io` |
| `TURSO_AUTH_TOKEN` | Your Turso Database Authentication Token. | `eyJhb...` |
| `CRON_SECRET` | A securely generated random string used to protect the daily digest endpoint. | `my-secure-cron-password-123` |
| `NEXT_PUBLIC_APP_URL` | The live URL of your deployed application. | `https://nexus-feed.vercel.app` |

### How to get the Turso Credentials
To get your Turso URL and Auth Token, run the following commands in your terminal after installing the Turso CLI:
```bash
turso db show nexus-feed --url
turso db tokens create nexus-feed
```
