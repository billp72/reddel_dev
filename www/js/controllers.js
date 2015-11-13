angular.module('mychat.controllers', [])

.controller('LoginCtrl', [
    '$scope', 
    '$ionicModal', 
    '$state', 
    '$firebaseAuth', 
    'Rooms', 
    'Users', 
    '$ionicLoading', 
    '$rootScope', 
    '$ionicHistory', 
    'schoolFormDataService',
    'ConnectionCheck', 
    'stripDot',
    'pushService',
    '$window',
    function (
    $scope, 
    $ionicModal, 
    $state, 
    $firebaseAuth, 
    Rooms, 
    Users, 
    $ionicLoading, 
    $rootScope, 
    $ionicHistory, 
    schoolFormDataService,
    ConnectionCheck, 
    stripDot,
    pushService,
    $window) {

    var ref = new Firebase($scope.firebaseUrl);
    var auth = $firebaseAuth(ref);

    ConnectionCheck.netCallback(function(state){
                if(state){
                    var alertPopup = $ionicPopup.alert({
                        title: 'Warning!',
                        template: state
                });
                $timeout(function(){
                    alertPopup.close();
                }, 2000);
            }
    });

    $scope.$on('$ionicView.enter', function(){
            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();
    });

    $scope.user = {};
    $scope.data = { "list" : '', "search" : ''};
    
    function moveCaretToStart(el) {
        if (typeof el.selectionStart == "number") {
            el.selectionStart = el.selectionEnd = 0;
        } else if (typeof el.createTextRange != "undefined") {
            el.focus();
            var range = el.createTextRange();
            range.collapse(true);
            range.select();
        }
    }

    $scope.search = function() {

        schoolFormDataService.retrieveDataSort($scope.data.search, 
            function(promise) {
                promise.then(function(matches){
                    $scope.user.schoolID = matches[0];
                    $scope.data.list = matches;
                    $scope.user.schoolemail = '@'+$scope.user.schoolID.domain;
                    var textBox = document.getElementById('schoolemail');
                        moveCaretToStart(textBox);
                        $window.setTimeout(function() {
                            moveCaretToStart(textBox);
                        }, 1);
                });
            });
    }
    
    $scope.update = function(school){
        $scope.user.schoolemail = '@'+school.domain;
        var textBox = document.getElementById('schoolemail');
            moveCaretToStart(textBox);
            $window.setTimeout(function() {
                    moveCaretToStart(textBox);
            }, 1);    
    }
    function emailDomain(email){
        var tolower = email.toLowerCase();
        return (/[@]/.exec(tolower)) ? /[^@]+$/.exec(tolower) : undefined;
    }
     $scope.openModal = function(template){
        $ionicModal.fromTemplateUrl('templates/'+template+'.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modal1 = modal;
            $scope.modal1.show();
        });
    }
    $scope.forgotPass = function(){
        $ionicModal.fromTemplateUrl('templates/forgotpass.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modal2 = modal;
            $scope.modal2.show();
        });
    }
    $scope.forgotPassReset = function(enter){
        ref.resetPassword({
            email: enter.email
        }, function(error) {
            if (error) {
                switch (error.code) {
                    case "INVALID_USER":
                        alert("The specified user account does not exist.");
                        break;
                    default:
                        alert("Error resetting password:" + error);
                }
            } else {
                alert("Password reset. Email sent successfully!");
                $scope.modal2.hide();
                $scope.modal2.remove();
                $state.go('login');
            }
        });
    }
 
    $scope.createStudent = function (user) {
        if (
            !!user && 
            !!user.schoolemail &&
            !!user.displayname && 
            !!user.schoolID &&
            user.schoolID.domain === emailDomain(user.schoolemail)[0]
             ) 
        {
        
           $ionicLoading.show({
                template: 'Signing Up...'
            });
                auth.$createUser({
                    email: user.schoolemail,
                    password: stripDot.generatePass()
                }).then(function (userData) {
                    alert("User created successfully!");
                    ref.child("users").child(userData.uid).set({
                        user:{
                            displayName: user.displayname +'-'+ stripDot.shortRandom(),
                            schoolID: stripDot.strip(user.schoolID.domain),
                            schoolEmail: user.schoolemail,
                            gender: user.gender
                        }
                    });
                    $ionicLoading.hide();
                    $scope.modal1.hide();
                    $scope.modal1.remove();
                }).then(function(userData){

                    var school = Rooms.checkSchoolExist(stripDot.strip(user.schoolID.domain));
                    school.$loaded(function(data){

                        //if the school doesn't exist already, add it
                        if(data.length <= 0){
                            var room = ref.child("schools").child(stripDot.strip(user.schoolID.domain));
                            room.set({
                                icon: "ion-university",
                                schoolname: user.schoolID.value,
                                schoolID: stripDot.strip(user.schoolID.domain),
                                schoolEmail: user.schoolID.schoolContact,
                                category: user.schoolID.category,
                                ID: room.key()
                            },function(err){
                                if(err) throw err;

                            })
                        }
                    });
                }).then(function(){
                    ref.resetPassword({
                        email: user.schoolemail
                    }, function(error) {
                        if (error) {
                            switch (error.code) {
                                case "INVALID_USER":
                                    alert("The specified user account does not exist.");
                                    break;
                                default:
                                    alert("Error:" + error);
                            }
                        } else {
                            alert("An email to your student account has been sent!");
                            $ionicLoading.hide();
                            $state.go('login');
                        }
                    });
                })  
                .catch(function (error) {
                    alert("Error: " + error);
                    $ionicLoading.hide();
                });
            
        }else{
            alert("Please fill all details properly");
        }
    }
    $scope.openSignIn = function (){
        $ionicModal.fromTemplateUrl('templates/login2.html', {
                    scope: $scope
                }).then(function (modal) {
                    $scope.modal = modal;
                    $scope.modal.show();
                });
    }
    $scope.about = function (){
        $ionicModal.fromTemplateUrl('templates/about.html', {
                    scope: $scope
                }).then(function (modal) {
                    $scope.modal_about = modal;
                    $scope.modal_about.show();
                });
    }
    $scope.signIn = function (user) {

        $window.localStorage.setItem('test', 'test');

            if($window.localStorage.getItem('test') === null){
                alert('You must activate local storage on your device to use this app');
                $scope.modal.hide(); 

                $window.localStorage.removeItem('test');

                return; 
            }         
       
            $window.localStorage.removeItem('test');
        
            if (user && user.email && user.pwdForLogin) {

                $ionicLoading.show({
                    template: 'Signing In...'
                });

                    auth.$authWithPassword({
                        email: user.email,
                        password: user.pwdForLogin
                    }).then(function (authData) {
                
                        ref.child("users").child(authData.uid+'/user').once('value', function (snapshot) {
                            var val = snapshot.val();
                            //get and store gavitar image inside authData  - https://en.gravatar.com/
                            var group              = !!val.groupID ? {'groupID':val.groupID, 'groupName':val.groupName} : {'groupID': 'gen', 'groupName':'General'};
                            $rootScope.email       = val.schoolEmail;
                            $rootScope.schoolID    = val.schoolID;
                            $rootScope.group       = group;
                            $rootScope.gender      = val.gender;
                            //$rootScope.groupKey    = !!val.groups ? true : false;
                            $rootScope.userID      = authData.uid;
                            $rootScope.displayName = val.displayName;
                            $rootScope.superuser   = !!val.superuser ? val.superuser : null;
                       
                        //persist data
                            Users.storeIDS(authData.password.profileImageURL, 'avatar');
                            Users.storeIDS(val.schoolID, 'schoolID');
                            Users.storeIDS(group, 'group');
                            Users.storeIDS(authData.uid, 'userID');
                            Users.storeIDS(val.displayName, 'displayName');

                            pushService.register().then(function(token){
                                console.log("token: ", token);
                            });

                            $scope.modal.hide();
                    
                            $state.go('menu.tab.student');
                      
                    });
                
                }).catch(function (error) {
                    alert("Authentication failed:" + error.message);
                    $ionicLoading.hide();
                });

        } else{
            alert("Please enter email and password both");
        }

    }   
}])
/*
* end Loginctrl
*/
.controller('TabCtrl', ['$scope', '$rootScope', function ($scope, $rootScope){
    $scope.tabSelected = function (select){
        $rootScope.tabs = select;
    }
}])
/*
settings for mentor
*/
.controller('SettingsCtrlMentor', ['$scope', '$rootScope','Users', 'ChangePassword', '$state', '$ionicLoading', '$ionicModal', 'Auth', 'groupsMentorsDataService',
    function ($scope, $rootScope, Users, ChangePassword, $state, $ionicLoading, $ionicModal, Auth, groupsMentorsDataService) { 
        /*part of add/edit group
        */
        //$scope.showEditGroup = !!$scope.groupKey ? true : false;
        //$scope.hideNewGroup = $scope.groupKey;
        
        $scope.add  = {};
        $scope.user = {};
        $scope.data = { 'list' : '', 'groups' : ''};
        //$scope.add.newgroup = !!Users.getIDS('groupName') ? Users.getIDS('groupName') : '';

        $scope.runChangePassword = function(user){

            ChangePassword.change(user, $scope.email);
        }
        $scope.askQuestion = function(){

            $state.go('menu.tab.ask');
        }
        $scope.logout = function () {
            $ionicLoading.show({
                template: 'Logging Out...'
            });
            Auth.$unauth();
        }
        /*$scope.searchg = function() {
            groupsMentorsDataService.retrieveDataSort($scope.data.groups, function(promise){
                promise.then(
                    function(matches) {
                        $scope.user.group = matches[0];
                        $scope.data.list = matches; 
                        $rootScope.group = {
                            'groupID': matches[0].groupID,
                            'groupName': matches[0].groupName
                        }
                    //console.log($rootScope.group);     
                    }
                )
            });
        }
          $scope.update = function (data){
            $rootScope.group = {
                'groupID': data.groupID,
                'groupName': data.groupName
            }
        }

        
        $scope.create = function(add){
            $scope.allGroups = Users.getAllGroups($scope.userID);
            
            $scope.allGroups.$loaded(function(data){
                if(!!data){
                    var groups,
                        groupsNum = 0,
                        removeWhiteInput = add.newgroup.replace(/\s/g, "");

                    angular.forEach(data, function(key, value){
                        var removeWhiteKeys  = key.groupName.replace(/\s/g, "");
                            groupsNum +=1;
                        if(removeWhiteKeys.toLowerCase() === removeWhiteInput.toLowerCase()){
                            groups = key.groupName;
                        }
                    });
                    if(groupsNum < 2){
                        if(!groups){

                            Users.createGroups($scope.schoolID, add.newgroup, function(promise){
                                promise.then(function(data){

                                    var key = data.key().groupKey;
                                    var ID  = data.key().groupID;
                                
                                        Users.addGroupKey($scope.userID, key, add.newgroup, ID);
                                        Users.storeIDS(add.newgroup, 'groupName');
                        
                                    $scope.hideNewGroup  = true;
    
                                });
                            });
                   
                        }else{
                            alert(groups + ' is already a group');
                            $scope.add.newgroup = !!Users.getIDS('groupName') ? Users.getIDS('groupName') : '';
                        }
                    }else{
                        alert('You have reached your allotted number of groups');
                        $scope.add.newgroup = Users.getIDS('groupName');
                    }
                }
            });
               
               
        }
        part of add/edit group
        $scope.edit = function(add){
            $scope.groupRemoveName = add.newgroup;
            $ionicModal.fromTemplateUrl('templates/delete-group.html', {
                    scope: $scope
                }).then(function (modal) {
                    $scope.modalGrp = modal;
                    $scope.modalGrp.show();
                });
            
        }
        $scope.removeGroup = function(){
            var groupKey = !!Users.getIDS('groupKey') ? Users.getIDS('groupKey') : $scope.groupKey;
            Users.editGroup(groupKey, $scope.schoolID, $scope.userID, $scope.groupRemoveName);

            Users.removeItem('groupKey');
            Users.removeItem('groupName');
            $scope.showEditGroup = false;
            $scope.hideNewGroup  = false;
            $scope.modalGrp.hide();
        }
        $scope.deleteAccount = function(){
                $ionicModal.fromTemplateUrl('templates/delete-account.html', {
                    scope: $scope
                }).then(function (modal) {
                    $scope.modal = modal;
                    $scope.modal.show();
                });
        }*/
       
}])

