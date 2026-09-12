// --- config ---
const owner = "gtref";   // e.g. "gtref"
const repo  = "satiscode";    // e.g. "satiscode"

// --- API calls ---
async function getLatestRelease() {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);
  if (!res.ok) throw new Error("Failed to fetch latest release");
  return res.json();
}

async function getContributors() {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors`);
  if (!res.ok) throw new Error("Failed to fetch contributors");
  return res.json();
}

// --- helpers ---
function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
}

// --- renderers ---
function renderReleaseInfo(release) {
  document.getElementById("version").textContent =
    release.tag_name || release.name || "unknown";

  document.getElementById("release-date").textContent =
    new Date(release.published_at).toLocaleDateString();

  // Find installer asset
  const installer = release.assets.find(a =>
    a.name.endsWith(".exe") ||
    a.name.endsWith(".msi") ||
    a.name.endsWith(".zip") ||
    a.name.endsWith(".tar.gz")
  );

  document.getElementById("installer-size").textContent =
    installer ? formatBytes(installer.size) : "N/A";
}

function renderContributors(contributors) {
  const list = document.getElementById("contributors-list");
  list.innerHTML = "";

  contributors.forEach(user => {
    const li = document.createElement("li");

    const avatar = document.createElement("img");
    avatar.src = user.avatar_url;
    avatar.width = 24;
    avatar.height = 24;
    avatar.style.borderRadius = "50%";
    avatar.style.marginRight = "8px";

    const link = document.createElement("a");
    link.href = user.html_url;
    link.textContent = user.login;
    link.target = "_blank";

    li.appendChild(avatar);
    li.appendChild(link);
    list.appendChild(li);
  });
}

// --- bootstrap ---
(async () => {
  try {
    const [release, contributors] = await Promise.all([
      getLatestRelease(),
      getContributors()
    ]);

    renderReleaseInfo(release);
    renderContributors(contributors);
  } catch (err) {
    console.error(err);
  }
})();
