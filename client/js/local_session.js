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
	    stor.setItem(this.KEYS_KEY,JSON.stringify(key_dict));
	}
	this.deleteEveryFuckingThing = function() {
	    for (a in key_dict) 
		this.del(a);
	}
    }

    function MyStorage() {
	var self = this;
	this.permStor = new StorageWrapper(hasAttr(global,'localStorage')?global.localStorage:global.globalStorage[location.hostname]);
	//this.sessStor = new StorageWrapper(global.sessionStorage);
	this.nsPERSON = 'PERSON_';
	this.nsPEOPLE = 'CBOOK_PEOPLE';
	this.nsME = 'MY_KEYS';

	this.getKeyIdentifier = function(key_base64, obj) {
	    ///first two bytes of the sha256 hash of the key in base64;
	    var x = parseInt(ecmaScrypt.sha2.hex_sha256(key_base64).substr(0,2),16);
	    return Base64._keyStr[Math.floor(x/4)];
	}

        this.getKeysByIdentifier = function(ident) {
            return self.friendsCache[ident];
        }

	this.keyList = function(limit) {
	    var key_list = [/*me-friends divider:*/['','','---------']];
	    var me = JSON.parse(self.permStor.get(self.nsME,'{}'));
	    var friends = self.friendsCache || JSON.parse(self.permStor.get(self.nsPEOPLE,'{}'));
	    for (k in friends) 
		for (var i=0;i<friends[k].length;i++) {
		    var secret = friends[k][i];
		    var alias = self.getInfo(secret).alias.v;
		    var side = ((secret in me) ?'unshift':'push');
		    if (secret in me || !limit) 
			key_list[side]([k,secret,alias]);
		}
	    return key_list;
	}
	this.populateKeysOnSelect = function(select,limit) {
	    var key_list = self.keyList(limit);
	    for (var i=0;i<key_list.length;i++) {
		var k=key_list[i];
		var o=document.createElement('option');
		o.value = k[0]+':'+k[1];
		o.innerHTML = k[2];
		select.appendChild(o);
	    }
	}
	this.generateKey = function(frm) {
	    var newsecret = Base64.encodeBytes(ecmaScrypt.generateSharedKey(ecmaScrypt.aes.keySize.SIZE_128));
	    var alias = frm.elements['alias'].value;
	    var obj = {"alias":{"v":alias,"p":"friends"}};
	    var prefix = self.getKeyIdentifier(newsecret, obj);
	    ///v:value, p:privacy
	    self.addMyKey(newsecret, obj, prefix);
	    self.addFriend(newsecret, obj, prefix);
	    alert('New key generated.');
	}
	this.addMyKey = function(secret) {
	    var keys = JSON.parse(self.permStor.get(self.nsME,'{}'));
	    keys[secret]=1;
	    self.permStor.set(self.nsME, JSON.stringify(keys));
	}

	this.addFriend = function(newsecret, obj, prefix) {
	    prefix = prefix || self.getKeyIdentifier(newsecret, obj);
	    var key = self.nsPERSON + newsecret;
	    if (self.permStor.hasKey(key)) {
		var old_person = JSON.parse(self.permStor.get(key));
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
	    var ppl = self.friendsCache||JSON.parse(self.permStor.get(self.nsPEOPLE,'{}'));
	    ppl[prefix] = ppl[prefix] || [];
	    if (ppl[prefix].indexOf(newsecret) == -1) {
		ppl[prefix].push(newsecret);
		self.permStor.set(self.nsPEOPLE, JSON.stringify(ppl));
	    }
	}

	this.getInfo = function(secret) {
	    return JSON.parse(self.permStor.get(self.nsPERSON+secret,'{}'));
	}

	this.passPhrase = function(text) {
	    return ecmaScrypt.generatePrivateKey(
		text,
		ecmaScrypt.aes.keySize.SIZE_128
	    );	    
	}
	this.getBackup = function(key_ary/*typeof string=all*/, passkey) {
	    var bkup = [{},JSON.parse(self.permStor.get(self.nsME,'{}'))];;
	    if (typeof key_ary == 'string') {
		key_ary = [];
		var f = self.friendsCache;
		for (a in f) 
		    for (var i=0;i<f[a].length;i++) 
			key_ary.push(f[a][i]);
	    }
	    for (var i=0;i<key_ary.length;i++) {
		bkup[0][key_ary[i]] = self.getInfo(key_ary[i]);
	    }
	    if (passkey) {
		return CBook['base64'
			    ].encrypt.apply(null,encrypt(JSON.stringify(bkup), 
							 passkey));
	    } else
		return JSON.stringify(bkup);
	}
	this.backupForm = function(frm) {
	    var eee = frm.elements;
	    var passkey = self.passPhrase(eee['passphrase'].value);
	    eee['backup'].value = self.getBackup('all',passkey);
	    document.location = '#backup-text';

	}
	this.restoreForm = function(frm) {
	  try {
	      var passkey = self.passPhrase(frm.elements['passphrase'].value);
	      var iv_ciph = CBook['base64'
				 ].decrypt.apply(null,frm.elements['backup'].value.split(','));
	      var restoral_keys = JSON.parse(decrypt(iv_ciph[0],iv_ciph[1], passkey));
	      for (a in restoral_keys[0]) 
		  self.addFriend(a, restoral_keys[0][a]);
	      for (m in restoral_keys[1]) 
		  self.addMyKey(restoral_keys[1][m]);

	      alert('Restoral complete');
	  } catch(e) {
	      alert('Unable to decrypt backup');
	      if (window.console)
		  console.log(e);
	  }
	}
	this.shareForm = function(frm) {
	    var key_list = [];
	    var eee = frm.elements;
	    var passkey = self.passPhrase(eee['passphrase'].value);
	    var o = eee['friendkey'].options;
	    for (var i=0;i<o.length;i++) {
		if (o[i].selected) {
		    key_list.push(o[i].value);
		}
	    }
	    eee['backup'].value = self.getBackup(key_list,passkey);
	    document.location="#share-text";
	}
	this.deleteEverything = function() {
	    if (confirm("Are you sure you want to delete all your keys from this browser?")) {
		self.permStor.deleteEveryFuckingThing();
		alert("Your keys have been removed. Don't lose your backup!");
	    }
	}


        this.friendsCache = JSON.parse(self.permStor.get(self.nsPEOPLE,'{}'));
    }


    if (window.localStorage) {
	global.Stor = new MyStorage();
	global.e = global.Stor;
    } else {
	throw "No localStorage support in browser (yet)!";
    }

})();