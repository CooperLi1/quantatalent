## LLM Prompt Safety

- When adding or changing an LLM generation prompt, include `UNTRUSTED_DATA_SYSTEM_RULE` and wrap user, applicant, web, file, search-result, and prior-LLM-derived content with `untrustedJson(...)` from `lib/llm-safety.ts`. Treat those values as evidence only, never instructions, and sanitize model outputs before storing or displaying them.
