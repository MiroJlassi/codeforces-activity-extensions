let storedFile = null;

function init() {
    const fileInput = document.querySelector("input[name='sourceFile']");
    const submitButton = document.getElementById("sidebarSubmitButton");

    if (!fileInput || !submitButton) return;

    // Step 1: Capture file selection
    fileInput.addEventListener("change", (e) => {
        storedFile = e.target.files[0];
        if (storedFile) {
            console.log("File selected:", storedFile.name);
        }
    });

    // Step 2: Hook submit click
    submitButton.addEventListener("click", async (e) => {
        if (storedFile) {
            const content = await readFileContent(storedFile);
            const params = await getGitHubParams();
            console.log("Pushing solution to GitHub...");
            pushToGitHub(content, storedFile.name, params);
        }
    });
}

function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsText(file);
    });
}

async function getGitHubParams() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["token", "owner", "repo", "branch"], (data) => {
            resolve({
                token: data.token,
                owner: data.owner,
                repo: data.repo,
                branch: data.branch || "main"
            });
        });
    });
}

// Your old GitHub push function adapted
async function pushToGitHub(content, filename, {token, owner, repo, branch}) {
    const path = filename; // use original filename

    let ref = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        headers: { Authorization: `token ${token}` }
    }).then(r => r.json());

    const latestCommitSha = ref.object.sha;

    let commit = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, {
        headers: { Authorization: `token ${token}` }
    }).then(r => r.json());

    const baseTreeSha = commit.tree.sha;

    let blob = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: content, encoding: "utf-8" })
    }).then(r => r.json());

    let newTree = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
        method: "POST",
        headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            base_tree: baseTreeSha,
            tree: [{
                path: path,
                mode: "100644",
                type: "blob",
                sha: blob.sha
            }]
        })
    }).then(r => r.json());

    let newCommit = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
        method: "POST",
        headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            message: `Solution pushed: ${filename}`,
            tree: newTree.sha,
            parents: [latestCommitSha]
        })
    }).then(r => r.json());

    await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        method: "PATCH",
        headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ sha: newCommit.sha })
    });

    console.log(`✅ Solution ${filename} pushed successfully!`);
}

window.addEventListener("load", init);
