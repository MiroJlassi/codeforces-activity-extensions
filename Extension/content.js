(async function () {
    const startTime = performance.now(); // Start timing
    
    const colors = ["#EBEDF0","#91DA9E","#40C463","#30A14E","#216E39"];
    const handle = window.location.pathname.split("/")[2]; // get handle

    if (!handle) return;

    // Fetch user status from Codeforces API
    const resp = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
    const data = await resp.json();

    if (data.status !== "OK") {
        console.error("Failed to fetch user status");
        return;
    }

    // Count problems per day
    const solvedPerDay = {};
    data.result.forEach(item => {
        const timestamp = item.creationTimeSeconds;
        const date = new Date(timestamp * 1000).toISOString().split("T")[0];
        if (!solvedPerDay[date]) solvedPerDay[date] = 0;
        solvedPerDay[date]++;
    });
    // want to see the first date of solved per day : 
    const firstDate = Object.keys(solvedPerDay).length > 0 
        ? Object.keys(solvedPerDay).sort()[0]  // Get the first date when sorted
        : null;
    console.log("First activity date:", firstDate);

    // Static date range for now
    const start = new Date(firstDate.slice(0,4) + "-01-01");
    const end = new Date(new Date().toISOString().split("T")[0]);

    // Create container
    const container = document.createElement("div");
    container.id = "cf-activity-container";
    container.className = "roundbox userActivityRoundBox borderTopRound borderBottomRound";

    // Title    
    const title = document.createElement("h4");
    title.innerText = "User Activity Scrollable";
    container.appendChild(title);

    // Calculate and display processing time
    const endTime = performance.now();
    const processingTime = Math.round(endTime - startTime);
    
    const timeInfo = document.createElement("p");
    timeInfo.className = "cf-time-info";
    timeInfo.innerText = `Processed in ${processingTime}ms`;
    container.appendChild(timeInfo);

    // Create flex container for day labels and grid
    const activityContent = document.createElement("div");
    activityContent.className = "cf-activity-content";

    // Day labels - show only Mon, Wed, Fri (like GitHub)
    const dayLabels = document.createElement("div");
    dayLabels.id = "cf-day-labels";
    const dayNames = ["", "Mon", "", "Wed", "", "Fri", ""];
    dayNames.forEach(day => {
        const label = document.createElement("div");
        label.className = "cf-day";
        label.innerText = day;  
        dayLabels.appendChild(label);
    });

    // Grid
    const grid = document.createElement("div");
    grid.id = "cf-activity-grid";
    const startDayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    console.log("Start date day of week:", startDayOfWeek, "(0=Sunday, 1=Monday, etc.)");

    // Add empty cells for days before the start date to align with week days
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "cf-cell cf-cell-empty";
        emptyCell.title = "No data";
        grid.appendChild(emptyCell);
    }

    let currentDate = new Date(start);

    while (currentDate < end) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const count = solvedPerDay[dateStr] || 0;
        const color = colors[count] || colors[4];

        const cell = document.createElement("div");
        cell.className = "cf-cell";
        cell.title = `${dateStr}: ${count} problems solved`;
        cell.style.backgroundColor = color;

        grid.appendChild(cell);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Add day labels and grid to the flex container
    activityContent.appendChild(dayLabels);
    activityContent.appendChild(grid);
    
    // Add the flex container to the main container
    container.appendChild(activityContent);

    // Find the target div and insert after it
    const targetDiv = document.querySelector('._UserActivityFrame_frame');
    if (targetDiv) {
        targetDiv.parentNode.insertBefore(container, targetDiv.nextSibling);
        console.log("Extension inserted after _UserActivityFrame_frame");
    } else {
        document.body.prepend(container);
        console.log("Target div not found, inserted at top of body");
    }
})();
