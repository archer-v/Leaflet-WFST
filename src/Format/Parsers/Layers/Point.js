/**
 * Created by PRadostev on 05.06.2015.
 */

L.GML.Point = L.GML.PointNode.extend({
  includes: L.GML.CoordsToLatLngMixin,

  parse: function (element, options) {
    var coords = L.GML.PointNode.prototype.parse.call(this, element, options);
    var latLng = this.transform(coords, options);
    var layer = null;
    if (options.properties) {
      if (options.properties.radius != null && options.properties.radius > 0) {
        layer = new L.Circle(latLng, {radius: options.properties.radius })
      }
    }
    if (layer == null)
      layer = new L.Marker(latLng);
    
    return layer;
  }
});
