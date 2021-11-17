L.CircleMarker.include({
  toGml: function(crs) {
    var node = L.XmlUtil.createElementNS('gml:Point', {srsName: crs.code});
    if (typeof this.getRadius == "function")
      this.feature.properties.radius = this.getRadius();
    node.appendChild(L.GmlUtil.posNode(L.Util.project(crs, L.GmlUtil.transformToWorldBounds(this.getLatLng()))));
    return node;
  }
});
