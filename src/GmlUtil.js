/**
 * Utility functions for gml creation
 * @namespace GmlUtil
 */

L.GmlUtil = {

  /**
   * Create gml:pos Element with passed coordinates
   *
   * @method posNode
   * @param {L.Point} coord
   * @return {Element} gml:pos
   */
  posNode: function (coord) {
    return L.XmlUtil.createElementNS('gml:pos', { srsDimension: 2 }, { value: coord.x + ' ' + coord.y });
  },

  /**
   * Create gml:posList Element from passed coordinates
   *
   * @method posListNode
   * @param {Array} coords Array of L.Point that should be represent as GML
   * @param {boolean} close Should posList be closed, uses when need do polygon
   * @return {Element} gml:posList Element
   */
  posListNode: function (coords, close) {
    var localcoords = [];
    coords.forEach(function (coord) {
      localcoords.push(coord.x + ' ' + coord.y);
    });
    if (close && coords.length > 0) {
      var coord = coords[0];
      localcoords.push(coord.x + ' ' + coord.y);
    }

    var posList = localcoords.join(' ');
    return L.XmlUtil.createElementNS('gml:posList', {}, { value: posList });
  },

  //transform lng coordinates outside the world bounds -180:180 to inner area (add or sub 360*x degrees)
  //todo checking SRS needed causes it works only for standart EPSG:4326
  transformToWorldBounds: function (latLngs) {
    //passes the multidimensional array recursively
    if (Array.isArray(latLngs)) {
      var resultLatLngs = [];
      for (var i = 0; i < latLngs.length; i++) {
        resultLatLngs.push(this.transformToWorldBounds(latLngs[i]));
      }

      return resultLatLngs;
    }

    var tLatLng = L.latLng([latLngs.lat, latLngs.lng]);
    if (tLatLng.lng > 180) {
      tLatLng.lng = tLatLng.lng - 360 * (Math.floor(( tLatLng.lng  - 180 ) / 360) + 1)
    } else if (tLatLng.lng < -180) {
      tLatLng.lng = tLatLng.lng + 360 * (Math.floor((-180 - tLatLng.lng ) / 360) + 1)
    }

    return tLatLng;
  },

};
