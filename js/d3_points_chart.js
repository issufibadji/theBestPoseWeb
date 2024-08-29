export function renderPointsChart(filteredResults) {
    const keypointNames = [
        "Cabeça", "Pescoço", "Ombro Direito", "Cotovelo Direito", "Punho Direito",
        "Ombro Esquerdo", "Cotovelo Esquerdo", "Punho Esquerdo", "Quadril Direito",
        "Joelho Direito", "Tornozelo Direito", "Quadril Esquerdo", "Joelho Esquerdo",
        "Tornozelo Esquerdo", "Olho Direito", "Olho Esquerdo"
    ];

    const pointCounts = keypointNames.map(name => ({ name: name, count: 0 }));

    filteredResults.forEach(result => {
        if (result && Array.isArray(result.keypoints)) {
            result.keypoints.forEach((score, index) => {
                if (score > 0.5 && keypointNames[index]) {
                    pointCounts[index].count++;
                }
            });
        } else {
            console.error("Pontos-chave estão indefinidos ou não são um array.", result);
        }
    });

    const margin = { top: 20, right: 30, bottom: 100, left: 50 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    d3.select("#pointsChart").selectAll("*").remove();

    const svg = d3.select("#pointsChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(pointCounts.map(d => d.name))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(pointCounts, d => d.count)])
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
        .data(pointCounts)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.name))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", 'blue');

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text("Pontos-Chave Confiáveis por Ponto Corporal");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Número de Pontos");
}