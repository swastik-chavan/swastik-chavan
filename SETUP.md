# Setup

## Quick Start

This repository is your GitHub profile README. Push it to a repository named `swastik-chavan` (matching your GitHub username) and the `README.md` will appear on your GitHub profile.

---

## Contribution Graph

The custom contribution graph with the stickman animation requires a GitHub Personal Access Token.

### 1. Create a token

Go to [github.com/settings/tokens](https://github.com/settings/tokens) and create a **classic** token with the `read:user` scope.

### 2. Add the secret

In this repository, go to **Settings > Secrets and variables > Actions** and add:

| Name       | Value            |
|------------|------------------|
| `GH_TOKEN` | Your PAT string  |

### 3. Run the workflow

Go to **Actions > Update Profile Assets** and click **Run workflow**.

The workflow also runs automatically once per day at 00:00 UTC.

### Running locally

```bash
GITHUB_TOKEN=ghp_your_token_here node scripts/generate-contributions.js
```

On Windows PowerShell:

```powershell
$env:GITHUB_TOKEN="ghp_your_token_here"; node scripts/generate-contributions.js
```

This regenerates `assets/github/contributions.svg` with your real GitHub data.

---

## File Structure

```
README.md                         Main profile README
SETUP.md                          This file
assets/
  hero/hero.svg                   Primary hero banner
  hero/hero-alt.svg               Alternative hero (typing animation)
  openorg/openorg.svg             OpenORG project card
  github/contributions.svg        Contribution graph (auto-generated)
  techx/techx.svg                 TECH X brand card
  ui/divider.svg                  Section divider
scripts/
  generate-contributions.js       Contribution graph generator
.github/workflows/
  update-profile.yml              Daily contribution graph update
```

---

## Customization

### Switching hero variants

In `README.md`, the primary hero is `hero.svg`. To use the alternative typing-cursor variant, comment out the current hero `<img>` and uncomment the `hero-alt.svg` block. Instructions are in the README comments.

### Adding project URLs

The Selected Projects table currently has no repository links since the exact URLs could not be verified. To add them, edit the table rows in `README.md`:

```html
<td><b><a href="https://github.com/swastik-chavan/YOUR-REPO">Project Name</a></b></td>
```

### Changing the accent color

Rose-gold accent values used throughout the SVGs:
- `#b76e79` — rose-gold primary
- `#c9a87c` — gold accent

Search and replace these in the SVG files to change the accent palette.

---

## Limitations

- **GitHub SVG rendering**: GitHub renders SVGs via `<img>` tags, so CSS animations work but JavaScript does not. All animations use pure CSS `@keyframes`.
- **External fonts**: GitHub strips external font references. All SVGs use the system font stack which falls back to the viewer's OS fonts.
- **Self-contained stats cards**: GitHub stats and top languages are rendered as a custom self-contained SVG (`assets/github/stats.svg`), automatically kept up-to-date by the GitHub Actions workflow without depending on fragile third-party Vercel deployments.
- **Caching**: GitHub's image proxy (`camo.githubusercontent.com`) may cache images. After updating the contribution graph or stats, it may take a few minutes to appear on your profile.
