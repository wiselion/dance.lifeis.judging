// setting urls
app_prms.url = {
	auth: 'https://cp.lifeis.dance/app/auth.php',
	token: 'https://cp.lifeis.dance/app/token.php',
	data: 'https://cp.lifeis.dance/app/data.php',
	userdata: 'https://cp.lifeis.dance/app/userdata.php',
	login: 'https://cp.lifeis.dance/app/login.php',
	logout: 'https://cp.lifeis.dance/app/logout.php',
	/*tape: 'https://lifeis.dance/app/tape.php',
	post: 'https://lifeis.dance/app/post.php',
	setpush: 'https://lifeis.dance/app/setpush.php',
	comments: 'https://lifeis.dance/app/comments.php',
	userinfo: 'https://lifeis.dance/app/userinfo.php',
	usertape: 'https://lifeis.dance/app/usertape.php',
	notices: 'https://lifeis.dance/app/notices.php',
	chats: 'https://lifeis.dance/app/messages_all.php',
	messages: 'https://lifeis.dance/app/messages.php',
	sendmessage: 'https://lifeis.dance/app/sendmessage.php',*/
};
//app_prms.sender_id = 908372754074;

routes = [
  {
    path: '/',
    componentUrl: './pages/cs_categories.html',
  },
  {
    path: '/judges/:hitId/:final/',
    componentUrl: './pages/cs_hit_judges.html',
  },
  {
    path: '/hit/:hitId/:final/:judgeId/',
    componentUrl: './pages/cs_hit.html',
  },

  /*{
    path: '/',
    componentUrl: './pages/tape.html',
  },
  {
    path: '/post/:postId/',
    componentUrl: './pages/post.html',
  },
  {
    path: '/users/:userId/',
    componentUrl: './pages/userpage.html',
  },
  {
    path: '/tags/:tagId/',
    componentUrl: './pages/tagpage.html',
  },*/
/*  {
    path: '/login/',
    loginScreen:{componentUrl:'./pages/login-screen.html'},
    //loginScreen: {componentUrl:'./pages/login-screen.html'}
  },*/
  {
    path: '/logout/',
    async: function (routeTo, routeFrom, resolve, reject) {
		app.request.json(app_prms.url.logout,(data) => {
			console.log('start logout');
		},
		(xhr, status) => {
			if(status==401 || status==403) {
				clearToken();
				SetNotAuth();
			} else app.dialog.alert(lang.login.disconnect);
		},'json');
	}
  },
/*
  {
    path: '/menu/',
    url: './pages/menu.html',
  },
  {
    path: '/events/',
    componentUrl: './pages/shedule.html',
  },
  {
    path: '/messages/',
    componentUrl: './pages/messages.html',
  },
  {
    path: '/message/:chatId/',
    componentUrl: './pages/message.html',
  },
  {
    path: '/notices/',
    componentUrl: './pages/notices.html',
  },

  {
    path: '/about/',
    templateUrl: './pages/about.html',
  },
  {
    path: '/tests/geo/',
    url: './pages/tests-geo.html',
  },
  {
    path: '/tests/global/',
    url: './pages/tests-global.html',
  },
  {
    path: '/tests/device/',
    url: './pages/tests-device.html',
  },
  {
    path: '/tests/storage/',
    url: './pages/tests-storage.html',
  },
  {
    path: '/catalog/',
    componentUrl: './pages/catalog.html',
  },
  {
    path: '/product/:id/',
    componentUrl: './pages/product.html',
  },
  {
    path: '/settings/',
    url: './pages/settings.html',
  },
  // Page Loaders & Router
  {
    path: '/page-loader-template7/:user/:userId/:posts/:postId/',
    templateUrl: './pages/page-loader-template7.html',
  },
  {
    path: '/page-loader-component/:user/:userId/:posts/:postId/',
    componentUrl: './pages/page-loader-component.html',
  },
  {
    path: '/request-and-load/user/:userId/',
    async: function (routeTo, routeFrom, resolve, reject) {
      // Router instance
      var router = this;

      // App instance
      var app = router.app;

      // Show Preloader
      app.preloader.show();

      // User ID from request
      var userId = routeTo.params.userId;

      // Simulate Ajax Request
      setTimeout(function () {
        // We got user data from request
        var user = {
          firstName: 'Vladimir',
          lastName: 'Kharlampidi',
          about: 'Hello, i am creator of Framework7! Hope you like it!',
          links: [
            {
              title: 'Framework7 Website',
              url: 'http://framework7.io',
            },
            {
              title: 'Framework7 Forum',
              url: 'http://forum.framework7.io',
            },
          ]
        };
        // Hide Preloader
        app.preloader.hide();

        // Resolve route to load page
        resolve(
          {
            componentUrl: './pages/request-and-load.html',
          },
          {
            context: {
              user: user,
            }
          }
        );
      }, 1000);
    },
  },*/
  // Default route (404 page). MUST BE THE LAST
  {
    path: '(.*)',
    url: './pages/404.html',
  },
];
