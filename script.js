let margin = {top:30, right:70, bottom:60, left: 70};
let height = 500;
let width = window.innerWidth * 0.6;


d3.csv("avocado.csv").then(function(data) {
    // console.log(data);

    let totalUSdata = [];
    let regionalData = [];

    // parses date string to js datetime object
    const parseTime = d3.timeParse("%Y-%m-%d");

    // formats js datetime object to desired string
    const formatTime = d3.timeFormat("%b %d");

    data.forEach(d => {
        d.Date = parseTime(d.Date);

        // convert strings to ints
        d.AveragePrice = +d.AveragePrice;
        d.TotalVolume = +d.TotalVolume;

        // collect data points labelled "TotalUS" in separate array
        if(d.region == "TotalUS"){
            totalUSdata.push(d);
        };
    });

    // console.log(totalUSdata);
    nationalPricesChart(totalUSdata);
    volumeByYearChart(totalUSdata);

});


function nationalPricesChart(data){
    // nesting data http://bl.ocks.org/shancarter/raw/4748131/

    const weekify = d3.timeFormat("%U");

    data.forEach(d => {
        d.Week = +weekify(d.Date);
    })

    let nestedUSdata = d3.nest()
        .key(d => d.type)
        .key(d => d.year)
        .entries(data);

    // console.log(nestedUSdata);

    let yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AveragePrice)])
        .range([height - margin.bottom, margin.top])

    let xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Week))
        .range([margin.left, width - margin.right])
    
    const toDate = d3.timeParse("%U");
    const date_ify = d3.timeFormat("%b-%d")

    let xTicks = d3.axisBottom(xScale)
        .ticks(7)
        .tickSizeOuter(0)
        .tickFormat(d => date_ify(toDate(d)))
        .tickPadding(10)

    let xAxis = g => g
        .attr("transform", "translate(0,"+(height-margin.bottom)+")")
        .call(xTicks)
        .call(g => g.select(".tick:first-of-type text").remove())
        .call(g => g.select(".tick:first-of-type line").remove())
        .call(g => g.attr("class", "xAxis"));

    let yTicks = d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => "$" + d)
        .tickSize(-(width-margin.right-margin.left))
        .tickSizeOuter(0)
        .tickPadding(10)

    let yAxis = g => g
        .attr("transform", "translate("+margin.left+",0)")
        .call(yTicks)
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:first-of-type line").remove())
        .call(g => g.attr("class", "yAxis"));;

    const line = d3.line()
        .defined(d => !isNaN(d.AveragePrice))
        .x(d => xScale(d.Week))
        .y(d => yScale(d.AveragePrice));

    const svg = d3.select("#nationalPricesChart");
    
    svg.attr("width", width)
        .attr("height", height);

    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);

    let conventionalLines = svg.append("g")
        .selectAll("path")
        .data(nestedUSdata[0].values)
        .enter()
        .append("path")
        .style("mix-blend-mode","multiply")
        .attr("class", d => "line " + "line"+d.key)
        .attr("d", d => line(d.values))

    let organicLines = svg.append("g")
        .selectAll("path")
        .data(nestedUSdata[1].values)
        .enter()
        .append("path")
        .attr("class", d => "line " + "line"+d.key)
        .style("mix-blend-mode","multiply")
        .attr("d", d => line(d.values))
        .attr("opacity", 0);

    d3.selectAll("g.tick")
        .filter(d => d==1)
        // .select("line")
        .attr("x1", 0)
        .attr("x2", width - margin.right - margin.left)
        .attr("class", "majorTick")

    let lineChoice = document.getElementById("nationalPricesForm");

    lineChoice.oninput = () => {
        if(lineChoice.radio.value =="conventional"){
            conventionalLines.attr("opacity", 1);
            organicLines.attr("opacity", 0);
        }
        else{
            conventionalLines.attr("opacity", 0);
            organicLines.attr("opacity", 1);
        }
    }
}



function volumeByYearChart(data){
    let volumeRollup = d3.nest()
        .key(d => d.type)
        .key(d => d.year)
        .rollup(v => d3.sum(v, d => d.TotalVolume))
        .entries(data);

    let test = Array.from(volumeRollup[0]['values'].keys())
    console.log(volumeRollup)

    let yScale = d3.scaleLinear()
        .domain([0, (d3.max(volumeRollup[0].values, d => d.value) + d3.max(volumeRollup[1].values, d => d.value))])
        .range([height - margin.bottom, margin.top])

    let xScale = d3.scaleBand()
        .domain(["2015","2016","2017","2018"])
        .range([margin.left, width - margin.right])
        .padding(0.05)

    let xTicks = d3.axisBottom(xScale)
        .ticks(4)
        .tickSizeOuter(0)
        .tickPadding(10)
        .tickFormat(d => d.toString())

    let xAxis = g => g
        .attr("transform", "translate(0,"+(height-margin.bottom)+")")
        .call(xTicks)
        .call(g => g.attr("class", "xAxis"));

    let yTicks = d3.axisLeft(yScale)
        .ticks(4)
        .tickSize(-(width-margin.right-margin.left))
        .tickSizeOuter(0)
        .tickPadding(10)
        .tickFormat(d => d/1000000000 + " BIL")

    let yAxis = g => g
        .attr("transform", "translate("+margin.left+",0)")
        .call(yTicks)
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:first-of-type text").remove())
        .call(g => g.select(".tick:first-of-type line").remove())
        .call(g => g.attr("class", "yAxis"));

    const svg = d3.select("#volumeByYearChart");

    svg.attr("width", width)
        .attr("height", height);

    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);
    
    svg.append("g")
        .selectAll("g")
        .data(volumeRollup)
        .enter()
        .append("g")
            .attr("class", d => d.key + "Bars")
        .selectAll("rect")
        .data(d => d.values)
        .enter()
        .append("rect")
            .attr("x", d => xScale(d.key))
            .attr("y", d => yScale(d.value))
            .attr("height", d => yScale(height)- yScale(d.value))
            .attr("width", xScale.bandwidth())
            .style("mix-blend-mode","multiply")

    d3.selectAll(".conventionalBars")
        .selectAll("rect")
        .attr("y", (d,i) => yScale(d.value) - (yScale(height) - yScale(volumeRollup[1]['values'][i]['value'])));
    // by region
}