L.WFST = L.WFS.extend({
  options: {
    forceMulti: false
  },

  initialize: function (options, readFormat) {
    L.WFS.prototype.initialize.call(this, options, readFormat);
    this.state = L.extend(this.state, {
      insert: 'insertElement',
      update: 'updateElement',
      remove: 'removeElement'
    });

    this.changes = {};
  },

  addLayer: function (layer) {
    L.FeatureGroup.prototype.addLayer.call(this, layer);
    if (!layer.feature) {
      layer.feature = { properties: {} };
    }

    if (!layer.state) {
      layer.state = this.state.insert;
      var id = this.getLayerId(layer);
      this.changes[id] = layer;
    }
    return this;
  },

  removeLayer: function (layer) {
    L.FeatureGroup.prototype.removeLayer.call(this, layer);

    var id = this.getLayerId(layer);

    if (id in this.changes) {
      var change = this.changes[id];
      if (change.state === this.state.insert) {
        delete this.changes[id];
      }
      else {
        change.state = this.state.remove;
      }
    }
    else {
      layer.state = this.state.remove;
      this.changes[id] = layer;
    }
  },

  editLayer: function (layer) {
    if (layer.state !== this.state.insert) {
      layer.state = this.state.update;
    }

    var id = this.getLayerId(layer);
    this.changes[id] = layer;
    return this;
  },

  save: function () {
    if (this.changes.length === 0)
      return

    var transaction = L.XmlUtil.createElementNS('wfs:Transaction', { service: 'WFS', version: this.options.version });

    var inserted = [];
    var updated = [];
    var deleted = [];

    for (var id in this.changes) {
      var layer = this.changes[id];
      var action = this[layer.state](layer);
      transaction.appendChild(action);

      if (layer.state === this.state.insert) {
        inserted.push(layer);
      }
      if (layer.state === this.state.update) {
        updated.push(layer);
      }
      if (layer.state === this.state.remove) {
        deleted.push(layer);
      }
    }

    var that = this;

    L.Util.request({
      url: this.options.url,
      data: L.XmlUtil.serializeXmlDocumentString(transaction),
      headers: this.options.headers || {},
      withCredentials: this.options.withCredentials,
      success: function (data) {
        var xmlDoc = L.XmlUtil.parseXml(data);
        var exception = L.XmlUtil.parseOwsExceptionReport(xmlDoc);
        if(exception !== null) {
          that.fire('save:failed', exception);
          return;
        }

        var totalUpdated = 0;
        var totalInserted = 0;
        var totalDeleted = 0;

        try {
          totalUpdated = L.XmlUtil.evaluate('//wfs:TransactionSummary/wfs:totalUpdated', xmlDoc).iterateNext().textContent * 1;
          totalInserted = L.XmlUtil.evaluate('//wfs:TransactionSummary/wfs:totalInserted', xmlDoc).iterateNext().textContent * 1;
          totalDeleted = L.XmlUtil.evaluate('//wfs:TransactionSummary/wfs:totalDeleted', xmlDoc).iterateNext().textContent * 1;

          if (totalUpdated === updated.length) {
            that.fire('wfst:update:success', { layers: updated });
            for (var i in updated) {
              delete that.changes[updated[i]._leaflet_id];
            }
          }
          if (totalDeleted === deleted.length) {
            that.fire('wfst:delete:success', { layers: deleted });
            for (var i in deleted) {
              delete that.changes[deleted[i]._leaflet_id];
            }
          }
        } catch (e) {

        }

        if (totalInserted > 0) {
          var insertResult = L.XmlUtil.evaluate('//wfs:InsertResults/wfs:Feature/ogc:FeatureId/@fid', xmlDoc);
          var insertedIds = [];
          var id = insertResult.iterateNext();
          while (id) {
            insertedIds.push(new L.Filter.GmlObjectID(id.value));
            id = insertResult.iterateNext();
          }

          inserted.forEach(function (layer) {
            L.FeatureGroup.prototype.removeLayer.call(that, layer);
          });

          that.once('load', function (e) {
            that.fire('save:success', { layers: e.layers });
            that.changes = {};
          });

          that.loadFeatures(insertedIds);
        }
      },
      error: function (data) {
        that.fire('save:failed', data);
      }
    });

    return this;
  }
});

L.wfst = function (options, readFormat) {
  return new L.WFST(options, readFormat);
};