/*
* opens the private chat room
*/
.controller('ChatCtrl', [
                '$scope', 
                'Chats', 
                'Users', 
                'Rooms', 
                '$state',
                '$ionicModal', 
                '$ionicPopup',
                '$ionicLoading', 
                '$ionicScrollDelegate', 
                '$timeout', 
                'RequestsService', 
                'ConnectionCheck',
        function ($scope, 
                  Chats, 
                  Users, 
                  Rooms, 
                  $state,  
                  $ionicModal, 
                  $ionicPopup,
                  $ionicLoading, 
                  $ionicScrollDelegate, 
                  $timeout, 
                  RequestsService, 
                  ConnectionCheck) {

        $ionicLoading.show();

        $scope.$watch('tabs', function(old, newv){
            if(newv !== 'chatprivate' || old === 'chatprivate'){
                ConnectionCheck.netCallback(function(state){
                    if(state){
                        var alertPopup = $ionicPopup.alert({
                            title: 'Warning!',
                            template: state
                        });
                        $timeout(function(){
                            alertPopup.close();
                        }, 2000);
                        /*alertPopup.then(function(res) {
                            console.log(res);
                        });*/
                    }
                })
            }
        });
        
    var 
        advisorKey          = $state.params.advisorKey,
        schoolID            = $state.params.schoolID,
        advisorID           = $state.params.advisorID,
        prospectUserID      = $state.params.prospectUserID,
        prospectQuestionID  = $state.params.prospectQuestionID,
        schoolsQuestionID   = $state.params.schoolsQuestionID,
        displayName         = $state.params.displayName,
        email               = $state.params.email,
        group               = $state.params.group,
        who                 = $state.params.who,
        toggleUserID        = '',
        toggleQuestionID    = '',
        firstMessage        = false;

    if(!$scope.schoolID){
        $scope.schoolID = Users.getIDS('schoolID');
    }
    if(!$scope.displayName){
        $scope.displayName = Users.getIDS('displayName');
    }
    $scope.IM = {
        textMessage: ""
    };
    var txtInput;
    $timeout(function(){
        footerBar = document.body.querySelector('#userMessagesView .bar-footer');
        txtInput = angular.element(footerBar.querySelector('input'));
    },0);
    var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    function keepKeyboardOpen() {
      txtInput.one('blur', function() {
        txtInput[0].focus();
      });
    }
    
        if(who === 'asker'){
            toggleUserID     = advisorID;
            toggleQuestionID = advisorKey;
        }else{
            toggleUserID     = prospectUserID;
            toggleQuestionID = prospectQuestionID;
        }

        if(!advisorKey){
            firstMessage=true;
        }
        $scope.avatar   = $state.params.avatar;
        $scope.question = $state.params.question;
        Chats.selectRoom(schoolID, advisorID, advisorKey);

    Chats.getSelectedRoomName(function (roomName){
        if (roomName) {
            $scope.roomName = " - " + roomName;
            $scope.chats = Chats.all($scope.displayName);
            $scope.chats.$loaded(function(data){
                $ionicLoading.hide();
            });
            $scope.$watch('chats', function(newValue, oldValue){
                $timeout(function() {
                    keepKeyboardOpen();
                    viewScroll.scrollBottom();
                }, 0);
        
            },true);
        }
    });
    $scope.sendMessage = function (msg) {
        if(!firstMessage){
            Chats.send($scope.displayName, schoolID, msg, toggleUserID, toggleQuestionID, Users.getIDS('avatar'));
            $scope.IM.textMessage = "";
        }else{//first time an advisor asnwers a question
               if($scope.displayName === displayName){
                    alert('No need to attend your own event.');

                    return;
                }
                $ionicLoading.show({
                    template: 'Sending...'
                });
                Users.addQuestionToUser({//add the question to self
                    schoolID:schoolID, 
                    ID:advisorID, 
                    question:$scope.question, 
                    icon:'ion-chatbubbles', 
                    questionID:prospectQuestionID, 
                    prospectUserID:prospectUserID, 
                    displayName:displayName,
                    avatar:$scope.avatar
                 }
                )
                .then(function (results){
                   $scope.addAnswerAdvisor = results;
                   $scope.advisorKey = results.key();
                   return Users.addAnswerToAdvisor( //request 2 - add answer to conversation inside question
                        {
                            from: $scope.displayName, 
                            schoolID: schoolID, 
                            message: msg, 
                            questionsID: $scope.advisorKey, 
                            userID: advisorID, 
                            avatar: Users.getIDS('avatar')
                        }
                    )               
                })
                .then(function (results){
                    $scope.updateProspectQuestion = results;
                    return Users.updateProspectQuestion( //request 3
                        {
                            studentID: prospectUserID, 
                            questionID: prospectQuestionID, 
                            advisorID: advisorID, 
                            advisorKey: $scope.advisorKey, 
                            originalID: schoolsQuestionID, 
                            schoolID: schoolID, 
                            groupID: group
                        } 
                    )
                            
                })
                .then(function(){
                    firstMessage=false;
                    Chats.selectRoom(schoolID, advisorID, $scope.advisorKey);
                    $scope.chats = Chats.all($scope.displayName);
                    $scope.IM.textMessage = "";
                    $ionicLoading.hide();

                    $scope.addAnswerAdvisor = null;
                    $scope.updateProspectQuestion = null;
                }).catch (function(error){
                    alert('error sending message: ' + error);
                })
              
        }
        /*RequestsService.pushNote(
            {
             'message':'Message from: ' + $scope.displayName,
             'userID': toggleUserID,
             'method':'GET',
             'path':'push'
            });*/

    }
//removes a single chat message
    $scope.remove = function (chat, index) {
        Chats.remove(chat);
    }
//remove question/conversation once dialog is confirmed
    $scope.removePerm = function () {
       var advkey = !!advisorKey ? advisorKey : $scope.advisorKey;
       var mail = firstMessage ? null : email;
       var val = Chats.wrapitup(advkey, 
                                advisorID, 
                                schoolID, 
                                schoolsQuestionID, 
                                prospectQuestionID, 
                                prospectUserID, 
                                $scope.question,
                                mail, 
                                prospectUserID,
                                group
                            );
       if(typeof val !== "string"){
            $scope.modal.hide();
            $state.go('menu.tab.student', {
                schoolID: schoolID
            });          
       }else{
            alert(val);
       }
    }
//dialog that warns user before question/conversation is deleted
    $scope.removeConversation = function (){
        $ionicModal.fromTemplateUrl('templates/remove-conversation.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modal = modal;
            $scope.modal.show();
        });
    }

}])
/*
* opens the public chat room
*
*/
.controller('PublicChatCtrl', [
                    '$scope', 
                    'PublicChat', 
                    'Users', 
                    '$state',  
                    '$ionicModal', 
                    '$ionicPopup',
                    '$ionicLoading', 
                    '$ionicScrollDelegate', 
                    '$timeout', 
                    'RequestsService', 
                    'ConnectionCheck',
        function ($scope, 
                  PublicChat, 
                  Users, 
                  $state, 
                  $ionicModal, 
                  $ionicPopup,
                  $ionicLoading, 
                  $ionicScrollDelegate, 
                  $timeout, 
                  RequestsService, 
                  ConnectionCheck) {

        $ionicLoading.show();

        $scope.$watch('tabs', function(old, newv){
            if(newv !== 'chatpublic' || old === 'chatpublic'){
                ConnectionCheck.netCallback(function(state){
                    if(state){
                        var alertPopup = $ionicPopup.alert({
                            title: 'Warning!',
                            template: state
                        });
                        $timeout(function(){
                            alertPopup.close();
                        }, 2000);
                    }
                });
            }
        });

    var 
        prospectUserID      = $state.params.prospectUserID,
        prospectQuestionID  = $state.params.prospectQuestionID,
        schoolsQuestionID   = $state.params.schoolsQuestionID,
        displayName         = $state.params.displayName,
        group               = $state.params.group,
        wrap                = $state.params.wrap,
        toggleUserID        = '',
        toggleQuestionID    = '',
        firstMessage        = false;

    if(!$scope.schoolID){
        $scope.schoolID = Users.getIDS('schoolID');
    }
    if(!$scope.displayName){
        $scope.displayName = Users.getIDS('displayName');
    }
    $scope.IM = {
        textMessage: ""
    };
    if(!wrap){
        $scope.wontWrap = true;
    }else{
        $scope.wontWrap = false;
    }
    var txtInput;
    $timeout(function(){
        footerBar = document.body.querySelector('#userMessagesView .bar-footer');
        txtInput = angular.element(footerBar.querySelector('input'));
    },0);
    var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    function keepKeyboardOpen() {
      txtInput.one('blur', function() {
        txtInput[0].focus();
      });
    }
    
       
        toggleUserID     = prospectUserID;
        toggleQuestionID = prospectQuestionID;
        
        $scope.avatar   = $state.params.avatar;
        $scope.question = $state.params.question;

        PublicChat.selectRoom($scope.schoolID, schoolsQuestionID, group);

    PublicChat.getSelectedRoomName(function(roomName){
        if (roomName) {
            $scope.roomName = " - " + roomName;
            $scope.chats = PublicChat.all($scope.displayName);
            $scope.chats.$loaded(function(data){
                $ionicLoading.hide();
            })
            $scope.$watch('chats', function(newValue, oldValue){
                $timeout(function() {
                    keepKeyboardOpen();
                    viewScroll.scrollBottom();
                }, 0);
        
            },true);
        }
    });
    $scope.sendMessage = function (msg) {
        if(!firstMessage){
            PublicChat.send($scope.displayName, $scope.schoolID, msg, toggleQuestionID, toggleUserID, Users.getIDS('avatar'));
            $scope.IM.textMessage = "";
        }else{

         /*RequestsService.pushNote(
            {
                'message':'Message from: ' + $scope.displayName,
                'userID': toggleUserID,
                'method':'GET',
                'path':'push'
            });*/
        }
    }
//removes a single chat message
    $scope.remove = function (chat, index) {
        PublicChat.remove(chat);
    }
//remove question/conversation once dialog is confirmed
    $scope.removePerm = function () {

       var val = PublicChat.wrapitup( 
                                $scope.schoolID, 
                                schoolsQuestionID, 
                                prospectQuestionID, 
                                prospectUserID,
                                group
                            );
       if(typeof val !== "string"){
            $scope.modal.hide();
            $state.go('menu.tab.student', {
                schoolID: $scope.schoolID
            });          
       }else{
            alert(val);
       }
    }
//dialog that warns user before question/conversation is deleted
    $scope.removeConversation = function (){
        $ionicModal.fromTemplateUrl('templates/remove-conversation.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modal = modal;
            $scope.modal.show();
        });
    }

}])
/*the advisor see private questions and open chat
*
*/
.controller('AdvisorConversationsCtrl', ['$scope', 'Users', 'Chats', 'Rooms', '$state', '$window',
    function ($scope, Users, Chats, Rooms, $state, $window) {

    if(!$scope.userID){
        $scope.userID = Users.getIDS('userID');
    }
    if(!$scope.schoolID){
        $scope.schoolID = Users.getIDS('schoolID');
    }
    $scope.school = Users.getUserByID($scope.userID);
    $scope.school.$loaded(function(data){
         $scope.rooms = data;

     });
    $scope.askQuestion = function(){
        $state.go('menu.tab.ask');
    }
    $scope.openChatRoom = function (advisorID, schoolID, question, advisorKey, selfKey, prospectUserID, email, prospectQuestionID1, status, groupID, publicQuestionKey, avatar) {
        if(status === 'private' || !status){
            if(!advisorID){
                if(!prospectUserID){
                    alert('Waiting for a participant ...');

                    return;
                }
            }
            if(!!prospectUserID){//question answerer
                /*the advisorKey and advisorID are not params
                Instead they are stored in scope when the question answerer logs in
                prospectQuestionID is the original key that is in the school and is retrieved 
                like room.$id
                */
                $state.transitionTo('menu.tab.chat', {
                    advisorID: $scope.userID,
                    schoolID: $scope.schoolID,
                    advisorKey: selfKey,//name.$id get self key
                    prospectUserID: prospectUserID,
                    prospectQuestionID: prospectQuestionID1,//get the prospects added question key
                    schoolsQuestionID: '',
                    question: question,
                    displayName: '',
                    email: email,
                    group: '',
                    who: 'answerer',
                    avatar: avatar   
                },{reload: true, inherit: true, notify: true });

                Users.toggleQuestionBackAfterClick($scope.userID, selfKey);//toggle back own question name.$id
            }

            if(!!advisorID){ //question asker -- response return
            /*when advisor adds their advisorID and advisorKey, the asker can chat 
            because the question has been answered

            $state.transitionTo($state.current, $stateParams, { reload: true, inherit: true, notify: true });
            */
                $state.transitionTo('menu.tab.chat', {
                    advisorID: advisorID,
                    schoolID: schoolID,
                    advisorKey: advisorKey,
                    prospectUserID: $scope.userID, //
                    prospectQuestionID: selfKey, //name.$id to get self key
                    schoolsQuestionID: '',
                    question: question,
                    displayName: '',
                    email: $scope.email,
                    group: '',
                    who: 'asker',
                    avatar: avatar

                }, {reload: true, inherit: true, notify: true });

                Users.toggleQuestionBackAfterClick($scope.userID, selfKey);//toggle back own question name.$id
            }
        }else{
            $state.transitionTo('menu.tab.publicchat', {
                prospectUserID: $scope.userID,
                prospectQuestionID: selfKey,
                schoolsQuestionID: publicQuestionKey,
                displayName: '',
                question: question,
                group: groupID,
                wrap: 'wrap',
                avatar: avatar
            },{reload: true, inherit: true, notify: true });
            //Users.toggleQuestionBackAfterClick($scope.userID, selfKey);
        }
    }
}])

