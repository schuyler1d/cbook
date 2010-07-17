(function() {
    var global = this;

    function hasAttr(obj,key) {
	try {
	    return (typeof(obj[key]) != 'undefined');
	} catch(e) {return false;}
    }

    function NOT(bool) {
	return !bool;
    }

    function StorageWrapper(stor) {

	this.KEYS_KEY = 'KEYS';
	this.hasKey = function(key) {
	    return (stor.getItem(key) != null);
	}
	this.get = function(key,default_val) {
	    return (this.hasKey(key) ? stor.getItem(key) : default_val);
	}
	var key_dict = JSON.parse(this.get(this.KEYS_KEY,'{}'));
	this.set = function(key,value) {
	    stor.setItem(key,value);
	    key_dict[key]=1;
	    stor.setItem(this.KEYS_KEY,JSON.stringify(key_dict));
	}

	///actually returns a dict in the form {key1:1,key2:1,...}
	this.keyDict = function() {
	    return key_dict;
	}
	this.del = function(key) {
	    delete stor[key];
	    delete key_dict[key];
	    stor.setItem(this.KEYS_KEY,M.JSON.stringify(key_dict));
	}
    }

    function MyStorage() {
	this.permStor = new StorageWrapper(hasAttr(global,'localStorage')?global.localStorage:global.globalStorage[location.hostname]);
	//this.sessStor = new StorageWrapper(global.sessionStorage);
	this.nsPERSON = 'PERSON_';
	this.nsPEOPLE = 'CBOOK_PEOPLE';
	this.nsME = 'ME_';

	this.generateKey = function(frm) {
	    alert(frm.tagName);
	}

	this.addFriend = function() {
	    
	}

	this.addMyInfo = function() {
	    
	}

	this.backupFriends = function() {
	    
	}

	this.restoreFriends = function(friend_str) {

	}

	this.people_keys = this.permStor.get(this.nsPEOPLE, {})

    }


    if (window.localStorage) {
	global.Stor = new MyStorage();
	global.e = global.Stor;
    } else {
	throw "No localStorage support in browser (yet)!";
    }

})();