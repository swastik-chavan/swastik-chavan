/**
 * generate-contributions.js
 *
 * Fetches real GitHub contribution data via the GraphQL API
 * and generates an SVG with:
 *   - Monochrome contribution grid
 *   - Stickman with gun on the left
 *   - Glowing projectile animation
 *   - Tiny grave silhouettes on zero-contribution days
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx node scripts/generate-contributions.js
 *
 * Environment:
 *   GITHUB_TOKEN  — Personal Access Token with `read:user` scope (required)
 *   GITHUB_USER   — GitHub username (default: swastik-chavan)
 *
 * Output:
 *   assets/github/contributions.svg
 */

const fs = require('fs');
const path = require('path');

// ─── Configuration ────────────────────────────────────────────
const GITHUB_USER = process.env.GITHUB_USER || 'swastik-chavan';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const OUTPUT_PATH = path.join(__dirname, '..', 'assets', 'github', 'contributions.svg');

// Visual config
const CELL_SIZE = 11;
const CELL_GAP = 3;
const CELL_RADIUS = 2;
const GRID_OFFSET_X = 120;
const GRID_OFFSET_Y = 35;
const SVG_WIDTH = 850;
const SVG_HEIGHT = 200;

// Intensity colors (monochrome, dark theme)
const INTENSITY_COLORS = [
  '#161616', // 0 — empty (will get a grave)
  '#2a2a2a', // 1
  '#444444', // 2
  '#666666', // 3
  '#999999', // 4
];

// ─── Fetch contribution data ──────────────────────────────────
async function fetchContributions() {
  if (!GITHUB_TOKEN) {
    console.error('Error: GITHUB_TOKEN or GH_TOKEN environment variable is required.');
    console.error('Create a PAT with read:user scope at https://github.com/settings/tokens');
    process.exit(1);
  }

  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                weekday
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'github-profile-contributions-generator',
    },
    body: JSON.stringify({
      query,
      variables: { username: GITHUB_USER },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`GitHub API error (${response.status}): ${text}`);
    process.exit(1);
  }

  const data = await response.json();

  if (data.errors) {
    console.error('GraphQL errors:', JSON.stringify(data.errors, null, 2));
    process.exit(1);
  }

  return data.data.user.contributionsCollection.contributionCalendar;
}

// ─── Generate grave SVG element ───────────────────────────────
function generateGrave(x, y, size) {
  const s = size * 0.6;
  const cx = x + size / 2;
  const bottom = y + size - 1;
  return `<g opacity="0.4">
      <rect x="${cx - s / 2}" y="${bottom - s}" width="${s}" height="${s * 0.65}" rx="0.5" fill="#333"/>
      <rect x="${cx - s / 2}" y="${bottom - s - s * 0.2}" width="${s}" height="${s * 0.3}" rx="${s * 0.15}" fill="#333"/>
      <line x1="${cx}" y1="${bottom - s + 1}" x2="${cx}" y2="${bottom - s * 0.35}" stroke="#222" stroke-width="0.4"/>
      <line x1="${cx - s * 0.2}" y1="${bottom - s * 0.55}" x2="${cx + s * 0.2}" y2="${bottom - s * 0.55}" stroke="#222" stroke-width="0.4"/>
    </g>`;
}

// ─── Generate stickman SVG ────────────────────────────────────
function generateStickman() {
  return `
    <!-- Head -->
    <circle cx="15" cy="15" r="6" fill="none" stroke="#e0e0e0" stroke-width="1.2"/>
    <!-- Body -->
    <line x1="15" y1="21" x2="15" y2="45" stroke="#e0e0e0" stroke-width="1.2"/>
    <!-- Left arm -->
    <line x1="15" y1="30" x2="5" y2="38" stroke="#e0e0e0" stroke-width="1.2"/>
    <!-- Right arm (gun) -->
    <line x1="15" y1="30" x2="35" y2="28" stroke="#e0e0e0" stroke-width="1.2"/>
    <!-- Gun -->
    <rect x="33" y="25" width="14" height="5" rx="1" fill="none" stroke="#c9a87c" stroke-opacity="0.5" stroke-width="0.8"/>
    <line x1="47" y1="27.5" x2="52" y2="27.5" stroke="#c9a87c" stroke-opacity="0.4" stroke-width="0.6"/>
    <!-- Left leg -->
    <line x1="15" y1="45" x2="8" y2="62" stroke="#e0e0e0" stroke-width="1.2"/>
    <!-- Right leg -->
    <line x1="15" y1="45" x2="22" y2="62" stroke="#e0e0e0" stroke-width="1.2"/>
  `;
}

