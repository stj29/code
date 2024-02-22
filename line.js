const viewer = new Cesium.Viewer("cesiumContainer", {
  selectionIndicator: false,
  infoBox: false,
  terrain: Cesium.Terrain.fromWorldTerrain(),
});

// Anıtkabiri zoomlar.
viewer.camera.lookAt(
  Cesium.Cartesian3.fromDegrees(32.8375, 39.924925),
  new Cesium.Cartesian3(5000.0, 5000.0, 5000.0)
);
viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

let activeShapePoints = [];
let activeShape;
let floatingPoint;

viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
  Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
);

function createPoint(worldPosition) {
  const point = viewer.entities.add({
      position: worldPosition,
      point: {
          color: Cesium.Color.RED,
          pixelSize: 5,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
  });
  return point;
}

function drawShape(positionData) {
  let shape;
  shape = viewer.entities.add({
      polyline: {
          positions: positionData,
          clampToGround: true,
          width: 3,
      },
  });
  return shape;
}

let pointCounter = 1; // Nokta sayısını tutmak için bir sayaç
let lastLeftClickPosition; // Son sol tıklama pozisyonunu tutmak için bir değişken
let lastLeftClickPositionsw = null; // Sol tıklama pozisyonunu tutmak için bir değişken
let currentLine; // Mevcut çizgiyi tutmak için bir değişken

// SOL TIK İŞLEVİ
const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
handler.setInputAction(function(event) {
  // Fare tıklama noktasından bir ışın (ray) oluşturulur. Bu ışın, kameranın bakış açısına göre oluşturulur.
  const ray = viewer.camera.getPickRay(event.position);
  // Oluşturulan ışının, yeryüzündeki bir noktayla (earthPosition) kesişimini hesaplar. Yani, fare tıklamasının yeryüzündeki konumunu bulmaya çalışır.
  const earthPosition = viewer.scene.globe.pick(ray, viewer.scene);
  // Eğer fare tıklamasının yeryüzündeki konumu tanımlanmışsa

  if (Cesium.defined(earthPosition)) {
      if (pointCounter > 1) {
          lastLeftClickPositionsw = lastLeftClickPosition;
      }
      lastLeftClickPosition = earthPosition;

      // Henüz bir çizim başlamamışsa ;
      if (activeShapePoints.length === 0) {
          // Yeryüzünde bir nokta oluşturulur (createPoint fonksiyonu ile)
          floatingPoint = createPoint(earthPosition);
          // activeShapePoints dizisine yeryüzündeki nokta eklenir.
          activeShapePoints.push(earthPosition);
          // Bu özellik, activeShapePoints'in dinamik olarak güncellenmesini sağlar.
          const dynamicPositions = new Cesium.CallbackProperty(function() {
              return activeShapePoints;
          }, false);
          // Dinamik konumları kullanarak bir şekil çizilir.
          activeShape = drawShape(dynamicPositions);
      }

      createPoint(earthPosition);
      activeShapePoints.push(earthPosition);

      // Eklenen noktanın altında artan bir sayı gösterilmesi için sayaç güncellenir.
      const labelEntity = viewer.entities.add({
          position: earthPosition,
          label: {
              text: String(pointCounter++), // Sayaç değeri eklenen noktanın altında gösterilir ve sonra artırılır.
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              font: "14px sans-serif",
              pixelOffset: new Cesium.Cartesian2(0, -20), // Noktanın üstünde görünecek şekilde ayarlanır.
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
      });

      // İki ardışık nokta arasındaki mesafeyi hesapla
      if (pointCounter > 2) {
          const midpoint = new Cesium.Cartesian3(
              (lastLeftClickPosition.x + lastLeftClickPositionsw.x) / 2,
              (lastLeftClickPosition.y + lastLeftClickPositionsw.y) / 2,
              (lastLeftClickPosition.z + lastLeftClickPositionsw.z) / 2
          );

          const distance = Cesium.Cartesian3.distance(
              lastLeftClickPosition,
              lastLeftClickPositionsw
          );

          // Eklenen noktanın altında artan bir sayı gösterilmesi için sayaç güncellenir.
          const labelEntity = viewer.entities.add({
              position: midpoint,
              label: {
                  text: ` ${distance.toFixed(2)} M`, // Sayaç değeri eklenen noktanın altında gösterilir ve sonra artırılır.
                  fillColor: Cesium.Color.WHITE,
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 2,
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  font: "14px sans-serif",
                  pixelOffset: new Cesium.Cartesian2(0, -20), // Noktanın üstünde görünecek şekilde ayarlanır.
                  heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              },
          });
      }
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

// MOUSE HAREKET İŞLEVİ
handler.setInputAction(function(event) {
  // floatingPoint var mı kontrolü ;
  if (Cesium.defined(floatingPoint)) {
      // Fare hareketinin son konumuna göre bir ışın (ray) oluşturulur. Bu ışın, kameranın bakış açısına göre oluşturulur.
      const ray = viewer.camera.getPickRay(event.endPosition);
      // Oluşturulan ışının, yeryüzündeki bir noktayla (newPosition) kesişimini hesaplar. Yani, fare hareketinin son konumuna göre, yeryüzündeki bir noktayı belirler.
      const newPosition = viewer.scene.globe.pick(ray, viewer.scene);
      // Eğer yeni bir konum belirlenmişse (defined), yani fare hareketi yeryüzünde bir noktaya denk geliyorsa ;
      if (Cesium.defined(newPosition)) {
          // Hareket eden noktanın pozisyonu, yeni belirlenen konuma ayarlanır.
          floatingPoint.position.setValue(newPosition);
          // Aktif şekil noktalarından son nokta çıkarılır. Bu, çizimin sürekli olarak güncellenmesi ve hareket eden noktanın son konuma bağlı kalması için yapılır.
          activeShapePoints.pop();
          // Yeni belirlenen konum, aktif şekil noktalarına eklenir. Bu, çizimin güncellenmiş konumu ve hareket eden noktanın güncellenmiş konumuyla bağlantılı olmasını sağlar.
          activeShapePoints.push(newPosition);
          var cartesian = viewer.camera.pickEllipsoid(event.endPosition, viewer.scene.globe.ellipsoid);
          // Piksel konumunu enlem ve boylam bilgilerine dönüştürme
          var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          // Enlem ve boylam bilgilerini string olarak oluşturma ve ekrana yazdırma
          var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(7);
          var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(7);
          var info = 'E: ' + latitudeString + ', B: ' + longitudeString;
          var overlay = document.getElementById('overlay');
          overlay.textContent = info;
          overlay.style.display = 'block';
          overlay.style.left = event.endPosition.x + 5 + 'px';
          overlay.style.top = event.endPosition.y + 5 + 'px';
      }
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

// SAĞ TIK İŞLEVİ
function terminateShape() {
  // Aktif şekil noktalarından son nokta çıkarılır. 
  activeShapePoints.pop();
  drawShape(activeShapePoints);
  // Hareket eden nokta (floatingPoint) haritadan kaldırılır.
  viewer.entities.remove(floatingPoint);
  // Çizgi (activeShape) haritadan kaldırılır.
  viewer.entities.remove(activeShape);
  floatingPoint = undefined;
  activeShape = undefined;
  activeShapePoints = [];
  pointCounter = 1;
  var overlay = document.getElementById('overlay');
  overlay.style.display = 'none';
}
handler.setInputAction(function(event) {
  terminateShape();
}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
