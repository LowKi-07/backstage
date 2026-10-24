@AGENTS.md

## Web preview (how the owner tests on their phone)

Every push to GitHub is deployed to Vercel as a web build (`vercel.json`), and the owner checks changes on their iPhone from the home-screen web app — often while away from the Mac. Keep the web build working:

- Run `npx expo export -p web` and `npx tsc --noEmit` before declaring a task done; both must pass.
- Any native-only API must have a web fallback (check `Platform.OS === 'web'`) so the web build doesn't crash.
- Home-screen setup lives in `public/` (`index.html`, `manifest.json`, icons) — keep it when editing.
