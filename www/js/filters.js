var filt = angular.module('mychat.filters', [])

filt.filter('reverse', [function () {
  return function(items) {
  	if( !items ){ return; }
         return items.slice().reverse();
  };
}]);

filt.filter('conversation', [function () {
	return function(items, attr){
		if(!items){ return;}
		 var shownItems = [];
		 angular.forEach(items, function (item) {
    
                if (item[attr] === true) {shownItems.unshift(item)}
            
                if (item[attr] !== true) {shownItems.push(item)}
           
        });
		return shownItems;
	}
}]);