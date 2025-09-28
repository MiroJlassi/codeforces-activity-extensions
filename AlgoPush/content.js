function attachSubmitListener() {
    const submitButton = document.querySelector("input.submit[type='submit']");
    if (!submitButton) return false;

    submitButton.addEventListener("mousedown", async () => {
        const handleElement = document.querySelector("a[href^='/profile/']");
        if (!handleElement) return;

        const handle = handleElement.textContent.trim();
        console.log("💡 My Codeforces handle is:", handle);

        try {
            const response = await fetch(
                `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=1`
            );
            const data = await response.json();

            if (data.status !== "OK") {
                console.error("❌ API Error:", data.comment);
                return;
            }

            const submission = data.result[0];
            if (!submission) {
                console.log("⚠ No submissions found.");
                return;
            }

            console.log("✅ Latest submission:");
            console.log("Submission ID:", submission.id);
            console.log("Contest ID:", submission.contestId);
            console.log("Problem Name:", submission.problem.name);
            console.log("Index:", submission.problem.index);
            console.log("Programming Language:", submission.programmingLanguage);

            // Now download source code
            const submissionUrl = `https://codeforces.com/contest/${submission.contestId}/submission/${submission.id}`;
            const htmlResponse = await fetch(submissionUrl);
            const htmlText = await htmlResponse.text();

            // Extract source code from HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, "text/html");
            const codeElement = doc.querySelector("#program-source-text");
            if (!codeElement) {
                console.error("❌ Could not find source code element.");
                return;
            }
            const sourceCode = codeElement.textContent;

            // Determine file extension
            const extension = getFileExtension(submission.programmingLanguage);

            // Create a downloadable file
            const blob = new Blob([sourceCode], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${submission.problem.name}_${submission.id}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log(`💾 Solution downloaded as ${submission.problem.name}_${submission.id}.${extension}`);

        } catch (error) {
            console.error("❌ Error:", error);
        }
    });

    return true;
}

function getFileExtension(language) {
    if (language.includes("C++")) return "cpp";
    if (language.includes("Python")) return "py";
    if (language.includes("Java")) return "java";
    if (language.includes("C#")) return "cs";
    if (language.includes("Pascal")) return "pas";
    if (language.includes("JavaScript")) return "js";
    if (language.includes("Kotlin")) return "kt";
    if (language.includes("Ruby")) return "rb";
    if (language.includes("Go")) return "go";
    return "txt";
}

if (!attachSubmitListener()) {
    const observer = new MutationObserver(() => {
        if (attachSubmitListener()) {
            observer.disconnect();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}
