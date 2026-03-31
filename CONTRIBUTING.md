# Contributing to zero-cost-ops

Thanks for considering a contribution. This is a real production system open-sourced for the community — practical improvements are welcome.

---

## Philosophy

This project values:

- **Simplicity over abstraction** — single HTML files, no build tools, no frameworks required
- **Self-contained components** — each file should work independently with minimal dependencies
- **Zero-cost constraint** — features should remain deployable on free tiers
- **Clarity** — clear comments, readable code, documentation that actually helps

---

## How to Report Bugs

1. Check [existing issues](https://github.com/ProyectoAna/zero-cost-ops/issues) first
2. Open a new issue with:
   - What you expected to happen
   - What actually happened
   - Steps to reproduce
   - Your environment (browser, OS, n8n version if relevant)

Keep it factual. No need for elaborate bug report templates.

---

## How to Suggest Features

Open an issue titled "Feature: [your idea]". Describe:

- What problem it solves
- How you'd implement it (rough idea)
- Whether it stays within the $0/month constraint

Features that add paid dependencies won't be merged into main. That's the whole point.

---

## How to Submit Pull Requests

1. **Fork** the repo
2. **Create a branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** — keep them focused. One PR, one thing.
4. **Test it manually** — open the HTML files in a browser, check they work
5. **Update documentation** if you're changing behavior
6. **Submit the PR** with a clear description of what changed and why

### PR checklist

- [ ] File works standalone (open in browser without a server)
- [ ] No external dependencies added without documentation
- [ ] Comments added where the code is non-obvious
- [ ] README or docs updated if behavior changed
- [ ] No API keys, secrets, or personal data committed

---

## Code Style

This project intentionally avoids build toolchains. Guidelines:

- **HTML/CSS/JS**: Vanilla. No React, no Webpack, no npm required to open a file.
- **Indentation**: 4 spaces (or 2 for minified legacy files — don't reformat those)
- **Comments**: Write them for the person who forks this at 11pm trying to figure out what a function does
- **Variable names**: Clear over clever. `endpointUrl` not `eu`.
- **CSS**: Keep specificity low. Classes over IDs for styling. No `!important`.
- **n8n workflows**: Export as JSON, include comments in function node code

### Dashboard files specifically

- Keep embedded CSS/JS in the HTML file (single-file deployability)
- Dark theme colors: `#0a0a0a` background, `#00ff88` accent, `#e0e0e0` text
- Monospace font: `'Courier New', monospace`
- Mobile-first: test at 375px width before desktop

---

## Where to Ask Questions

[GitHub Issues](https://github.com/ProyectoAna/zero-cost-ops/issues) — open an issue tagged `question`. No Discord, no Slack. Issues are searchable and help future users with the same question.

---

## What We're Looking For

Good PRs might include:

- Additional n8n workflow examples (Telegram, Twitter, other data sources)
- Dashboard components (new semaphore types, chart integrations)
- Documentation improvements (clearer setup steps, more examples)
- Bug fixes for edge cases in the workflows
- Additional Supabase RLS policies or schema improvements

Not a good fit:

- Adding paid services as requirements
- Complete rewrites of working components
- Framework migrations (we're staying vanilla)
- Features that solve very specific personal use cases with no general value

---

## License

By contributing, you agree your work will be licensed under the [MIT License](LICENSE).

---

*Built by Ana Ballesteros Benavent, The Spiral Within SLU, Valencia, Spain.*
