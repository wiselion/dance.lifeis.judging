// application langs
var lang = {};
// application data && maybe setted to localStorage
var app_data = {};
// application params
var app_prms = {
	url: {},
	tmpl: {},
	time_offline: 90000,
	time_online: 30000,
};
var authorize = true;
var userdata = {};
// device battery status
var battery = {};
// token
var connectionToken = '';
// offline режим
var offline = false;
// имя планшета
var tabletName = '';
// текущий турнир
var tour_id = '';
var tour_name = '';
var tour_cats = {};
var tour_cats_last;
var componentCats;
var tour_results = {};
var upload_results = {};
// пишем сюда все действия по подсчету судьи
var results_log = {};
// идет ли в данный момент процесс загрузки
var loadingprocess = false;
var timeout_in_process = false;

// ------------- SYS LIB --------------- //
String.prototype.printf = function() {
    var formatted = this;
    for( var arg in arguments ) {
        formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    }
    return formatted;
};
// использование Math.round() даст неравномерное распределение!
function getRandomInt(min, max)
{
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
// ------------- INITIALIZATION --------------- //
// Init/Create application
function InitApplication() {
	app.init();
	InitConnection();
}
// Init connection after init application
function InitConnection() {
	var token = getToken();
	if(!token) SetNotAuth();
	// посылаем запрос на данные пользователя
	app.request.post(app_prms.url.userdata, {token:token}, (req) => {
		userdata = req;
		if(userdata.tournaments!==undefined) SetTournaments(userdata.tournaments);
		offline = false; $$('.connection-status').removeClass('color-red').attr('title','online');
		InitViews();
	},
	(xhr, status) => {
		app.preloader.hide();
		if(status==401 || status==403) SetNotAuth();
		else {
			app.dialog.confirm('Продолжение работы возможно только в offline режиме. Повторить подключение еще раз?', lang.login.disconnect, InitConnection, SetOfflineMode);
			//app.dialog.alert(lang.login.disconnect);
		}
	},'json');
}
// Init/Create views
function SetOfflineMode() {
	offline = true;
	InitViews();
}
// Init/Create views
function InitViews() {
	InitBatteryStatus();
	if(offline) $$('.connection-status').addClass('color-red').attr('title','offline');
	else $$('.connection-status').removeClass('color-red').attr('title','online');
	if(homeView===undefined) homeView = app.views.create('#view-home',{url:'/'});
	/*if(searchView===undefined) searchView = app.views.create('#view-search',{url:'/search/'});
	if(menuView===undefined) menuView = app.views.create('#view-menu',{url:'/menu/'});
	if(messagesView===undefined) messagesView = app.views.create('#view-messages',{url:'/messages/'});
	if(noticesView===undefined) noticesView = app.views.create('#view-notices',{url:'/notices/'});*/
	app.preloader.hide();
	InitTournament();
	//InitPush();
}
function InitAppAfterLogin() {
	loginScreen.close();
	InitConnection();
	//InitViews();
}
// отправка данных категорий
function DumpResultsData() {
	var data = localStorage.getItem('results_'+tour_id);
	if(data!==undefined) {
		var token = getToken();
		if(!token) SetNotAuth();
		app.preloader.show();
		app.request.post(app_prms.url.data, {dump:data,action:'dump',token:token,tour_id:tour_id,tab_name:tabletName}, (req) => {
			app.preloader.hide();
			if(req.status) {
				app.dialog.alert('Data uploaded successfully!');
			} else app.dialog.alert(req.error);
		},
		(xhr, status) => {
			app.preloader.hide();
			app.dialog.alert(lang.login.disconnect);
		},'json');
	} else {
		app.dialog.alert('No results to upload!');
	}
}
function SendAuthRequest(url,data) {
	app.preloader.show();
	app.request.post(url, data, (req) => {
		app.preloader.hide();
		if(req.status) {
			if(req.token) {
				setToken(req.token);
				InitAppAfterLogin();
			} else {
				app.dialog.alert('Error: no token!');
			}
		} else app.dialog.alert(req.error);
	},
	(xhr, status) => {
		app.preloader.hide();
		app.dialog.alert(lang.login.disconnect);
		//if(status==401 || status==403) SetNotAuth(); //console.log('show login screen');
	},'json');
}
// if get 401 or 403 code
function SetNotAuth() {
	// наверное стоит перезагружать те функции, которые прилетели без авторизации
	if(!authorize) return;
	//app.dialog.alert('not auth');
	loginScreen.open();
	// init view
	// .........
}
// get connection token
function getToken() {
	if(!connectionToken) {
		connectionToken = localStorage.getItem('connectionToken');
	}
	return connectionToken;
}
// set connection token
function setToken(token) {
	if(token!==undefined) {
		localStorage.setItem('connectionToken',token);
		connectionToken = token;
	}
}
// clear connection token
function clearToken() {
	localStorage.removeItem('connectionToken');
	connectionToken = '';
}
// ------------- ИНИЦИАЛИЗАЦИЯ ПЛАНШЕТА ------------------//
function RefreshState() {
	console.log('refresh state');
}
// устанавливаем загруженные категории
function SetLoadedCats(f_tour_id,cats) {
	/*if(f_tour_id!=tour_id) {
		GetCats()
	}*/
	if(cats!==undefined) {
		// очищаем, если загружали не дельту
		if(!tour_cats_last) tour_cats = {};
		var num = 0; var ldate = tour_cats_last!==undefined ? tour_cats_last : 0;
		for(var cid in cats) {
			if(cats[cid].ldate) ldate = Math.max(ldate,cats[cid].ldate);
			// обновляем или вставляем элемент
			if(cats[cid].status) {
				tour_cats[cid] = cats[cid];
				num++;
			// удаляем готовый, если нету
			} else {
				//console.log('try err');
				//console.log(tour_cats);
				//console.log(cid);
				tour_cats[cid] = cats[cid];
				num++;
				// временно переназначаем отсуженные категории
				/*if(tour_cats[cid]!==undefined) {
					delete tour_cats[cid];
					num++;
				}*/
			}
		}
		//if(num) {
			tour_cats = SortObjectFunc(tour_cats,function(a,b){if(a[1].ts<b[1].ts) return -1; if(a[1].ts>b[1].ts) return 1; return 0;});
			SetCats(f_tour_id,tour_cats,ldate);
			//if(f_tour_id==tour_id) componentCats.$setState({cats:tour_cats,lastid:tour_cats_last});
		//}
	}
}
function LoadTourCats(prms) {
	//console.log('---------------- load cats --------------');
	if(loadingprocess) return;
	loadingprocess = true;
	var token = getToken();
	if(!token) SetNotAuth();

	if(prms===undefined) var prms = {};
	// если в функцию принудительно отправили offline режим просто обновляем данные
	if(/*offline ||*/ prms.offline) {
		loadingprocess = false;
		if(PageCatsStatus()) componentCats.$setState({cats:GetCats(tour_id),lastid:tour_cats_last});
		return;
	}
	var f_tour_id = prms.tour_id!==undefined?prms.tour_id:tour_id;
	// проверяем на результаты незагруженные
	// :TEST NEW UPLOAD: //var results = GetUploadResults();
	// временно сохраняем в localstorage
	// :TEST NEW UPLOAD: //localStorage.setItem('tmp_upload_results',json_encode(results));
	// :TEST NEW UPLOAD: //upload_results = {};

//	console.log({last:tour_cats_last,tour_id:f_tour_id});
	app.request.post(app_prms.url.data, {action:'cats',ldate:tour_cats_last,tour_id:f_tour_id,tab_name:tabletName,tab_state:battery,token:token,results:GetUploadResults()}, (reqdata) => {
		if(reqdata.error!==undefined) {
			app.dialog.alert('Error: '+reqdata.error);
			// :TEST NEW UPLOAD: //
			/*if(results!==undefined) {
				AddMassResultToUpload(results);
			}*/
		} else {
			if(prms.func_before!==undefined) prms.func_before();
			// удаляем успешно загруженные результаты
			if(reqdata.complete_results!==undefined) {
				ClearUploadedResults(reqdata.complete_results);
				delete reqdata.complete_results;
			}
			// разбираем данные
			SetLoadedCats(f_tour_id,reqdata);
			if(prms.func_after!==undefined) prms.func_after();
			$$('.connection-status').removeClass('color-red').attr('title','online');
		}
		// :TEST NEW UPLOAD: //localStorage.removeItem('tmp_upload_results');
		loadingprocess = false;
		app.ptr.done();
		// попытка загрузки данных через определенное время
		if(!timeout_in_process) {
			timeout_in_process = true;
			setTimeout(function(){timeout_in_process=false;LoadTourCats();},app_prms.time_online);
		}
	},
	(xhr, status) => {
		console.log('error xhr loading');
		console.log(status);
		// :TEST NEW UPLOAD: //
		/*if(results!==undefined) {
			AddMassResultToUpload(results);
			localStorage.removeItem('tmp_upload_results');
		}*/
		if(status==401 || status==403) SetNotAuth();
		else {
			if(ObjectLength(tour_cats)<1 && tour_id!==undefined) {
				var newcats = GetCats(tour_id);
				if(PageCatsStatus() && ObjectLength(newcats)) componentCats.$setState({cats:newcats,lastid:tour_cats_last});
			}
			//if(PageCatsStatus()) componentCats.$setState({cats:GetCats(tour_id),lastid:tour_cats_last});
			/*if(tour_cats_last!==undefined) {
				if(prms.lastid===undefined || (prms.lastid!==undefined && prms.lastid<tour_cats_last)) {
					if(PageCatsStatus()) componentCats.$setState({cats:GetCats(tour_id),lastid:tour_cats_last});
				}
			}*/
			offline = true; $$('.connection-status').addClass('color-red').attr('title','offline');
			// попытка через определенного времени выйти из offline
			if(!timeout_in_process) {
				timeout_in_process = true;
				setTimeout(function(){timeout_in_process=false;LoadTourCats();},app_prms.time_offline);
			}
		}
		app.ptr.done();
		loadingprocess = false;
	},'json');
	return;
}
function InitTournament() {
	if(!GetTabletName()) app.dialog.prompt(
		'Необходимо задать имя для планшета',
		'Имя планшета',
		function(name){
			if(name) SetTabletName(name); else InitTournament();
		},
		InitTournament
	);

	// загружаем пакеты для загрузки из хранилища
	GetUploadResults();
	/*var tmp_results = localStorage.getItem('tmp_upload_results');
	// если остались пакеты сломавшиеся
	if(tmp_results) {
		AddMassResultToUpload(json_decode(tmp_results));
		localStorage.removeItem('tmp_upload_results');
	}*/

	var tours = GetTournaments();
	//if(ObjectLength(tours)) {
	if(!GetTourId() || !GetTourName()) {
		SelectTour();
	} else {
		// start tour
		var res = GetResults(tour_id);
	}
}
// open set tablet name
function SelectTabletName() {
	app.dialog.prompt(
		'Введите имя для планшета',
		'Имя планшета',
		function(name){
			if(name) SetTabletName(name);
		},
		InitTournament,
		GetTabletName()
	);
}
// open popup window
function SelectTour() {
	var str = '';
	var tours = GetTournaments();
	if(ObjectLength(tours)) {
		str += '<li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Турнир</div><div class="item-input-wrap input-dropdown-wrap"><select placeholder="Выберите турнир ..." name="tour_id">';
		for(var i in tours) {
			str += '<option '+(tour_id==i ? 'selected' : '')+' value="'+i+'">'+tours[i]+'</option>';
		}
		str += '</select>';
		str += '</div></div></li>';
	} else {
		str += '<li>Доступные чемпионаты не найдены</li>';
	}
	var popup = app.popup.create({
	  content: '<div id="popup_select_tour" class="popup"><form><div class="list inline-labels no-hairlines-md"><ul>'+str+'</ul></div><p><button type="submit" id="select_tour_button" class="button button-raised button-fill">Выбрать</button><a class="popup-close button color-red">Закрыть</a></p></form></div>',
	  on: {
	    opened: function () {
			$$('#popup_select_tour form').on('submit',function(e){
				e.preventDefault();
				if(this.tour_id.value) {
					var tours = GetTournaments();
					SaveResults();
					SetTourId(this.tour_id.value);
					SetTourName(tours[this.tour_id.value]);
					if(PageCatsStatus()) componentCats.$setState({title:GetTourName()});
					//var cats = GetCats();
					tour_cats_last = 0;
					var res = GetResults(this.tour_id.value);
					LoadTourCats();
					popup.close().destroy();
					app.panel.close('right');
				}
				return false;
			});
	    }
	  }
	}).open();
}
// проверка статуса страницы категорий
function PageCatsStatus() {
	return componentCats!==undefined && $$('.page[data-name="home"]').length ? true : false;
}
// get tablet name
function GetTabletName() {
	if(!tabletName) {
		tabletName = localStorage.getItem('tabletName');
	}
	return tabletName;
}
// set tablet name
function SetTabletName(name) {
	if(name!==undefined) {
		localStorage.setItem('tabletName',name);
		tabletName = name;
	}
}
// get tournament name
function GetTourName() {
	if(!tour_name) {
		tour_name = localStorage.getItem('tour_name');
	}
	return tour_name;
}
// set tournament name
function SetTourName(name) {
	if(name!==undefined) {
		localStorage.setItem('tour_name',name);
		tour_name = name;
	}
}
// get tournament id
function GetTourId() {
	if(!tour_id) {
		tour_id = localStorage.getItem('tour_id');
	}
	return tour_id;
}
// set tournament id
function SetTourId(id) {
	if(id!==undefined) {
		localStorage.setItem('tour_id',id);
		if(tour_id!=id) {
			tour_id = id;
			GetCats(id);
		}
	}
}
// get tournament id
function GetTournaments() {
	if(userdata.tournaments===undefined) {
		userdata.tournaments = json_decode(localStorage.getItem('tournaments'));
	}
	return userdata.tournaments;
}
// set tournament id
function SetTournaments(data) {
	if(data!==undefined) {
		localStorage.setItem('tournaments',json_encode(data));
		userdata.tournaments = data;
	}
}
// get tournament cats
function GetCats(id) {
	if(id!==undefined) {
		var f_tour_cats = json_decode(localStorage.getItem('cats_'+id));
		var f_tour_cats_last = localStorage.getItem('cats_last_'+id);
		var f_tour_results = json_decode(localStorage.getItem('results_'+id));
		// только если совпадает активный id
		if(id==tour_id) {
			tour_cats = f_tour_cats;
			tour_cats_last = f_tour_cats_last;
			tour_results = f_tour_results;
		}
	}
	return f_tour_cats;
}
// set tournament cats
function SetCats(id,data,last_id) {
	if(data!==undefined) {
		localStorage.setItem('cats_'+id,json_encode(data));
		localStorage.setItem('cats_last_'+id,last_id);
		// только если совпадает активный id
		if(id==tour_id) {
			tour_cats = data;
			tour_cats_last = last_id;
			if(PageCatsStatus()) componentCats.$setState({cats:tour_cats,lastid:tour_cats_last});
		}
	}
}
// get tournament results
function GetResults(id) {
	if(id!==undefined) {
		var f_tour_results = json_decode(localStorage.getItem('results_'+id));
		// только если совпадает активный id
		if(id==tour_id) {
			tour_results = f_tour_results;
		}
	}
	return f_tour_results;
}
// set tournament results to localstorage
function SaveResults() {
	if(tour_id!==undefined && tour_results!==undefined) {
		localStorage.setItem('results_'+tour_id,json_encode(tour_results));
	}
}
// set tournament results
function SetResults(id,cid,jid,data) {
	if(id!==undefined && cid!==undefined && jid!==undefined && data!==undefined) {
		var results = GetResults(id);
		if(results[cid]===undefined) results[cid] = {};
		results[cid][jid] = data;
		AddResultToUpload(id,cid,jid,data);
		localStorage.setItem('results_'+id,json_encode(results));
		// возможно данные по загрузке результатов
		// только если совпадает активный id
		if(id==tour_id) {
			tour_results = results;
		}
	}
}
// получить результат к загрузке на сервер из хранилища
function GetUploadResults() {
	if(upload_results===undefined) {
		upload_results = json_decode(localStorage.getItem('upload_results'));
	}
	return upload_results;
}
// добавить массовый результат к загрузке на сервер
function AddMassResultToUpload(data) {
	if(data!==undefined) {
		for(var tid in data) {
			if(upload_results[tid]===undefined) upload_results[tid] = {};
			for(var cid in data[tid]) {
				if(upload_results[tid][cid]===undefined) upload_results[tid][cid] = {};
				for(var jid in data[tid][cid]) {
					upload_results[tid][cid][jid] = data[tid][cid][jid];
					//localStorage.setItem('upload_results',json_encode(upload_results));
				}
			}
		}
		// записываем только итог
		localStorage.setItem('upload_results',json_encode(upload_results));
	}
}
// подчищаем загруженные результаты
function ClearUploadedResults(data) {
	if(data!==undefined) {
		// берем актуальные результаты
		upload_results = json_decode(localStorage.getItem('upload_results'));
		if(upload_results!==undefined) for(var tid in data) {
			if(upload_results[tid]!==undefined) for(var cid in data[tid]) {
				if(upload_results[tid][cid]!==undefined) for(var jid in data[tid][cid]) {
					if(upload_results[tid][cid][jid]!==undefined) delete upload_results[tid][cid][jid];
				}
				if(!ObjectLength(upload_results[tid][cid])) delete upload_results[tid][cid];
			}
			if(!ObjectLength(upload_results[tid])) delete upload_results[tid];
		}
		// записываем после изменения
		localStorage.setItem('upload_results',json_encode(upload_results));
	}
}
// добавить результат к загрузке на сервер
function AddResultToUpload(id,cid,jid,data) {
	if(id!==undefined && cid!==undefined && jid!==undefined && data!==undefined) {
		// берем актуальные результаты
		upload_results = json_decode(localStorage.getItem('upload_results'));
		if(upload_results===undefined) upload_results = {};
		if(upload_results[id]===undefined) upload_results[id] = {};
		if(upload_results[id][cid]===undefined) upload_results[id][cid] = {};
		upload_results[id][cid][jid] = data;
		localStorage.setItem('upload_results',json_encode(upload_results));
	}
}
function ClearLocalData() {
	app.dialog.confirm(
		'Вы уверены, что хотите очистить локальное хранилище? Это приведет к полной потере данных приложения. После очистки обязательно перезагрузите приложение',
		'Очистка хранилища',
		function(){
			localStorage.clear();
			tour_id = 0;
			tour_results = {};
			tour_cats = {};
			tour_name = '';
			InitTournament();
		});
}
// ------------- BATTERY ------------------//
function InitBatteryStatus() {
	if(navigator.getBattery!==undefined) navigator.getBattery().then(function(bat) {
		SetBatteryStatus(bat);
		bat.onlevelchange = function(){SetBatteryStatus(this);};
	});
}
function SetBatteryStatus(bat) {
	if(bat.charging!==undefined) battery.charging = bat.charging // fe: false
	if(bat.chargingTime!==undefined) battery.chargingTime = bat.chargingTime // fe: Infinity
	if(bat.dischargingTime!==undefined) battery.dischargingTime = bat.dischargingTime // fe: 12840
	if(bat.level!==undefined) battery.level = bat.level // fe: 0.94
	//battery = bat;
}
function GetChargeLevel() {
	return battery.level!==undefined ? battery.level : 0;
}
function GetDischargeTime() {
	return battery.dischargingTime!==undefined ? battery.dischargingTime : 0;
}
// ------------- PUSH FUNCTIONS --------------- //
// получаем запрос на токен, если еще не получали ранее
function InitPush() {
	// ...........
}
// ------------- GLOBALIZATION ---------------- //
function SetUserLanguage(lng) {
	lng = lng.substr(0,2).toLowerCase();
	//app.preloader.show();
	app.request.json('langs/'+lng+'.json',{},
		function(data,status,xhr){lang=data;InitApplication();},
		function(xhr,status){app.dialog.alert('Error getting language: '+status+'\n');/*console.log('error');console.log(status);console.log(xhr);*/}
	);
}
// HTML5 version
function InitGlobalPreferredLanguage() {
	var lang = navigator.language!==undefined ? navigator.language : 'en';
	SetUserLanguage(lang);
}
// plugin version
function InitGlobalPreferredLanguagePlugin() {
	navigator.globalization.getPreferredLanguage(
        function(data){SetUserLanguage(data.value);},
        function(){SetUserLanguage('en');}
	);
}

// ------------- LOADING --------------- //
function LoadItemsToInfiniteTape(url,container,tmpl,f_beforecomplete,f_aftercomplete,mydata) {
	//console.log('load items to scroll');
	//console.log(url);
	//console.log(container);
	//console.log(tmpl);
	console.log(mydata);
	if(container.hasClass('loadstate')) return;
	container.addClass('loadstate');
	app.request.post(url, mydata, (reqdata) => {
		if(f_beforecomplete!==undefined) f_beforecomplete();
		var html = tmpl(reqdata);
		//console.log(html);
		// js not init
		container.append(html).removeClass('loadstate');
		app.swiper.create(container.find('.swiper-container'),{pagination:{el:".swiper-pagination"}});
		//$$(html).appendTo(container);
		//container.removeClass('loadstate');
		// :TODO: remove if end of tape
		if(f_aftercomplete!==undefined) f_aftercomplete();
	},
	(xhr, status) => {
		console.log('error xhr loading');
		console.log(status);
		if(status==401 || status==403) SetNotAuth(); //console.log('show login screen');
	},'json');
}

// -------------------------------------- JSON FUNCTIONS ------------------------------------------------ //
function json_encode(obj) {
	return JSON.stringify(obj);
}
function json_decode(JSONtext) {
	var obj = {};
	if(isValidJSON(JSONtext)) {
		var obj = eval('(' + JSONtext + ')');
		//var obj = JSON.parse(JSONtext);
		//var obj = jQuery.parseJSON(JSONtext);
	}
	return obj;
}
function isValidJSON(src) {
	if(!src) return false;
    var filtered = src;
    filtered = filtered.replace(/\\["\\\/bfnrtu]/g, '@');
    filtered = filtered.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
    filtered = filtered.replace(/(?:^|:|,)(?:\s*\[)+/g, '');

    return (/^[\],:{}\s]*$/.test(filtered));
};

// -------------------------------------- SYSTEM FUNCTIONS ------------------------------------------------ //
function ObjectLength(obj) {
	var l = 0;
	for(var i in obj) l++;
	return l;
}
function ObjectFirstKey(obj) {
	for(var i in obj) return i;
	return '';
}
function CheckKeyInObject(key,obj) {
	if(key!==undefined && obj!==undefined) return obj[key]!==undefined ? true : false;
	return false;
}
function GetArrayFromNumber(num) {
	var r = [];
	for(var i=1;i<=num;i++) r.push(i);
	return r;
}
function SortObjectFunc(o,func) {
	var new_o = {};
	if(o!==undefined && func!==undefined) {
		var sortable = [];
		for(var i in o) sortable.push([i, o[i]]);
		//console.log(sortable);
		sortable.sort(func);
		for(var i in sortable) new_o[sortable[i][0]] = sortable[i][1];
		//console.log(new_o);
		//console.log(sortable);
	}
	return new_o;
}
function isNumber(n) {return /^-?[\d.]+(?:e-?\d+)?$/.test(n);}
// -------------- Template7 helpers -------------- //
function JudgeCompleteStatus(key, obj) {
	if(CheckKeyInObject(key, obj)) {
		return ' <span class="badge color-green"><i class="material-icons">check_circle</i></span>';
	} else {
		return '';
	}
}
function JudgeLogStatus(hid,fid,jid) {
	var st = false;
	if(results_log!==undefined && hid!==undefined && fid!==undefined && jid!==undefined)
		if(results_log[hid+'-'+fid]!==undefined)
			if(results_log[hid+'-'+fid][jid]!==undefined)
				st = true;
	if(st) {
		return ' <span class="badge color-red">D</span> ';
	} else {
		return '';
	}
}
function CatCompleteStatus(key) {
	var st = false;
	if(tour_results!==undefined && key!==undefined) if(tour_results[key]!==undefined) st=true;
	if(st) {
		return ' <span class="badge color-green">C</span> ';
	} else {
		return '';
	}
}
function GetSexColor(key, obj) {
	if(CheckKeyInObject(key, obj)) {
		return parseInt(obj[key]) > 0 ? 'bg-color-blue' : 'bg-color-pink';
	} else {
		return '';
	}
}
// -------------- DATE & TIME ----------------- //
function FormatUTDate(date) {
	return FormatDate(date*1000);
}
function FormatDate(date) {
    var months = ('January February March April May June July August September October November December').split(' ');
    var _date = new Date(date);
    var month = months[_date.getMonth()];
    var day = _date.getDate();
    var year = _date.getFullYear();
    var h = _date.getHours();
    h = h < 10 ? '0' + h : h;
    var m = _date.getMinutes();
    m = m < 10 ? '0' + m : m;
    return month + ' ' + day + ', ' + year + ' ' + h + ':' + m;
}

// ------------- MESSAGES --------------- //
function LoadMessagesToPage(url,container,f_beforecomplete,f_aftercomplete) {
	if(container.hasClass('loadstate')) return;
	container.addClass('loadstate');
	//console.log(container);
	var mess_container = app.messages.get(container);
	//console.log(app.messages);
	//console.log(mess_container);
	app.request.post(url, {}, (md) => {
		if(f_beforecomplete!==undefined) f_beforecomplete();
		if(md.messages!==undefined) {
			SetMessages(mess_container,md.messages,'prepend');
			container.removeClass('loadstate');
		}
		if(f_aftercomplete!==undefined) f_aftercomplete();
	},
	(xhr, status) => {
		console.log('error xhr messages loading');
		console.log(status);
		if(status==401 || status==403) SetNotAuth(); //console.log('show login screen');
	},'json');
}
function GetMessageObj(ms) {
	var mo = {};
	if(ms.type===undefined) ms.type='s';
	mo.footer = GetSmartShortDateTimeTS(ms.timestamp);
	if(ms.message!==undefined) mo.text = ms.message;
	if(ms.image!==undefined) mo.imageSrc = ms.image;
	switch(ms.type) {
		case 's':
			mo.type = 'sent';
		break;
		case 'r':
			mo.type = 'received';
			if(ms.author!==undefined) {
				mo.name = ms.author.name;
				mo.avatar = ms.author.photo;
			}
		break;
	}
	return mo;
}
function GetSmartShortDateTime(d) {
	return (d.getHours()<10?'0':'')+d.getHours()+':'+(d.getMinutes()<10?'0':'')+d.getMinutes();
}
function GetSmartShortDateTimeTS(ts) {
	var d = new Date(ts*1000);
//	return '{0}:{1}'.printf(d.getHours(),d.getMinutes());
	return (d.getHours()<10?'0':'')+d.getHours()+':'+(d.getMinutes()<10?'0':'')+d.getMinutes();
}
function SetMessages(mobj,ms,dir) {
	var mss = [];
	for(var i=0;i<ms.length;i++) mss.push(GetMessageObj(ms[i]));
	//console.log(mss);
	mobj.addMessages(mss,dir);
	mobj.addMessages(mss,'prepend');
}
function SetMessage(mobj,ms,dir) {
	mobj.addMessage(GetMessageObj(ms),dir);
}
function SendMessage(mbc,mc,url) {
	if(!mbc.val()) return;
	app.request.post(url, {message:mbc.val()}, (res) => {
		if(res.status) {
			var mess_container = app.messages.get(mc);
			var d = new Date();
			mess_container.addMessage({
				text:mbc.val(),
				footer:GetSmartShortDateTime(d)
			},'append');
			mbc.val('');
			// TEST
			setTimeout(function(){SendRandTyping(mess_container);},1000);
			setTimeout(function(){SendRandMessage(mess_container);},4000);
		} else {
			app.dialog.alert(res.error);
		}
	},
	(xhr, status) => {
		console.log('error xhr send message loading');
		console.log(status);
		if(status==401 || status==403) console.log('show login screen');
	},'json');
}
function SendRandTyping(mess_container) {
	var auth = [
		{"id":1,"photo":"https:\/\/lifeis.dance\/app\/i\/p1.jpg","name":"Alexander Pushkin","alias":"alex_pushkin"},
		{"id":2,"photo":"https:\/\/lifeis.dance\/app\/i\/p2.jpg","name":"Alexander Ostrovsky","alias":"theatre"},
		{"id":3,"photo":"https:\/\/lifeis.dance\/app\/i\/p3.jpg","name":"Ivan Turgenev","alias":"fathers_sons"},
		{"id":4,"photo":"https:\/\/lifeis.dance\/app\/i\/p4.jpg","name":"Leo Tolstoy","alias":"pacifist"},
		{"id":5,"photo":"https:\/\/lifeis.dance\/app\/i\/p5.jpg","name":"Noname Nofamily","alias":"noname"},
		{"id":6,"photo":"https:\/\/lifeis.dance\/app\/i\/p6.jpg","name":"Alexander Griboedov","alias":"a_griboedov"}];
	var ind = getRandomInt(0,auth.length);
	mess_container.showTyping({header:auth[ind].name+' is typing',avatar:auth[ind].photo});
}
function SendRandMessage(mess_container) {
	mess_container.hideTyping();
	var messages = [
		{"id":223,"timestamp":1537806797,"type":"r","message":"Lorem ipsum dolor sit amet, consectetur adipisicing elit.","author":{"id":1,"photo":"https:\/\/lifeis.dance\/app\/i\/p1.jpg","name":"Alexander Pushkin","alias":"alex_pushkin"}},
		{"id":220,"timestamp":1537806377,"type":"r","message":"Hi, I am good!","author":{"id":2,"photo":"https:\/\/lifeis.dance\/app\/i\/p2.jpg","name":"Alexander Ostrovsky","alias":"theatre"}},
		{"id":219,"timestamp":1537806197,"type":"r","message":"Hi there, I am also fine, thanks! And how are you?","author":{"id":3,"photo":"https:\/\/lifeis.dance\/app\/i\/p3.jpg","name":"Ivan Turgenev","alias":"fathers_sons"}},
		{"id":215,"timestamp":1537804577,"type":"r","message":"Nice!","author":{"id":4,"photo":"https:\/\/lifeis.dance\/app\/i\/p4.jpg","name":"Leo Tolstoy","alias":"pacifist"}},
		{"id":214,"timestamp":1537803557,"type":"r","message":"Like it very much!","author":{"id":5,"photo":"https:\/\/lifeis.dance\/app\/i\/p5.jpg","name":"Noname Nofamily","alias":"noname"}},
		{"id":213,"timestamp":1537803017,"type":"r","message":"Awesome! (213)","author":{"id":6,"photo":"https:\/\/lifeis.dance\/app\/i\/p6.jpg","name":"Alexander Griboedov","alias":"a_griboedov"}}];
	var ind = getRandomInt(0,messages.length);
	SetMessage(mess_container,messages[ind]);
}

/*
id
timestamp
type
message
author {
	id
	photo
	name
	alias
}

text	string		Message text
header	string		Single message header
footer	string		Single message footer
name	string		Sender name
avatar	string		Sender avatar URL string
type	string	sent	Message type - sent or received
textHeader	string		Message text header
textFooter	string		Message text footer
image	string		Message image HTML string, e.g. <img src="path/to/image">. Can be used instead of imageSrc parameter
imageSrc	string		Message image URL string. Can be used instead of image parameter
isTitle	boolean		Defines whether it should be rendered as a message or as a messages title
*/

// !!! ВСЕ ЧТО НИЖЕ НАДО УПОРЯДОЧИТЬ !!! //


// ------------- GEOLOCATION -------------- //

	// onSuccess Callback
    // This method accepts a Position object, which contains the
    // current GPS coordinates
    //
    var onGeolocationSuccess = function(position) {
		app.dialog.alert('Latitude: '          + position.coords.latitude          + '\n' +
						 'Longitude: '         + position.coords.longitude         + '\n' +
						 'Altitude: '          + position.coords.altitude          + '\n' +
						 'Accuracy: '          + position.coords.accuracy          + '\n' +
						 'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
						 'Heading: '           + position.coords.heading           + '\n' +
						 'Speed: '             + position.coords.speed             + '\n' +
						 'Timestamp: '         + position.timestamp                + '\n');
    };

    // onError Callback receives a PositionError object
    //
    function onGeolocationError(error) {
		app.dialog.alert('code: '    + error.code    + '\n' +
						 'message: ' + error.message + '\n');
    }

    //navigator.geolocation.getCurrentPosition(onGeolocationSuccess, onGeolocationError);

// ------------- GLOBALIZATION ---------------- //
function GlobalPreferredLanguage() {
	navigator.globalization.getPreferredLanguage(
        function (data) {alert('language: ' + data.value + '\n');},
        function () {alert('Error getting language\n');}
	);
}

function GlobalLocaleName() {
	navigator.globalization.getLocaleName(
        function (data) {alert('localename: ' + data.value + '\n');},
        function () {alert('Error getting language\n');}
	);
}

function GlobalCurrencyPattern() {
	navigator.globalization.getCurrencyPattern(
        function (data) {alert('language: ' + data.value + '\n');},
        function () {alert('Error getting language\n');}
	);
}

// ---------- DEVICE ----------------- //
function GetDeviceProperties() {
	app.dialog.alert('cordova: ' + device.cordova + '\n' +
					 'model: ' + device.model + '\n' +
					 'platform: ' + device.platform + '\n' +
					 'uuid: ' + device.uuid + '\n' +
					 'version: ' + device.version + '\n' +
					 'manufacturer: ' + device.manufacturer + '\n' +
					 'isVirtual: ' + device.isVirtual + '\n' +
					 'serial: ' + device.serial + '\n');
}

// ---------- STORAGE --------------- //
function ReadAllCookies() {
	alert(document.cookie ? document.cookie : 'is empty');
}
function setCookie(name, value, options) {
  options = options || {};

  var expires = options.expires;

  if (typeof expires == "number" && expires) {
    var d = new Date();
    d.setTime(d.getTime() + expires * 1000);
    expires = options.expires = d;
  }
  if (expires && expires.toUTCString) {
    options.expires = expires.toUTCString();
  }

  value = encodeURIComponent(value);

  var updatedCookie = name + "=" + value;

  for (var propName in options) {
    updatedCookie += "; " + propName;
    var propValue = options[propName];
    if (propValue !== true) {
      updatedCookie += "=" + propValue;
    }
  }

  document.cookie = updatedCookie;
}
function deleteCookie(name) {
  setCookie(name, "", {
    expires: -1
  })
}
function getCookie(name) {
  var matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}
function ReadAllLS() {
	var t = localStorage.getItem('test');
	if(t!==undefined) alert('val: '+t);
	else alert('val undefined');
}
function SetLSItem(val) {
	localStorage.setItem('test',val);
}
// --------- NETWORK ------------- //
function checkConnection() {
    var networkState = navigator.connection.type;

    var states = {};
    states[Connection.UNKNOWN]  = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI]     = 'WiFi connection';
    states[Connection.CELL_2G]  = 'Cell 2G connection';
    states[Connection.CELL_3G]  = 'Cell 3G connection';
    states[Connection.CELL_4G]  = 'Cell 4G connection';
    states[Connection.CELL]     = 'Cell generic connection';
    states[Connection.NONE]     = 'No network connection';

    app.dialog.alert('Connection type: ' + states[networkState]);
}
// -------- CONTACTS ----------- //
/*function onContactsSuccess(contacts) {
    alert('Found ' + contacts.length + ' contacts.');
};
function onContactsError(contactError) {
    alert('onError!');
};
function FindContacts(srch) {
	// find all contacts with 'Bob' in any name field
	var options      = new ContactFindOptions();
	options.filter   = srch; //"a";
	options.multiple = true;
	options.desiredFields = [navigator.contacts.fieldType.id];
	options.hasPhoneNumber = true;
	var fields       = [navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name];
	navigator.contacts.find(fields, onContactsSuccess, onContactsError, options);
}*/
function FindContacts() {
	navigator.contactsPhoneNumbers.list(function(contacts) {
      app.dialog.alert(contacts.length + ' contacts found');
      for(var i = 0; i < contacts.length; i++) {
         console.log(contacts[i].id + " - " + contacts[i].displayName);
         for(var j = 0; j < contacts[i].phoneNumbers.length; j++) {
            var phone = contacts[i].phoneNumbers[j];
            console.log("===> " + phone.type + "  " + phone.number + " (" + phone.normalizedNumber+ ")");
         }
      }
   }, function(error) {
      console.error(error);
   });
}
// ------- CAMERA ----------- //
function GetMyPhoto() {
	navigator.camera.getPicture(onSuccessCamera, onFailCamera, { quality: 50, destinationType: Camera.DestinationType.FILE_URI });
}
function onSuccessCamera(imageURI) {
    var image = document.getElementById('myPhoto');
    image.src = imageURI;
}
function onFailCamera(message) {
    app.dialog.alert('Failed because: ' + message);
}
function openFilePicker(selection) {

    var srcType = Camera.PictureSourceType.SAVEDPHOTOALBUM;
    var options = setOptions(srcType);
    var func = createNewFileEntry;

    navigator.camera.getPicture(function cameraSuccess(imageUri) {

        // Do something
	    var image = document.getElementById('myPhoto');
	    image.src = imageUri;

    }, function cameraError(error) {
        console.debug("Unable to obtain picture: " + error, "app");

    }, options);
}
function setOptions(srcType) {
    var options = {
        // Some common settings are 20, 50, and 100
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
        // In this app, dynamically set the picture source, Camera or photo gallery
        sourceType: srcType,
        encodingType: Camera.EncodingType.JPEG,
        mediaType: Camera.MediaType.PICTURE,
        allowEdit: true,
        correctOrientation: true  //Corrects Android orientation quirks
    }
    return options;
}
function createNewFileEntry(imgUri) {
    window.resolveLocalFileSystemURL(cordova.file.cacheDirectory, function success(dirEntry) {

        // JPEG file
        dirEntry.getFile("tempFile.jpeg", { create: true, exclusive: false }, function (fileEntry) {

            // Do something with it, like write to it, upload it, etc.
            // writeFile(fileEntry, imgUri);
            console.log("got file: " + fileEntry.fullPath);
            // displayFileData(fileEntry.fullPath, "File copied to");

        }, onErrorCreateFile);

    }, onErrorResolveUrl);
}
