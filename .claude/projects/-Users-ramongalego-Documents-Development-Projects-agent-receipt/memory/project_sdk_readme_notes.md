---
name: SDK README rewrite notes
description: Notes on what to cover when rewriting the SDK README, especially session naming patterns and wrap-per-task usage
type: project
---

When rewriting the SDK README, include these usage patterns:

**Wrap-per-task pattern** (most common): create a new wrapped client per task/request so each gets its own session. This is what most people will do. Show an example with sessionName including dynamic context like ticket IDs.

**Session API pattern** (complex agents): use startSession + trackTool + trackDecision for multi-step agents where you want fine control over what appears in the timeline.

**Why:** the current README doesn't explain that wrapping a client once at module level means all requests share one session. Most users will need to understand they should wrap per-task to get meaningful session boundaries.

**How to apply:** make this the primary guidance in the quickstart, not an afterthought. The wrap-per-task example should come first.
