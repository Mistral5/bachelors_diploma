// Const
const category = [grocery = [], restaurant = [], sport = [], pharmacy = []];
const categoryLayer = [groceryLayer = L.layerGroup(), restaurantLayer = L.layerGroup(), sportLayer = L.layerGroup(), pharmacyLayer = L.layerGroup()];
const uikLayer = L.layerGroup();
const realtyArr = [], realtyLayer = L.layerGroup();
const polygonLayer = [groceryPolygons = L.layerGroup(), restaurantPolygons = L.layerGroup(), sportPolygons = L.layerGroup(), pharmacyPolygons = L.layerGroup()];
let mainPoly = L.latLngBounds();

window.onload = function() {
  ajaxMain();
  ajaxCsvInit();
  ajaxTypeInit();
  ajaxDataInit();
  ajaxRealtyInit();
};

function ajaxMain() {
  let request = new XMLHttpRequest();
  request.open("POST", "/", true);
  request.setRequestHeader("Content-Type", "application/json");
  request.addEventListener("load", function() {
    minY = JSON.parse(request.response).minY;
    maxY = JSON.parse(request.response).maxY;
    minX = JSON.parse(request.response).minX;
    maxX = JSON.parse(request.response).maxX;
    mainPoly = L.latLngBounds(JSON.parse(request.response).mainPolygon);
    mainPolCenterY = JSON.parse(request.response).mainPolCenterY;
    mainPolCenterX = JSON.parse(request.response).mainPolCenterX;
    mapCreator();
    mainPolygonCreator();
  });
  request.send();
}

// Functions
function mapCreator() {
  map = L.map('map', { center: [mainPolCenterY, mainPolCenterX], zoom: 14 });
  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, minZoom: 8 }).addTo(map);
}

function mainPolygonCreator() {
  L.rectangle(mainPoly, {color: "grey", weight: 0.3}).addTo(map);
  //map.fitBounds(mainPoly);// если решу делать кнопку возврата
}

function ajaxCsvInit() {
  let request = new XMLHttpRequest();
  request.open("POST", "/csvInit", true);
  request.setRequestHeader("Content-Type", "application/json");
  request.addEventListener("load", function() {
    result = JSON.parse(request.response).result;
    packerCsv();
  });
  request.send();
}

function packerCsv() {
  result.forEach((el, i) => {
    let marker = L.marker([el.lat, el.lon], {
      title: el.uik + " Население: " + el.population,
      clickable: true,
      icon: L.icon({
        iconUrl: '/images/uik_circle.svg',
        iconSize: [16, 16]
      })
    });
    uikLayer.addLayer(marker);
  });
}

function ajaxTypeInit() {
  let request = new XMLHttpRequest();
  request.open("POST", "/typeInit", true);
  request.setRequestHeader("Content-Type", "application/json");
  request.addEventListener("load", function() {
    type = JSON.parse(request.response).type;
  });
  request.send();
}

function ajaxDataInit() {
  let request = new XMLHttpRequest();
  request.open("POST", "/dataInit", true);
  request.setRequestHeader("Content-Type", "application/json");
  request.addEventListener("load", function() {
    facility = JSON.parse(request.response).facility;
    dataPacker();
  });
  request.send();
}

function dataPacker() {
  facility.forEach((el, i) => {
    let marker = L.marker([el.lat, el.lon], {
      title: el.name,
      clickable: true,
      icon: L.icon({
        iconUrl: '/images/circle.svg',
        iconSize: [16, 16]
      })
    });
    marker.bindPopup(el.name + "<br>Площадь: " + el.square + "<br><img class='popup' src=" + el.img + ">").openPopup();

    switch (el.type) {
      case "grocery": grocery.push(el); groceryLayer.addLayer(marker); break;
      case "restaurant": restaurant.push(el); restaurantLayer.addLayer(marker); break;
      case "sport": sport.push(el); sportLayer.addLayer(marker); break;
      case "pharmacy": pharmacy.push(el); pharmacyLayer.addLayer(marker); break;
    }
  });
}

function ajaxRealtyInit() {
  let request = new XMLHttpRequest();
  request.open("POST", "/realtyInit", true);
  request.setRequestHeader("Content-Type", "application/json");
  request.addEventListener("load", function() {
    realty = JSON.parse(request.response).realty;
    packerRealty();
  });
  request.send();
}

