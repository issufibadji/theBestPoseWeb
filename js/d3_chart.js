export function renderChart(filteredResults) {
    const labels = filteredResults.map((_, index) => `Pessoa ${index + 1}`);
    const scores = filteredResults.map(result => result.score);

    const ctx = d3.select("#accuracyChart").select("svg");
    if (!ctx.empty()) {
        ctx.remove(); // Remove o gráfico anterior se existir
    }

    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select("#accuracyChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(labels)
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, 1])
        .nice()
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.selectAll(".bar")
        .data(scores)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d, i) => x(labels[i]))
        .attr("y", d => y(d))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d))
        .attr("fill", d => d > 0.5 ? 'green' : 'red');

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text("Confiabilidade das Detecções");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Score");
}