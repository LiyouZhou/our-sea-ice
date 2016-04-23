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
    return weekdays[date.getDay()] + ", " +
        date.getDate() + nth(date.getDate()) + " " +
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

  console.log(range);

  var t_slider = document.getElementById('time_slider');

  noUiSlider.create(t_slider, {
    start: t_max, // Handle start position
    range: range,
    snap: true
  });

  t_slider.noUiSlider.on('update', function( values, handle ) {
      k = timeData.indexOf(Math.floor(values[handle]));
      $("#time_str").text( formatDate(new Date(values[handle]*1000)) );
      updatePlot(latData, lonData);
  });
}

var timeData, latData, lonData;
d3.json("./json/sea-ice/lon.json", function(londata) {
  d3.json("./json/sea-ice/lat.json", function(latdata) {
    latDelta = (latdata[1]-latdata[0])/2
    lonDelta = (londata[1]-londata[0])/2
    d3.json("./json/sea-ice/time.json", function(timedata) {
      timeData = timedata;
      latData = latdata;
      lonData = londata;
      setupSlider();
    });
  });
});


d3.select(self.frameElement).style("height", height + "px");
