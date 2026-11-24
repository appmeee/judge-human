---
name: judge-human
description: Use JudgeHuman to analyze a product idea or public product page, build or revise an interactive prototype, and retrieve the saved project and design prompt when the user wants to work in JudgeHuman.
metadata:
  openclaw:
    primaryEnv: JUDGEHUMAN_BUILD_KEY
    requires:
      env: [JUDGEHUMAN_BUILD_KEY]
      bins: [node]
---

# Build in JudgeHuman

Use **Analyze** when the user asks for feedback, a first customer, or a testable brief. Use **Build** when they want a working browser prototype. A founder can continue in the linked private project to find customers, test the offer, size the market, and prepare investor materials.

Use a product build key created in the account’s **Settings → Product build keys**. Read it from `JUDGEHUMAN_BUILD_KEY`. Each key can read and revise the builds it created. Keep the key in the operator’s environment.

From the installed skill directory, pass a JSON object on standard input. The helper sends a single request to the JudgeHuman API and writes the response to standard output.

```sh
node scripts/project.mjs analyze <<'JSON'
{"mode":"product","productUrl":"https://www.judgehuman.ai/","idea":"Which first customer should I test with?"}
JSON
```

For an idea, use `{"mode":"idea","idea":"A weekly invoice follow-up queue for independent bookkeepers"}`. Switch the command to `build` to generate both a brief and a prototype. Supply product descriptions or notes the user wants included in the analysis. The service reads public page text for a submitted product link.

Keep the request UUID printed before a write. Use `--id UUID` to supply it yourself. After an interruption, call `node scripts/project.mjs status BUILD_UUID` using the original key. Replaying the same request ID with the same input recovers existing state. A fresh ID starts new work.

To build from a saved brief or revise an existing prototype, pass the original build UUID and a revision instruction.

```sh
node scripts/project.mjs revise "$BUILD_UUID" <<'JSON'
{"instruction":"Show the next customer interview and the assumption it will test."}
JSON
```

Include `baseVersionId` from the selected prototype when revising it. Report the returned status, project link, and any saved partial result. A prototype is ready at `prototype_ready`. The `designPrompt` describes how to implement the final product. Give the user the project link for viewing the prototype and continuing with real customer evidence.

For direct HTTP requests, see the [build API reference](references/build-api.md).
