let margin = {top:30, right:70, bottom:60, left: 70},
let height = 500,
let width = window.innerWidth * 0.6,


d3.csv("avocado.csv").then(function(data) {
    // console.log(data),

    let totalUSdata = [],
    let regionalData = [],
    let citiesData = [],

    // parses date string to js datetime object
    const parseTime = d3.timeParse("%Y-%m-%d"),

    // formats js datetime object to desired string
    const formatTime = d3.timeFormat("%b %d"),

    data.forEach(d => {
        d.Date = parseTime(d.Date),

        // convert strings to ints
        d.AveragePrice = +d.AveragePrice,
        d.TotalVolume = +d.TotalVolume,

        // collect data points labelled "TotalUS" in separate array
        if(d.region == "TotalUS"){
            totalUSdata.push(d),
        }
        else if(d.region =="Northeast" || 
                d.region =="GreatLakes" || 
                d.region =="Plains" || 
                d.region =="Southeast" || 
                d.region =="Midsouth" || 
                d.region =="SouthCentral" || 
                d.region =="West"){
            regionalData.push(d)
        }
        else{
            citiesData.push(d),
        }
    }),

    // console.log(totalUSdata),
    nationalPricesChart(totalUSdata),
    volumeByRegionChart(regionalData),
    avgPriceByRegionChart(regionalData,citiesData),
}),


function nationalPricesChart(data){
    // nesting data http://bl.ocks.org/shancarter/raw/4748131/

    const weekify = d3.timeFormat("%U"),

    data.forEach(d => {
        d.Week = +weekify(d.Date),
    })

    let nestedUSdata = d3.nest()
        .key(d => d.type)
        .key(d => d.year)
        .entries(data),

    // console.log(nestedUSdata),

    let yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AveragePrice)])
        .range([height - margin.bottom, margin.top])

    let xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Week))
        .range([margin.left, width - margin.right])
    
    const toDate = d3.timeParse("%U"),
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
        .call(g => g.attr("class", "xAxis")),

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
        .call(g => g.attr("class", "yAxis")),,

    const line = d3.line()
        .defined(d => !isNaN(d.AveragePrice))
        .x(d => xScale(d.Week))
        .y(d => yScale(d.AveragePrice)),

    const svg = d3.select("#nationalPricesChart"),
    
    svg.attr("width", width)
        .attr("height", height),

    svg.append("g")
        .call(xAxis),

    svg.append("g")
        .call(yAxis),

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
        .attr("opacity", 0),

    d3.selectAll("g.tick")
        .filter(d => d==1)
        // .select("line")
        .attr("x1", 0)
        .attr("x2", width - margin.right - margin.left)
        .attr("class", "majorTick")

    let lineChoice = document.getElementById("nationalPricesForm"),

    lineChoice.oninput = () => {
        if(lineChoice.radio.value =="conventional"){
            conventionalLines.attr("opacity", 1),
            organicLines.attr("opacity", 0),
        }
        else{
            conventionalLines.attr("opacity", 0),
            organicLines.attr("opacity", 1),
        }
    }
}



