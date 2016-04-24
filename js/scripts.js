var width = 800,
    height = 400;

var scale = 180;

var charts = [{}, {}];
var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

charts[0].g = svg.append("g")
                .attr("transform", "translate("+width/4+",0)");
charts[1].g = svg.append("g")
                .attr("transform", "translate("+width*3/4+",0)");

charts[0].projection = d3.geo.orthographic()
                          .scale(scale)
                          .translate([0, height / 2])
                          .precision(.6)
                          .clipAngle(90)
                          .rotate([0,-90,0]);
charts[1].projection = d3.geo.orthographic()
                          .scale(scale)
                          .translate([0, height / 2])
                          .precision(.6)
                          .clipAngle(90)
                          .rotate([0,90,0]);

charts[0].path = d3.geo.path()
                  .projection(charts[0].projection);
charts[1].path = d3.geo.path()
                  .projection(charts[1].projection);

var graticule = d3.geo.graticule();

d3.json("./json/world-50m.json", function(error, world) {
  if (error) throw error;

  for (var i=0; i<charts.length; i++)
  {
    var chart = charts[i];

    chart.g.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", chart.path);

    chart.g.insert("path", ".graticule")
        .datum(topojson.feature(world, world.objects.land))
        .attr("class", "land")
        .attr("d", chart.path);

    chart.g.insert("path", ".graticule")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
        .attr("class", "boundary")
        .attr("d", chart.path);
  }
});

var k=0;
function updatePlot() {
  var side = 5*lonDelta;
  d3.json("./json/sea-ice/"+k+".json", function(sic_mean) {
    var polygons = charts[0].g.selectAll("polygon")
                      .data(sic_mean);

    polygons.exit().remove();
    polygons.enter().append("polygon");

    var polygonAttributes = polygons
                           .attr("points",function(d) {
                              var pt = d.slice(1);
                              var pts = [ [pt[1]-side, pt[0]-side],
                                          [pt[1]-side, pt[0]+side],
                                          [pt[1]+side, pt[0]+side],
                                          [pt[1]+side, pt[0]-side] ];
                              return pts.map(function(dd) {
                                return charts[0].projection(dd).join(",");
                              }).join(" ");
                           })
                           .style("fill", "rgb(255,0,200)")
                           .style("opacity", function(d) { return d[0]; });
  });

  d3.json("./json/sea-ice/southpole"+k+".json", function(sic_mean) {
  var polygons = charts[1].g.selectAll("polygon")
                    .data(sic_mean);

  polygons.exit().remove();
  polygons.enter().append("polygon");

  var polygonAttributes = polygons
                         .attr("points",function(d) {
                            var pt = d.slice(1);
                            var pts = [ [pt[1]-side, pt[0]-side],
                                        [pt[1]-side, pt[0]+side],
                                        [pt[1]+side, pt[0]+side],
                                        [pt[1]+side, pt[0]-side] ];
                            return pts.map(function(dd) {
                              return charts[1].projection(dd).join(",");
                            }).join(" ");
                         })
                         .style("fill", "rgb(255,0,200)")
                         .style("opacity", function(d) { return d[0]; });
  });
}

// Create a list of day and monthnames.
var
  weekdays = [
    "Sunday", "Monday", "Tuesday",
    "Wednesday", "Thursday", "Friday",
    "Saturday"
  ],
  months = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
  ];

// Append a suffix to dates.
// Example: 23 => 23rd, 1 => 1st.
function nth (d) {
  if(d>3 && d<21) return 'th';
  switch (d % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
}

// Create a string representation of the date.
function formatDate ( date ) {
  return date.getDate() + nth(date.getDate()) + " " +
        months[date.getMonth()] + " " +
        date.getFullYear();
}

function setupSlider() {
  var t_min = timeData[0];
  var t_max = timeData[timeData.length-1];

  var range = {
    "min": t_min,
    "max": t_max
  };

  for (var i=1; i<timeData.length-1; i+=1) {
    var key = (timeData[i] - t_min)/(t_max-t_min);
    range[key*100+"%"] = timeData[i];
  }

  var t_slider = document.getElementById('time_slider');

  noUiSlider.create(t_slider, {
    start: t_max, // Handle start position
    range: range,
    snap: true
  });

  t_slider.noUiSlider.on('update', function( values, handle ) {
      k = timeData.indexOf(Math.floor(values[handle]));
      $("#time_str").text( formatDate(new Date(values[handle]*1000)) );
      updatePlot();
  });
}

var timeData, latData, lonData;
d3.json("./json/sea-ice/lon.json", function(londata) {
  d3.json("./json/sea-ice/lat.json", function(latdata) {
    latDelta = (latdata[1]-latdata[0]);
    lonDelta = (londata[1]-londata[0]);
    d3.json("./json/sea-ice/time.json", function(timedata) {
      timeData = timedata;
      latData = latdata;
      lonData = londata;
      setupSlider();
    });
  });
});


d3.select(self.frameElement).style("height", height + "px");
