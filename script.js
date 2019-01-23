let margin = {top:30, right:70, bottom:60, left: 70};
let height = 500;
let width = window.innerWidth * 0.6;


d3.csv("data/avocado.csv").then(function(data) {
    // console.log(data);

    let totalUSdata = [];
    let regionalData = [];
    let citiesData = [];

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
            citiesData.push(d);
        }
    });

    // console.log(totalUSdata);
    nationalPricesChart(totalUSdata);
    volumeByRegionChart(regionalData);
    avgPriceByRegionChart(regionalData,citiesData);
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

    let priceLines = svg.append("g")
        .selectAll("path")
        .data(nestedUSdata[0].values)
        .enter()
        .append("path")
        .style("mix-blend-mode","multiply")
        .attr("class", d => "line " + "line"+d.key)
        .attr("d", d => line(d.values))

    d3.selectAll("g.tick")
        .filter(d => d==1)
        .attr("x1", 0)
        .attr("x2", width - margin.right - margin.left)
        .attr("class", "majorTick")
    
    let palette = ["gold", "yellowgreen", "olivedrab", "darkgreen"]
    let years = ["2015", "2016", "2017", "2018"]

    const colorKey = svg.append("g")
        .attr("transform", "translate(25,40)");
    colorKey.selectAll("rect")
        .data(palette)
        .enter().append("rect")
          .attr("height", 12)
          .attr("x", width-margin.right * 2.15)
          .attr("y", (d,i) => (height - margin.bottom * 2.25) - (20 * (palette.length - i)))
          .attr("width", 12)
          .attr("fill", d => d)
    colorKey.selectAll("text")
        .data(years)
        .enter().append("text")
            .attr("y", (d,i) => (height - margin.bottom * 2.1) - (20 * (palette.length - i)))
            .attr("x", width-margin.right * 1.85)
            .text(d => d)
            .attr("class", "caption")

    let lineChoice = document.getElementById("nationalPricesForm");

    lineChoice.oninput = () => {
        let index = (lineChoice.radio.value == "conventional") ? 0 : 1;

        priceLines.data(nestedUSdata[index].values)
            .attr("class", d => "line " + "line"+d.key)
            .attr("d", d => line(d.values))
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

    const svg = d3.select("#volumeByRegionChart");

    svg.attr("width", width)
        .attr("height", height);

    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);

    let regionBars = svg.append("g")
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

    let barChoice = document.getElementById("volumeByRegionForm");

    barChoice.oninput = () => {
        let index = (barChoice.radio.value =="conventional") ? 0 : 1;

        d3.selectAll(".MidwestBars")
            .selectAll("rect")
            .data(regionRollup[index].values[0].values)
                .attr("y", (d,i) => yScale(d.value))
                .attr("height", d => yScale(height)- yScale(d.value))
        d3.selectAll(".SouthBars")
            .selectAll("rect")
            .data(regionRollup[index].values[1].values)
                .attr("y", (d,i) => yScale(d.value))
                .attr("height", d => yScale(height)- yScale(d.value))
        d3.selectAll(".NortheastBars")
            .selectAll("rect")
            .data(regionRollup[index].values[2].values)
                .attr("y", (d,i) => yScale(d.value))
                .attr("height", d => yScale(height)- yScale(d.value))
        d3.selectAll(".WestBars")
            .selectAll("rect")
            .data(regionRollup[index].values[3].values)
                .attr("y", (d,i) => yScale(d.value))
                .attr("height", d => yScale(height)- yScale(d.value))
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

    // console.log(regionalRollup);

    let cityCoordLookup = {};
    let cities = Object.keys(regionalRollup['conventional']);

    // create lookup table for city coordinates
    d3.tsv("data/1000-largest-us-cities-by-population-with-geographic-coordinates.tsv").then(function(cityCoords){
        cities.forEach(d => {
            cityCoords.forEach(e =>{
                if(e['City'].includes(d) || d.includes(e['City'])){
                    cityCoordLookup[d] = []
                    cityCoordLookup[d].push(e['Coordinates'].split(", "))
                    let lat = parseFloat(cityCoordLookup[d][0][1])
                    let long = parseFloat(cityCoordLookup[d][0][0])
                    cityCoordLookup[d][0][0] = lat;
                    cityCoordLookup[d][0][1] = long;

                }
            })
        })
    })

    // console.log(cityCoordLookup)

    const svg = d3.select("#avgPriceByRegionChart");

    svg.attr("width", width)
        .attr("height", height+100);

    // ready-to-use color schemes: https://github.com/d3/d3-scale-chromatic
    let palette = ["gold", "#d3e534", "yellowgreen", "olivedrab", "#356d01","#37511f", "saddlebrown"]
    let color = d3.scaleQuantize() // discrete range scale
        .domain([0.5,2.25])
        .range(palette)

    // https://www.census.gov/geo/maps-data/
    // https://mapshaper.org/
    d3.json("data/cb_2017_us_region_500k.json").then(function(regionShapes){

        let center = d3.geoCentroid(regionShapes);

        const projection = d3.geoMercator()
            .scale(width)
            .translate([width /2.75, height /3.75])
            .center(center);

        const path = d3.geoPath().projection(projection);

        const tooltip = d3.select("#avgPriceByRegionContainer")
            .append('div')
            .attr('class', 'tooltip')
            .style('display', "none");

        svg.append("g")
            .selectAll("g")
            .data(regionShapes.features)
            .enter()
            .append("path")
            .attr("d", d => path(d))
            .attr("fill", (d) => color(regionalRollup['conventional'][d.properties.NAME]))
            .attr("class", "regionShapes")

        let cities = svg.append("g")
            .selectAll("circle")
            .data(Object.keys(cityCoordLookup))
            .enter()
            .append("circle")
            .attr("cx", d => projection(cityCoordLookup[d][0])[0])
            .attr("cy", d => projection(cityCoordLookup[d][0])[1])
            .attr("r", 7)
            .attr("fill", d => color(regionalRollup['conventional'][d]))
            .attr("class", "cityPoints")
            .on('mouseover', d => {
                tooltip
                  .transition()
                  .duration(100)
                  .style('display', "block");
                tooltip
                  .html("<b>"+d+":</b><br>" + "$" + Math.round(regionalRollup[mapChoice.radio.value][d] * 100) /100)
                  .style('left', d3.event.pageX - 60 + 'px')
                  .style('top', d3.event.pageY - 220 + 'px');
              })
              .on('mouseout', () => {
                tooltip
                  .transition()
                  .duration(500)
                  .style('display', "none");
              });

        const xScale = d3.scaleLinear()
            .domain(d3.extent(color.domain()))
            .rangeRound([width-300, width-50]);

        const colorKey = svg.append("g")
            .attr("transform", "translate(25,40)");
        colorKey.selectAll("rect")
            .data(color.range().map(d => color.invertExtent(d))) // data here is hex codes
            .enter().append("rect")
              .attr("height", 8)
              .attr("x", d => xScale(d[0]))
              .attr("width", d => xScale(d[1]) - xScale(d[0]))
              .attr("fill", d => color(d[0]));
        colorKey.append("text")
            .attr("class", "caption")
            .attr("x", xScale.range()[0])
            .attr("y", -6)
            .text("Average Price ($)");
        colorKey.call(d3.axisBottom(xScale)
            .tickSize(13)
            .tickValues(color.range().slice(1).map(d => color.invertExtent(d)[0])))
          .select(".domain")
            .remove();

        let mapChoice = document.getElementById("avgPriceByRegionForm");

        mapChoice.oninput = () => {
            svg.selectAll("circle")
                .attr("fill", d => color(regionalRollup[mapChoice.radio.value][d]))
            svg.selectAll(".regionShapes")
                .attr("fill", (d) => color(regionalRollup[mapChoice.radio.value][d.properties.NAME]))
        }
    })
}
