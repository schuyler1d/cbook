/*
 {
    CBOOK_PEOPLE: {"s":['{{key1}}','{{key2}}']}
    MY_KEYS: {"s":['{{key1}}']}
    PERSON_{key1}: {key:{friends:{'alias':"{{alias}}"}}}
 }
*/
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
	var self = this;
	this.permStor = new StorageWrapper(hasAttr(global,'localStorage')?global.localStorage:global.globalStorage[location.hostname]);
	//this.sessStor = new StorageWrapper(global.sessionStorage);
	this.nsPERSON = 'PERSON_';
	this.nsPEOPLE = 'CBOOK_PEOPLE';
	this.nsME = 'MY_KEYS';

	this.getKeyIdentifier = function(key_base64) {
	    ///first two bytes of the sha256 hash of the key in base64;
	    return Base64._keyStr[parseInt(
		ecmaScrypt.sha2.hex_sha256(key_base64).substr(0,2),
		16)];
	}

	this.generateKey = function(frm) {
	    var newsecret = Base64.encodeBytes(ecmaScrypt.generateSharedKey(ecmaScrypt.aes.keySize.SIZE_128));
	    var prefix = self.getKeyIdentifier(newsecret);
	    var alias = frm.elements['alias'].value;
	    var obj = {};
	    ///v:value, p:privacy
	    obj[newsecret] = {"alias":{"v":alias,"p":"friends"}};

	    self.addFriend(newsecret, obj, prefix);
	    self.addMyKey(newsecret, obj, prefix);
	}
	this.addMyKey = function(newsecret, obj, prefix) {
	    prefix = prefix || self.getKeyIdentifier(newsecret);
	    ///TODO NEXT NEXT
	}
	this.addFriend = function(newsecret, obj, prefix) {
	    prefix = prefix || self.getKeyIdentifier(newsecret);
	    var key = self.nsPERSON + newsecret;
	    if (key in self.permStor.keyDict()) {
		var old_person = self.permStor.get(key);
		if (NOT(obj.alias && obj.alias.v)
		    || NOT(confirm('You are about to overwrite a preexisting friend/account in your database, Their alias is '+old_person.alias.v+'. The new alias is '+obj.alias.v))) {
		    return;
		}
	    }
	    if (NOT(obj.alias && obj.alias.v)) {
		return; //atm, don't support friends w/o aliases
	    }
	    self.permStor.set(key, JSON.stringify(obj));
	    self.addPrefix(prefix, newsecret);
	}

	this.addPrefix = function(prefix, newsecret) {
	    var ppl = JSON.parse(self.permStor.get(self.nsPEOPLE));
	    ppl[prefix] = ppl[prefix] || [];
	    ppl[prefix].push(newsecret);
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