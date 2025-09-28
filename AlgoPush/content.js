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
        e.preventDefault(); // Prevent normal form submit

        if (storedFile) {
            try {
                const content = await readFileContent(storedFile);
                const params = await getGitHubParams();

                if (!params || !params.token) {
                    console.error("GitHub params missing!");
                    return;
                }

                console.log("Pushing solution to GitHub...");
                await pushToGitHub(content, storedFile.name, params);

                console.log("✅ Push complete. Submitting form...");
                submitButton.closest("form").submit(); // Continue with normal submission
            } catch (err) {
                console.error("File read failed:", err);
            }
        }
    });
}

function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsText(file); // Reads file as text
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

function getProblemDetails() {
    try {
        const urlParts = window.location.pathname.split("/");
        const contestId = urlParts[2]; // e.g., "2134"
        const problemIndex = urlParts[4]; // e.g., "A"

        const problemNameElement = document.querySelector(".problem-statement .title");
        let problemName = problemNameElement ? problemNameElement.textContent.trim() : "";

        problemName = problemName.replace(/\s+/g, "_").replace(/[^\w\-]/g, ""); // sanitize

        return { contestId, problemIndex, problemName };
    } catch (e) {
        console.error("Failed to get problem details:", e);
        return null;
    }
}

function getFileExtension(filename) {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop() : "txt";
}

async function pushToGitHub(content, filename, { token, owner, repo, branch }) {
    try {
        const details = getProblemDetails();
        let path = filename;

        if (details) {
            path = `${details.contestId}/${details.problemIndex}_${details.problemName}.${getFileExtension(filename)}`;
        }

        console.log("GitHub path:", path);
        console.log("GitHub repo:", `${owner}/${repo} on branch ${branch}`);

        // 1. Get latest commit SHA
        let ref = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
            headers: { Authorization: `token ${token}` }
        }).then(r => r.json());

        const latestCommitSha = ref.object.sha;

        // 2. Get base tree SHA
        let commit = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, {
            headers: { Authorization: `token ${token}` }
        }).then(r => r.json());

        const baseTreeSha = commit.tree.sha;

        // 3. Create blob
        let blob = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
            method: "POST",
            headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ content: btoa(content), encoding: "base64" })
        }).then(r => r.json());

        // 4. Create new tree
        let newTree = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
            method: "POST",
            headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                base_tree: baseTreeSha,
                tree: [
                    {
                        path: path,
                        mode: "100644",
                        type: "blob",
                        sha: blob.sha
                    }
                ]
            })
        }).then(r => r.json());

        // 5. Create commit
        let newCommit = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
            method: "POST",
            headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `Solution pushed: ${filename}`,
                tree: newTree.sha,
                parents: [latestCommitSha]
            })
        }).then(r => r.json());

        // 6. Update branch ref
        await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
            method: "PATCH",
            headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ sha: newCommit.sha })
        });

        console.log(`✅ Solution ${filename} pushed successfully!`);
    } catch (err) {
        console.error("GitHub push failed:", err);
    }
}

window.addEventListener("load", init);
