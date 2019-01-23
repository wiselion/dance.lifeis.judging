// Dom7
var $$ = Dom7;

// Framework7 App main instance
var app  = new Framework7({
  init: false,
  root: '#app', // App root element
  id: 'dance.lifeis.judging', // App bundle ID
  name: 'Lifeis.Judging', // App name
  theme: 'auto', // Automatic theme detection
  view: {
	  iosSwipeBack: false,
	  mdSwipeBack: false,
  },
  // App root data
  data: function () {
    return {
	  lang: lang,
      user: {
        firstName: 'Vladimir',
        lastName: 'Anisimov',
      },
      // Demo products for Catalog section
      /*products: [
        {
          id: '1',
          title: 'Apple iPhone 8',
          description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nisi tempora similique reiciendis, error nesciunt vero, blanditiis pariatur dolor, minima sed sapiente rerum, dolorem corrupti hic modi praesentium unde saepe perspiciatis.'
        },
        {
          id: '2',
          title: 'Apple iPhone 8 Plus',
          description: 'Velit odit autem modi saepe ratione totam minus, aperiam, labore quia provident temporibus quasi est ut aliquid blanditiis beatae suscipit odio vel! Nostrum porro sunt sint eveniet maiores, dolorem itaque!'
        },
        {
          id: '3',
          title: 'Apple iPhone X',
          description: 'Expedita sequi perferendis quod illum pariatur aliquam, alias laboriosam! Vero blanditiis placeat, mollitia necessitatibus reprehenderit. Labore dolores amet quos, accusamus earum asperiores officiis assumenda optio architecto quia neque, quae eum.'
        },
      ]*/
    };
  },
  // App root methods
  methods: {
    helloWorld: function () {
      app.dialog.alert('Hello World!');
    },
  },
  // App routes
  routes: routes,
});

// Init/Create views
var homeView, searchView, menuView, messagesView, noticesView;

/*var catalogView = app.views.create('#view-catalog', {
  url: '/catalog/'
});*/
var settingsView = app.views.create('#view-settings', {
  url: '/settings/'
});

// страница логина
var loginScreen = app.loginScreen.create({el:'#login-screen'});
$$('#login-form').on('submit',function(e){
	e.preventDefault();
	var formData = app.form.convertToData('#login-form');
	SendAuthRequest(app_prms.url.login,formData);
	return false;
});

app.preloader.show();
InitGlobalPreferredLanguage();

// функции шаблона
Template7.registerHelper('FormatUTDate',FormatUTDate);
Template7.registerHelper('CatCompleteStatus',CatCompleteStatus);
Template7.registerHelper('JudgeCompleteStatus',JudgeCompleteStatus);
Template7.registerHelper('JudgeLogStatus',JudgeLogStatus);

document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
	StatusBar.styleDefault();
	//InitGlobalPreferredLanguage();
}