function volumeByRegionChart(data){

    data.forEach(d =>{
        if(d.region== "GreatLakes" || d.region == "Plains"){
            d.region = "Midwest"
        }
        else if(d.region == "Midsouth" || d.region == "SouthCentral" || d.region == "Southeast"){
            d.region = "South"
        }
    })

    let regionRollup = d3.nest()
        .key(d => d.type)
        .key(d => d.region)
        .key(d => d.year)
        .rollup(v => d3.sum(v, d => d.TotalVolume))
        .entries(data)

    let yScale = d3.scaleLinear()
        .domain([0, (d3.sum(regionRollup[0].values[1].values, d => d.value))])
        .range([height - margin.bottom, margin.top])

    let xScale = d3.scaleBand()
        .domain(["Northeast","West","Midwest","South"])
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
        .call(g => g.attr("class", "xAxis")),

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
        .call(g => g.attr("class", "yAxis")),

    const svg = d3.select("#volumeByRegionChart"),

    svg.attr("width", width)
        .attr("height", height),

    svg.append("g")
        .call(xAxis),

    svg.append("g")
        .call(yAxis),

    
    let conventionalBars = svg.append("g")
        .selectAll("g")
        .data(regionRollup[0].values)
            .enter()
            .append("g")
            .attr("class", d => d.key + "Bars") //region bars
            .attr("transform", d => "translate("+xScale(d.key)+",0)")
            .selectAll("g")
                .data((d,i) => d.values)
                .enter()
                .append("rect")
                    .attr("y", (d,i) => yScale(d.value))
                    .attr("height", d => yScale(height)- yScale(d.value))
                    .attr("width", xScale.bandwidth())
                    .attr("class", d => "bar"+d.key)

    let organicBars = svg.append("g")
        .selectAll("g")
        .data(regionRollup[1].values)
            .enter()
            .append("g")
            .attr("class", d => d.key + "Bars") //region bars
            .attr("transform", d => "translate("+xScale(d.key)+",0)")
            .selectAll("g")
                .data((d,i) => d.values)
                .enter()
                .append("rect")
                    .attr("y", (d,i) => yScale(d.value))
                    .attr("height", d => yScale(height)- yScale(d.value))
                    .attr("width", xScale.bandwidth())
                    .attr("class", d => "bar"+d.key)
                    .attr("opacity", 0),



    let barChoice = document.getElementById("volumeByRegionForm"),

    barChoice.oninput = () => {
        if(barChoice.radio.value =="conventional"){
            conventionalBars.attr("opacity", 1),
            organicBars.attr("opacity", 0),
        }
        else{
            conventionalBars.attr("opacity", 0),
            organicBars.attr("opacity", 1),
        }
    }
}


function avgPriceByRegionChart(regionalData, citiesData){

    regionalData.forEach(d => citiesData.push(d))

    let allData2018 = citiesData.filter(d => d.year == "2018")

    let regionalRollup = d3.nest()
        .key(d => d.type)
        .key(d => d.region)
        .rollup(v => d3.mean(v, d => d.AveragePrice))
        .object(allData2018)

    console.log(regionalRollup),
    // console.log(citiesData),

    // let priceLookup = 
    // https://www.census.gov/geo/maps-data/
    // https://mapshaper.org/


    const svg = d3.select("#avgPriceByRegionChart"),

    svg.attr("width", width)
        .attr("height", height),


    let color = d3.scaleQuantize()
        .domain([0.5,2.5])
        .range(d3.schemeYlGn[8]),

    d3.json("cb_2017_us_region_500k.json").then(function(regionShapes){

        let center = d3.geoCentroid(regionShapes),

        const projection = d3.geoMercator()
            .scale(700)
            .translate([width /2.75, height /2.75])
            .center(center),

        const path = d3.geoPath().projection(projection),
        let aa = [-122.490402, 37.786453],
        let bb = [-122.389809, 37.72728],
        // console.log(regionRollup)
        let conventionalMap = svg.append("g")
            .selectAll("g")
            .data(regionShapes.features)
            .enter()
            .append("path")
            .attr("d", d => path(d))
            .attr("stroke-width", 2)
            .attr("stroke", "white")
            // .attr("fill", "olivedrab")
            .attr("fill", (d) => color(regionalRollup['conventional'][d.properties.NAME]))
            .attr("class", (d) => d.properties.NAME + "Shape")
        // svg.selectAll("circle")
        //     .data([aa,bb])
        //     .enter()
        //     .append("circle")
        //     .attr("cx", d => projection(d)[0])
        //     .attr("cy", d => projection(d)[1])
        //     .attr("r", "8px")
        //     .attr("fill", "red")
        let organicMap = svg.append("g")
            .selectAll("g")
            .data(regionShapes.features)
            .enter()
            .append("path")
            .attr("d", d => path(d))
            .attr("stroke-width", 2)
            .attr("stroke", "white")
            // .attr("fill", "olivedrab")
            .attr("fill", (d) => color(regionalRollup['organic'][d.properties.NAME]))
            .attr("class", (d) => d.properties.NAME + "Shape")
            .attr("opacity", 0)

        let mapChoice = document.getElementById("avgPriceByRegionForm"),

        mapChoice.oninput = () => {
            if(mapChoice.radio.value =="conventional"){
                conventionalMap.attr("opacity", 1),
                organicMap.attr("opacity", 0),
            }
            else{
                conventionalMap.attr("opacity", 0),
                organicMap.attr("opacity", 1),
            }
        }
    })

}