---
title: "Building a Load Testing Script with Claude"
description: "How I built a custom load testing tool with Claude Sonnet 4.6"
date: 2026-02-22T13:23:00+07:00
draft: false
tags:
  - go
  - testing
  - ai
---

## From "I just want something simple" to a full-featured Go tool

There's a specific kind of frustration that comes with evaluating load testing tools. You find one, it works, but it's either too bloated, requires a config file the size of a novel, or has a learning curve you didn't sign up for. You just want to hammer an endpoint, see some numbers, and move on.

That was me last week. I needed to load test a REST API I was building at work. I didn't want to install k6, learn Gatling DSL, or spin up Locust just to fire some requests and see how the server holds up. I just wanted something simple — a script I could run from the terminal, point at a URL, and get results.

So I turned to **Claude Sonnet 4.6** and said: let's build this together.

---

### Why Build Instead of Use?

Fair question. There are plenty of load testing tools out there. But rolling your own has real advantages:

- You know exactly what it does
- Zero config files — everything is a CLI flag
- No hidden behavior, no telemetry, no account required
- You own it and can extend it however you want

The trade-off is time. But when you have an AI pair programmer, that trade-off basically disappears.

---

### The Design Conversation

Before writing a single line of code, I had Claude walk through the design with me. This is actually something I've started doing consistently — rubber duck debugging, but the duck talks back and knows Go.

We agreed on:

- **Language: Go** — zero external dependencies, single binary output, goroutines are a natural fit for concurrency
- **CLI flags** for everything — no config files
- **A shared token bucket rate limiter** across workers, with an `--unlimited` escape hatch
- **Real-time live output** while the test runs
- **HTML report** with charts after each run, saved with a timestamp so it doesn't get overwritten

The final flag interface looks like this:

```
--url           Target endpoint URL (required)
--method        HTTP method (default: GET)
--payload       Inline JSON payload
--payload-file  Path to a JSON payload file
--rps           Target requests per second (default: 10)
--duration      Test duration e.g. 30s, 1m, 2m30s (required)
--workers       Concurrent workers (default: 1)
--unlimited     Remove rate limiting entirely
--auth          Raw Authorization header e.g. "Bearer abc123"
--header        Extra headers, repeatable
--live-interval How often to print live stats (default: 1s)
--output        HTML report path (default: reports/report_TIMESTAMP.html)
```

Clean. No surprises.

---

### How It Works

The script spins up N worker goroutines, all sharing a single rate limiter. The limiter is a simple ticker-based token bucket — each tick is one allowed request. Workers block on it, so collectively they stay within the target RPS.

When `--unlimited` is passed, the limiter is skipped entirely and workers fire as fast as the server — and your machine — can handle.

Each request is tied to a `context.WithTimeout`, which is how we get a clean shutdown when the duration expires. In-flight requests are cancelled immediately via the context, so the script always exits on time.

A single collector goroutine receives all results from workers through a channel, appending them to a slice and updating live counters atomically. This keeps the workers fast — they never touch shared state directly.

Here's the core worker loop, simplified:

```go
func runWorker(ctx context.Context, cfg config, client *http.Client, limiter *rateLimiter, results chan<- Result, wg *sync.WaitGroup) {
    defer wg.Done()

    for {
        if ctx.Err() != nil {
            return
        }

        if limiter != nil {
            if !limiter.Wait() {
                return
            }
            if ctx.Err() != nil {
                return
            }
        }

        result := doRequest(ctx, cfg, client)

        if ctx.Err() != nil {
            return
        }

        results <- result
    }
}
```

The double context check around `limiter.Wait()` is intentional — the context can be cancelled while the worker is blocked waiting for a token, so we check again after it unblocks.

---

### The Debugging Journey

Nothing works perfectly on the first try. Here are the bugs we caught and fixed along the way.

**Workers not stopping on time.** The first version used a manual `stop` channel. The problem: workers were blocking on in-flight HTTP requests when the stop signal came in, so the test would run 3-4x longer than the specified duration. Switched to `context.WithTimeout` + `http.NewRequestWithContext`, which cancels the TCP connection immediately on expiry. Fixed.

**Live output printing line by line on Termux.** I also run tools on my Android phone via Termux. The `\r` carriage return trick to overwrite a single line wasn't working — each update was printing on a new line. We went through a few attempts: ANSI cursor codes, `bufio` flushing. Eventually traced it to Go's stdout buffering. The fix was `os.Stdout.WriteString()` which writes directly to the file descriptor without buffering, the same way shell `printf` does.

**Results freezing mid-test but the timer kept going.** This was a race condition in the live display — it was reading from a copy of the results slice rather than the live counters. Introduced a dedicated `liveCounters` struct with a mutex that the collector updates directly, and the display reads from that instead.

---

### Running It

No dependencies, no setup. Just Go:

```bash
# Run directly
go run loadtest.go --url https://your-api.com/endpoint --duration 30s

# Or compile to a binary
go build -o loadtest loadtest.go
./loadtest --url https://your-api.com/endpoint --duration 30s

# Cross-compile for Linux arm64 (e.g. Termux on Android)
GOOS=linux GOARCH=arm64 go build -o loadtest loadtest.go
```

Live output looks like this while running:

```
🎯 Target  : GET https://your-api.com/endpoint
⏱  Duration: 30s
👷 Workers : 10
⚡ RPS     : unlimited

[00:01] ⚡ 284 reqs | ✅ 284 | ❌ 0 | ⏱ Avg: 35ms
[00:02] ⚡ 571 reqs | ✅ 571 | ❌ 0 | ⏱ Avg: 34ms
[00:03] ⚡ 849 reqs | ✅ 847 | ❌ 2 | ⏱ Avg: 35ms
```

And after the test, a timestamped HTML report lands in `reports/` with a latency-over-time chart, status code distribution, and percentile breakdown. Dark themed, easy on the eyes.

---

### A Note on Responsibility

At one point during our testing session I accidentally ran 500 workers in unlimited mode against a server I didn't own. For about 30 seconds. From a VPS.

Claude's response when I told him: a calm but very clear explanation that this is functionally a DDoS, that VPS providers will terminate accounts for it, and that intent doesn't matter — impact does.

So: only run this against servers you own or have explicit written permission to test. The script is powerful enough to cause real harm if mispointed.

---

### What I Learned

The most useful part of building this with Claude wasn't the code — it was the design conversations before any code was written. Having to articulate what I wanted clearly enough for Claude to understand forced me to think through the architecture properly. By the time we started writing, the hard decisions were already made.

Claude also caught things I would have missed. The double context check in the worker loop, the collector goroutine pattern to avoid shared mutable state in workers — these are the kinds of things that don't show up in a first draft but matter in production.

The full script is a single `loadtest.go` file, 812 lines. A good chunk of that is the embedded HTML report template — the actual Go logic is well under half of that. No external dependencies. You can read the whole thing in one sitting and understand exactly what it does.

That's the goal, isn't it? Code you understand is code you can trust.

---

[**Download the script**](/files/go-loadtest.7z)
