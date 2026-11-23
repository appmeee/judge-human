# JudgeHuman Build API

Use the production origin `https://www.judgehuman.ai` or the local origin `http://localhost:3107`. Create a product build key in Settings and send it as a Bearer token. Revoke it from the same screen. Build operations create private drafts in the owner’s Personal builds workspace.

| Action | Method and path | JSON body |
| --- | --- | --- |
| Start an analysis or build | POST /api/v1/builds | `{"requestId":"<uuid>","intake":{"mode":"idea","idea":"…","action":"build"}}` |
| Read saved state | GET /api/v1/builds/{buildRequestId} | None |
| Build or revise a prototype from the saved brief | POST /api/v1/builds/{buildRequestId}/prototypes | `{"requestId":"<operation uuid>","instruction":"…","baseVersionId":"<optional prototype id>"}` |

For a public product page set `mode` to `product` and pass `productUrl`. The description field `idea` may be an empty string when a product URL is present. Without a link, provide at least ten characters of description. Optional `notes` accept up to 8,000 bytes of text. The default action is `analyze`.

```sh
curl --fail-with-body https://www.judgehuman.ai/api/v1/builds \
  -H "Authorization: Bearer $JUDGEHUMAN_BUILD_KEY" \
  -H 'Content-Type: application/json' \
  --data-binary @build-request.json
```

Generate a UUID for each intended operation. An identical replay under the same key reuses its saved result. Reusing an ID for different input returns HTTP 409. Keep the original request ID when checking a build, including after an interrupted response. Revisions have their own operation IDs.

| Status | How to continue |
| --- | --- |
| processing | Generation is in progress. Read the build again after a short delay. |
| input_saved | Open the returned source URL to recover the input. Read the error before retrying. |
| brief_ready | Open the saved project or request its prototype. If an error is present, the brief was saved and prototype generation needs attention. |
| prototype_ready | Open the project URL, read the prototype version, or export the returned design prompt. |

Resolve `sourceUrl` and `projectUrl` against the API origin. Opening them in a browser requires the owning account. Inspect the JSON status and any `error` even for HTTP 200. HTTP 401 indicates a missing, expired, or revoked build key. HTTP 404 means the requested build is unavailable to that key. HTTP 429 requests a pause. These operations do not publish offers or contact prospects.
