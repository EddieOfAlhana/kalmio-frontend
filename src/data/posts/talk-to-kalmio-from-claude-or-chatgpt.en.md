## A Tuesday at the airport

Your flight got delayed two hours at Liszt Ferenc. You buy a beer and a salty pretzel. Open Claude on your phone:

> *"Had a beer and a pretzel at the airport — log them as today's afternoon snack."*

Claude calls Kalmio. The off-plan meal lands in your dashboard. Tomorrow morning, the replan diff offers to shift your overplanned dinner to Friday so you don't blow the week's calorie budget.

You didn't open the Kalmio app. You're not even using your laptop. The kitchen got managed because the assistant knew how to talk to Kalmio.

## What just shipped

Kalmio now has two ways for AI assistants to talk to it — both live, both yours to use today:

- **An MCP server** — for [Claude Desktop](https://claude.ai/download), Cursor, and any client that speaks the [Model Context Protocol](https://modelcontextprotocol.io). Available at `https://api.kalmio.hu/mcp/sse`, with OAuth 2.0 / PKCE for authentication.
- **A ChatGPT Custom GPT Actions spec** — for ChatGPT Plus subscribers who want to wire Kalmio into a Custom GPT. Auth via a per-user API key generated in your Kalmio Settings.

Both expose the same idea: **Kalmio is no longer just an app. It's a verb you can use in any AI assistant you already chat with.**

## What you can actually do

Out of the box, the assistant can:

- See today's meals, prep tasks, and macros
- Read your active plan or pull all prep tasks
- Inspect the fridge — quantities and expiry status
- Generate a new meal plan
- Mark planned meals as eaten or skipped
- Log off-plan meals (with optional macros)
- Delete a logged off-plan meal you entered by mistake

Eight tools on the MCP side, six on the ChatGPT Actions side. Off-plan logging and deletion are MCP-only for now — ChatGPT's per-action limits squeeze them out, but they'll land there too once we tighten the spec. The shape of every tool maps directly onto a verb you'd actually say to the assistant out loud, which is the only test that matters.

## Why it's free

We thought hard about pricing this and it landed at "free for everyone, no cap" — at least for now.

The reason traces back to a principle in the master plan: **deterministic features are free; agentic features that cost us LLM tokens per use are premium.** The MCP server doesn't burn our tokens — your Claude or ChatGPT subscription pays the LLM. We just expose the verbs. Per-use cost to Kalmio is approximately zero, so the right thing to do is make it free.

If we ever see abuse (a runaway agent hammering 50 000 calls a day), we'll add a fair-use cap, framed as fair use rather than credits. Premium subscribers will keep unlimited access. Until then: go.

## How to set it up

Generate an API key in your Kalmio Settings. Copy it once — we never show it again. Then:

- **Claude Desktop / other MCP clients** — add `https://api.kalmio.hu/mcp/sse` to your MCP config and authenticate via OAuth. Your browser will pop a Kalmio consent page once, and you're done.
- **ChatGPT Custom GPT** — create a new Custom GPT, paste the OpenAPI spec from `https://api.kalmio.hu/api/gpt-actions/openapi.yaml` into the *Configure actions* dialog, set the auth scheme to API Key with header name `X-API-Key`, paste your key.

Detailed walk-throughs are in the docs.

## What's next

The current toolset covers the MVP loop well. The next round will likely add: trigger a replan explicitly, add a personal recipe (once that feature ships), edit fridge items, set dietary preferences. If there's a verb you wish your AI could speak with Kalmio, send it through the in-app feedback panel. We're paying close attention to which tools get used and which don't.

The premise is small and load-bearing: wherever you already think out loud — Claude, ChatGPT, eventually Telegram bots and custom agents — Kalmio is now there. The kitchen comes with you.
