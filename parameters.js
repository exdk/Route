        var RouteControl = function ( options ) {
            this._element;
            this._startAddressInput;
            this._finishAddressInput;
            this._clearButton;
            this._totalInfoDiv;

            this._map = options.map;
            this._source;

            this._numPoint;
            this._startPoint;
            this._finishPoint;
            this._route;

            this._init();

            ol.control.Control.call( this, {
                element: this._element,
                target: options.target
            } );
        };

        ol.inherits( RouteControl, ol.control.Control );

        RouteControl.prototype._init = function () {
            this._element = document.getElementById( 'routeControl' );

            this._startAddressInput = document.getElementById( 'startAddress' );
            this._finishAddressInput = document.getElementById( 'finishAddress' );
            this._totalInfoDiv = document.getElementById( 'totalInfo' );
            this._clearButton = document.getElementById( 'clear' );

            // при клике на поле ввода начального адреса на карте будет устанавливаться
            // точка отправления, при клике на поле конечного адреса - точка прибытия
            this._startAddressInput.addEventListener( 'click', this._setRoutePoint.bind( this, 0 ), false );
            this._startAddressInput.addEventListener( 'touchstart', this._setRoutePoint.bind( this, 0 ), false );

            this._finishAddressInput.addEventListener( 'click', this._setRoutePoint.bind( this, 1 ), false );
            this._finishAddressInput.addEventListener( 'touchstart', this._setRoutePoint.bind( this, 1 ), false );

            this._clearButton.addEventListener( 'click', this._clear.bind( this, 1 ), false );
            this._clearButton.addEventListener( 'touchstart', this._clear.bind( this, 1 ), false );
			
            // подписываемся на событие клика на карте для установки маркеров
            this._map.on('click', this._processClick.bind( this ) );

            var styleFunc = function( feature, resolution ) {
                var marker = feature.get( 'marker' );

                if (marker) {
                    // marker определён - возвращаем стили для точки
                    return [new ol.style.Style({
                        image : new ol.style.Icon({
                            anchor : [ 0.5, 1 ],
                            src : marker
                        })
                    })];
                } else {
                    // marker не определён - возвращаем стили для линии
                    return [new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'blue',
                            width: 3
                        })
                    })];
                }
            };

            this._source = new ol.source.Vector();
            var markerLayer = new ol.layer.Vector({
                source : this._source,
                style : styleFunc
            });
            this._map.addLayer( markerLayer );
        };

        RouteControl.prototype._clear = function () {
            this._route = null;
            this._numPoint = null;
            this._startPoint = null;
            this._finishPoint = null;
            this._source.clear();

            this._startAddressInput.value = "";
            this._finishAddressInput.value = "";

            this._totalInfoDiv.style.display = "none"
            this._totalInfoDiv.innerHTML = "";
        };
		

        RouteControl.prototype._setRoutePoint = function (numPoint) {
            this._numPoint = numPoint;
        };

        RouteControl.prototype._createPoint = function ( coords, pathToMarker ) {
            return new ol.Feature({
                marker: pathToMarker,
                geometry: new ol.geom.Point( coords )
            });
        };

        RouteControl.prototype._fillAddress = function ( coords, input ) {
            var coordsWgs = ol.proj.transform( coords, 'EPSG:3857', 'EPSG:4326' );
            var url = 'http://nominatim.openstreetmap.org/reverse?format=json&lon='
                + coordsWgs[0] + '&lat=' + coordsWgs[1];
            var request = new XMLHttpRequest();
            request.open( "GET", url );
            request.onreadystatechange = function () {
                if (request.readyState == 4) {
                    var address = JSON.parse( request.responseText );
                    input.value = address.display_name;
                }
            }
            request.send();
        };

        RouteControl.prototype._parseRoute = function ( routesInfo ) {
            var routes = routesInfo.routes;
            if ( routes.length > 0 ) {
                var route = routes[0];
                // преобразуем геометрию Polyline в формат OpenLayers 3
                var polyGeom = route.geometry;
                var polylineFormat = new ol.format.Polyline();
                var olFeature = polylineFormat.readFeature( polyGeom );
                olFeature.getGeometry().transform( "EPSG:4326", "EPSG:3857" );
                this._source.addFeatures( [olFeature] );
                this._route = olFeature;

                this._totalInfoDiv.style.display = "block";
                this._totalInfoDiv.innerHTML = parseInt(route.duration / 60) + ' мин, ' + (route.distance / 1000 ).toFixed(2) + ' км';;
            }
        };

        RouteControl.prototype._buildRoute = function () {
            if ( !this._route ) {
                // получаем координаты точки отправления и прибытия в WGS84
                var startCoords = this._startPoint.getGeometry().getCoordinates();
                var finishCoords = this._finishPoint.getGeometry().getCoordinates();
                var startWgs = ol.proj.transform( startCoords, 'EPSG:3857', 'EPSG:4326' );
                var finishWgs = ol.proj.transform( finishCoords, 'EPSG:3857', 'EPSG:4326' );

                // формируем запрос на получение маршрута
                var routeUrl = 'https://router.project-osrm.org/route/v1/driving/'
                    + startWgs[0] + ',' + startWgs[1] + ';'+ finishWgs[0] + ',' + finishWgs[1]
                    + '?alternatives=false&steps=false&hints=;&overview=full';

                var self = this;
                var request = new XMLHttpRequest();
                request.open( "GET", routeUrl );
                request.onreadystatechange = function () {
                    if (request.readyState == 4) {
                        var routes = JSON.parse( request.responseText );
                        self._parseRoute( routes );
                    }
                }
                request.send();
            }
        };

        RouteControl.prototype._processClick = function ( evt ) {
            if ( (this._numPoint == null || this._numPoint === 0) && !this._startPoint ) {
                this._startPoint = this._createPoint( evt.coordinate, 'start.png' );
                this._source.addFeatures( [this._startPoint] );
                this._fillAddress( evt.coordinate, this._startAddressInput );
            } else if ( (this._numPoint == null || this._numPoint === 1) && !this._finishPoint ) {
                this._finishPoint = this._createPoint( evt.coordinate, 'finish.png' );
                this._source.addFeatures( [this._finishPoint] );
                this._fillAddress( evt.coordinate, this._finishAddressInput );
            }
            this._numPoint = null;

            if ( this._startPoint && this._finishPoint ) {
                this._buildRoute();
            }
        };


        var map = new ol.Map({
            target: 'map'
        });

        var osmLayer = new ol.layer.Tile({
          source: new ol.source.OSM()
        });
        map.addLayer(osmLayer);

        map.addControl( new RouteControl( { map: map } ) );

        var view = new ol.View({
          center: [ 4188426.7147939987, 7508764.236877314 ],
          zoom: 12
        });
        map.setView(view);