function packerRealty() {
  realty.forEach((el, i) => {
    let marker = L.marker([el.lat, el.lon], {
      title: el.square + ', ' + el.type,
      clickable: true,
      icon: L.icon({
        iconUrl: '/images/realty_circle.svg',
        iconSize: [16, 16]
      })
    });
    marker.bindPopup(`
      <div class='d-flex align-items-center'>
        <div class='p-2'>
          <div class='pb-2'>Тип: ${el.type} </div>
          <div class='pb-2'>Площадь: ${el.square} м&sup2;</div>
          <div class='pb-2'>Цена: ${el.price} &#8381; /мес.</div>
          <div class='pb-2'>Цена за м&sup2;: ${Math.round(el.price/el.square)} &#8381;</div>
          <div>Адрес: ${el.address}</div>
        </div>
        <img class='popup' src=${el.img}>
      </div>
      `).openPopup();

      realtyArr.push(el);
      realtyLayer.addLayer(marker);
    });
  }

  function chooseCategory(layer) {
    showMarkers(layer);
    showMenu(layer);
    chooseSquare();
  }

  function chooseSquare() {
    const btnCategoryGroup = document.querySelectorAll('input[name="btnCategoryGroup"]');
    const square = document.getElementById("square").value;
    if (square != '') {
      for (const radio of btnCategoryGroup) {
        if (radio.checked) {
          showPolygons(radio.id, square);
        }
      }
    }
  }

  function showPolygons(layer, square) {
    for (let i = 0; i < polygonLayer.length; i++) { polygonLayer[i].removeFrom(map); }
    switch (layer) {
      case "grocery": gridCreator(grocery, groceryPolygons, square); groceryPolygons.addTo(map); break;
      case "restaurant": gridCreator(restaurant, restaurantPolygons, square); restaurantPolygons.addTo(map); break;
      case "sport": gridCreator(sport, sportPolygons, square); sportPolygons.addTo(map); break;
      case "pharmacy": gridCreator(pharmacy, pharmacyPolygons, square); pharmacyPolygons.addTo(map); break;
    }
  }

  function showMarkers(layer) {
    for (let i = 0; i < categoryLayer.length; i++) { categoryLayer[i].removeFrom(map); }
    switch (layer) {
      case "grocery": groceryLayer.addTo(map); break;
      case "restaurant": restaurantLayer.addTo(map); break;
      case "sport": sportLayer.addTo(map); break;
      case "pharmacy": pharmacyLayer.addTo(map); break;
      case "all": for (let i = 0; i < categoryLayer.length; i++) { categoryLayer[i].addTo(map); } break;
    }
  }

  function showMenu(layer) {
    let n;
    menuSidebar.innerHTML = menuFacilityCarousel.innerHTML = "";
    switch (layer) {
      case "grocery": n = 0; grocery.forEach((el, i) => { n++; menuCreator(el, n); }); break;
      case "restaurant": n = 0; restaurant.forEach((el, i) => { n++; menuCreator(el, n); }); break;
      case "sport": n = 0; sport.forEach((el, i) => { n++; menuCreator(el, n); }); break;
      case "pharmacy": n = 0; pharmacy.forEach((el, i) => { n++; menuCreator(el, n); }); break;
      case "all": n = 0; for (let i = 0; i < category.length; i++) { category[i].forEach((el, i) => { n++; menuCreator(el, n); }); }; break;
    }
  }

  function menuCreator(el, n) {
    let content = `
    <div class="d-flex flex-column justify-content-center pe-3">
    <h5 class="">${n}. ${el.name}</h5>
    <p class="m-0">Адрес: ${el.address}</p>
    <p class="m-0">Площадь: ${el.square} м&sup2;</p>
    </div>
    <img class="menu__img img-fluid d-none d-sm-block" src="${el.img}" alt="${el.name}">
    `; // lat: el.lat, lon: el.lon,info: el.info,

    menuSidebar.innerHTML += `<div class="menu d-flex justify-content-between align-items-center mb-2">` + content + `</div>`;

    menuFacilityCarousel.innerHTML += `
    <div id="carousel-item${n}" class="carousel-item h-100 px-3">
    <div class="menu d-flex justify-content-center justify-content-sm-between align-items-center">` + content + `</div>
    </div>`;

    if (n == 1) { document.getElementById('carousel-item1').classList.add("active"); }
  }

  function gridCreator(layer, polyLayer, square) {
    polyLayer.clearLayers();
    menuRealtyCarousel.innerHTML = "";
    const stepY = 0.0002, stepX = 0.0004;
    let latLng, polygon, n = 0;

    for (let i = minY; i < maxY; i += stepY) {
      for (let j = minX; j < maxX; j += stepX) {
        let latlngs = [
          [i        , j        ], //нижний левый
          [i + stepY, j        ], //верхний левый
          [i + stepY, j + stepX], //верхний правый
          [i        , j + stepX]  //нижний правый
        ];
        latLng = L.latLngBounds(latlngs);

        if (mainPoly.contains(latLng)) {
          polygon = L.polygon(latlngs, {
            stroke: false,
            weight: '1',
            fillOpacity: 0.4,
            fillColor: colorised(layer, latLng, square, n)
          });
          polyLayer.addLayer(polygon);
        }
      }
    }
  }

  function colorised(layer, latLng, square, n) {
    let time, lambda, attrOther = 0;

    type.forEach((el, i) => { if (layer[0].type === el.name) { lambda = el.lambda; } });

    layer.forEach((el, i) => {
      time = latLng.getCenter().distanceTo(L.latLng(el.lat, el.lon)) / (1000 / 12);
      attrOther += el.square / Math.pow(time, lambda);
    });

    let attr = null, result, point;

    realty.forEach((el, i) => {
      point = L.latLng(el.lat, el.lon);
      if (latLng.contains(point)) {
        n++;
        time = 10 / (1000 / 12);
        attr = el.square / Math.pow(time, lambda);
        result = attr / (attr + attrOther) * 100;
        menuRealtyCreator(el, attr, lambda, attrOther, n);
      }
    });

    if (attr === null) {
      time = 10 / (1000 / 12);
      attr = square / Math.pow(time, lambda);
      result = attr / (attr + attrOther) * 100;
    }

    // console.log(Math.floor(result));
    // switch (Math.floor(result / 25)) {
    //   case 0: return 'red'; break;
    //   case 1: return 'orange'; break;
    //   case 2: return 'yellow'; break;
    //   case 3: return 'green'; break;
    // }

    if (result <= 40) {
      return 'red';
    } else if (40 < result && result <= 60) {
      return 'orange';
    } else if (60 < result && result <= 75) {
      return 'yellow';
    } else if (75 < result) {
      return 'green';
    }
  }

  function menuRealtyCreator(el, attr, lambda, attrOther, n) {
    let content = `
    <div class="d-flex flex-column">
      <div class="d-flex">
        <div class="d-flex flex-column w-75 pe-3">
          <div>
            <a href="${el.link}"><h5 class="">${el.id}.&emsp;${el.square}м&sup2;, ${el.type}</h5></a>
            <div class="pb-1">Адрес: ${el.address}</div>
            <div class="pb-1">Цена: ${el.price} &#8381; / месяц</div>
            <div class="pb-2">Цена за м&sup2;: ${Math.round(el.price/el.square)} &#8381;</div>
          </div>
          <div>
            <h4 class="">Рассчёты</h4>
            <div class="pb-1">Коммерческая ривлекательность объекта: ${Math.round(attr * 1000) / 1000} у.е.</div>
            <div class="pb-1">Привлекательность других объектов в зоне: ${Math.round(attrOther * 1000) / 1000} у.е.</div>
            <div class="pb-1">Эффект влияния воспринимаемых временных затрат: ${lambda}</div>
            <div class="pb-1">Шанс успеха в собсвенном квадрате: ${Math.round((attr / (attr + attrOther)) * 100) / 100 * 100}%</div>
          </div>
        </div>
        <a class="w-25 d-flex align-items-center" href="${el.link}"><img class="realtyCarousel__img img-fluid d-none d-sm-block" src="${el.img}" alt="${el.type}"></a>
      </div>
      <div class="pt-2">${el.description}</div>
    </div>
    `;

    menuRealtyCarousel.innerHTML += `
    <div id="carousel-${el.lambda}-item${el.id}" class="carousel-item h-100 px-3">
      <div class="menu d-flex justify-content-center justify-content-sm-around align-items-center">` + content + `</div>
    </div>`;

    if (n === el.id) {
      document.getElementById('carousel-' + el.lambda + '-item' + el.id).classList.add("active");
      document.getElementById('realtyCarousel').style.display = "block";
    }
  }

  function uikSwitch() {
    if (document.getElementById('uik').checked)
    uikLayer.addTo(map);
    else
    uikLayer.removeFrom(map);
  }

  function realtySwitch() {
    if (document.getElementById('realty').checked)
    realtyLayer.addTo(map);
    else
    realtyLayer.removeFrom(map);
  }

  // Работа sidebar
  document.querySelector(".arrow").addEventListener("click", function(){
    document.querySelector(".wrapper").classList.toggle("active");
    if (document.querySelector("#caret").classList.contains("active")) {
      document.querySelector("#caret").classList.remove("active");
    } else {
      document.querySelector("#caret").classList.add("active");
    };
  });

  // Обработка нажатия клавиши enter для square
  document.getElementById("square").addEventListener("keydown", function(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      chooseSquare();
    }
  });