// ─── Generate SVG ─────────────────────────────────────────────
function generateSVG(calendar) {
  const weeks = calendar.weeks;
  const totalContributions = calendar.totalContributions;

  // Find max contribution for normalization
  let maxCount = 0;
  for (const week of weeks) {
    for (const day of week.contributionDays) {
      if (day.contributionCount > maxCount) {
        maxCount = day.contributionCount;
      }
    }
  }

  // Map contribution count to intensity level (0–4)
  function getIntensity(count) {
    if (count === 0) return 0;
    if (maxCount === 0) return 0;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.50) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }

  // Day labels
  const dayLabels = ['', 'M', '', 'W', '', 'F', ''];

  // Month labels
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabels = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks.length; w++) {
    const firstDay = weeks[w].contributionDays[0];
    if (firstDay) {
      const month = new Date(firstDay.date).getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ week: w, name: monthNames[month] });
        lastMonth = month;
      }
    }
  }

  // Build grid cells and graves
  let cells = '';
  let graves = '';
  let zeroCount = 0;
  let totalDays = 0;

  for (let w = 0; w < weeks.length; w++) {
    for (const day of weeks[w].contributionDays) {
      const d = day.weekday;
      const x = GRID_OFFSET_X + w * (CELL_SIZE + CELL_GAP);
      const y = GRID_OFFSET_Y + d * (CELL_SIZE + CELL_GAP);
      const intensity = getIntensity(day.contributionCount);
      const color = INTENSITY_COLORS[intensity];

      cells += `    <rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="${CELL_RADIUS}" fill="${color}"/>\n`;

      if (day.contributionCount === 0) {
        graves += generateGrave(x, y, CELL_SIZE) + '\n';
        zeroCount++;
      }
      totalDays++;
    }
  }

  // Day labels on the left
  let dayLabelsSVG = '';
  for (let d = 0; d < 7; d++) {
    if (dayLabels[d]) {
      const y = GRID_OFFSET_Y + d * (CELL_SIZE + CELL_GAP) + CELL_SIZE * 0.75;
      dayLabelsSVG += `    <text x="${GRID_OFFSET_X - 10}" y="${y}" text-anchor="end" fill="#444" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="8">${dayLabels[d]}</text>\n`;
    }
  }

  // Month labels on top
  let monthLabelsSVG = '';
  for (const ml of monthLabels) {
    const x = GRID_OFFSET_X + ml.week * (CELL_SIZE + CELL_GAP);
    monthLabelsSVG += `    <text x="${x}" y="${GRID_OFFSET_Y - 6}" fill="#444" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="8">${ml.name}</text>\n`;
  }

  // Projectile Y position — center of the grid
  const projectileY = GRID_OFFSET_Y + 3 * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
  const gridEndX = GRID_OFFSET_X + weeks.length * (CELL_SIZE + CELL_GAP);
  const travelDistance = gridEndX - 92;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" width="${SVG_WIDTH}" height="${SVG_HEIGHT}">
  <defs>
    <style>
      @keyframes projectile-move {
        0% { transform: translateX(0); opacity: 0; }
        3% { opacity: 1; }
        85% { opacity: 1; }
        100% { transform: translateX(${travelDistance}px); opacity: 0; }
      }
      @keyframes stickman-recoil {
        0%, 8%, 100% { transform: translate(40px, 55px); }
        4% { transform: translate(38px, 55px); }
      }
      .stickman { animation: stickman-recoil 14s linear infinite; }
    </style>
    <linearGradient id="projectile-glow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c9a87c" stop-opacity="0"/>
      <stop offset="40%" stop-color="#c9a87c" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.8"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="#0e0e0e" rx="4"/>

  <!-- Month labels -->
${monthLabelsSVG}
  <!-- Day labels -->
${dayLabelsSVG}
  <!-- Contribution grid -->
  <g>
${cells}  </g>

  <!-- Graves on zero-contribution days -->
  <g>
${graves}  </g>

  <!-- Stickman -->
  <g class="stickman">
${generateStickman()}
  </g>

  <!-- Projectile -->
  <g style="animation: projectile-move 14s linear infinite;">
    <rect x="92" y="${projectileY - 0.75}" width="18" height="1.5" rx="0.75" fill="url(#projectile-glow)"/>
    <circle cx="110" cy="${projectileY}" r="1.8" fill="#c9a87c" fill-opacity="0.7"/>
  </g>

  <!-- Stats footer -->
  <text x="${GRID_OFFSET_X}" y="${SVG_HEIGHT - 12}" fill="#333" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="9" letter-spacing="0.5">${totalContributions} contributions in the last year</text>
  <text x="${SVG_WIDTH - 30}" y="${SVG_HEIGHT - 12}" text-anchor="end" fill="#2a2a2a" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="8" letter-spacing="1">GITHUB ACTIVITY</text>

</svg>`;

  return svg;
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log(`Fetching contributions for ${GITHUB_USER}...`);
  const calendar = await fetchContributions();
  console.log(`Total contributions: ${calendar.totalContributions}`);
  console.log(`Weeks of data: ${calendar.weeks.length}`);

  const svg = generateSVG(calendar);

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, svg, 'utf-8');
  console.log(`Contribution graph saved to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Failed to generate contributions:', err.message);
  process.exit(1);
});
