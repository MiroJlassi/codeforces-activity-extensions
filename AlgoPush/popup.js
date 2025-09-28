document.addEventListener("DOMContentLoaded", () => {
    const tokenInput = document.getElementById("token");
    const ownerInput = document.getElementById("owner");
    const repoInput = document.getElementById("repo");
    const branchInput = document.getElementById("branch");
    const saveButton = document.getElementById("save");

    // Load saved values
    chrome.storage.local.get(["token", "owner", "repo", "branch"], (data) => {
        tokenInput.value = data.token || "";
        ownerInput.value = data.owner || "";
        repoInput.value = data.repo || "";
        branchInput.value = data.branch || "main";
    });

    // Save values
    saveButton.addEventListener("click", () => {
        chrome.storage.local.set({
            token: tokenInput.value,
            owner: ownerInput.value,
            repo: repoInput.value,
            branch: branchInput.value
        }, () => {
            alert("Settings saved!");
        });
    });
});
