var express = require("express");
var app = express();

const cheerio = require('cheerio');

const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');
const urlencodedParser = express.urlencoded({ extended: false });
const jsonParser = express.json();

const csv = require('csv-parser')
const fs = require('fs')

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + '/public'));

var NodeGeocoder =  require('node-geocoder');
var geocoder =  NodeGeocoder({
  provider: 'opencage',
  apiKey: '7858378831494fca8abe82048f0b8966'
});

const db = new sqlite3.Database("db.db");
const minY = 60.0315, maxY = 60.0468, minX = 30.3804, maxX = 30.4151;
const mainPolCenterY = (minY + maxY) / 2, mainPolCenterX = (minX + maxX) / 2;
// const mainPolygon = [[60.04173639, maxX], [minY, 30.40670274], [60.03658416, minX], [maxY, 30.39012068]];
const mainPolygon = [[minY, minX], [maxY, maxX]];

app.post("/", jsonParser, function(request, response) {
  response.json({
    minY: minY, maxY: maxY, minX: minX, maxX: maxX,
    mainPolygon: mainPolygon, mainPolCenterY: mainPolCenterY, mainPolCenterX: mainPolCenterX
  });
});

app.get("/", function(request, response){
  response.render("index", {
    time: time(),
    info_title: ['Система', 'Сервис', 'Тепловая карта', 'Для начала'],
    info: ['анализирует и оценивает инвестиционную привлекательность объектов недвижимости. А также помогает упростить процесс анализа ситуации, для принятия наиболее коммерчески выгодного решения',
    'реализует модель Хаффа, в рамках которой, анализирует уровень конкуренции, характеристики объектов недвижимости и транспортную доступность',
    'разбита на сектора, имеющие разный цвет, в зависимости от коммерческой привлекательности этого места для открытия объекта ритейла',
    'работы сервиса необходимо указать: какой площади объект планируется к открытию и какой категории объект будет принадлежать'],
  });
});

function time() {
  var now = new Date();
  var date = new Intl.DateTimeFormat().format(now);
  return date;
}

// CSV parsing
app.post("/csvInit", jsonParser, function(request, response){
  response.json({ result: result });
});

async function csvInit() {
  // fs.createReadStream('spb_lo.csv').pipe(csv({ separator: ';' })).on('data', (data) => db.run("INSERT INTO uik (uik, lat, lon, population) values (?,?,?,?)", [data.uik, data.lat, data.lon, data.population])).on('end', () => {});
  let result_ = [];
  db.all("SELECT * FROM uik WHERE lat > '" + minY + "' AND lat < '" + maxY + "' AND lon > '" + minX + "' AND lon < '" + maxX + "'", [], (err, data) => {
    data.forEach((el, i) => {
      result.push({
        id: el.id,
        uik: el.uik,
        lat: el.lat,
        lon: el.lon,
        population: el.population
      });
    });
  });
  result = result_;
}

// DB parsing
app.post("/dataInit", jsonParser, function(request, response){
  response.json({facility: facility});
});

async function dataInit() {
  let facility_ = [];
  db.all("SELECT * FROM place", [], (err, data) => {
    data.forEach((el, i) => {
      facility_.push({
        id: el.id,
        name: el.name,
        lat: el.lat,
        lon: el.lon,
        address: el.address,
        type: el.type,
        square: el.square,
        info: el.info,
        img: el.img
      });
    });
  });
  facility = facility_;
}

app.post("/typeInit", jsonParser, function(request, response){
  response.json({type: type});
});

async function typeInit() {
  let type_ = [];
  db.all("SELECT * FROM type", [], (err, data) => {
    data.forEach((el, i) => {
      type_.push({
        id: el.id,
        name: el.name,
        nameRu: el.nameRu,
        lambda: el.lambda
      });
    });
  });
  type = type_;
}

app.post("/realtyInit", jsonParser, function(request, response){
  response.json({realty: realty});
});

async function realtyInit() {
  let realty_ = [];
  db.all("SELECT * FROM realty", [], (err, data) => {
    data.forEach((el, i) => {
      realty_.push({
        id: el.id,
        type: el.type,
        square: el.square,
        address: el.address,
        lat: el.lat,
        lon: el.lon,
        price: el.price,
        link: el.link,
        img: el.img,
        description: el.description
      });
    });
  });
  realty = realty_;
}

