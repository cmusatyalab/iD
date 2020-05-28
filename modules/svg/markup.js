import { select as d3_select } from 'd3-selection';

import { svgPointTransform } from './helpers';
import { geoMetersToLat, geoMetersToLon, geoLonToMeters, geoLatToMeters, geoSphericalDistance } from '../geo';
import { osmNode, osmWay } from '../osm';
import { presetManager } from '../presets';

export function svgMarkup(projection, context) {
    var layer = d3_select(null);


    class Marker {
        constructor(loc, id, icon) {
          // Store required properties
          this.loc = loc;
          this.id = id;
          this.icon = icon;

          return this;
        }
    }

    function showLayer() {
        layer.style('display', 'block');
    }


    function hideLayer() {
        layer
            .transition()
            .duration(100)
            .style('opacity', 0);
    }

    function layerOn() {
        layer
            .style('opacity', 0)
            .transition()
            .duration(0)
            .style('opacity', 1);

    }

    function layerOff() {
        layer.style('display', 'none');
    }

    function transform(d) {
        return svgPointTransform(projection)(d);
    }

    function getNodeLocationById(nodeid) {
        loc = null;
        _created = context.history().difference().created();
        _created.forEach(function (item) {
             if (item instanceof osmNode) {
                if (item.id == nodeid) {
                    loc = item.loc;
                }
            }
        });
        return loc;
    }

    function calcGeoOffset(a, b) {
        var TAU = 2 * Math.PI;
        var EQUATORIAL_RADIUS = 6356752.314245179;
        var POLAR_RADIUS = 6378137.0;

        var dx = geoLonToMeters(a[0] - b[0], (a[1] + b[1]) / 2);
        var dy = geoLatToMeters(a[1] - b[1]);

        lat = a[0] + (180/Math.PI)*(dy/POLAR_RADIUS);
        lon = a[0]+ (180/Math.PI)*(dx/POLAR_RADIUS)/Math.cos(Math.PI/180.0*a[0]);

        return [lat,lon];
    }

    function update() {
        markers = [];
        _created = context.history().difference().created();

        _created.forEach(function (item) {
            if (item instanceof osmWay) {
                console.debug(item);
                if (item.tags.military && !item.tags.area) {
                    time = context.simtime;
                    if(item.tags.maxspeed == null) {
                        speed = 0;
                    } else {
                        speed_chunks = item.tags.maxspeed.split(' ');
                        if(speed_chunks.length > 1 && speed_chunks[1] == 'mph') {
                            speed = speed_chunks[0] / 2.237;
                        } else {
                            //assume maxspeed field is km/h and convert to m/s; when selecting mph, the units are part of maxspeed
                            speed = item.tags.maxspeed / 3.6; 
                        }
                    }
                    console.debug('Speed: ' + speed);
                    offset = time * speed; 
                    console.debug('Offset: ' + offset); 
                    nearest = 0;
                    dist = 0;
                    for(i=0; i < item.nodes.length-1; i++) {
                        dist = dist + geoSphericalDistance(getNodeLocationById(item.nodes[i]), getNodeLocationById(item.nodes[i+1]));
                        console.debug("Distance between " + item.nodes[i] + " and " + item.nodes[i+1] + " is " + dist);
                        if (offset > dist) {
                            nearest++;
                            console.debug("Nearest node is now " + nearest);
                        }
                    }
                 
                    
                    var preset = presetManager.match(item, context.graph());
                    var picon = preset && preset.icon;
    
                    if (!picon) {
                        icon = '';
                    } else {
                        var isMaki = /^maki-/.test(picon);
                        icon = '#' + picon + (isMaki ? '-15' : '');
                    }
                    
                    m = new Marker(getNodeLocationById(item.nodes[nearest]), item.id, icon); //(item.tags.military == 'tank') ? "#fas-snowplow" : "#fas-hiking");
                    markers.push(m);

                }
            } 
        });

        var groups = layer.selectAll('.markups').selectAll('.markup')
            .data(markers);

        groups.exit()
            .remove();

        var pointsEnter = groups.enter()
            .append('g')
            .attr('class', function(d) { return 'markup ' + d.id; });

        pointsEnter
            .append('circle')
            .attr('dx', '0')
            .attr('dy', '0')
            .attr('fill', 'black')
            .attr('stroke', 'white')
            .attr('stroke-width', '1.5')
            .attr('r', '10');

        pointsEnter
        .append('use')
        .attr('transform', 'translate(-6, -6)')
        .attr('class', 'icon')
        .attr('color', 'white')
        .attr('width', '11px')
        .attr('height', '11px');
    
        groups.select('.icon')      // propagate bound data
        .attr('xlink:href', function(d) { return d.icon; });
        
        groups.merge(pointsEnter)
            .attr('transform', svgPointTransform(projection));

    }
    

    function drawLocation(selection) {
        var enabled = svgMarkup.enabled;

        layer = selection.selectAll('.layer-markup')
            .data([0]);

        layer.exit()
            .remove();

        var layerEnter = layer.enter()
            .append('g')
            .attr('class', 'layer-markup')
            .style('display', enabled ? 'block' : 'none');

        layerEnter
            .append('g')
            .attr('class', 'markups');

        layer = layerEnter
            .merge(layer);

        if (enabled) {
            update();
        } else {
            layerOff();
        }
    }

    drawLocation.enabled = function (enabled) {
        svgMarkup.enabled = enabled;
        if (svgMarkup.enabled) {
            update();
             showLayer();
            layerOn();
        } else {
            hideLayer();
        }
        return this;
    };

    return drawLocation;
}
