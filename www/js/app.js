// MyChat App - Ionic & Firebase Demo
var firebaseUrl = "https://reddel.firebaseio.com";

function onDeviceReady() {

    setTimeout(function() {

        navigator.splashscreen.hide();

    }, 3000);

    angular.bootstrap(document, ["mychat"]);

    /*if(ionic.Platform.isIOS()){
        StatusBar.overlaysWebView(false);
    }*/
}
//console.log("binding device ready");
// Registering onDeviceReady callback with deviceready event
document.addEventListener("deviceready", onDeviceReady, false);

// 'mychat.services' is found in services.js
// 'mychat.controllers' is found in controllers.js
angular.module('mychat', ['ionic', 'firebase', 'angularMoment', 'mychat.controllers', 'mychat.services', 'mychat.directives', 'mychat.autocomplete'])

    .run(function ($ionicPlatform, $rootScope, $location, Auth, $ionicLoading) {

    $ionicPlatform.ready(function() {
        //localstorage check

        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        /*Google keys
         * key: AIzaSyAbXzuAUk1EICCdfpZhoA6-TleQrPWxJuI
         * Project Number: open-circles-1064/346007849782
         */
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
        // To Resolve Bug
        ionic.Platform.fullScreen();

        $rootScope.firebaseUrl = firebaseUrl;
        $rootScope.displayName = null;

        Auth.$onAuth(function (authData) {
            if (!authData) {
                console.log("Logged out");
                $ionicLoading.hide();
                $location.path('/login');
            }
        });


        $rootScope.$on("$stateChangeError", function (event, toState, toParams, fromState, fromParams, error) {
            // We can catch the error thrown when the $requireAuth promise is rejected
            // and redirect the user back to the home page
            if (error === "AUTH_REQUIRED") {
                $location.path("/login");
            }
        });
    });
})

    .config(['$stateProvider', '$urlRouterProvider', '$ionicConfigProvider',

function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    console.log("setting config");
    $ionicConfigProvider.tabs.position('top');
    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

    // State to represent Login View
    .state('login', {
        url: "/login",
        templateUrl: "templates/login.html",
        controller: 'LoginCtrl',
        resolve: {
            // controller will not be loaded until $waitForAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",

            function (Auth) {
                // $waitForAuth returns a promise so the resolve waits for it to complete
                return Auth.$waitForAuth();
            }]
        }
    })
        .state('menu', {
        url: "/menu",
        abstract: true,
        templateUrl: "templates/menu.html",
        resolve: {
            // controller will not be loaded until $requireAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",

            function (Auth) {
                // $requireAuth returns a promise so the resolve waits for it to complete
                // If the promise is rejected, it will throw a $stateChangeError (see above)
                return Auth.$requireAuth();
            }]
        }
    })
    // setup an abstract state for the tabs directive
    .state('menu.tab', {
        url: "/tab",
        abstract: true,
        views: {
            'tabs': {
                templateUrl: "templates/tabs.html",
                controller: 'TabCtrl'
            }
        }
    })
        .state('menu.tab.ask', {
        url: '/ask',
        views: {
            'tab-ask': {
                templateUrl: 'templates/askQuestion.html',
                controller: 'AskCtrl'
            }
        }
    })
        .state('menu.tab.student', {
        url: '/studentrooms',
        views: {
            'tab-student': {
                templateUrl: 'templates/tab-rooms-student.html',
                controller: 'AdvisorCtrl'
            }
        }
    })
        .state('menu.tab.studentc', {
        url: '/conversations',
        views: {
            'tab-converse': {
                templateUrl: 'templates/tab-student-convers.html',
                controller: 'AdvisorConversationsCtrl'
            }
        }
    })
        .state('menu.tab.settingsMentor', {
        url: '/settingsMentor',
        views: {
            'tab-settingsMentor': {
                templateUrl: 'templates/tab-groups.html',
                controller: 'SettingsCtrlMentor'
            }
        }
    })
        .state('menu.tab.chat', {
        url: '/chat/:advisorID/:schoolID/:advisorKey/:prospectUserID/:prospectQuestionID/:schoolsQuestionID/:question/:displayName/:email/:group/:who',
        views: {
            'tab-chat': {
                templateUrl: 'templates/tab-chat.html',
                controller: 'ChatCtrl'
            }
        }
    })
        .state('menu.tab.publicchat', {
        url: '/chat/:prospectUserID/:prospectQuestionID/:schoolsQuestionID/:displayName/:question/:group/:wrap',
        views: {
            'tab-publicchat': {
                templateUrl: 'templates/tab-chat.html',
                controller: 'PublicChatCtrl'
            }
        }
    });
    //PublicChatCtrl
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');

}]);