// geocodeOpenCage
function geocodeOpenCage(query) {
  return new Promise((resolve, reject) => {
    let resArr = [];
    geocoder.geocode(query, function(err, res) {

      if (res.length > 0) {
        resArr.push({
          lat: res[0].latitude,
          lon: res[0].longitude
        });
        resolve(resArr[0]);
      }
      if (err === 402) { reject('hit free trial daily limit'); }
      else if (err != null) { reject(err); }

      // geocoder.geocode('37.4396, -122.1864', function(err, res) {
      //   console.log(res);
      // });

      // geocoder.batchGeocode(['address1', 'address2'], function (err, results) {
      //   // Return an array of type {error: false, value: []}
      //   console.log(results) ;
      // });
    });
  });
}

async function yaParse() {
  // request.get({url: 'https://realty.yandex.ru/sankt-peterburg_i_leningradskaya_oblast/snyat/kommercheskaya-nedvizhimost/metro-grazhdanskiy-prospekt/?bottomLatitude=60.03081&commercialType=RETAIL&commercialType=FREE_PURPOSE&commercialType=PUBLIC_CATERING&leftLongitude=30.322313&mapPolygon=60.03184127807617%2C30.381589889526367%3B60.031951904296875%2C30.41567039489746%3B60.0472297668457%2C30.415189743041992%3B60.04713821411133%2C30.381290435791016&rightLongitude=30.422392&topLatitude=60.053135'},function(err, resp, body) {

  const body = fs.readFileSync("./realtyYandex.txt", "utf8"); //убери свое дерьмо

  const $ = cheerio.load(body);

  // console.log($.html());
  // fs.appendFileSync('./file.txt', `${$.html()}`); //госпади спасибо
  // fs.truncateSync('./file2.txt');

  const elemNum = $('.FormFieldSet_name_actions > div.FormFieldSet__controls > div.GridCell_size_0 > div.FiltersFormField__counter-submit').find('span.Button__text').text().replace(/[^0-9]/g,"");

  let title = [], address = [], description = [], link = [], img = [], price = [];
  let square, type, priceNum, lat, lon;
  for (let i = 0; i < elemNum; i++) {
    title[i] = $('.OffersSerpItem').find('span.OffersSerpItem__title').eq(i).text();
    address[i] = $('.OffersSerpItem').find('div.OffersSerpItem__address').eq(i).text();
    description[i] = $('.OffersSerpItem').find('p.OffersSerpItem__description').eq(i).text();
    link[i] = "https://realty.yandex.ru/" + $('.OffersSerpItem').find('a.OffersSerpItem__link').eq(i).attr('href');
    img[i] = $('.OffersSerpItem > a.SerpItemLink > div.OffersSerpItem__images > div.OffersSerpItem__gallery > div.Gallery > div.Gallery__activeImg-wrapper').find('img.Gallery__activeImg').eq(i).attr('src');
    price[i] = $('.OffersSerpItem > div.OffersSerpItem__info > div.OffersSerpItem__info-inner > div.OffersSerpItem__main > div.OffersSerpItem__dealInfo > div.OffersSerpItem__price').find('span.price').eq(i).text();
    // если дай бог яндекс отдуплится и тогда строка снизу отвалится

    type = title[i].split('²')[1].replace(/^[,\s]+|[,\s]+$/g, '');
    square = title[i].match(/^[^²]*/)[0].replace(/[^0-9^,]/g,"").replace(/,/g, '.');
    priceNum = price[i].replace(/[^0-9^,]/g,"");

    // await geocodeOpenCage(address[i]).then((result) => { lat = result.lat; lon = result.lon; });
    // db.run("INSERT INTO realty (type, square, address, lat, lon, price, link, img, description) VALUES (?,?,?,?,?,?,?,?,?)", [type, square, address[i], lat, lon, priceNum, link[i], img[i], description[i]]);
  }
}

// Init
dataInit();
typeInit();
csvInit();
yaParse();
realtyInit();

// setInterval
const timer = 1200000;
const timeDataInit = setInterval(dataInit, timer);
const timeTypeInit = setInterval(typeInit, timer);
const timeCsvInit = setInterval(csvInit, timer);
const timeRealtyInit = setInterval(realtyInit, timer);
const timeYaParse = setInterval(yaParse, timer);

app.listen(9000);