/*this controller is for public questions
*
*/
.controller('AdvisorCtrl', ['$scope', 'Users', 'Chats', 'Rooms', '$state', '$window', 'orderAlphanumeric', '$ionicLoading',
    function ($scope, Users, Chats, Rooms, $state, $window, orderAlphanumeric, $ionicLoading) {

    var stop;
    if(!$scope.schoolID){
        $scope.schoolID = Users.getIDS('schoolID');
    }
    if(!$scope.userID){
        $scope.userID = Users.getIDS('userID');
    }
   
    $scope.askQuestion = function(){
        $state.go('menu.tab.ask');
    }
    $scope.user = {}
    $scope.data = {'list': ''};
    $scope.$watch('tabs', function(old, newv){
        if(newv === 'events' || old === 'events'){
            orderAlphanumeric.retrieveDataSort(function (promise){
                promise.then(function(matches){
                    matches.push({'groupID': 'sel', 'groupName':'Select Group'});
                    $scope.user.group = matches[matches.length-1];
                    $scope.data.list = matches;
                });

            });
        }
    });

    $scope.update = function (data){
            $scope.group = {
                'groupID': data.groupID,
                'groupName': data.groupName
            }
    }
    $scope.$watch('group', function(oldValue, newValue){
        var val;
        if(!!oldValue){
            val = oldValue;
        }else{
            val = newValue;
        }

        $scope.groupID = val.groupID;
        $scope.title1  = val.groupName;

        $scope.school = Rooms.getSchoolBySchoolID($scope.schoolID, $scope.groupID);
            $scope.school.$loaded(function(data){
                $scope.rooms = data;

                $ionicLoading.hide();
        });
        Users.updateUserGroup(val.groupID, val.groupName, $scope.userID);  

    });
    
    $scope.openChatRoom = function (question, prospectUserID, prospectQuestionID, schoolsQuestionID, displayName, email, status, avatar) {
       if(status === 'private'){
            $state.transitionTo('menu.tab.chat', {
                advisorID: $scope.userID,
                schoolID: $scope.schoolID,
                advisorKey: '',
                prospectUserID: prospectUserID,
                prospectQuestionID: prospectQuestionID,
                schoolsQuestionID: schoolsQuestionID,
                question: question,
                displayName: displayName,
                email: email,
                group: $scope.groupID,
                who: 'answerer',
                avatar: avatar
            },{reload: true, inherit: true, notify: true });
       }else{
             $state.transitionTo('menu.tab.publicchat', {
                prospectUserID: prospectUserID,
                prospectQuestionID: prospectQuestionID,//not currently avaiable for wrap question
                schoolsQuestionID: schoolsQuestionID,
                displayName: displayName,
                question: question,
                group: $scope.groupID,
                wrap: '',//hides ability to wrap question
                avatar: avatar
            },{reload: true, inherit: true, notify: true });
       }
    }
 
}])
/*the prospect can ask a question
*
*/
.controller('AskCtrl', ['$scope', '$state', 'Users', 'Rooms', 'orderAlphanumeric', 'stripDot', '$ionicLoading', 'Questions',
    function ($scope, $state, Users, Rooms, orderAlphanumeric, stripDot, $ionicLoading, Questions){
    var icon='',
        grpID,
        grpName,
        status;
    if(!$scope.userID){
        $scope.userID = Users.getIDS('userID');
    }
    if(!$scope.schoolID){
        $scope.schoolID = Users.getIDS('schoolID');
    }
    if(!$scope.displayName){
        $scope.displayName = Users.getIDS('displayName');
    }
    $scope.sudo = !$scope.superuser ? false : true;
    $scope.user = {}
    $scope.data = { 'listg' : '', 'search' : '', 'groups': ''};


   /*$scope.searchg = function() {
     groupsMentorsDataService.retrieveDataSort($scope.data.groups, function(promise){
                promise.then(
                    function(matches) {
                        $scope.user.group = matches[0];
                        $scope.data.listg = matches;     
                    }
                )
            });
    }*/

    $scope.$watch('tabs', function(old, newv){
        if(newv === 'ask' || old === 'ask'){
            orderAlphanumeric.retrieveDataSort(function (promise){
                promise.then(function(matches){
                    matches.push({'groupID': 'sel', 'groupName':'Select Group'});
                    $scope.user.group = matches[matches.length-1];
                    $scope.data.listg = matches;
                });

            });
        }
    });

    $scope.ask = function (quest){  
         //!quest.group && !quest.group.groupID &&        
          if(quest.group.groupID === 'sel'){
                alert('please select a group');
                return;
          } 
    
          status = !!quest.ischecked ? 'public' : 'private';
         
          grpID = quest.group.groupID;
          grpName = quest.group.groupName;
                if(quest.question.amount >= 15){
                    $ionicLoading.show({
                        template: 'Sending...'
                    });
                if(status === 'public'){
                        Rooms.addQuestionsToSchool(
                            {
                                schoolID: $scope.schoolID, 
                                userID: $scope.userID, 
                                question: quest.question.value, 
                                icon: 'ion-chatbubbles', 
                                questionID: null, 
                                displayName: $scope.displayName, 
                                email: $scope.email, 
                                groupID: grpID, 
                                groupName: grpName, 
                                status: status, 
                                avatar: Users.getIDS('avatar') 
                            } 
                        ).then(function(data){
                             Users.addQuestionToUser({
                                schoolID:$scope.schoolID, 
                                ID:$scope.userID, 
                                question:quest.question.value, 
                                icon:'ion-chatbubble',
                                groupName: grpName, 
                                status: status, 
                                groupID: grpID, 
                                publicQuestionKey: data.key(), 
                                avatar:Users.getIDS('avatar')
                                }
                            ).then(function(){
                                $ionicLoading.hide();
                                $state.transitionTo('menu.tab.studentc',{},{ reload: true, inherit: true, notify: true });
                                $scope.data.search = '';
                                $scope.user.question = '';
                            });
                        });
                    }else{
                        Users.addQuestionToUser({
                                schoolID:$scope.schoolID, 
                                ID:$scope.userID, 
                                question:quest.question.value, 
                                icon:'ion-chatbubble',
                                groupName: grpName, 
                                status: status, 
                                groupID: grpID,
                                publicQuestionKey: null, 
                                avatar:Users.getIDS('avatar')
                                } 
                        ).then(function(data){
                            Rooms.addQuestionsToSchool(
                                {
                                schoolID: $scope.schoolID, 
                                userID: $scope.userID, 
                                question: quest.question.value, 
                                icon: 'ion-chatbubbles', 
                                questionID: data.key(), 
                                displayName: $scope.displayName, 
                                email: $scope.email, 
                                groupID: grpID, 
                                groupName: grpName, 
                                status: status, 
                                avatar: Users.getIDS('avatar') 
                            } 
                            ).then(function(){
                                $ionicLoading.hide();
                                $state.transitionTo('menu.tab.studentc',{},{ reload: true, inherit: true, notify: true });
                                $scope.data.search = '';
                                $scope.user.question = '';
                            });
                        });
                    }
                    Questions.save({
                        question: quest.question.value,
                        school: $scope.schoolID
                    }); 
                    /*if(grpID !== 'gen'){
                       var keys = Users.getGroupKeys().
                            then(function(data){
                                Users.sendPushByGroup(data, grpID, $scope.schoolID, grpName);
                            }); 
                    }

                    */

                }else{
                    alert('questions must be at least 15 characters long');
                }
            
    }
}]);
