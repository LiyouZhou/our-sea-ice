var width = 400,
    height = 400;

var projection = d3.geo.orthographic()
    .scale(153)
    .translate([width / 2, height / 2])
    .precision(.1)
    .rotate([90,90,0]);

var path = d3.geo.path()
    .projection(projection);

var graticule = d3.geo.graticule();

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);

d3.json("./json/world-50m.json", function(error, world) {
  if (error) throw error;

  svg.insert("path", ".graticule")
      .datum(topojson.feature(world, world.objects.land))
      .attr("class", "land")
      .attr("d", path);

  console.log(world.objects.land);
  console.log(topojson.feature(world, world.objects.land));

  svg.insert("path", ".graticule")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("d", path);
});

var k=0;
function updatePlot(latdata, londata) {
  console.log(k);

  d = new Date(timeData[k]*1000)
  $("#time_str").text(d);

  d3.json("./json/sea-ice/"+k+".json", function(sic_mean) {
    data = []

    for (i = 0; i < latdata.length; i+=5) {
      for (j = 0; j < londata.length; j+=5) {
        if(sic_mean[i][j] !== 0) {
          var v = [ projection([londata[j]-5*lonDelta, latdata[i]-5*latDelta]),
                    projection([londata[j]-5*lonDelta, latdata[i]+5*latDelta]),
                    projection([londata[j]+5*lonDelta, latdata[i]+5*latDelta]),
                    projection([londata[j]+5*lonDelta, latdata[i]-5*latDelta]) ];

          data.push([v, sic_mean[i][j]]);
        }
      }
    }

    var polygons = svg.selectAll("polygon")
                              .data(data);

    polygons.exit().remove();
    polygons.enter().append("polygon");

    var polygonAttributes = polygons
                           .attr("points",function(d) {
                              return d[0].map(function(d) { return d.join(","); }).join(" ");
                           })
                           .style("fill", "rgb(255,255,200)")
                           .style("opacity", function(d) { return d[1]; })
                           .style("stroke-width", 0)
                           .style("stroke", "red");

    if (k<433) {
      k += 1;
      setTimeout(updatePlot(latdata, londata), 3000);
    } else {
      k = 0;
    }
  });
}

var timeData
d3.json("./json/sea-ice/lon.json", function(londata) {
  d3.json("./json/sea-ice/lat.json", function(latdata) {
    latDelta = (latdata[1]-latdata[0])/2
    lonDelta = (londata[1]-londata[0])/2
    d3.json("./json/sea-ice/time.json", function(timedata) {
      timeData = timedata;
      updatePlot(latdata, londata);
    });
  });
});


d3.select(self.frameElement).style("height", height + "px");
