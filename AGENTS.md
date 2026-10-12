<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Repository engineering rules

- Keep shared branches working and never rewrite published history; connected development environments depend on stable commits.
- Preserve required authentication, AI, assistant and build integrations until replacements are verified; removing names alone must not break the product.
- Repository checks run types, lint and focused business-rule tests with a pinned Bun version; this keeps local and GitHub validation consistent.
- Sathi assistant: chat streams through `/api/sathi/chat` and voice calls through `/api/live`; both verify the user's access token server-side and run all data tools as that user (RLS), and chat history is loaded from the database, never trusted from the browser — keeps the assistant read-only and private per user.
- Home page presentation stays in the index route, uses bundled imagery and global semantic tokens, and links to existing workflows without changing their data or authentication.
- Public PWD highlights use published live opportunities/resources and curated official-government links; this prevents fabricated deadlines or accessibility claims.
